import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Crosshair, Loader2, MapPin, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/components/rr/Shell";
import { useRoadRescue } from "@/lib/roadrescue/store";
import { PROBLEM_TYPES, type ProblemTypeId } from "@/lib/roadrescue/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/driver/emergency")({
  head: () => ({
    meta: [
      { title: "Get Emergency Help — ROADRESCUE" },
      {
        name: "description",
        content:
          "One tap sends a rail-mounted rescue pod to your vehicle. Pick your problem, confirm your vehicle and location, and dispatch.",
      },
      { property: "og:title", content: "Get Emergency Help — ROADRESCUE" },
      { property: "og:description", content: "One-tap highway breakdown dispatch." },
    ],
  }),
  component: EmergencyPage,
});

function EmergencyPage() {
  const { vehicles, buttons, createEmergency } = useRoadRescue();
  const navigate = useNavigate();
  const [problem, setProblem] = React.useState<ProblemTypeId>("TYRE_PUNCTURE");
  const [vehicle, setVehicle] = React.useState(vehicles[0]);
  const [buttonId, setButtonId] = React.useState("B-027");
  const [useGps, setUseGps] = React.useState(false);
  const [gpsKm, setGpsKm] = React.useState<number | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [dispatching, setDispatching] = React.useState(false);

  const matchedButton = buttons.find((b) => b.id === buttonId.trim().toUpperCase());

  function simulateGps() {
    setLocating(true);
    setTimeout(() => {
      const km = Number((Math.random() * 29 + 1).toFixed(1));
      setGpsKm(km);
      setUseGps(true);
      setLocating(false);
      toast.success("Location locked", { description: `NH-44 corridor · km ${km}` });
    }, 1200);
  }

  function dispatch() {
    if (!vehicle) return toast.error("Add a vehicle first");
    if (!useGps && !matchedButton) return toast.error("Enter a valid button ID like B-027");
    setDispatching(true);
    const id = createEmergency({
      problemType: problem,
      vehicleLabel: `${vehicle.label} · ${vehicle.plate}`,
      buttonId: useGps ? null : matchedButton!.id,
      km: useGps ? (gpsKm ?? 16.2) : undefined,
    });
    toast.success("Emergency created", { description: "Control room notified. Tracking your rescue." });
    setTimeout(() => navigate({ to: "/driver/request/$id", params: { id } }), 400);
  }

  return (
    <AppShell title="Get emergency help" subtitle="Three quick confirmations, then one tap to dispatch">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1 · What's wrong?</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PROBLEM_TYPES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProblem(p.id)}
                  className={cn(
                    "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-3 text-center text-sm font-medium transition-colors",
                    problem === p.id
                      ? "border-emergency bg-emergency/10 text-emergency"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <span className="text-xl">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">2 · Which vehicle?</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicle(v)}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-colors",
                    vehicle?.id === v.id ? "border-primary bg-accent" : "border-border hover:bg-accent",
                  )}
                >
                  <p className="font-semibold">{v.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{v.plate}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">3 · Where are you?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="btn">Emergency button ID on the roadside post</Label>
                <div className="flex gap-2">
                  <Input
                    id="btn"
                    value={buttonId}
                    onChange={(e) => {
                      setButtonId(e.target.value);
                      setUseGps(false);
                    }}
                    placeholder="B-027"
                    className="font-mono uppercase"
                  />
                  <Button variant="outline" onClick={simulateGps} disabled={locating}>
                    {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
                    <span className="hidden sm:inline">Use GPS instead</span>
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="size-4 text-emergency" />
                  {useGps
                    ? `Simulated GPS · km ${gpsKm?.toFixed(1)}`
                    : matchedButton
                      ? `Button ${matchedButton.id} · km ${matchedButton.km.toFixed(1)}`
                      : "No matching button yet"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {useGps
                    ? "GPS fallback active — accurate to roughly 15 metres."
                    : matchedButton
                      ? `Nearest base on record: ${matchedButton.stationId} · node ${matchedButton.online ? "online" : "offline"}`
                      : "Type a button ID between B-001 and B-050, or use GPS."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="border-emergency/40 bg-emergency/5">
            <CardContent className="p-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-emergency">
                One-tap dispatch
              </p>
              <button
                type="button"
                onClick={dispatch}
                disabled={dispatching}
                className="mx-auto mt-5 grid size-40 place-items-center rounded-full bg-emergency text-emergency-foreground shadow-lg transition-transform active:scale-95 rr-pulse disabled:opacity-70"
              >
                {dispatching ? (
                  <Loader2 className="size-14 animate-spin" />
                ) : (
                  <span className="flex flex-col items-center gap-1">
                    <Siren className="size-12" />
                    <span className="font-display text-sm font-extrabold">SEND HELP</span>
                  </span>
                )}
              </button>
              <ul className="mt-6 space-y-1 text-left text-sm text-muted-foreground">
                <li>· Problem: {PROBLEM_TYPES.find((p) => p.id === problem)?.label}</li>
                <li>· Vehicle: {vehicle ? vehicle.label : "—"}</li>
                <li>
                  · Location: {useGps ? `GPS km ${gpsKm?.toFixed(1)}` : matchedButton?.id ?? "—"}
                </li>
                <li>· Kit access fee: ₹99 on unlock</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
