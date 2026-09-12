import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Package, QrCode, Siren, TrainFront, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/rr/Shell";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How ROADRESCUE Works — From Button Press to Repair" },
      {
        name: "description",
        content:
          "Six steps: press the roadside button, we locate you, a rail pod is dispatched, it arrives, you unlock the kit by QR, and a mechanic steps in if needed.",
      },
      { property: "og:title", content: "How ROADRESCUE Works" },
      {
        property: "og:description",
        content: "Button press to completed repair in six tracked steps.",
      },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    icon: Siren,
    title: "Press the button or tap emergency",
    body: "Hit the roadside emergency button (B-001 to B-050) or tap the big red button in the ROADRESCUE app. Both create the same request in the command center.",
    detail: "Works with no phone signal — buttons are hard-wired IoT nodes.",
  },
  {
    icon: MapPin,
    title: "Your location is identified automatically",
    body: "The button ID carries exact coordinates. From the app, GPS pins your kilometre marker on the corridor, with a manual button-ID fallback.",
    detail: "Nearest available station is chosen by Haversine distance, not guesswork.",
  },
  {
    icon: TrainFront,
    title: "A rail pod is dispatched",
    body: "The nearest station with an idle pod releases it onto the rail. You see it move in real time with battery, speed, obstacle status and live ETA.",
    detail: "Example: at B-027, station S2 is 2.7 km away versus S1 at 8.4 km — S2 wins.",
  },
  {
    icon: QrCode,
    title: "Arrival and QR access",
    body: "The pod stops beside your vehicle. Scan the QR on the pod door, confirm the ₹99 kit access payment, and the seal opens for your request only.",
    detail: "Access is bound to your request ID and expires when the job closes.",
  },
  {
    icon: Package,
    title: "Use the complete kit",
    body: "Jump starter, tyre inflator, puncture repair, 5L fuel can, tool set, warning cones, torch and first aid — with step-by-step guidance in the app.",
    detail: "Most punctures, dead batteries and fuel-outs are resolved right here.",
  },
  {
    icon: Wrench,
    title: "Mechanic fallback if needed",
    body: "Tap 'Unable to Repair' and the platform assigns the nearest skill-matched, highest-rated available mechanic and tracks them to you.",
    detail: "You approve the work; the mechanic updates status until completion.",
  },
];

function HowItWorks() {
  return (
    <PageShell>
      <section className="border-b border-border rr-grid-bg">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-emergency">
            How it works
          </span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            From breakdown to back on the road
          </h1>
          <p className="mt-4 text-muted-foreground">
            Six steps, all visible to you in real time. No calls, no waiting on hold, no wondering
            whether anyone is coming.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14">
        <ol className="space-y-6">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:gap-6"
            >
              <div className="flex items-center gap-4 sm:flex-col sm:gap-2">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emergency text-emergency-foreground">
                  <s.icon className="size-6" />
                </span>
                <span className="font-display text-sm font-extrabold text-muted-foreground">
                  STEP {i + 1}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{s.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs font-medium">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-emergency/25 bg-emergency/5 p-6 text-center">
          <h2 className="text-2xl font-bold">See all six steps run live</h2>
          <p className="text-sm text-muted-foreground">
            The interactive demo plays the full B-027 Ghat Road rescue, including the mechanic
            fallback path.
          </p>
          <div className="mt-2 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-emergency text-emergency-foreground hover:bg-emergency/90">
              <Link to="/demo">Run the interactive demo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/driver/emergency">Create a real request</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
