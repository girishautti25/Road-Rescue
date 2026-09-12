import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  CircleDot,
  Gauge,
  Home,
  LifeBuoy,
  Menu,
  Play,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRoadRescue } from "@/lib/roadrescue/store";

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const ROLES = [
  { to: "/driver", label: "Driver app", icon: LifeBuoy },
  { to: "/admin", label: "Admin command center", icon: Gauge },
  { to: "/mechanic", label: "Mechanic portal", icon: Wrench },
  { to: "/demo", label: "Interactive demo", icon: Play },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-md bg-emergency text-emergency-foreground">
        <ShieldCheck className="size-5" />
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight">
        ROAD<span className="text-emergency">RESCUE</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { activeEmergencies, emergencyStop } = useRoadRescue();
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {activeEmergencies.length > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full border border-emergency/30 bg-emergency/10 px-2.5 py-1 text-xs font-semibold text-emergency sm:flex">
              <Activity className="size-3.5" />
              {activeEmergencies.length} active
            </span>
          )}
          {emergencyStop && (
            <span className="rounded-full bg-emergency px-2.5 py-1 text-xs font-bold text-emergency-foreground">
              SYSTEM HALTED
            </span>
          )}
          <RoleSwitcher />
          <Button asChild size="sm" className="hidden bg-emergency text-emergency-foreground hover:bg-emergency/90 sm:inline-flex">
            <Link to="/driver/emergency">Get help</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function RoleSwitcher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = ROLES.find((r) => pathname.startsWith(r.to));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Menu className="size-4 md:hidden" />
          <span className="hidden md:inline">{current ? current.label : "Switch role"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Review as</DropdownMenuLabel>
        {ROLES.map((r) => (
          <DropdownMenuItem key={r.to} asChild>
            <Link to={r.to} className="flex items-center gap-2">
              <r.icon className="size-4" /> {r.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Public pages</DropdownMenuLabel>
        {PUBLIC_LINKS.map((l) => (
          <DropdownMenuItem key={l.to} asChild>
            <Link to={l.to}>{l.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const MOBILE_TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/driver", label: "Driver", icon: LifeBuoy },
  { to: "/demo", label: "Demo", icon: Play },
  { to: "/admin", label: "Admin", icon: Gauge },
  { to: "/mechanic", label: "Mechanic", icon: Wrench },
] as const;

export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {MOBILE_TABS.map((t) => (
          <li key={t.to}>
            <Link
              to={t.to}
              activeOptions={{ exact: t.to === "/" }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground data-[status=active]:text-emergency"
            >
              <t.icon className="size-5" />
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Help is Always Within Reach. Rail-mounted rescue pods along highway corridors, 24/7.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
            <li><Link to="/demo" className="hover:text-foreground">Interactive demo</Link></li>
            <li><Link to="/driver/emergency" className="hover:text-foreground">Emergency help</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Operations</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/admin" className="hover:text-foreground">Command center</Link></li>
            <li><Link to="/mechanic" className="hover:text-foreground">Mechanic portal</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Emergency</h4>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CircleDot className="size-4 text-emergency" /> Helpline 1800-ROAD-911
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Corridor: NH-44 · Ghat Road section</p>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ROADRESCUE · Phase 1 simulation build
      </div>
    </footer>
  );
}

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={cn("flex-1 pb-24 md:pb-0", className)}>{children}</main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 md:pb-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
