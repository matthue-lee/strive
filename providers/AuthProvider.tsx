// providers/AuthProvider.tsx
import { supabase } from '@/library/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type Ctx = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>({
  session: null,
  user: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error; // keep your Promise<void> contract
  };

  const value = useMemo<Ctx>(() => ({
    session,
    user: session?.user ?? null,
    signOut,
  }), [session]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
