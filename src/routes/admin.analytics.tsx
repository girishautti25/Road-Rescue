import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoadRescue } from "@/lib/roadrescue/store";
import { PROBLEM_TYPES } from "@/lib/roadrescue/types";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — ROADRESCUE Command Center" },
      { name: "description", content: "Response times, problem mix, station load and kit-only resolution rate for the corridor." },
      { property: "og:title", content: "ROADRESCUE Analytics" },
      { property: "og:description", content: "Corridor performance charts." },
    ],
  }),
  component: AnalyticsPage,
});

const RESPONSE = [
  { day: "Mon", min: 7.4 },
  { day: "Tue", min: 6.8 },
  { day: "Wed", min: 6.1 },
  { day: "Thu", min: 5.9 },
  { day: "Fri", min: 6.6 },
  { day: "Sat", min: 5.4 },
  { day: "Sun", min: 5.1 },
];

const COLORS = [
  "var(--color-emergency)",
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-rail)",
];

function AnalyticsPage() {
  const { emergencies, stations } = useRoadRescue();

  const problemMix = PROBLEM_TYPES.map((p) => ({
    name: p.label,
    value: emergencies.filter((e) => e.problemType === p.id).length,
  })).filter((d) => d.value > 0);

  const stationLoad = stations.map((s) => ({
    station: s.id,
    jobs: emergencies.filter((e) => e.stationId === s.id).length,
  }));

  const kitOnly = emergencies.filter((e) => !e.mechanicId && e.stage === "COMPLETED").length;
  const withMechanic = emergencies.filter((e) => e.mechanicId).length;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Median response time (min)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={RESPONSE}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="min" stroke="var(--color-emergency)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jobs per station</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stationLoad}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="station" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="jobs" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Problem mix</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {problemMix.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={problemMix} dataKey="value" nameKey="name" outerRadius={90} label>
                  {problemMix.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resolution path</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-success/40 bg-success/10 p-5">
            <p className="font-display text-3xl font-extrabold text-success">{kitOnly}</p>
            <p className="text-sm text-muted-foreground">Resolved with the kit alone</p>
          </div>
          <div className="rounded-xl border border-warning/50 bg-warning/10 p-5">
            <p className="font-display text-3xl font-extrabold">{withMechanic}</p>
            <p className="text-sm text-muted-foreground">Escalated to a verified mechanic</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Counts include seeded history plus everything created in this session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
