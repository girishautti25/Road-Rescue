import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BatteryCharging,
  Clock,
  Fuel,
  MapPin,
  Play,
  QrCode,
  Radio,
  ShieldCheck,
  Siren,
  TrainFront,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/rr/Shell";
import { HighwayMap } from "@/components/rr/HighwayMap";
import { useRoadRescue } from "@/lib/roadrescue/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ROADRESCUE — Vehicle Breakdown Help on the Highway" },
      {
        name: "description",
        content:
          "Press a roadside button or tap once in the app: a rail-mounted rescue pod with a full repair kit reaches you in minutes, with a verified mechanic as backup.",
      },
      { property: "og:title", content: "ROADRESCUE — Help is Always Within Reach" },
      {
        property: "og:description",
        content:
          "Highway emergency assistance with rail-mounted rescue pods, QR kit access and verified mechanic fallback.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { stations, pods, buttons, activeEmergencies } = useRoadRescue();

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border rr-grid-bg">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emergency/30 bg-emergency/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emergency">
              <Siren className="size-3.5" /> 24/7 highway rescue network
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Vehicle Breakdown?
              <br />
              <span className="text-emergency">Help is Always Within Reach.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Rail-mounted rescue pods stand ready at stations along the highway. One press of a
              roadside button — or one tap in the app — sends a fully equipped repair kit straight
              to your vehicle, with a verified mechanic dispatched if the repair needs hands.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 bg-emergency px-8 text-base font-bold tracking-wide text-emergency-foreground hover:bg-emergency/90"
              >
                <Link to="/driver/emergency">
                  <Siren className="size-5" /> GET EMERGENCY HELP
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-6 text-base">
                <Link to="/demo">
                  <Play className="size-5" /> Watch the 60-second demo
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                ["4", "Rail stations"],
                ["50", "Roadside buttons"],
                ["< 6 min", "Median pod ETA"],
                ["10", "Verified mechanics"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-extrabold">{v}</dt>
                  <dd className="text-xs uppercase tracking-wide text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-4">
            <HighwayMap
              stations={stations}
              pods={pods}
              buttons={buttons}
              emergencies={activeEmergencies}
            />
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
                  <Radio className="size-5" />
                </span>
                <div className="text-sm">
                  <p className="font-semibold">Live corridor: NH-44 · Ghat Road section</p>
                  <p className="text-muted-foreground">
                    All station heartbeats healthy · pods charged and sealed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold">The problem on the highway today</h2>
            <ul className="mt-5 space-y-4 text-sm">
              {[
                ["Nobody is coming", "Stranded drivers wait 45–90 minutes for a tow or a mechanic who may never find them."],
                ["No signal, no help", "Ghat sections and night stretches often have no mobile coverage to call anyone."],
                ["Unsafe waiting", "Standing beside fast traffic — especially for solo drivers and families — is dangerous."],
                ["Overkill response", "A flat tyre or dead battery does not need a tow truck. It needs the right tool, now."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-emergency" />
                  <span>
                    <strong className="font-semibold">{t}.</strong>{" "}
                    <span className="text-muted-foreground">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emergency/20 bg-emergency/5 p-6 sm:p-8">
            <h2 className="text-2xl font-bold">How ROADRESCUE solves it</h2>
            <ul className="mt-5 space-y-4 text-sm">
              {[
                ["Infrastructure, not dispatch luck", "Pods already live on the highway, seconds from your kilometre marker."],
                ["Zero-dependency alerting", "Hard-wired roadside buttons work even with no phone, no battery, no network."],
                ["Self-service first", "A sealed kit covers punctures, jump starts, fuel top-up and basic engine fixes."],
                ["Human backup guaranteed", "Can't fix it? The nearest skill-matched mechanic is assigned automatically."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-success" />
                  <span>
                    <strong className="font-semibold">{t}.</strong>{" "}
                    <span className="text-muted-foreground">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* RAIL POD CONCEPT */}
      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-emergency">
              The core idea
            </span>
            <h2 className="mt-2 text-3xl font-bold">Horizontal rail-mounted rescue pods</h2>
            <p className="mt-3 text-muted-foreground">
              A continuous rail runs alongside the shoulder. Each station holds pods that glide
              horizontally at up to 45 km/h — no traffic, no wrong turns, no waiting for a driver to
              start a shift. The pod stops exactly at your kilometre marker.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: TrainFront, t: "Rail travel, not road travel", d: "Pods bypass jams entirely and arrive at a predictable, trackable ETA." },
              { icon: BatteryCharging, t: "Always charged, always sealed", d: "Docked pods self-charge and report battery, obstacle and seal telemetry every second." },
              { icon: Fuel, t: "Complete emergency kit", d: "Jump starter, inflator, puncture kit, 5L fuel can, tools, cones, torch and first aid." },
            ].map((f) => (
              <Card key={f.t}>
                <CardContent className="p-6">
                  <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{f.t}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BUTTONS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emergency">
              Roadside emergency buttons
            </span>
            <h2 className="mt-2 text-3xl font-bold">B-001 to B-050, every 600 metres</h2>
            <p className="mt-3 text-muted-foreground">
              Each button is a hard-wired IoT node with its own exact coordinates. Pressing it
              creates an emergency with your position already known — no typing, no describing
              landmarks, no phone required at all.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                [MapPin, "Location is the button ID — accurate to the metre."],
                [Clock, "Sub-second heartbeat monitoring flags any offline node."],
                [QrCode, "Confirmation light and QR panel right on the housing."],
              ].map(([Icon, text]) => {
                const I = Icon as typeof MapPin;
                return (
                  <li key={String(text)} className="flex items-center gap-3">
                    <I className="size-4 text-emergency" />
                    <span className="text-muted-foreground">{text as string}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="rounded-xl border-2 border-emergency/40 bg-emergency/5 p-6 text-center">
              <button
                type="button"
                className="mx-auto grid size-28 place-items-center rounded-full bg-emergency text-emergency-foreground rr-pulse"
                aria-hidden
              >
                <Siren className="size-12" />
              </button>
              <p className="mt-4 font-display text-lg font-extrabold">PRESS FOR HELP</p>
              <p className="text-sm text-muted-foreground">Button B-027 · km 16.2 · NH-44 Ghat Road</p>
              <Button asChild className="mt-5 w-full bg-emergency text-emergency-foreground hover:bg-emergency/90">
                <Link to="/demo">
                  Simulate this press <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section className="border-t border-border bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold">Safety assurance</h2>
          <p className="mt-3 max-w-2xl text-primary-foreground/75">
            Every rescue is logged, monitored and reversible. Operations can halt the entire rail
            network instantly with the emergency stop master switch.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, t: "Verified mechanics", d: "Background-checked, rated after every job." },
              { icon: QrCode, t: "Sealed kit access", d: "QR unlock tied to your request ID only." },
              { icon: Radio, t: "Monitored 24/7", d: "Command center watches every pod and button." },
              { icon: Wrench, t: "Transparent pricing", d: "Flat ₹99 kit access, mechanic quoted upfront." },
            ].map((f) => (
              <div key={f.t} className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-5">
                <f.icon className="size-5" />
                <h3 className="mt-3 font-semibold">{f.t}</h3>
                <p className="mt-1 text-sm text-primary-foreground/70">{f.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-emergency text-emergency-foreground hover:bg-emergency/90">
              <Link to="/driver/emergency">Get emergency help</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
