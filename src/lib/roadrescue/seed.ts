import type {
  EmergencyButton,
  Emergency,
  Mechanic,
  Pod,
  Station,
  Vehicle,
  EmergencyContact,
} from "./types";

/** The simulated NH-44 / Ghat Road corridor is modelled as chainage in km. */
export const CORRIDOR_LENGTH_KM = 31;

export function kmToLatLng(km: number) {
  return { lat: 12.9 + km * 0.009, lng: 77.6 + km * 0.004 };
}

export const STATIONS: Station[] = [
  { id: "S1", name: "S1 · Attibele Rail Base", km: 7.8, status: "ONLINE", railLengthKm: 11, ...kmToLatLng(7.8) },
  { id: "S2", name: "S2 · Ghat Road Rail Base", km: 18.9, status: "ONLINE", railLengthKm: 11, ...kmToLatLng(18.9) },
  { id: "S3", name: "S3 · Hosur Bypass Base", km: 28.2, status: "ONLINE", railLengthKm: 9, ...kmToLatLng(28.2) },
  { id: "S4", name: "S4 · Krishnagiri Base", km: 2.4, status: "MAINTENANCE", railLengthKm: 8, ...kmToLatLng(2.4) },
];

export const PODS: Pod[] = STATIONS.flatMap((s, i) => {
  const count = i < 2 ? 2 : 1;
  return Array.from({ length: count }, (_, j) => ({
    id: `${s.id}-POD0${j + 1}`,
    stationId: s.id,
    status: (s.status === "MAINTENANCE" ? "CHARGING" : "IDLE") as Pod["status"],
    battery: 78 + ((i * 7 + j * 11) % 22),
    speedKmph: 0,
    obstacleClear: true,
    km: s.km,
    kitSeal: "SEALED" as const,
  }));
});

export function nearestStationId(km: number) {
  return STATIONS.filter((s) => s.status === "ONLINE").reduce((best, s) =>
    Math.abs(s.km - km) < Math.abs(best.km - km) ? s : best,
  ).id;
}

export const BUTTONS: EmergencyButton[] = Array.from({ length: 50 }, (_, i) => {
  const km = Number(((i + 1) * 0.6).toFixed(2));
  return {
    id: `B-${String(i + 1).padStart(3, "0")}`,
    km,
    ...kmToLatLng(km),
    stationId: nearestStationId(km),
    online: i !== 12 && i !== 40,
    lastHeartbeat: Date.now() - ((i * 7919) % 90) * 1000,
    battery: 62 + ((i * 13) % 38),
    presses: (i * 3) % 5,
  };
});

const SKILLS = [
  ["TYRE_PUNCTURE", "TYRE_BURST", "BATTERY_DEAD"],
  ["ENGINE_ISSUE", "OVERHEATING", "BRAKE_ISSUE"],
  ["BATTERY_DEAD", "FUEL_SHORTAGE", "OTHER"],
  ["TYRE_BURST", "ENGINE_ISSUE", "BRAKE_ISSUE", "OTHER"],
  ["FUEL_SHORTAGE", "TYRE_PUNCTURE", "OVERHEATING"],
] as unknown as Mechanic["skills"][];

const NAMES = [
  "Ravi Kumar",
  "Suresh Naik",
  "Imran Shaikh",
  "Manoj Reddy",
  "Prakash Rao",
  "Deepak Joshi",
  "Arun Pillai",
  "Vikas Yadav",
  "Sathish Kumar",
  "Faizan Ahmed",
];

export const MECHANICS: Mechanic[] = NAMES.map((name, i) => ({
  id: `M-${String(i + 1).padStart(3, "0")}`,
  name,
  phone: `+91 9${String(800000000 + i * 1234567).slice(0, 9)}`,
  rating: Number((4.9 - (i % 5) * 0.18).toFixed(1)),
  jobs: 40 + ((i * 37) % 260),
  skills: SKILLS[i % SKILLS.length]!,
  km: Number((2 + i * 2.9).toFixed(1)),
  available: i !== 2 && i !== 7,
  earnings: 4200 + ((i * 977) % 9000),
}));

export const SAVED_VEHICLES: Vehicle[] = [
  { id: "v1", label: "Hyundai i20", plate: "KA 51 MJ 4412", type: "Car" },
  { id: "v2", label: "Mahindra XUV700", plate: "KA 02 HK 9087", type: "SUV" },
  { id: "v3", label: "Royal Enfield Classic", plate: "TN 29 BQ 1123", type: "Bike" },
];

export const CONTACTS: EmergencyContact[] = [
  { id: "c1", name: "Anita Utti", relation: "Spouse", phone: "+91 98450 11223" },
  { id: "c2", name: "Girish Rao", relation: "Brother", phone: "+91 99860 44551" },
];

export const DRIVER_NAME = "Girisha Utti";

const now = Date.now();
export const PAST_REQUESTS: Emergency[] = [
  {
    id: "ER-8841",
    createdAt: now - 86400000 * 3,
    updatedAt: now - 86400000 * 3 + 2400000,
    stage: "COMPLETED",
    problemType: "TYRE_PUNCTURE",
    vehicleLabel: "Hyundai i20 · KA 51 MJ 4412",
    buttonId: "B-014",
    km: 8.4,
    ...kmToLatLng(8.4),
    stationId: "S1",
    podId: "S1-POD01",
    mechanicId: null,
    podProgress: 100,
    distanceKm: 0.6,
    etaMin: 3,
    paid: true,
    amount: 99,
    kitUnlocked: true,
    source: "BUTTON",
    timeline: [{ stage: "CREATED", at: now - 86400000 * 3 }],
    nextAt: null,
    mechanicProgress: 0,
    driverName: DRIVER_NAME,
  },
  {
    id: "ER-8776",
    createdAt: now - 86400000 * 11,
    updatedAt: now - 86400000 * 11 + 5400000,
    stage: "COMPLETED",
    problemType: "BATTERY_DEAD",
    vehicleLabel: "Mahindra XUV700 · KA 02 HK 9087",
    buttonId: null,
    km: 20.4,
    ...kmToLatLng(20.4),
    stationId: "S2",
    podId: "S2-POD01",
    mechanicId: "M-004",
    podProgress: 100,
    distanceKm: 1.5,
    etaMin: 5,
    paid: true,
    amount: 99,
    kitUnlocked: true,
    source: "APP",
    timeline: [{ stage: "CREATED", at: now - 86400000 * 11 }],
    nextAt: null,
    mechanicProgress: 100,
    driverName: DRIVER_NAME,
  },
];
