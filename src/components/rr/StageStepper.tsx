import { Check, Loader2 } from "lucide-react";
import { STAGE_LABELS, type Emergency, type Stage } from "@/lib/roadrescue/types";
import { STAGE_ORDER_MECHANIC, STAGE_ORDER_PRIMARY } from "@/lib/roadrescue/stages";
import { cn } from "@/lib/utils";

export function stagesFor(e: Emergency): Stage[] {
  const wentMechanic = e.timeline.some((t) => t.stage === "UNABLE_TO_REPAIR");
  if (wentMechanic) return [...STAGE_ORDER_PRIMARY, ...STAGE_ORDER_MECHANIC];
  return [...STAGE_ORDER_PRIMARY, "REPAIR_SUCCESSFUL", "COMPLETED"];
}

export function StageStepper({ emergency }: { emergency: Emergency }) {
  const stages = stagesFor(emergency);
  const doneStages = new Set(emergency.timeline.map((t) => t.stage));
  const currentIndex = stages.indexOf(emergency.stage);

  return (
    <ol className="space-y-0">
      {stages.map((stage, i) => {
        const done = doneStages.has(stage) && i < currentIndex;
        const active = stage === emergency.stage;
        const at = emergency.timeline.find((t) => t.stage === stage)?.at;
        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                  done && "border-success bg-success text-success-foreground",
                  active && "border-emergency bg-emergency text-emergency-foreground rr-pulse",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : active ? <Loader2 className="size-3.5 animate-spin" /> : i + 1}
              </span>
              {i < stages.length - 1 && (
                <span className={cn("w-px flex-1 min-h-6", done ? "bg-success" : "bg-border")} />
              )}
            </div>
            <div className={cn("pb-4", !done && !active && "opacity-55")}>
              <p className={cn("text-sm font-semibold", active && "text-emergency")}>
                {STAGE_LABELS[stage]}
              </p>
              {at && (
                <p className="text-xs text-muted-foreground">
                  {new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  const tone =
    stage === "COMPLETED"
      ? "bg-success/15 text-success border-success/30"
      : stage.startsWith("MECHANIC") || stage === "UNABLE_TO_REPAIR"
        ? "bg-warning/20 text-warning-foreground border-warning/40"
        : "bg-emergency/10 text-emergency border-emergency/30";
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold", tone)}>
      {STAGE_LABELS[stage]}
    </span>
  );
}
