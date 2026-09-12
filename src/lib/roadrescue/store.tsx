import * as React from "react";
import {
  BUTTONS,
  CONTACTS,
  DRIVER_NAME,
  MECHANICS,
  PAST_REQUESTS,
  PODS,
  SAVED_VEHICLES,
  STATIONS,
  kmToLatLng,
} from "./seed";
import {
  findBestAvailableMechanic,
  findNearestAvailableStation,
  railTravelMinutes,
} from "./services";
import type {
  Emergency,
  EmergencyButton,
  EmergencyContact,
  Mechanic,
  Pod,
  ProblemTypeId,
  Stage,
  Station,
  Vehicle,
} from "./types";

interface State {
  stations: Station[];
  pods: Pod[];
  buttons: EmergencyButton[];
  mechanics: Mechanic[];
  emergencies: Emergency[];
  vehicles: Vehicle[];
  contacts: EmergencyContact[];
  emergencyStop: boolean;
  speed: number;
  heartbeats: number;
}

type Action =
  | { type: "CREATE"; payload: Emergency }
  | { type: "PATCH"; id: string; patch: Partial<Emergency> }
  | { type: "PATCH_POD"; id: string; patch: Partial<Pod> }
  | { type: "PATCH_BUTTON"; id: string; patch: Partial<EmergencyButton> }
  | { type: "PATCH_MECHANIC"; id: string; patch: Partial<Mechanic> }
  | { type: "PATCH_STATION"; id: string; patch: Partial<Station> }
  | { type: "TICK" }
  | { type: "SET_STOP"; value: boolean }
  | { type: "SET_SPEED"; value: number }
  | { type: "HEARTBEAT" }
  | { type: "ADD_VEHICLE"; vehicle: Vehicle }
  | { type: "ADD_CONTACT"; contact: EmergencyContact }
  | { type: "RESET" };

const initialState: State = {
  stations: STATIONS,
  pods: PODS,
  buttons: BUTTONS,
  mechanics: MECHANICS,
  emergencies: PAST_REQUESTS,
  vehicles: SAVED_VEHICLES,
  contacts: CONTACTS,
  emergencyStop: false,
  speed: 1,
  heartbeats: 1284,
};

/** Automatic stage transitions: [next stage, delay in ms]. */
const AUTO: Partial<Record<Stage, [Stage, number]>> = {
  CREATED: ["ACKNOWLEDGED", 1600],
  ACKNOWLEDGED: ["FINDING_STATION", 1600],
  FINDING_STATION: ["POD_ASSIGNED", 2000],
  POD_ASSIGNED: ["POD_DISPATCHED", 1600],
  POD_DISPATCHED: ["POD_MOVING", 1200],
  POD_ARRIVED: ["WAITING_FOR_ACCESS", 1500],
  ACCESS_GRANTED: ["KIT_IN_USE", 1800],
  REPAIR_SUCCESSFUL: ["COMPLETED", 2200],
  UNABLE_TO_REPAIR: ["MECHANIC_SEARCHING", 1600],
  MECHANIC_SEARCHING: ["MECHANIC_ASSIGNED", 2400],
  MECHANIC_ASSIGNED: ["MECHANIC_EN_ROUTE", 2000],
  MECHANIC_ARRIVED: ["REPAIR_IN_PROGRESS", 2400],
  REPAIR_IN_PROGRESS: ["COMPLETED", 6000],
};

const TERMINAL: Stage[] = ["COMPLETED"];
/** Stages that wait for a human action. */
const MANUAL: Stage[] = ["WAITING_FOR_ACCESS", "KIT_IN_USE"];

function stamp(e: Emergency, stage: Stage, now: number): Emergency {
  return {
    ...e,
    stage,
    updatedAt: now,
    timeline: [...e.timeline, { stage, at: now }],
    nextAt: AUTO[stage] ? now + AUTO[stage]![1] : null,
  };
}

function reducer(state: State, action: Action): State {
  const now = Date.now();
  switch (action.type) {
    case "CREATE":
      return { ...state, emergencies: [action.payload, ...state.emergencies] };
    case "PATCH":
      return {
        ...state,
        emergencies: state.emergencies.map((e) =>
          e.id === action.id ? { ...e, ...action.patch, updatedAt: now } : e,
        ),
      };
    case "PATCH_POD":
      return {
        ...state,
        pods: state.pods.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };
    case "PATCH_BUTTON":
      return {
        ...state,
        buttons: state.buttons.map((b) => (b.id === action.id ? { ...b, ...action.patch } : b)),
      };
    case "PATCH_MECHANIC":
      return {
        ...state,
        mechanics: state.mechanics.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)),
      };
    case "PATCH_STATION":
      return {
        ...state,
        stations: state.stations.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      };
    case "SET_STOP":
      return { ...state, emergencyStop: action.value };
    case "SET_SPEED":
      return { ...state, speed: action.value };
    case "HEARTBEAT":
      return { ...state, heartbeats: state.heartbeats + 1 };
    case "ADD_VEHICLE":
      return { ...state, vehicles: [...state.vehicles, action.vehicle] };
    case "ADD_CONTACT":
      return { ...state, contacts: [...state.contacts, action.contact] };
    case "RESET":
      return { ...initialState, emergencies: PAST_REQUESTS };
    case "TICK":
      return tick(state, now);
    default:
      return state;
  }
}

