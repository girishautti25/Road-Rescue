import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BatteryFull,
  CheckCircle2,
  Gauge,
  Phone,
  QrCode,
  ShieldAlert,
  Star,
  Timer,
  TrainFront,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/rr/Shell";
import { HighwayMap } from "@/components/rr/HighwayMap";
import { StageBadge, StageStepper } from "@/components/rr/StageStepper";
import { useRoadRescue } from "@/lib/roadrescue/store";
import { PROBLEM_TYPES } from "@/lib/roadrescue/types";

export const Route = createFileRoute("/driver/request/$id")({
  head: () => ({
    meta: [
      { title: "Live Rescue Tracking — ROADRESCUE" },
      {
        name: "description",
        content:
          "Track your rescue pod in real time: stage stepper, rail progress, pod telemetry, kit unlock and mechanic status.",
      },
      { property: "og:title", content: "Live Rescue Tracking — ROADRESCUE" },
      { property: "og:description", content: "Real-time pod progress and repair status." },
    ],
  }),
  component: RequestTracking,
});

function RequestTracking() {
  const { id } = Route.useParams();
  const { emergencies, stations, pods, buttons, mechanics, decideRepair } = useRoadRescue();
  const emergency = emergencies.find((e) => e.id === id);

  if (!emergency) {
    return (
      <AppShell title="Request not found" subtitle={`No rescue request with ID ${id}`}>
        <Button asChild>
          <Link to="/driver">Back to dashboard</Link>
        </Button>
      </AppShell>
    );
  }

  const pod = pods.find((p) => p.id === emergency.podId);
  const station = stations.find((s) => s.id === emergency.stationId);
  const mechanic = mechanics.find((m) => m.id === emergency.mechanicId);
  const problem = PROBLEM_TYPES.find((p) => p.id === emergency.problemType);

  return (
    <AppShell
      title={`Rescue ${emergency.id}`}
      subtitle={`${problem?.label} · ${emergency.vehicleLabel}`}
      actions={<StageBadge stage={emergency.stage} />}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Rail corridor view</CardTitle>
              <span className="text-xs text-muted-foreground">
                {emergency.buttonId ? `Button ${emergency.buttonId}` : "GPS request"} · km{" "}
                {emergency.km.toFixed(1)}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <HighwayMap
                stations={stations}
                pods={pod ? [pod] : pods}
                buttons={buttons}
                emergencies={[emergency]}
                highlightKm={emergency.km}
              />
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <TrainFront className="size-4 text-emergency" />
                    {emergency.podId ?? "Pod pending"} from {station?.id ?? "—"}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(emergency.podProgress)}% · {emergency.distanceKm} km
                  </span>
                </div>
                <Progress value={emergency.podProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {pod && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pod telemetry</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Telemetry icon={BatteryFull} label="Battery" value={`${Math.round(pod.battery)}%`} />
                <Telemetry icon={Gauge} label="Speed" value={`${Math.round(pod.speedKmph)} km/h`} />
                <Telemetry
                  icon={ShieldAlert}
                  label="Rail path"
                  value={pod.obstacleClear ? "Clear" : "Obstacle"}
                  tone={pod.obstacleClear ? "success" : "emergency"}
                />
                <Telemetry icon={Timer} label="ETA" value={emergency.etaMin > 0 ? `${emergency.etaMin} min` : "Arrived"} />
              </CardContent>
            </Card>
          )}

          {emergency.stage === "WAITING_FOR_ACCESS" && (
            <Card className="border-emergency/40 bg-emergency/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <p className="font-semibold text-emergency">Pod is beside your vehicle</p>
                  <p className="text-sm text-muted-foreground">
                    Scan the QR code on the pod door to unlock the sealed kit (₹99).
                  </p>
                </div>
                <Button asChild size="lg" className="bg-emergency text-emergency-foreground hover:bg-emergency/90">
                  <Link to="/kit-access/$podId" params={{ podId: emergency.podId! }} search={{ req: emergency.id }}>
                    <QrCode className="size-5" /> Scan QR to unlock
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {emergency.stage === "KIT_IN_USE" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Could you repair your vehicle?</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Button
                  size="lg"
                  className="h-14 bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => {
                    decideRepair(emergency.id, true);
                    toast.success("Great — closing your rescue");
                  }}
                >
                  <CheckCircle2 className="size-5" /> Vehicle repaired
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 border-emergency/40 text-emergency hover:bg-emergency/10"
                  onClick={() => {
                    decideRepair(emergency.id, false);
                    toast("Finding a verified mechanic near you");
                  }}
                >
                  <Wrench className="size-5" /> Unable to repair
                </Button>
              </CardContent>
            </Card>
          )}

          {mechanic && (
            <Card className="border-warning/50 bg-warning/10">
              <CardHeader>
                <CardTitle className="text-base">Mechanic {mechanic.id} en route</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{mechanic.name}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="size-3.5 fill-warning text-warning" /> {mechanic.rating} ·{" "}
                      {mechanic.jobs} jobs
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast(`Calling ${mechanic.phone}`)}>
                    <Phone className="size-4" /> Call
                  </Button>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>On the way</span>
                    <span>{Math.round(emergency.mechanicProgress)}%</span>
                  </div>
                  <Progress value={emergency.mechanicProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {emergency.stage === "COMPLETED" && (
            <Card className="border-success/40 bg-success/10">
              <CardContent className="p-6">
                <p className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="size-5" /> Rescue completed
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pod returned to {station?.id ?? "its station"} and re-sealed. Total elapsed{" "}
                  {Math.max(1, Math.round((emergency.updatedAt - emergency.createdAt) / 60000))} min.
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/driver">Back to dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:sticky lg:top-24 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <StageStepper emergency={emergency} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Telemetry({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  tone?: "success" | "emergency";
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p
        className={
          tone === "emergency"
            ? "mt-1 font-display text-lg font-bold text-emergency"
            : tone === "success"
              ? "mt-1 font-display text-lg font-bold text-success"
              : "mt-1 font-display text-lg font-bold"
        }
      >
        {value}
      </p>
    </div>
  );
}
