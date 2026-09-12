import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/rr/Shell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact ROADRESCUE — Support, Partnerships, Helpline" },
      {
        name: "description",
        content:
          "Reach the ROADRESCUE control room, partnership team or mechanic onboarding desk. Emergency helpline available 24/7.",
      },
      { property: "og:title", content: "Contact ROADRESCUE" },
      {
        property: "og:description",
        content: "Control room, partnerships and mechanic onboarding contacts.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = React.useState(false);

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-14">
        <span className="text-xs font-bold uppercase tracking-widest text-emergency">Contact</span>
        <h1 className="mt-3 text-4xl font-extrabold">Talk to the control room</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          For an active breakdown, always use the emergency button or the app — it is faster than
          any form. Everything else, write to us here.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardContent className="p-6">
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                  toast.success("Message received", {
                    description: "Our team replies within one working day.",
                  });
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required placeholder="Girisha Utti" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" required placeholder="+91 98450 00000" />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required placeholder="you@example.com" />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="message">How can we help?</Label>
                  <Textarea id="message" rows={5} required placeholder="Tell us about your corridor, fleet or mechanic application." />
                </div>
                <Button type="submit" className="sm:col-span-2">
                  {sent ? "Message sent" : "Send message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-emergency/30 bg-emergency/5">
              <CardContent className="p-5">
                <span className="flex items-center gap-2 font-semibold text-emergency">
                  <Siren className="size-4" /> Emergency helpline
                </span>
                <p className="mt-2 font-display text-2xl font-extrabold">1800-ROAD-911</p>
                <p className="text-sm text-muted-foreground">Staffed 24/7, every day of the year.</p>
              </CardContent>
            </Card>
            {[
              { icon: Phone, t: "Operations desk", d: "+91 80 4000 1180 · 06:00–23:00" },
              { icon: Mail, t: "Partnerships", d: "partners@roadrescue.example" },
              { icon: MapPin, t: "Control room", d: "Corridor Ops Hub, Hosur Road, Bengaluru" },
            ].map((c) => (
              <Card key={c.t}>
                <CardContent className="flex items-start gap-3 p-5">
                  <c.icon className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">{c.t}</p>
                    <p className="text-sm text-muted-foreground">{c.d}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
