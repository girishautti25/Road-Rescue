import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  Activity,
  Gauge,
  Home,
  LifeBuoy,
  Play,
  ShieldCheck,
  Wrench,
  Building2,
  LogOut,
  User,
  LogIn,
  ChevronDown,
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
import { useAuth, UserRole } from "@/context/AuthContext";
import { toast } from "sonner";

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const ROLE_NAV = [
  { to: "/driver", label: "Driver app", icon: LifeBuoy, role: "DRIVER" as UserRole },
  { to: "/mechanic", label: "Mechanic portal", icon: Wrench, role: "MECHANIC" as UserRole },
  { to: "/station", label: "Station operator", icon: Building2, role: "STATION_OPERATOR" as UserRole },
  { to: "/admin", label: "Admin command center", icon: Gauge, role: "ADMIN" as UserRole },
  { to: "/demo", label: "Interactive demo", icon: Play, role: null },
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
  const { user, signOut, switchDemoRole } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.navigate({ to: "/login" });
    } catch {
      toast.error("Error signing out");
    }
  };

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case "ADMIN":
      case "SUPER_ADMIN":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "STATION_OPERATOR":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "MECHANIC":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "DRIVER":
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
  };

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

          {/* User Auth Section */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 border-border">
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      getRoleBadgeColor(user.role)
                    )}
                  >
                    {user.role.replace("_", " ")}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-xs sm:inline font-medium">
                    {user.full_name || user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="truncate font-bold text-foreground text-sm">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Primary Role Link */}
                {user.role === "DRIVER" && (
                  <DropdownMenuItem asChild>
                    <Link to="/driver" className="flex items-center gap-2">
                      <LifeBuoy className="size-4 text-blue-500" /> Driver Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === "MECHANIC" && (
                  <DropdownMenuItem asChild>
                    <Link to="/mechanic" className="flex items-center gap-2">
                      <Wrench className="size-4 text-amber-500" /> Mechanic Portal
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === "STATION_OPERATOR" && (
                  <DropdownMenuItem asChild>
                    <Link to="/station" className="flex items-center gap-2">
                      <Building2 className="size-4 text-emerald-500" /> Station Console
                    </Link>
                  </DropdownMenuItem>
                )}
                {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Gauge className="size-4 text-purple-500" /> Command Center
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Quick Switch Demo Role
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => switchDemoRole("DRIVER")}>
                  <LifeBuoy className="size-3.5 text-blue-500 mr-2" /> Switch to Driver
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchDemoRole("MECHANIC")}>
                  <Wrench className="size-3.5 text-amber-500 mr-2" /> Switch to Mechanic
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchDemoRole("STATION_OPERATOR")}>
                  <Building2 className="size-3.5 text-emerald-500 mr-2" /> Switch to Station Operator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchDemoRole("ADMIN")}>
                  <Gauge className="size-3.5 text-purple-500 mr-2" /> Switch to Admin
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-emergency focus:text-emergency">
                  <LogOut className="size-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
                <Link to="/login">
                  <LogIn className="size-3.5" /> Sign In
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="hidden text-xs sm:inline-flex">
                <Link to="/signup">Register</Link>
              </Button>
            </div>
          )}

          <RoleSwitcher />

          <Button
            asChild
            size="sm"
            className="hidden bg-emergency text-emergency-foreground hover:bg-emergency/90 sm:inline-flex"
          >
            <Link to="/driver/emergency">Get help</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function RoleSwitcher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = ROLE_NAV.find((r) => pathname.startsWith(r.to));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <span className="hidden md:inline">{current ? current.label : "Portals"}</span>
          <span className="md:hidden">Roles</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>ROADRESCUE Portals</DropdownMenuLabel>
        {ROLE_NAV.map((r) => (
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
  { to: "/station", label: "Station", icon: Building2 },
  { to: "/mechanic", label: "Mechanic", icon: Wrench },
  { to: "/admin", label: "Admin", icon: Gauge },
] as const;

export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-6">
        {MOBILE_TABS.map((t) => (
          <li key={t.to}>
            <Link
              to={t.to}
              activeOptions={{ exact: t.to === "/" }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground data-[status=active]:text-emergency"
            >
              <t.icon className="size-4" />
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
          <h4 className="text-sm font-semibold">Portals</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/driver" className="hover:text-foreground">
                Driver Application
              </Link>
            </li>
            <li>
              <Link to="/mechanic" className="hover:text-foreground">
                Mechanic Portal
              </Link>
            </li>
            <li>
              <Link to="/station" className="hover:text-foreground">
                Station Operator Console
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-foreground">
                Command Center
              </Link>
            </li>
            <li>
              <Link to="/demo" className="hover:text-foreground">
                Interactive Presentation Demo
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/how-it-works" className="hover:text-foreground">
                How It Works
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground">
                About the Network
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact & Safety
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground">
                Account Sign In
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Highway Corridor</h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Simulated along the NH-44 Ghat corridor between km 0.0 and km 30.0. Stations S1–S4 online.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Autonomous Rail Grid: Active</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border/80 px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ROADRESCUE Platform. Built for highway vehicle breakdown assistance.
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
  className,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className={cn("flex-1 px-4 py-8 max-w-7xl mx-auto w-full", className)}>
        {(title || actions) && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-border/60">
            <div>
              {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
