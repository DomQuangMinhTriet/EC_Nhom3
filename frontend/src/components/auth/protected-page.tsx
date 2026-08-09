"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { dashboardForRole, roleFromBackend, type UserRole } from "@/features/auth/auth-api";
import { useAuthSession } from "@/features/auth/auth-session-provider";

export function ProtectedPage({ role, children }: { role: UserRole; children: ReactNode }) {
  const router = useRouter();
  const { session, isLoading } = useAuthSession();
  const actualRole = session ? roleFromBackend(session.user.roleCode) : null;

  useEffect(() => {
    if (!isLoading && !session) router.replace("/login");
    if (!isLoading && actualRole && actualRole !== role) {
      router.replace(dashboardForRole(session?.user.roleCode));
    }
  }, [actualRole, isLoading, role, router, session]);

  if (isLoading || !session || actualRole !== role) return null;
  return <>{children}</>;
}