function tick(state: State, now: number): State {
  if (state.emergencyStop) return state;
  let pods = state.pods;
  let mechanics = state.mechanics;
  const step = state.speed;

  const emergencies = state.emergencies.map((e) => {
    if (TERMINAL.includes(e.stage) || MANUAL.includes(e.stage)) return e;
    let next = e;

    // Rail pod travel animation.
    if (next.stage === "POD_MOVING") {
      const progress = Math.min(100, next.podProgress + 3.2 * step);
      const station = state.stations.find((s) => s.id === next.stationId);
      const podKm = station ? station.km + ((next.km - station.km) * progress) / 100 : next.km;
      pods = pods.map((p) =>
        p.id === next.podId
          ? {
              ...p,
              km: podKm,
              status: progress >= 100 ? "ON_SITE" : "MOVING",
              speedKmph: progress >= 100 ? 0 : 38 + ((Math.round(progress) % 5) * 2),
              battery: Math.max(20, p.battery - 0.06 * step),
              obstacleClear: true,
            }
          : p,
      );
      next = {
        ...next,
        podProgress: progress,
        etaMin: Math.max(0, Math.round(railTravelMinutes(next.distanceKm) * (1 - progress / 100))),
      };
      if (progress >= 100) next = stamp(next, "POD_ARRIVED", now);
      return next;
    }

    // Mechanic travel animation.
    if (next.stage === "MECHANIC_EN_ROUTE") {
      const progress = Math.min(100, next.mechanicProgress + 4 * step);
      next = { ...next, mechanicProgress: progress };
      if (progress >= 100) next = stamp(next, "MECHANIC_ARRIVED", now);
      return next;
    }

    if (next.nextAt && now >= next.nextAt) {
      const [target] = AUTO[next.stage]!;

      if (target === "POD_ASSIGNED") {
        const match = findNearestAvailableStation(
          { lat: next.lat, lng: next.lng, km: next.km },
          state.stations,
          pods,
        );
        if (!match) return { ...next, nextAt: now + 2000 };
        pods = pods.map((p) => (p.id === match.pod.id ? { ...p, status: "DISPATCHED" } : p));
        next = {
          ...next,
          stationId: match.station.id,
          podId: match.pod.id,
          distanceKm: Number(Math.abs(match.station.km - next.km).toFixed(1)),
          etaMin: railTravelMinutes(Math.abs(match.station.km - next.km)),
        };
      }

      if (target === "MECHANIC_ASSIGNED") {
        const mech = findBestAvailableMechanic({ km: next.km }, next.problemType, mechanics);
        if (mech) {
          mechanics = mechanics.map((m) => (m.id === mech.id ? { ...m, available: false } : m));
          next = { ...next, mechanicId: mech.id, mechanicProgress: 0 };
        }
      }

      if (target === "COMPLETED") {
        pods = pods.map((p) =>
          p.id === next.podId
            ? { ...p, status: "IDLE", kitSeal: "SEALED", km: railHome(state, p), speedKmph: 0 }
            : p,
        );
        if (next.mechanicId) {
          mechanics = mechanics.map((m) =>
            m.id === next.mechanicId ? { ...m, available: true, earnings: m.earnings + 850, jobs: m.jobs + 1 } : m,
          );
        }
      }

      next = stamp(next, target, now);
    }
    return next;
  });

  return { ...state, emergencies, pods, mechanics };
}

function railHome(state: State, pod: Pod) {
  return state.stations.find((s) => s.id === pod.stationId)?.km ?? pod.km;
}

interface Ctx extends State {
  createEmergency: (input: {
    problemType: ProblemTypeId;
    vehicleLabel: string;
    buttonId?: string | null;
    km?: number;
    source?: Emergency["source"];
  }) => string;
  unlockKit: (id: string) => void;
  payAndUnlock: (id: string) => void;
  decideRepair: (id: string, repaired: boolean) => void;
  advance: (id: string, stage: Stage) => void;
  setEmergencyStop: (v: boolean) => void;
  setSpeed: (v: number) => void;
  pressButton: (buttonId: string) => void;
  addVehicle: (v: Vehicle) => void;
  addContact: (c: EmergencyContact) => void;
  reset: () => void;
  activeEmergencies: Emergency[];
}

const StoreContext = React.createContext<Ctx | null>(null);

let seq = 9001;

