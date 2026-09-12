import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Radio, TrainFront, Users, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HighwayMap } from "@/components/rr/HighwayMap";
import { StageBadge } from "@/components/rr/StageStepper";
import { useRoadRescue } from "@/lib/roadrescue/store";
import { PROBLEM_TYPES } from "@/lib/roadrescue/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Command Center — ROADRESCUE" },
      {
        name: "description",
        content:
          "Live operations view: active emergencies, online pods, station status, mechanic availability and IoT heartbeats.",
      },
      { property: "og:title", content: "ROADRESCUE Command Center" },
      { property: "og:description", content: "Live corridor operations dashboard." },
    ],
  }),
  component: AdminOverview,
});

const FILTERS = ["All", "Active", "Pod phase", "Mechanic phase", "Completed"] as const;

function AdminOverview() {
  const { stations, pods, buttons, mechanics, emergencies, activeEmergencies, heartbeats } =
    useRoadRescue();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All");

  const rows = emergencies.filter((e) => {
    if (filter === "Active") return e.stage !== "COMPLETED";
    if (filter === "Completed") return e.stage === "COMPLETED";
    if (filter === "Pod phase") return e.stage.startsWith("POD") || e.stage === "KIT_IN_USE";
    if (filter === "Mechanic phase")
      return e.stage.startsWith("MECHANIC") || e.stage === "REPAIR_IN_PROGRESS";
    return true;
  });

  const metrics = [
    { icon: Activity, label: "Active emergencies", value: activeEmergencies.length, tone: "emergency" },
    { icon: TrainFront, label: "Pods online", value: `${pods.filter((p) => p.status !== "CHARGING").length}/${pods.length}` },
    { icon: Warehouse, label: "Stations online", value: `${stations.filter((s) => s.status === "ONLINE").length}/${stations.length}` },
    { icon: Users, label: "Mechanics available", value: `${mechanics.filter((m) => m.available).length}/${mechanics.length}` },
    { icon: Radio, label: "IoT heartbeats", value: heartbeats.toLocaleString("en-IN") },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <m.icon className={cn("size-4", m.tone === "emergency" ? "text-emergency" : "text-muted-foreground")} />
              <p className={cn("mt-2 font-display text-2xl font-extrabold", m.tone === "emergency" && "text-emergency")}>
                {m.value}
              </p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live corridor map</CardTitle>
        </CardHeader>
        <CardContent>
          <HighwayMap
            stations={stations}
            pods={pods}
            buttons={buttons}
            emergencies={activeEmergencies}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Emergencies</CardTitle>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3">ID</th>
                <th className="pb-2 pr-3">Problem</th>
                <th className="pb-2 pr-3">Location</th>
                <th className="pb-2 pr-3">Station / Pod</th>
                <th className="pb-2 pr-3">Mechanic</th>
                <th className="pb-2 pr-3">Stage</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-3 font-mono">{e.id}</td>
                  <td className="py-2.5 pr-3">{PROBLEM_TYPES.find((p) => p.id === e.problemType)?.label}</td>
                  <td className="py-2.5 pr-3">{e.buttonId ?? "GPS"} · km {e.km.toFixed(1)}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{e.stationId ?? "—"} / {e.podId ?? "—"}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{e.mechanicId ?? "—"}</td>
                  <td className="py-2.5 pr-3"><StageBadge stage={e.stage} /></td>
                  <td className="py-2.5">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/driver/request/$id" params={{ id: e.id }}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    No emergencies match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
