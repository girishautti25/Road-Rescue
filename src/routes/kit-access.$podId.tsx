import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Lock, LockOpen, QrCode, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppShell } from "@/components/rr/Shell";
import { useRoadRescue } from "@/lib/roadrescue/store";

export const Route = createFileRoute("/kit-access/$podId")({
  validateSearch: (search: Record<string, unknown>) => ({ req: String(search["req"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Unlock Rescue Kit — ROADRESCUE" },
      {
        name: "description",
        content: "Scan the pod QR code, confirm the ₹99 kit access payment and unlock the sealed emergency kit.",
      },
      { property: "og:title", content: "Unlock Rescue Kit — ROADRESCUE" },
      { property: "og:description", content: "QR kit access with secure test payment." },
    ],
  }),
  component: KitAccess,
});

const KIT_ITEMS = [
  "Portable jump starter (12V)",
  "Tyre inflator + pressure gauge",
  "Tubeless puncture repair kit",
  "5L emergency fuel can",
  "Tool set (spanners, jack, wrench)",
  "Reflective cones & warning triangle",
  "LED torch & power bank",
  "First aid kit",
];

function KitAccess() {
  const { podId } = Route.useParams();
  const { req } = Route.useSearch();
  const navigate = useNavigate();
  const { pods, emergencies, payAndUnlock, unlockKit } = useRoadRescue();
  const pod = pods.find((p) => p.id === podId);
  const emergency = emergencies.find((e) => e.id === req) ?? null;

  const [scanned, setScanned] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [paying, setPaying] = React.useState(false);

  const unlocked = emergency?.kitUnlocked ?? pod?.kitSeal === "OPEN";

  function scan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
      toast.success(`QR verified for ${podId}`);
    }, 1400);
  }

  function pay() {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPayOpen(false);
      if (emergency) {
        payAndUnlock(emergency.id);
        unlockKit(emergency.id);
      }
      toast.success("Payment successful · Kit unlocked", { description: "Razorpay test mode · ₹99" });
    }, 1600);
  }

  return (
    <AppShell title="Kit access" subtitle={`Pod ${podId}${req ? ` · request ${req}` : ""}`}>
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1 · Scan the pod QR code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40">
              {scanned || unlocked ? (
                <div className="text-center">
                  <CheckCircle2 className="mx-auto size-14 text-success" />
                  <p className="mt-2 font-semibold">QR verified</p>
                  <p className="font-mono text-xs text-muted-foreground">RR-{podId}-{req || "GUEST"}</p>
                </div>
              ) : (
                <>
                  <QrCode className="size-28 text-muted-foreground/50" />
                  {scanning && (
                    <span className="absolute inset-x-6 top-6 h-0.5 animate-bounce bg-emergency" />
                  )}
                </>
              )}
            </div>
            <Button className="w-full" onClick={scan} disabled={scanning || scanned || unlocked}>
              {scanning ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
              {scanned || unlocked ? "Scanned" : scanning ? "Scanning…" : "Simulate QR scan"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2 · Unlock the sealed kit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-border p-4">
              <span
                className={
                  unlocked
                    ? "grid size-11 place-items-center rounded-lg bg-success/15 text-success"
                    : "grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground"
                }
              >
                {unlocked ? <LockOpen className="size-5" /> : <Lock className="size-5" />}
              </span>
              <div>
                <p className="font-semibold">{unlocked ? "Kit unlocked" : "Kit sealed"}</p>
                <p className="text-sm text-muted-foreground">
                  {unlocked ? "Take what you need — all items are logged." : "Access fee ₹99 (test payment)"}
                </p>
              </div>
            </div>

            {!unlocked ? (
              <Button
                className="h-12 w-full bg-emergency text-emergency-foreground hover:bg-emergency/90"
                disabled={!scanned}
                onClick={() => setPayOpen(true)}
              >
                Pay ₹99 & unlock kit
              </Button>
            ) : (
              <Button
                className="h-12 w-full"
                onClick={() =>
                  emergency
                    ? navigate({ to: "/driver/request/$id", params: { id: emergency.id } })
                    : navigate({ to: "/driver" })
                }
              >
                Back to live tracking
              </Button>
            )}

            <div>
              <p className="text-sm font-semibold">Inside the kit</p>
              <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
                {KIT_ITEMS.map((k) => (
                  <li key={k}>· {k}</li>
                ))}
              </ul>
            </div>
            {!req && (
              <p className="text-xs text-muted-foreground">
                No request linked. <Link to="/driver/emergency" className="underline">Create an emergency</Link> to
                bind kit access to a rescue.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Razorpay · Test mode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kit access fee</span>
                <span className="font-semibold">₹99.00</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Pod</span>
                <span className="font-mono">{podId}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Request</span>
                <span className="font-mono">{req || "—"}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Test card 4111 1111 1111 1111 · any future expiry · CVV 123. No real money moves.
            </p>
            <Button className="h-12 w-full" onClick={pay} disabled={paying}>
              {paying ? <Loader2 className="size-4 animate-spin" /> : null}
              {paying ? "Processing payment…" : "Pay ₹99"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
