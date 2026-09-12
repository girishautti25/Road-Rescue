import { useState } from 'react';
import { useRouter, createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShieldCheck, Loader2, ArrowRight, LifeBuoy, Wrench, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/signup')({
  head: () => ({
    meta: [
      { title: 'Create Account — ROADRESCUE' },
      { name: 'description', content: 'Create a Driver or Mechanic account on the ROADRESCUE platform.' },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'DRIVER' | 'MECHANIC'>('DRIVER');
  const [submitting, setSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);

  const router = useRouter();
  const { signUp, user, loading, resendVerification } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUp(email, password, role, fullName);
      if (result.emailConfirmed) {
        toast.success('Account created successfully!');
        if (role === 'MECHANIC') {
          router.navigate({ to: '/mechanic' });
        } else {
          router.navigate({ to: '/driver' });
        }
      } else {
        setVerificationSent(true);
        toast.info('Verification email dispatched. Please verify your inbox.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await resendVerification(email);
      toast.success('Verification email resent! Please check your spam or inbox.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not resend email';
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emergency" />
      </div>
    );
  }

  if (user) {
    router.navigate({ to: role === 'MECHANIC' ? '/mechanic' : '/driver' });
    return null;
  }

  if (verificationSent) {
    return (
      <div className="container mx-auto flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border/80 shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Mail className="size-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
            <p>
              Please open the link in your email to activate your ROADRESCUE account and start requesting or responding to highway assistance.
            </p>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-left space-y-1">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> Account initialized as {role}
              </p>
              <p>Check your Spam or Junk folder if you do not see it within 2 minutes.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Resending email...' : 'Resend verification email'}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/login">Back to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
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
          <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
          <CardDescription>
            Join the roadside rescue network as a highway driver or certified mechanic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Role selection strictly restricted to public roles: DRIVER and MECHANIC */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account Type (Public Roles)
              </Label>
              <RadioGroup
                value={role}
                onValueChange={(v) => setRole(v as 'DRIVER' | 'MECHANIC')}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem value="DRIVER" id="role-driver" className="peer sr-only" />
                  <Label
                    htmlFor="role-driver"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-3 text-center hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-emergency peer-data-[state=checked]:bg-emergency/5 [&:has([data-state=checked])]:border-emergency cursor-pointer"
                  >
                    <LifeBuoy className="mb-2 size-5 text-blue-500" />
                    <span className="text-sm font-semibold">Driver</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Emergency Assistance</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="MECHANIC" id="role-mechanic" className="peer sr-only" />
                  <Label
                    htmlFor="role-mechanic"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-3 text-center hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-emergency peer-data-[state=checked]:bg-emergency/5 [&:has([data-state=checked])]:border-emergency cursor-pointer"
                  >
                    <Wrench className="mb-2 size-5 text-amber-500" />
                    <span className="text-sm font-semibold">Mechanic</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Assistance Provider</span>
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-[11px] text-muted-foreground pt-1">
                Note: Station Operator and Administrator accounts cannot be self-registered and must be provisioned by organization administrators.
              </p>
            </div>

            <Button type="submit" className="w-full bg-emergency text-emergency-foreground hover:bg-emergency/90" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Creating account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/50 p-4 text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="ml-1 font-semibold text-emergency underline hover:text-emergency/90">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
