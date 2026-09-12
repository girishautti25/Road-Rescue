import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/rr/Shell";
import { HighwayMap } from "@/components/rr/HighwayMap";
import { StageBadge, StageStepper } from "@/components/rr/StageStepper";
import { useRoadRescue } from "@/lib/roadrescue/store";
import { STAGE_LABELS } from "@/lib/roadrescue/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Interactive Demo — ROADRESCUE B-027 Ghat Road Rescue" },
      {
        name: "description",
        content:
          "One-click presentation runner: button B-027 pressed, station S2 chosen over S1, pod dispatched, QR unlock, ₹99 test payment, mechanic fallback and completion.",
      },
      { property: "og:title", content: "ROADRESCUE Interactive Demo" },
      {
        property: "og:description",
        content: "Watch a full highway rescue play out step by step.",
      },
    ],
  }),
  component: DemoPage,
});

const SCRIPT = [
  "Button B-027 pressed on NH-44 Ghat Road (km 16.2)",
  "Control room acknowledges the alert",
  "Nearest station computed: S2 at 2.7 km beats S1 at 8.4 km",
  "S2-POD01 assigned and released onto the rail",
  "Pod glides along the rail, telemetry streaming live",
  "Pod arrives beside the vehicle",
  "Driver scans QR and pays ₹99 (test mode) — kit unlocked",
  "Driver reports 'Unable to Repair'",
  "Mechanic M-004 matched, assigned and en route",
  "Repair completed · pod returns to S2 and re-seals",
];

