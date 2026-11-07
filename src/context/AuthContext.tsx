import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { parsePlaces } from '../lib/format';
import { supabase, isConfigured } from '../lib/supabase';
import type { CollegeChoice, Profile } from '../types';

export type AuthMode = 'login' | 'signup';

interface AuthState {
  open: boolean;
  mode: AuthMode;
  onDone?: () => void;
}

type ProfileInput = Omit<Profile, 'id' | 'college_id'>;

interface Ctx {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  auth: AuthState;
  openAuth: (mode?: AuthMode, onDone?: () => void) => void;
  closeAuth: () => void;
  requireAuth: (then: () => void) => void;
  sendOtp: (email: string) => Promise<string | null>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null; hasProfile: boolean }>;
  saveProfile: (p: ProfileInput, college: CollegeChoice) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<AuthState>({ open: false, mode: 'login' });

  const loadProfile = useCallback(async (uid: string): Promise<Profile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    const p = (data as Profile | null) ?? null;
    setProfile(p);
    return p;
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const openAuth = useCallback((mode: AuthMode = 'login', onDone?: () => void) => setAuth({ open: true, mode, onDone }), []);
  const closeAuth = useCallback(() => setAuth((a) => ({ ...a, open: false })), []);

  const requireAuth = useCallback(
    (then: () => void) => {
      if (session && profile) then();
      else openAuth('login', then);
    },
    [session, profile, openAuth],
  );

  const sendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    return error ? error.message : null;
  }, []);

  const verifyOtp = useCallback(
    async (email: string, token: string) => {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (error || !data.user) return { error: error?.message ?? 'That code did not work.', hasProfile: false };
      setSession(data.session);
      const p = await loadProfile(data.user.id);
      return { error: null, hasProfile: Boolean(p) };
    },
    [loadProfile],
  );

  const saveProfile = useCallback(async (p: ProfileInput, choice: CollegeChoice) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return 'You are not logged in. Verify your email first.';

    let collegeId: string;
    if (choice.kind === 'existing') {
      collegeId = choice.college.id;
    } else {
      const name = choice.name.trim();
      const city = choice.city.trim();
      const places = parsePlaces(choice.places);
      if (places.length < 2) return 'Add at least two campus places for your college.';
      const ins = await supabase
        .from('colleges')
        .insert({ name, city, country: choice.country.trim() || 'India', locations: places, created_by: u.user.id })
        .select('id')
        .single();
      if (ins.error) {
        if (ins.error.code !== '23505') return ins.error.message;
        // Someone already added this college. Use theirs instead of creating a copy.
        const ex = await supabase.from('colleges').select('id').ilike('name', name).ilike('city', city).maybeSingle();
        if (!ex.data) return 'That college already exists. Search for it instead.';
        collegeId = ex.data.id as string;
      } else {
        collegeId = ins.data.id as string;
      }
    }

    const row: Profile = { id: u.user.id, college_id: collegeId, ...p };
    const { error } = await supabase.from('profiles').upsert(row);
    if (error) return error.message;
    setProfile(row);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ session, profile, loading, auth, openAuth, closeAuth, requireAuth, sendOtp, verifyOtp, saveProfile, signOut }),
    [session, profile, loading, auth, openAuth, closeAuth, requireAuth, sendOtp, verifyOtp, saveProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