export function RoadRescueProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  React.useEffect(() => {
    const t = setInterval(() => dispatch({ type: "TICK" }), 250);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => dispatch({ type: "HEARTBEAT" }), 4000);
    return () => clearInterval(t);
  }, []);

  const createEmergency: Ctx["createEmergency"] = React.useCallback((input) => {
    const button = input.buttonId ? BUTTONS.find((b) => b.id === input.buttonId) : undefined;
    const km = button?.km ?? input.km ?? 16.2;
    const now = Date.now();
    const id = `ER-${seq++}`;
    const e: Emergency = {
      id,
      createdAt: now,
      updatedAt: now,
      stage: "CREATED",
      problemType: input.problemType,
      vehicleLabel: input.vehicleLabel,
      buttonId: button?.id ?? null,
      km,
      ...kmToLatLng(km),
      stationId: null,
      podId: null,
      mechanicId: null,
      podProgress: 0,
      distanceKm: 0,
      etaMin: 0,
      paid: false,
      amount: 99,
      kitUnlocked: false,
      source: input.source ?? (button ? "BUTTON" : "APP"),
      timeline: [{ stage: "CREATED", at: now }],
      nextAt: now + AUTO.CREATED![1],
      mechanicProgress: 0,
      driverName: DRIVER_NAME,
    };
    dispatch({ type: "CREATE", payload: e });
    if (button) {
      dispatch({
        type: "PATCH_BUTTON",
        id: button.id,
        patch: { presses: button.presses + 1, lastHeartbeat: now },
      });
    }
    return id;
  }, []);

  const value: Ctx = {
    ...state,
    activeEmergencies: state.emergencies.filter((e) => e.stage !== "COMPLETED"),
    createEmergency,
    unlockKit: (id) => {
      const e = state.emergencies.find((x) => x.id === id);
      if (!e) return;
      dispatch({
        type: "PATCH",
        id,
        patch: {
          kitUnlocked: true,
          stage: "ACCESS_GRANTED",
          nextAt: Date.now() + AUTO.ACCESS_GRANTED![1],
          timeline: [...e.timeline, { stage: "ACCESS_GRANTED", at: Date.now() }],
        },
      });
      if (e.podId) dispatch({ type: "PATCH_POD", id: e.podId, patch: { kitSeal: "OPEN" } });
    },
    payAndUnlock: (id) => dispatch({ type: "PATCH", id, patch: { paid: true } }),
    decideRepair: (id, repaired) => {
      const e = state.emergencies.find((x) => x.id === id);
      if (!e) return;
      const stage: Stage = repaired ? "REPAIR_SUCCESSFUL" : "UNABLE_TO_REPAIR";
      dispatch({
        type: "PATCH",
        id,
        patch: {
          stage,
          nextAt: Date.now() + AUTO[stage]![1],
          timeline: [...e.timeline, { stage, at: Date.now() }],
        },
      });
    },
    advance: (id, stage) => {
      const e = state.emergencies.find((x) => x.id === id);
      if (!e) return;
      dispatch({
        type: "PATCH",
        id,
        patch: {
          stage,
          nextAt: AUTO[stage] ? Date.now() + AUTO[stage]![1] : null,
          timeline: [...e.timeline, { stage, at: Date.now() }],
          mechanicProgress: stage === "MECHANIC_ARRIVED" ? 100 : e.mechanicProgress,
        },
      });
    },
    setEmergencyStop: (v) => dispatch({ type: "SET_STOP", value: v }),
    setSpeed: (v) => dispatch({ type: "SET_SPEED", value: v }),
    pressButton: (buttonId) =>
      dispatch({
        type: "PATCH_BUTTON",
        id: buttonId,
        patch: { lastHeartbeat: Date.now(), online: true },
      }),
    addVehicle: (vehicle) => dispatch({ type: "ADD_VEHICLE", vehicle }),
    addContact: (contact) => dispatch({ type: "ADD_CONTACT", contact }),
    reset: () => dispatch({ type: "RESET" }),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useRoadRescue() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useRoadRescue must be used inside RoadRescueProvider");
  return ctx;
}

export function useEmergency(id: string) {
  const { emergencies } = useRoadRescue();
  return emergencies.find((e) => e.id === id) ?? null;
}

export const STAGE_ORDER_PRIMARY: Stage[] = [
  "CREATED",
  "ACKNOWLEDGED",
  "FINDING_STATION",
  "POD_ASSIGNED",
  "POD_DISPATCHED",
  "POD_MOVING",
  "POD_ARRIVED",
  "WAITING_FOR_ACCESS",
  "ACCESS_GRANTED",
  "KIT_IN_USE",
];

export const STAGE_ORDER_MECHANIC: Stage[] = [
  "UNABLE_TO_REPAIR",
  "MECHANIC_SEARCHING",
  "MECHANIC_ASSIGNED",
  "MECHANIC_EN_ROUTE",
  "MECHANIC_ARRIVED",
  "REPAIR_IN_PROGRESS",
  "COMPLETED",
];
