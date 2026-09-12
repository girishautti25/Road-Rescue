import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Radio, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoadRescue } from "@/lib/roadrescue/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/buttons")({
  head: () => ({
    meta: [
      { title: "Emergency Buttons IoT — ROADRESCUE Command Center" },
      { name: "description", content: "Monitor heartbeats, battery and press counts for roadside emergency buttons B-001 to B-050." },
      { property: "og:title", content: "ROADRESCUE Emergency Buttons" },
      { property: "og:description", content: "IoT heartbeat simulator for roadside buttons." },
    ],
  }),
  component: ButtonsPage,
});

function ButtonsPage() {
  const { buttons, pressButton, createEmergency } = useRoadRescue();
  const [selected, setSelected] = React.useState("B-027");
  const [beating, setBeating] = React.useState(false);
  const button = buttons.find((b) => b.id === selected);

  React.useEffect(() => {
    if (!beating) return;
    const t = setInterval(() => {
      buttons.filter((b) => b.online).forEach((b) => pressButton(b.id));
    }, 3000);
    return () => clearInterval(t);
  }, [beating, buttons, pressButton]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Button grid · B-001 to B-050</CardTitle>
          <Button
            variant={beating ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setBeating((v) => !v);
              toast(beating ? "Heartbeat simulator stopped" : "Heartbeat simulator running");
            }}
          >
            <Radio className="size-4" /> {beating ? "Stop simulator" : "Start heartbeat simulator"}
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
          {buttons.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelected(b.id)}
              className={cn(
                "rounded-md border p-2 text-[11px] font-semibold transition-colors",
                selected === b.id && "ring-2 ring-primary",
                b.online
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {b.id.replace("B-", "")}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{button?.id ?? "Select a button"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {button && (
            <>
              <p>Status: <strong className={button.online ? "text-success" : "text-emergency"}>{button.online ? "ONLINE" : "OFFLINE"}</strong></p>
              <p>Chainage: <strong>km {button.km}</strong></p>
              <p>Nearest base: <strong>{button.stationId}</strong></p>
              <p>Battery: <strong>{button.battery}%</strong></p>
              <p>Presses: <strong>{button.presses}</strong></p>
              <p className="text-muted-foreground">
                Last heartbeat {Math.max(0, Math.round((Date.now() - button.lastHeartbeat) / 1000))}s ago
              </p>
              <Button
                className="w-full bg-emergency text-emergency-foreground hover:bg-emergency/90"
                onClick={() => {
                  createEmergency({
                    problemType: "ENGINE_ISSUE",
                    vehicleLabel: "Unknown vehicle · walk-up press",
                    buttonId: button.id,
                  });
                  toast.success(`${button.id} pressed · emergency created`);
                }}
              >
                <Siren className="size-4" /> Simulate press
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
