import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HighwayMap } from "@/components/rr/HighwayMap";
import { useRoadRescue } from "@/lib/roadrescue/store";

export const Route = createFileRoute("/admin/pods")({
  head: () => ({
    meta: [
      { title: "Rescue Pods — ROADRESCUE Command Center" },
      { name: "description", content: "Rail pod fleet telemetry: status, battery, speed, seal state and position." },
      { property: "og:title", content: "ROADRESCUE Rescue Pods" },
      { property: "og:description", content: "Live pod fleet telemetry." },
    ],
  }),
  component: PodsPage,
});

function PodsPage() {
  const { pods, stations } = useRoadRescue();
  return (
    <div className="space-y-6">
      <HighwayMap stations={stations} pods={pods} compact />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pods.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="font-mono text-base">{p.id}</CardTitle>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold">
                {p.status}
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Battery</span>
                  <span>{Math.round(p.battery)}%</span>
                </div>
                <Progress value={p.battery} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p>Speed: <strong>{Math.round(p.speedKmph)} km/h</strong></p>
                <p>Position: <strong>km {p.km.toFixed(1)}</strong></p>
                <p>Seal: <strong>{p.kitSeal}</strong></p>
                <p>Rail: <strong>{p.obstacleClear ? "Clear" : "Obstacle"}</strong></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
