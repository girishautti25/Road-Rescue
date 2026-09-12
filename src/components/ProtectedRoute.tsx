import { ReactNode } from 'react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useRouter, useLocation, Link } from '@tanstack/react-router';
import { ShieldAlert, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-emergency" />
        <p className="text-sm font-medium text-muted-foreground">Verifying ROADRESCUE authorization...</p>
      </div>
    );
  }

  if (!user) {
    const currentPath = location.pathname + (location.searchStr ? `?${location.searchStr}` : '');
    // Navigate to login with safe returnTo
    router.navigate({
      to: '/login',
      search: { returnTo: currentPath },
    });
    return null;
  }

  const isAuthorized = allowedRoles.includes(user.role);

  if (!isAuthorized) {
    const roleDashboardMap: Record<UserRole, string> = {
      DRIVER: '/driver',
      MECHANIC: '/mechanic',
      STATION_OPERATOR: '/station',
      ADMIN: '/admin',
      SUPER_ADMIN: '/admin',
    };
    const defaultDashboard = roleDashboardMap[user.role] || '/';

    return (
      <div className="container mx-auto flex min-h-[70vh] max-w-lg items-center justify-center p-4">
        <Card className="w-full border-emergency/30 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-emergency/10 text-emergency">
              <ShieldAlert className="size-8" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-sm">
              This area requires elevated permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-sm">
            <div className="rounded-lg bg-muted/60 p-3 text-left">
              <p className="text-xs text-muted-foreground">Current Account:</p>
              <p className="font-semibold text-foreground">{user.email ?? 'Authenticated User'}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Assigned Role:</span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {user.role}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Your account is not authorized to view this page. Allowed roles:{' '}
              <span className="font-semibold text-foreground">{allowedRoles.join(', ')}</span>.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full gap-2">
              <Link to={defaultDashboard}>
                Go to your {user.role.replace('_', ' ')} Portal <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                await signOut();
                router.navigate({ to: '/login' });
              }}
            >
              <LogOut className="size-4" /> Sign In with Different Account
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
