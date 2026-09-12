import type { Mechanic, Pod, ProblemTypeId, Station } from "./types";

/** Great-circle distance in km. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface StationMatch {
  station: Station;
  pod: Pod;
  distanceKm: number;
  ranked: { station: Station; distanceKm: number; available: boolean }[];
}

/** Nearest station that is online and has an idle rail pod within rail reach. */
export function findNearestAvailableStation(
  location: { lat: number; lng: number; km: number },
  stations: Station[],
  pods: Pod[],
): StationMatch | null {
  const ranked = stations
    .map((station) => {
      const distanceKm = Number(haversineKm(location, station).toFixed(1));
      const available =
        station.status === "ONLINE" &&
        Math.abs(station.km - location.km) <= station.railLengthKm &&
        pods.some((p) => p.stationId === station.id && p.status === "IDLE");
      return { station, distanceKm, available };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const winner = ranked.find((r) => r.available);
  if (!winner) return null;
  const pod = pods.find((p) => p.stationId === winner.station.id && p.status === "IDLE")!;
  return { station: winner.station, pod, distanceKm: winner.distanceKm, ranked };
}

/** Best mechanic: skill match first, then proximity, then rating. */
export function findBestAvailableMechanic(
  location: { km: number },
  problemType: ProblemTypeId,
  mechanics: Mechanic[],
): Mechanic | null {
  const scored = mechanics
    .filter((m) => m.available)
    .map((m) => {
      const distance = Math.abs(m.km - location.km);
      const skill = m.skills.includes(problemType) ? 1 : 0;
      const score = skill * 100 - distance * 3 + m.rating * 4;
      return { m, score, distance };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.m ?? null;
}

export function railTravelMinutes(distanceKm: number) {
  return Math.max(2, Math.round((distanceKm / 42) * 60));
}
