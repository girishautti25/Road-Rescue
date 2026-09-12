import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BellRing,
  Check,
  IndianRupee,
  MapPin,
  Navigation,
  Star,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/rr/Shell";
import { StageBadge } from "@/components/rr/StageStepper";
import { useRoadRescue } from "@/lib/roadrescue/store";
import { PROBLEM_TYPES, type Stage } from "@/lib/roadrescue/types";

export const Route = createFileRoute("/mechanic/")({
  head: () => ({
    meta: [
      { title: "Mechanic Portal — ROADRESCUE" },
      {
        name: "description",
        content:
          "Accept dispatches, navigate to stranded drivers, update repair status and track your ROADRESCUE earnings.",
      },
      { property: "og:title", content: "ROADRESCUE Mechanic Portal" },
      { property: "og:description", content: "Dispatch alerts, navigation and earnings." },
    ],
  }),
  component: MechanicPortal;
});

const FLOW: { stage: Stage; label: string }[] = [
  { stage: "MECHANIC_EN_ROUTE", label: "Start journey" },
  { stage: "MECHANIC_ARRIVED", label: "Arrived at vehicle" },
  { stage: "REPAIR_IN_PROGRESS", label: "Start repair" },
  { stage: "COMPLETED", label: "Complete repair" },
];

function MechanicPortal() {
  const { emergencies, mechanics, advance } = useRoadRescue();
  const [rejected, setRejected] = React.useState<string[]>([]);

  const job =
    emergencies.find(
      (e) =>
        e.mechanicId &&
        !rejected.includes(e.id) &&
        ["MECHANIC_ASSIGNED", "MECHANIC_EN_ROUTE", "MECHANIC_ARRIVED", "REPAIR_IN_PROGRESS"].includes(
          e.stage,
        ),
    ) ?? null;

  const me = mechanics.find((m) => m.id === job?.mechanicId) ?? mechanics[3];
  const problem = PROBLEM_TYPES.find((p) => p.id === job?.problemType);
  const completed = emergencies.filter((e) => e.stage === "COMPLETED" && e.mechanicId === me.id);

  return (
    <AppShell
      title={`Mechanic ${me.id}`}
      subtitle={`${me.name} · rating ${me.rating} · ${me.jobs} jobs completed`}
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-sm font-semibold text-success">
          <span className="size-2 rounded-full bg-success" /> {me.available ? "Available" : "On a job"}
        </span>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {job ? (
            <Card className="border-emergency/40">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BellRing className="size-4 text-emergency" /> Dispatch {job.id}
                </CardTitle>
                <StageBadge stage={job.stage} />
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Problem" value={`${problem?.icon ?? ""} ${problem?.label ?? "—"}`} />
                  <Info label="Vehicle" value={job.vehicleLabel} />
                  <Info label="Driver" value={job.driverName} />
                  <Info
                    label="Location"
                    value={`${job.buttonId ? `Button ${job.buttonId} · ` : ""}km ${job.km.toFixed(1)}`}
                  />
                </div>

                {job.stage === "MECHANIC_ASSIGNED" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      className="h-14 bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => {
                        advance(job.id, "MECHANIC_EN_ROUTE");
                        toast.success("Dispatch accepted · navigation started");
                      }}
                    >
                      <Check className="size-5" /> Accept dispatch
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 border-emergency/40 text-emergency hover:bg-emergency/10"
                      onClick={() => {
                        setRejected((r) => [...r, job.id]);
                        toast("Dispatch rejected · reassigning to next mechanic");
                      }}
                    >
                      <X className="size-5" /> Reject
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Navigation className="size-4 text-emergency" /> Route to driver
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>· Head to NH-44 service road, keep left at Ghat entry</li>
                        <li>· Continue {Math.abs(me.km - job.km).toFixed(1)} km to km marker {job.km.toFixed(1)}</li>
                        <li>· Look for rescue pod {job.podId} on the shoulder rail</li>
                      </ul>
                      <div className="mt-3">
                        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                          <span>Journey progress</span>
                          <span>{Math.round(job.mechanicProgress)}%</span>
                        </div>
                        <Progress value={job.mechanicProgress} className="h-2" />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-4">
                      {FLOW.map((f) => (
                        <Button
                          key={f.stage}
                          variant={job.stage === f.stage ? "default" : "outline"}
                          disabled={job.stage === f.stage}
                          onClick={() => {
                            advance(job.id, f.stage);
                            toast.success(f.label);
                          }}
                        >
                          {f.label}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-10 text-center">
                <Wrench className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 font-semibold">No active dispatch</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You'll get an alert the moment a driver reports they can't repair with the kit. Run
                  the interactive demo to trigger one.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent completed jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {completed.length === 0 && (
                <p className="text-muted-foreground">No completed jobs in this session yet.</p>
              )}
              {completed.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span>
                    {e.id} · {PROBLEM_TYPES.find((p) => p.id === e.problemType)?.label}
                  </span>
                  <span className="font-semibold">₹850</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Earnings summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="flex items-center gap-1 font-display text-3xl font-extrabold">
                <IndianRupee className="size-6" />
                {me.earnings.toLocaleString("en-IN")}
              </p>
              <p className="text-sm text-muted-foreground">Lifetime payout across {me.jobs} jobs</p>
              <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                <Info label="Avg per job" value={`₹${Math.round(me.earnings / me.jobs)}`} />
                <Info label="Rating" value={`${me.rating} ★`} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Phone" value={me.phone} />
              <Info label="Base position" value={`km ${me.km} on NH-44`} />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Skills</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {me.skills.map((s) => (
                    <span key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {PROBLEM_TYPES.find((p) => p.id === s)?.label ?? s}
                    </span>
                  ))}
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Star className="size-3.5 fill-warning text-warning" /> Verified partner since 2024
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5" /> Coverage: NH-44 Ghat Road section
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
