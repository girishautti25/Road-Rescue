export type Stage =
  | "CREATED"
  | "ACKNOWLEDGED"
  | "FINDING_STATION"
  | "POD_ASSIGNED"
  | "POD_DISPATCHED"
  | "POD_MOVING"
  | "POD_ARRIVED"
  | "WAITING_FOR_ACCESS"
  | "ACCESS_GRANTED"
  | "KIT_IN_USE"
  | "REPAIR_SUCCESSFUL"
  | "UNABLE_TO_REPAIR"
  | "MECHANIC_SEARCHING"
  | "MECHANIC_ASSIGNED"
  | "MECHANIC_EN_ROUTE"
  | "MECHANIC_ARRIVED"
  | "REPAIR_IN_PROGRESS"
  | "COMPLETED";

export const STAGE_LABELS: Record<Stage, string> = {
  CREATED: "Request created",
  ACKNOWLEDGED: "Control room acknowledged",
  FINDING_STATION: "Finding nearest station",
  POD_ASSIGNED: "Rescue pod assigned",
  POD_DISPATCHED: "Pod dispatched",
  POD_MOVING: "Pod moving on rail",
  POD_ARRIVED: "Pod arrived at your location",
  WAITING_FOR_ACCESS: "Waiting for kit access",
  ACCESS_GRANTED: "Access granted",
  KIT_IN_USE: "Kit in use",
  REPAIR_SUCCESSFUL: "Repair successful",
  UNABLE_TO_REPAIR: "Repair not possible",
  MECHANIC_SEARCHING: "Searching for mechanic",
  MECHANIC_ASSIGNED: "Mechanic assigned",
  MECHANIC_EN_ROUTE: "Mechanic en route",
  MECHANIC_ARRIVED: "Mechanic arrived",
  REPAIR_IN_PROGRESS: "Repair in progress",
  COMPLETED: "Completed",
};

export const PROBLEM_TYPES = [
  { id: "TYRE_PUNCTURE", label: "Tyre puncture", icon: "🛞" },
  { id: "TYRE_BURST", label: "Tyre burst", icon: "💥" },
  { id: "BATTERY_DEAD", label: "Battery dead", icon: "🔋" },
  { id: "ENGINE_ISSUE", label: "Engine issue", icon: "⚙️" },
  { id: "FUEL_SHORTAGE", label: "Fuel shortage", icon: "⛽" },
  { id: "OVERHEATING", label: "Overheating", icon: "🌡️" },
  { id: "BRAKE_ISSUE", label: "Brake issue", icon: "🛑" },
  { id: "OTHER", label: "Something else", icon: "❓" },
] as const;

export type ProblemTypeId = (typeof PROBLEM_TYPES)[number]["id"];

export interface Station {
  id: string;
  name: string;
  km: number;
  lat: number;
  lng: number;
  status: "ONLINE" | "MAINTENANCE";
  railLengthKm: number;
}

export interface Pod {
  id: string;
  stationId: string;
  status: "IDLE" | "DISPATCHED" | "MOVING" | "ON_SITE" | "RETURNING" | "CHARGING";
  battery: number;
  speedKmph: number;
  obstacleClear: boolean;
  km: number;
  kitSeal: "SEALED" | "OPEN";
}

export interface EmergencyButton {
  id: string;
  km: number;
  lat: number;
  lng: number;
  stationId: string;
  online: boolean;
  lastHeartbeat: number;
  battery: number;
  presses: number;
}

export interface Mechanic {
  id: string;
  name: string;
  phone: string;
  rating: number;
  jobs: number;
  skills: ProblemTypeId[];
  km: number;
  available: boolean;
  earnings: number;
}

export interface Vehicle {
  id: string;
  label: string;
  plate: string;
  type: "Car" | "SUV" | "Bike" | "Truck";
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface Emergency {
  id: string;
  createdAt: number;
  updatedAt: number;
  stage: Stage;
  problemType: ProblemTypeId;
  vehicleLabel: string;
  buttonId: string | null;
  km: number;
  lat: number;
  lng: number;
  stationId: string | null;
  podId: string | null;
  mechanicId: string | null;
  podProgress: number;
  distanceKm: number;
  etaMin: number;
  paid: boolean;
  amount: number;
  kitUnlocked: boolean;
  source: "BUTTON" | "APP" | "DEMO";
  timeline: { stage: Stage; at: number }[];
  nextAt: number | null;
  mechanicProgress: number;
  driverName: string;
}
