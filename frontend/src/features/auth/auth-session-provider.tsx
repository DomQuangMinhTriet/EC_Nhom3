"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthState = { session: Session | null; isLoading: boolean };
const AuthSessionContext = createContext<AuthState>({ session: null, isLoading: true });

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, isLoading: true });

  useEffect(() => {
    try {
      const supabase = createSupabaseBrowserClient();
      supabase.auth.getSession().then(({ data }) => setState({ session: data.session, isLoading: false }));
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setState({ session, isLoading: false }));
      return () => listener.subscription.unsubscribe();
    } catch {
      // Local UI development can run without Supabase credentials.
      setState({ session: null, isLoading: false });
    }
  }, []);

  return <AuthSessionContext.Provider value={state}>{children}</AuthSessionContext.Provider>;
}

export const useAuthSession = () => useContext(AuthSessionContext);
