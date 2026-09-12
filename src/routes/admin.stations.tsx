import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoadRescue } from "@/lib/roadrescue/store";

export const Route = createFileRoute("/admin/stations")({
  head: () => ({
    meta: [
      { title: "Stations — ROADRESCUE Command Center" },
      { name: "description", content: "Rail station status, coverage and pod inventory across the corridor." },
      { property: "og:title", content: "ROADRESCUE Stations" },
      { property: "og:description", content: "Station status and pod inventory." },
    ],
  }),
  component: StationsPage,
});

function StationsPage() {
  const { stations, pods, buttons } = useRoadRescue();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stations.map((s) => {
        const sPods = pods.filter((p) => p.stationId === s.id);
        const sButtons = buttons.filter((b) => b.stationId === s.id);
        return (
          <Card key={s.id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{s.name}</CardTitle>
              <span
                className={
                  s.status === "ONLINE"
                    ? "rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success"
                    : "rounded-full border border-warning/50 bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground"
                }
              >
                {s.status}
              </span>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Chainage" value={`km ${s.km}`} />
              <Field label="Rail reach" value={`± ${s.railLengthKm} km`} />
              <Field label="Coordinates" value={`${s.lat.toFixed(3)}, ${s.lng.toFixed(3)}`} />
              <Field label="Buttons covered" value={String(sButtons.length)} />
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pods</p>
                <ul className="mt-1.5 space-y-1">
                  {sPods.map((p) => (
                    <li key={p.id} className="flex justify-between rounded-md border border-border px-3 py-1.5 font-mono text-xs">
                      <span>{p.id}</span>
                      <span>{p.status} · {Math.round(p.battery)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
