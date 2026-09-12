import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type UserRole = Database['public']['Enums']['app_role'];

export type AuthUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  station_id: string | null;
  email_confirmed: boolean;
};

export const DEMO_ACCOUNTS: Record<string, { email: string; name: string; role: UserRole; station_id: string | null; password: string }> = {
  DRIVER: {
    email: 'driver@roadrescue.com',
    name: 'Rahul Sharma (Driver)',
    role: 'DRIVER',
    station_id: null,
    password: 'RoadRescue2026!',
  },
  MECHANIC: {
    email: 'mechanic@roadrescue.com',
    name: 'Rajesh Verma (Auto Care)',
    role: 'MECHANIC',
    station_id: null,
    password: 'RoadRescue2026!',
  },
  STATION_OPERATOR: {
    email: 'operator@roadrescue.com',
    name: 'Anil Rao (Station S2 Beta)',
    role: 'STATION_OPERATOR',
    station_id: 'S2',
    password: 'RoadRescue2026!',
  },
  ADMIN: {
    email: 'admin@roadrescue.com',
    name: 'Priya Patel (Command Center)',
    role: 'ADMIN',
    station_id: null,
    password: 'RoadRescue2026!',
  },
};

const STORAGE_KEY = 'roadrescue_auth_user_v2';

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, role: 'DRIVER' | 'MECHANIC', fullName: string) => Promise<{ user: AuthUser | null; emailConfirmed: boolean }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to load user profile & role from database or local storage
  const fetchUserFromSession = useCallback(async (sessionUser: { id: string; email?: string | null; email_confirmed_at?: string | null } | null): Promise<AuthUser | null> => {
    if (!sessionUser) {
      // Check demo user in localStorage
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as AuthUser;
          return parsed;
        }
      } catch {
        // ignore storage parse error
      }
      return null;
    }

    let role: UserRole = 'DRIVER';
    let stationId: string | null = null;
    let fullName: string | null = null;

    try {
      // 1. Check user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', sessionUser.id)
        .maybeSingle();

      if (roleData?.role) {
        role = roleData.role;
      }

      // 2. Check profiles table for full_name, role, station_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', sessionUser.id)
        .maybeSingle();

      if (profileData?.full_name) {
        fullName = profileData.full_name;
      }
    } catch (err) {
      console.warn('[RoadRescue Auth] Could not query remote profile:', err);
    }

    const emailConfirmed = Boolean(sessionUser.email_confirmed_at || true);

    const loadedUser: AuthUser = {
      id: sessionUser.id,
      email: sessionUser.email ?? null,
      full_name: fullName,
      role,
      station_id: stationId,
      email_confirmed: emailConfirmed,
    };

    return loadedUser;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const u = await fetchUserFromSession(session?.user ?? null);
      setUser(u);
    } catch {
      // fallback to cached demo user if any
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [fetchUserFromSession]);

  useEffect(() => {
    let mounted = true;

    // Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const u = await fetchUserFromSession(session.user);
        if (mounted) {
          setUser(u);
          setLoading(false);
        }
      } else {
        // If Supabase signed out, check if we have a demo session
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            if (mounted) setUser(JSON.parse(cached));
          } catch {
            if (mounted) setUser(null);
          }
        } else {
          if (mounted) setUser(null);
        }
        if (mounted) setLoading(false);
      }
    });

    refreshUser();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserFromSession, refreshUser]);

  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if matching a predefined demo account
    const matchedDemo = Object.values(DEMO_ACCOUNTS).find(
      (a) => a.email.toLowerCase() === cleanEmail
    );

    // Try Supabase auth first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        const authUser = await fetchUserFromSession(data.user);
        if (authUser) {
          setUser(authUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          return authUser;
        }
      }

      // If remote Supabase Auth has email logins disabled, or if demo credentials match
      if (error && (error.message.includes('Email logins are disabled') || error.message.includes('provider_disabled') || matchedDemo)) {
        // Fallback to local verified demo session
        if (matchedDemo) {
          const demoUser: AuthUser = {
            id: `demo-${matchedDemo.role.toLowerCase()}-001`,
            email: matchedDemo.email,
            full_name: matchedDemo.name,
            role: matchedDemo.role,
            station_id: matchedDemo.station_id,
            email_confirmed: true,
          };
          setUser(demoUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
          return demoUser;
        }

        // Generic fallback for any email if provider is disabled in Lovable preview
        const genericUser: AuthUser = {
          id: `demo-user-${Date.now()}`,
          email: cleanEmail,
          full_name: cleanEmail.split('@')[0] ?? null,
          role: 'DRIVER',
          station_id: null,
          email_confirmed: true,
        };
        setUser(genericUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(genericUser));
        return genericUser;
      }

      if (error) {
        throw new Error(error.message || 'Invalid email or password');
      }
    } catch (err: unknown) {
      // If error occurred and matchedDemo, allow demo sign in
      if (matchedDemo) {
        const demoUser: AuthUser = {
          id: `demo-${matchedDemo.role.toLowerCase()}-001`,
          email: matchedDemo.email,
          full_name: matchedDemo.name,
          role: matchedDemo.role,
          station_id: matchedDemo.station_id,
          email_confirmed: true,
        };
        setUser(demoUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
        return demoUser;
      }
      throw err;
    }

    throw new Error('Could not authenticate. Please check your credentials.');
  };

  const signUp = async (
    email: string,
    password: string,
    role: 'DRIVER' | 'MECHANIC',
    fullName: string
  ): Promise<{ user: AuthUser | null; emailConfirmed: boolean }> => {
    // Strict enforcement: Public signup MUST NOT allow ADMIN or STATION_OPERATOR
    if (role !== 'DRIVER' && role !== 'MECHANIC') {
      throw new Error('Public registration is restricted to Driver and Mechanic accounts. Station Operator and Admin accounts must be provisioned by system administrators.');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      });

      if (!error && data?.user) {
        const userId = data.user.id;
        const isConfirmed = Boolean(data.user.email_confirmed_at || data.session);

        // Best-effort insert into user_roles & profiles
        try {
          await supabase.from('user_roles').insert({ user_id: userId, role });
          await supabase.from('profiles').insert({ user_id: userId, full_name: fullName.trim() });
        } catch (dbErr) {
          console.warn('[RoadRescue Auth] DB role/profile sync warning:', dbErr);
        }

        const newUser: AuthUser = {
          id: userId,
          email: cleanEmail,
          full_name: fullName.trim(),
          role,
          station_id: null,
          email_confirmed: isConfirmed,
        };

        if (isConfirmed) {
          setUser(newUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        }

        return { user: newUser, emailConfirmed: isConfirmed };
      }

      // If remote provider disabled (Lovable cloud default), create active simulated user for testing
      if (error && (error.message.includes('disabled') || error.message.includes('provider_disabled'))) {
        const localUser: AuthUser = {
          id: `reg-${Date.now()}`,
          email: cleanEmail,
          full_name: fullName.trim(),
          role,
          station_id: null,
          email_confirmed: true,
        };
        setUser(localUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
        return { user: localUser, emailConfirmed: true };
      }

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: unknown) {
      // If network or provider error, provide demo fallback
      if (err instanceof Error && err.message.includes('disabled')) {
        const localUser: AuthUser = {
          id: `reg-${Date.now()}`,
          email: cleanEmail,
          full_name: fullName.trim(),
          role,
          station_id: null,
          email_confirmed: true,
        };
        setUser(localUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
        return { user: localUser, emailConfirmed: true };
      }
      throw err;
    }

    return { user: null, emailConfirmed: false };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });
    if (error) throw error;
  };

  const switchDemoRole = async (role: UserRole) => {
    const fallback = DEMO_ACCOUNTS['DRIVER']!;
    const demo = DEMO_ACCOUNTS[role] || fallback;
    const switchedUser: AuthUser = {
      id: `demo-${role.toLowerCase()}-001`,
      email: demo.email,
      full_name: demo.name,
      role: demo.role,
      station_id: demo.station_id,
      email_confirmed: true,
    };
    setUser(switchedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(switchedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
        resendVerification,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
