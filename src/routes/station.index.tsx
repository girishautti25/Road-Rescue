import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Activity,
  BatteryCharging,
  Radio,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/rr/Shell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRoadRescue } from "@/lib/roadrescue/store";
import { StageBadge } from "@/components/rr/StageStepper";
import type { Station } from "@/lib/roadrescue/types";

export const Route = createFileRoute("/station/")({
  head: () => ({
    meta: [
      { title: "Station Operations — ROADRESCUE" },
      {
        name: "description",
        content: "Station Operator console for rail pod fleet monitoring, maintenance and local dispatch telemetry.",
      },
      { property: "og:title", content: "ROADRESCUE Station Operator Portal" },
    ],
  }),
  component: () => (
    <ProtectedRoute allowedRoles={["STATION_OPERATOR", "ADMIN", "SUPER_ADMIN"]}>
      <StationOperatorPortal />
    </ProtectedRoute>
  ),
});

function StationOperatorPortal() {
  const { user } = useAuth();
  const { stations, pods, buttons, emergencies, activeEmergencies } = useRoadRescue();

  const defaultStation: Station = stations[0] || {
    id: "S2",
    name: "Highway Station Beta",
    km: 12.5,
    lat: 15.8281,
    lng: 78.0373,
    status: "ONLINE",
    railLengthKm: 15,
  };

  // If station operator has assigned station_id, scope to that station. Otherwise default to S2 (or allow admin to pick).
  const assignedStationId = user?.station_id || defaultStation.id;
  const [selectedStationId, setSelectedStationId] = React.useState<string>(assignedStationId);

  const currentStation: Station = stations.find((s) => s.id === selectedStationId) || defaultStation;
  const stationPods = pods.filter((p) => p.stationId === currentStation.id);
  const stationEmergencies = emergencies.filter((e) => e.stationId === currentStation.id);
  const activeStationEmergencies = activeEmergencies.filter((e) => e.stationId === currentStation.id);
  const coveredButtons = buttons.filter((b) => b.stationId === currentStation.id);

  const canSwitchStation = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const handleMaintenanceToggle = (podId: string) => {
    toast.success(`Diagnostics and maintenance check scheduled for pod ${podId}`);
  };

  const handleRecalibrateRail = () => {
    toast.success(`Rail alignment telemetry recalibrated for ${currentStation.name}`);
  };

  return (
    <AppShell
      title={`Station ${currentStation.id} Operations`}
      subtitle={`${currentStation.name} · Highway Rail Corridor`}
      actions={
        <div className="flex items-center gap-2">
          {canSwitchStation && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-1">
              <span className="px-2 text-xs font-semibold text-muted-foreground">Admin View:</span>
              {stations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                    selectedStationId === st.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {st.id}
                </button>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleRecalibrateRail}>
            <RefreshCw className="size-3.5" /> Recalibrate Rail
          </Button>
        </div>
      }
    >
      {/* Station Overview Banner */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Station Status
            </CardTitle>
            <Building2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xl font-bold">{currentStation.status}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Station km {currentStation.km.toFixed(1)} · Lat {currentStation.lat.toFixed(4)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Station Pod Fleet
            </CardTitle>
            <Zap className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stationPods.length} pods</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stationPods.filter((p) => p.status === "IDLE").length} idle ·{" "}
              {stationPods.filter((p) => p.status === "MOVING").length} moving
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Dispatches
            </CardTitle>
            <Activity className="size-4 text-emergency" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emergency">
              {activeStationEmergencies.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stationEmergencies.length} total local calls today
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rail Telemetry
            </CardTitle>
            <Gauge className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStation.railLengthKm} km</div>
            <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="size-3" /> Rail Clear & Powered
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pod Fleet Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Station Pod Fleet</CardTitle>
                  <CardDescription>
                    Horizontal rail-mounted emergency pods stationed at {currentStation.name}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono">
                  Station ID: {currentStation.id}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stationPods.map((pod) => (
                <div
                  key={pod.id}
                  className="rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-border"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary font-bold">
                        {pod.id.split("-")[1] || pod.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{pod.id}</span>
                          <Badge
                            className={
                              pod.status === "IDLE"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : pod.status === "MOVING"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {pod.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Location: km {pod.km.toFixed(1)} · Speed: {pod.speedKmph} km/h
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 gap-1"
                        onClick={() => handleMaintenanceToggle(pod.id)}
                      >
                        <Wrench className="size-3" /> Diagnostics
                      </Button>
                      <Button asChild size="sm" variant="secondary" className="text-xs h-8">
                        <Link to="/kit-access/$podId" params={{ podId: pod.id }} search={{ req: "" }}>
                          Inspect Kit
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Battery Level</p>
                      <div className="flex items-center gap-1.5 font-semibold text-foreground mt-0.5">
                        <BatteryCharging className="size-3.5 text-emerald-500" /> {pod.battery}%
                      </div>
                      <Progress value={pod.battery} className="h-1.5 mt-1.5" />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Emergency Kit Seal</p>
                      <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="size-3.5 text-emerald-500" /> {pod.kitSeal}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Obstacle Sensor</p>
                      <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                        {pod.obstacleClear ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" /> CLEAR
                          </span>
                        ) : (
                          <span className="text-emergency flex items-center gap-1">
                            <AlertTriangle className="size-3.5" /> BLOCKED
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Station Emergencies Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Station Emergency Log</CardTitle>
              <CardDescription>
                Live and recent rescue dispatches allocated to Station {currentStation.id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stationEmergencies.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No emergency requests currently assigned to this station.
                </div>
              ) : (
                <div className="space-y-3">
                  {stationEmergencies.map((em) => (
                    <div
                      key={em.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{em.id}</span>
                          <StageBadge stage={em.stage} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vehicle: <span className="font-medium text-foreground">{em.vehicleLabel}</span> · Button: {em.buttonId || "GPS"} · Pod: {em.podId || "—"}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to="/driver/request/$id" params={{ id: em.id }}>
                          Track
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Covered Emergency Buttons & Hardware Node Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Covered Button Network</CardTitle>
              <CardDescription>
                IoT roadside emergency buttons mapped to Station {currentStation.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[480px] overflow-y-auto">
              {coveredButtons.length === 0 ? (
                <p className="text-xs text-muted-foreground">No buttons currently mapped.</p>
              ) : (
                coveredButtons.map((btn) => (
                  <div
                    key={btn.id}
                    className="flex items-center justify-between rounded-lg border border-border/70 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="size-4 text-emerald-500" />
                      <div>
                        <span className="font-bold text-foreground">{btn.id}</span>
                        <p className="text-[11px] text-muted-foreground">Corridor km {btn.km.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`rounded px-1.5 py-0.5 font-bold text-[10px] ${
                          btn.online
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {btn.online ? "ONLINE" : "OFFLINE"}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Batt: {btn.battery}%</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Station Operator Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>• Verify emergency kit seals before returning pods to the idle state.</p>
              <p>• In case of track obstruction, contact highway safety team and trigger diagnostic halt.</p>
              <p>• Station battery reserves must remain above 80% for uninterrupted autonomous dispatch.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
