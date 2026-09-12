import { useState } from 'react';
import { useRouter, createFileRoute, Link, useSearch } from '@tanstack/react-router';
import { useAuth, DEMO_ACCOUNTS, UserRole } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2, ArrowRight, LifeBuoy, Wrench, Building2, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSearchSchema = z.object({
  returnTo: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  head: () => ({
    meta: [
      { title: 'Sign In — ROADRESCUE' },
      { name: 'description', content: 'Sign in to access your ROADRESCUE emergency assistance portal.' },
    ],
  }),
  component: Login,
});

function isSafeReturnUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  // Must start with single slash, not double slash, no backslash, no protocol
  return url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\') && !url.includes('://');
}

function getRoleDefaultUrl(role: UserRole): string {
  switch (role) {
    case 'DRIVER':
      return '/driver';
    case 'MECHANIC':
      return '/mechanic';
    case 'STATION_OPERATOR':
      return '/station';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin';
    default:
      return '/';
  }
}

function isRoleAuthorizedForPath(role: UserRole, path: string): boolean {
  if (path.startsWith('/admin')) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }
  if (path.startsWith('/mechanic')) {
    return role === 'MECHANIC' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  }
  if (path.startsWith('/station')) {
    return role === 'STATION_OPERATOR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  }
  if (path.startsWith('/driver')) {
    return role === 'DRIVER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  }
  return true;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { signIn, user, loading } = useAuth();
  const search = useSearch({ from: '/login' });
  const returnTo = search.returnTo;

  const navigateAfterAuth = (authenticatedRole: UserRole) => {
    if (isSafeReturnUrl(returnTo) && isRoleAuthorizedForPath(authenticatedRole, returnTo!)) {
      router.navigate({ to: returnTo as '/' });
    } else {
      const defaultUrl = getRoleDefaultUrl(authenticatedRole);
      router.navigate({ to: defaultUrl as '/' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setSubmitting(true);
    try {
      const authUser = await signIn(email, password);
      toast.success(`Welcome back, ${authUser.full_name || authUser.email}!`);
      navigateAfterAuth(authUser.role);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (roleKey: keyof typeof DEMO_ACCOUNTS) => {
    const account = DEMO_ACCOUNTS[roleKey];
    if (!account) return;
    setEmail(account.email);
    setPassword(account.password);
    setSubmitting(true);
    try {
      const authUser = await signIn(account.email, account.password);
      toast.success(`Signed in as demo ${account.role.replace('_', ' ')}`);
      navigateAfterAuth(authUser.role);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emergency" />
      </div>
    );
  }

  // If already logged in, redirect
  if (user) {
    navigateAfterAuth(user.role);
    return null;
  }

  return (
    <div className="container mx-auto flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-md bg-emergency text-emergency-foreground shadow-sm">
          <ShieldCheck className="size-5" />
        </span>
        <span className="font-display text-2xl font-extrabold tracking-tight">
          ROAD<span className="text-emergency">RESCUE</span>
        </span>
      </div>

      <Card className="w-full max-w-md border-border/80 shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Sign in to your account</CardTitle>
          <CardDescription>
            Enter your credentials to access the emergency rescue platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-emergency text-emergency-foreground hover:bg-emergency/90" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Fill Demo Roles */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold">
                Or Quick Fill Demo Role
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center justify-start gap-1.5 text-xs h-9"
              onClick={() => handleQuickLogin('DRIVER')}
              disabled={submitting}
            >
              <LifeBuoy className="size-3.5 text-blue-500" /> Driver
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center justify-start gap-1.5 text-xs h-9"
              onClick={() => handleQuickLogin('MECHANIC')}
              disabled={submitting}
            >
              <Wrench className="size-3.5 text-amber-500" /> Mechanic
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center justify-start gap-1.5 text-xs h-9"
              onClick={() => handleQuickLogin('STATION_OPERATOR')}
              disabled={submitting}
            >
              <Building2 className="size-3.5 text-emerald-500" /> Station Op
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center justify-start gap-1.5 text-xs h-9"
              onClick={() => handleQuickLogin('ADMIN')}
              disabled={submitting}
            >
              <Gauge className="size-3.5 text-purple-500" /> Admin
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/50 p-4 text-xs text-muted-foreground">
          Don&apos;t have an account yet?{' '}
          <Link to="/signup" className="ml-1 font-semibold text-emergency underline hover:text-emergency/90">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
