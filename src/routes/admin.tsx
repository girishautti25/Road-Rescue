import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Power } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { AppShell } from "@/components/rr/Shell";
import { useRoadRescue } from "@/lib/roadrescue/store";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/stations", label: "Stations" },
  { to: "/admin/pods", label: "Pods" },
  { to: "/admin/buttons", label: "Buttons" },
  { to: "/admin/mechanics", label: "Mechanics" },
  { to: "/admin/analytics", label: "Analytics" },
] as const;

function AdminLayout() {
  const { emergencyStop, setEmergencyStop } = useRoadRescue();
  return (
    <AppShell
      title="Command center"
      subtitle="NH-44 · Ghat Road corridor operations"
      actions={
        <div className="flex items-center gap-3 rounded-xl border border-emergency/40 bg-emergency/5 px-4 py-2.5">
          <Power className="size-4 text-emergency" />
          <div className="text-sm">
            <p className="font-semibold text-emergency">Emergency stop</p>
            <p className="text-xs text-muted-foreground">
              {emergencyStop ? "All rail movement halted" : "Network running normally"}
            </p>
          </div>
          <Switch
            checked={emergencyStop}
            onCheckedChange={(v) => {
              setEmergencyStop(v);
              toast[v ? "error" : "success"](v ? "EMERGENCY STOP engaged" : "Network resumed");
            }}
          />
        </div>
      }
    >
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.to === "/admin" }}
            className="whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </AppShell>
  );
}
