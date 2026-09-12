import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoadRescue } from "@/lib/roadrescue/store";
import { PROBLEM_TYPES } from "@/lib/roadrescue/types";

export const Route = createFileRoute("/admin/mechanics")({
  head: () => ({
    meta: [
      { title: "Mechanics Review — ROADRESCUE Command Center" },
      { name: "description", content: "Registered mechanic roster with ratings, skills, coverage and earnings." },
      { property: "og:title", content: "ROADRESCUE Mechanics" },
      { property: "og:description", content: "Verified mechanic roster and ratings." },
    ],
  }),
  component: MechanicsPage,
});

function MechanicsPage() {
  const { mechanics } = useRoadRescue();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registered mechanics · {mechanics.length}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 pr-3">ID</th>
              <th className="pb-2 pr-3">Name</th>
              <th className="pb-2 pr-3">Rating</th>
              <th className="pb-2 pr-3">Jobs</th>
              <th className="pb-2 pr-3">Skills</th>
              <th className="pb-2 pr-3">Position</th>
              <th className="pb-2 pr-3">Earnings</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {mechanics.map((m) => (
              <tr key={m.id} className="border-b border-border/60">
                <td className="py-2.5 pr-3 font-mono">{m.id}</td>
                <td className="py-2.5 pr-3">{m.name}</td>
                <td className="py-2.5 pr-3">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 fill-warning text-warning" /> {m.rating}
                  </span>
                </td>
                <td className="py-2.5 pr-3">{m.jobs}</td>
                <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                  {m.skills.map((s) => PROBLEM_TYPES.find((p) => p.id === s)?.label).join(", ")}
                </td>
                <td className="py-2.5 pr-3">km {m.km}</td>
                <td className="py-2.5 pr-3">₹{m.earnings.toLocaleString("en-IN")}</td>
                <td className="py-2.5">
                  <span
                    className={
                      m.available
                        ? "rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success"
                        : "rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
                    }
                  >
                    {m.available ? "Available" : "On a job"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