function DemoPage() {
  const {
    emergencies,
    stations,
    pods,
    buttons,
    mechanics,
    createEmergency,
    unlockKit,
    payAndUnlock,
    decideRepair,
    setSpeed,
    speed,
  } = useRoadRescue();

  const [demoId, setDemoId] = React.useState<string | null>(null);
  const [auto, setAuto] = React.useState(true);
  const emergency = emergencies.find((e) => e.id === demoId) ?? null;
  const mechanic = mechanics.find((m) => m.id === emergency?.mechanicId);

  React.useEffect(() => {
    setSpeed(3);
    return () => setSpeed(1);
  }, [setSpeed]);

  // Auto-play resolves the two human gates by itself.
  React.useEffect(() => {
    if (!auto || !emergency) return;
    if (emergency.stage === "WAITING_FOR_ACCESS") {
      const t = setTimeout(() => {
        payAndUnlock(emergency.id);
        unlockKit(emergency.id);
        toast.success("Test payment ₹99 · kit unlocked");
      }, 1600);
      return () => clearTimeout(t);
    }
    if (emergency.stage === "KIT_IN_USE") {
      const t = setTimeout(() => {
        decideRepair(emergency.id, false);
        toast("Driver reported: unable to repair");
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [auto, emergency, payAndUnlock, unlockKit, decideRepair]);

  const stageIndex = (() => {
    if (!emergency) return -1;
    const s = emergency.stage;
    if (s === "CREATED") return 0;
    if (s === "ACKNOWLEDGED") return 1;
    if (s === "FINDING_STATION") return 2;
    if (s === "POD_ASSIGNED" || s === "POD_DISPATCHED") return 3;
    if (s === "POD_MOVING") return 4;
    if (s === "POD_ARRIVED" || s === "WAITING_FOR_ACCESS") return 5;
    if (s === "ACCESS_GRANTED" || s === "KIT_IN_USE") return 6;
    if (s === "UNABLE_TO_REPAIR") return 7;
    if (s.startsWith("MECHANIC") || s === "REPAIR_IN_PROGRESS") return 8;
    return 9;
  })();

  function start() {
    const id = createEmergency({
      problemType: "TYRE_BURST",
      vehicleLabel: "Hyundai i20 · KA 51 MJ 4412",
      buttonId: "B-027",
      source: "DEMO",
    });
    setDemoId(id);
    toast.success("Demo started · Button B-027 pressed");
  }

  function nextStep() {
    if (!emergency) return start();
    if (emergency.stage === "WAITING_FOR_ACCESS") {
      payAndUnlock(emergency.id);
      unlockKit(emergency.id);
      return toast.success("Test payment ₹99 · kit unlocked");
    }
    if (emergency.stage === "KIT_IN_USE") {
      decideRepair(emergency.id, false);
      return toast("Driver reported: unable to repair");
    }
    toast("This stage advances automatically");
  }

  const podForDemo = pods.find((p) => p.id === emergency?.podId);

  return (
    <AppShell
      title="Interactive demo"
      subtitle="The full B-027 Ghat Road rescue, end to end"
      actions={
        <div className="flex flex-wrap gap-2">
          {!emergency ? (
            <Button size="lg" className="bg-emergency text-emergency-foreground hover:bg-emergency/90" onClick={start}>
              <Play className="size-5" /> Run the demo
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setAuto((a) => !a)}>
                {auto ? <Pause className="size-4" /> : <Play className="size-4" />}
                {auto ? "Auto-play on" : "Manual step-through"}
              </Button>
              <Button variant="outline" onClick={nextStep} disabled={auto}>
                <SkipForward className="size-4" /> Next step
              </Button>
              <Button variant="outline" onClick={() => setDemoId(null)}>
                <RotateCcw className="size-4" /> Reset
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Corridor simulation</CardTitle>
              {emergency && <StageBadge stage={emergency.stage} />}
            </CardHeader>
            <CardContent className="space-y-4">
              <HighwayMap
                stations={stations}
                pods={pods}
                buttons={buttons}
                emergencies={emergency ? [emergency] : []}
                highlightKm={emergency?.km ?? 16.2}
              />
              {emergency && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium">Rail progress · {emergency.podId ?? "pending"}</span>
                      <span className="text-muted-foreground">{Math.round(emergency.podProgress)}%</span>
                    </div>
                    <Progress value={emergency.podProgress} className="h-3" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <Stat label="Battery" value={podForDemo ? `${Math.round(podForDemo.battery)}%` : "—"} />
                    <Stat label="Speed" value={podForDemo ? `${Math.round(podForDemo.speedKmph)} km/h` : "—"} />
                    <Stat label="ETA" value={emergency.etaMin > 0 ? `${emergency.etaMin} min` : "Arrived"} />
                  </div>
                </div>
              )}
              {!emergency && (
                <p className="text-sm text-muted-foreground">
                  Press <strong>Run the demo</strong> to simulate button B-027 being pressed on the Ghat
                  road section. Simulation speed is {speed}× for presentation.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presentation script</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5">
                {SCRIPT.map((line, i) => {
                  const done = i < stageIndex;
                  const active = i === stageIndex;
                  return (
                    <li
                      key={line}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                        active && "border-emergency bg-emergency/5 font-semibold text-emergency",
                        done && "border-success/40 bg-success/5",
                        !active && !done && "border-border text-muted-foreground",
                      )}
                    >
                      <span className="grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold">
                        {done ? <Check className="size-3" /> : i + 1}
                      </span>
                      {line}
                    </li>
                  );
                })}
              </ol>
              {mechanic && (
                <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
                  <p className="font-semibold">
                    Mechanic {mechanic.id} · {mechanic.name}
                  </p>
                  <p className="text-muted-foreground">
                    Rating {mechanic.rating} · {mechanic.jobs} jobs · km {mechanic.km} · progress{" "}
                    {Math.round(emergency?.mechanicProgress ?? 0)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Station decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-success/40 bg-success/10 p-3">
                <span className="font-semibold">S2 · Ghat Road Rail Base</span>
                <span>2.7 km ✓</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3 text-muted-foreground">
                <span>S1 · Attibele Rail Base</span>
                <span>8.4 km</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Chosen by <span className="font-mono">findNearestAvailableStation()</span> using
                Haversine distance and pod availability.
              </p>
            </CardContent>
          </Card>

          {emergency ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lifecycle</CardTitle>
              </CardHeader>
              <CardContent>
                <StageStepper emergency={emergency} />
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to="/driver/request/$id" params={{ id: emergency.id }}>
                    Open the driver view
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What you'll see</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                All 18 lifecycle states from {STAGE_LABELS.CREATED.toLowerCase()} through{" "}
                {STAGE_LABELS.COMPLETED.toLowerCase()}, including the mechanic fallback branch.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-base font-bold">{value}</p>
    </div>
  );
}
