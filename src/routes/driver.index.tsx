import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, History, Phone, Plus, Siren, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/rr/Shell";
import { StageBadge } from "@/components/rr/StageStepper";
import { useRoadRescue } from "@/lib/roadrescue/store";
import { DRIVER_NAME } from "@/lib/roadrescue/seed";
import { PROBLEM_TYPES } from "@/lib/roadrescue/types";
import { useAuth } from "@/context/AuthContext";
import {
  getOrCreateDriverProfile,
  fetchDriverVehicles,
  addDriverVehicle,
  fetchDriverRequests,
  type DriverProfile,
  type EmergencyRequestRow,
} from "@/services/driverService";

export const Route = createFileRoute("/driver/")({
  head: () => ({
    meta: [
      { title: "Driver Dashboard — ROADRESCUE" },
      {
        name: "description",
        content:
          "Your ROADRESCUE driver dashboard: saved vehicles, emergency contacts, live requests and rescue history.",
      },
      { property: "og:title", content: "ROADRESCUE Driver Dashboard" },
      { property: "og:description", content: "Saved vehicles, contacts and rescue history." },
    ],
  }),
  component: () => (
    <ProtectedRoute allowedRoles={["DRIVER", "ADMIN", "SUPER_ADMIN"]}>
      <DriverHome />
    </ProtectedRoute>
  ),
});

