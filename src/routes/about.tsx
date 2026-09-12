import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/rr/Shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ROADRESCUE — Rescue Infrastructure for Highways" },
      {
        name: "description",
        content:
          "ROADRESCUE builds rail-based rescue infrastructure along highway corridors so no driver waits alone after a breakdown.",
      },
      { property: "og:title", content: "About ROADRESCUE" },
      {
        property: "og:description",
        content: "Our mission, the corridor model, and the Phase 1 rollout plan.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <section className="border-b border-border rr-grid-bg">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emergency">About us</span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            Rescue should be infrastructure, not luck
          </h1>
          <p className="mt-4 text-muted-foreground">
            ROADRESCUE treats roadside emergencies the way we treat fire safety: pre-positioned
            equipment, hard-wired alarms and a monitored response, permanently installed along the
            highway itself.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { t: "Our mission", d: "Cut the median highway breakdown wait from 55 minutes to under 6, on every corridor we cover." },
            { t: "The corridor model", d: "Stations every 8–12 km, a continuous shoulder rail, and an emergency button every 600 metres." },
            { t: "Phase 1 scope", d: "NH-44 Ghat Road section: 4 stations, 6 pods, 50 buttons and 10 verified mechanics." },
          ].map((c) => (
            <Card key={c.t}>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold">{c.t}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">What we measure</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>· Time from alert to pod arrival, per kilometre marker</li>
              <li>· Share of emergencies resolved by the kit alone</li>
              <li>· Mechanic acceptance time and rating trend</li>
              <li>· Button and pod heartbeat uptime</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Where we go next</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>· Expressway corridors with higher pod density</li>
              <li>· EV charging pods for stranded electric vehicles</li>
              <li>· Highway authority and insurer integrations</li>
              <li>· Night-vision and medical-first-response pods</li>
            </ul>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
