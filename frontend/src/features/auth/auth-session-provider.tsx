"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { clearAuthSession, onAuthChange, readAuthSession, type AuthSession } from "./auth-api";

type AuthState = {
  session: AuthSession | null;
  isLoading: boolean;
  signOut: () => void;
};

const AuthSessionContext = createContext<AuthState>({
  session: null,
  isLoading: true,
  signOut: () => undefined,
});

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncSession = () => {
      setSession(readAuthSession());
      setIsLoading(false);
    };

    syncSession();
    return onAuthChange(syncSession);
  }, []);

  return (
    <AuthSessionContext.Provider value={{ session, isLoading, signOut: clearAuthSession }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export const useAuthSession = () => useContext(AuthSessionContext);