function DriverHome() {
  const { vehicles: localVehicles, contacts, emergencies: localEmergencies, activeEmergencies: localActive, addVehicle, addContact } =
    useRoadRescue();
  const { user } = useAuth();

  const [driverProfile, setDriverProfile] = React.useState<DriverProfile | null>(null);
  const [dbVehicles, setDbVehicles] = React.useState<Array<{ id: string; label: string; plate: string; type?: string }>>([]);
  const [dbRequests, setDbRequests] = React.useState<EmergencyRequestRow[]>([]);
  const [plate, setPlate] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [cName, setCName] = React.useState("");
  const [cPhone, setCPhone] = React.useState("");

  React.useEffect(() => {
    let active = true;
    async function loadDriverData() {
      if (!user) return;
      try {
        const profile = await getOrCreateDriverProfile(user.id, user.email);
        if (!active) return;
        setDriverProfile(profile);

        const [vList, rList] = await Promise.all([
          fetchDriverVehicles(profile.id),
          fetchDriverRequests(profile.id),
        ]);

        if (!active) return;
        setDbVehicles(vList.map((v) => ({ id: v.id, label: v.label, plate: v.plate, type: v.vehicle_type })));
        setDbRequests(rList);
      } catch (err: unknown) {
        console.warn('Error loading driver dashboard data:', err);
      }
    }
    loadDriverData();
    return () => { active = false; };
  }, [user]);

  const displayedVehicles = dbVehicles.length > 0 ? dbVehicles : localVehicles;

  const combinedEmergencies = React.useMemo(() => {
    const map = new Map<string, any>();
    localEmergencies.forEach((e) => map.set(e.id, e));
    dbRequests.forEach((r) => {
      if (!map.has(r.id)) {
        map.set(r.id, {
          id: r.id,
          createdAt: new Date(r.created_at).getTime(),
          stage: r.stage ?? r.status ?? 'CREATED',
          problemType: r.problem_type,
          vehicleLabel: r.vehicle_label,
          buttonId: r.button_id,
          km: r.km,
          stationId: r.station_id,
          podId: r.pod_id,
          mechanicId: r.mechanic_id,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [localEmergencies, dbRequests]);

  const activeEmergencies = combinedEmergencies.filter((e) => e.stage !== "COMPLETED");

  const displayName = user?.email ? user.email.split("@")[0] : DRIVER_NAME.split(" ")[0];

  const handleAddVehicle = async () => {
    if (!label || !plate) {
      toast.error("Add model and plate number");
      return;
    }

    if (user && driverProfile) {
      try {
        const newV = await addDriverVehicle(driverProfile.id, {
          label,
          plate,
          vehicle_type: "Car",
        });
        setDbVehicles((prev) => [{ id: newV.id, label: newV.label, plate: newV.plate, type: newV.vehicle_type }, ...prev]);
        setLabel("");
        setPlate("");
        toast.success("Vehicle saved to database");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to save vehicle';
        toast.error(msg);
      }
    } else {
      addVehicle({ id: `v${Date.now()}`, label, plate, type: "Car" });
      setLabel("");
      setPlate("");
      toast.success("Vehicle saved");
    }
  };

  return (
    <AppShell
      title={`Hello, ${displayName}`}
      subtitle="Your vehicles, contacts and rescue history"
      actions={
        <Button asChild size="lg" className="bg-emergency text-emergency-foreground hover:bg-emergency/90">
          <Link to="/driver/emergency">
            <Siren className="size-5" /> Get emergency help
          </Link>
        </Button>
      }
    >
      {activeEmergencies[0] && (
        <Card className="mb-6 border-emergency/40 bg-emergency/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm font-semibold text-emergency">Active rescue in progress</p>
              <p className="text-sm text-muted-foreground">
                {activeEmergencies[0]!.id} · {activeEmergencies[0]!.vehicleLabel}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StageBadge stage={activeEmergencies[0]!.stage} />
              <Button asChild size="sm">
                <Link to="/driver/request/$id" params={{ id: activeEmergencies[0]!.id }}>
                  Track live
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="vehicles">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="vehicles" className="flex-1 sm:flex-none">
            <Car className="mr-1.5 size-4" /> Vehicles
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex-1 sm:flex-none">
            <UserRound className="mr-1.5 size-4" /> Contacts
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none">
            <History className="mr-1.5 size-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {displayedVehicles.map((v) => (
              <Card key={v.id}>
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Car className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{v.label}</p>
                    <p className="font-mono text-sm text-muted-foreground">{v.plate}</p>
                    <p className="text-xs text-muted-foreground">{v.type ?? "Car"}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a vehicle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Model e.g. Tata Nexon" value={label} onChange={(e) => setLabel(e.target.value)} />
              <Input placeholder="Plate e.g. KA 05 AB 1234" value={plate} onChange={(e) => setPlate(e.target.value)} />
              <Button
                className="w-full"
                onClick={handleAddVehicle}
              >
                <Plus className="size-4" /> Save vehicle
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="grid size-11 place-items-center rounded-lg bg-success/15 text-success">
                    <Phone className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.relation}</p>
                    <p className="font-mono text-sm">{c.phone}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add emergency contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Name" value={cName} onChange={(e) => setCName(e.target.value)} />
              <Input placeholder="Phone" value={cPhone} onChange={(e) => setCPhone(e.target.value)} />
              <Button
                className="w-full"
                onClick={() => {
                  if (!cName || !cPhone) {
                    toast.error("Add name and phone");
                    return;
                  }
                  addContact({ id: `c${Date.now()}`, name: cName, relation: "Contact", phone: cPhone });
                  setCName("");
                  setCPhone("");
                  toast.success("Contact saved");
                }}
              >
                <Plus className="size-4" /> Save contact
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {combinedEmergencies.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">
                    {e.id} ·{" "}
                    {PROBLEM_TYPES.find((p) => p.id === e.problemType)?.label ?? e.problemType}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()} · {e.vehicleLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.buttonId ? `Button ${e.buttonId}` : "App request"} · km {typeof e.km === 'number' ? e.km.toFixed(1) : e.km} ·{" "}
                    {e.stationId ?? "—"} / {e.podId ?? "—"}
                    {e.mechanicId ? ` · Mechanic ${e.mechanicId}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StageBadge stage={e.stage} />
                  <Button asChild size="sm" variant="outline">
                    <Link to="/driver/request/$id" params={{ id: e.id }}>
                      Open
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

