"use client";

import type { LoginValues, RegisterValues } from "@/lib/schemas/auth";
import { apiRequest } from "@/services/api/http-client";

export type UserRole = "customer" | "partner" | "branch" | "admin";
type BackendRole = "Customer" | "Partner" | "Branch" | "Operational_Admin" | "Super_Admin";

export type AuthUser = {
  userId: string;
  email: string;
  roleCode: BackendRole;
  status: "banned" | "pending" | "active" | "deactivated";
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type RegisterResponse = {
  message: string;
  user: AuthUser;
};

const storageKey = "ec-voucher-auth";
const authChangedEvent = "ec-voucher-auth-changed";

const roleMap: Record<BackendRole, UserRole> = {
  Customer: "customer",
  Partner: "partner",
  Branch: "branch",
  Operational_Admin: "admin",
  Super_Admin: "admin",
};

export const roleFromBackend = (roleCode: BackendRole): UserRole => roleMap[roleCode];

export function dashboardForRole(roleCode?: BackendRole) {
  const role = roleCode ? roleFromBackend(roleCode) : "customer";
  return role === "admin"
    ? "/admin/dashboard"
    : role === "partner"
      ? "/partner/dashboard"
      : role === "branch"
        ? "/branch/redeem"
        : "/account";
}

const dispatchAuthChange = () => window.dispatchEvent(new Event(authChangedEvent));

export function readAuthSession() {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey);

  try {
    return value ? (JSON.parse(value) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(storageKey);
  sessionStorage.removeItem(storageKey);
  dispatchAuthChange();
}

function saveAuthSession(session: AuthSession, persistent: boolean) {
  const storage = persistent ? localStorage : sessionStorage;
  (persistent ? sessionStorage : localStorage).removeItem(storageKey);
  storage.setItem(storageKey, JSON.stringify(session));
  dispatchAuthChange();
}

export async function signIn(values: LoginValues) {
  const session = await apiRequest<AuthSession>("/api/auth/login", {
    method: "POST",
    body: { email: values.email, password: values.password },
  });

  saveAuthSession(session, values.remember ?? true);
  return session;
}

export function signUp(values: RegisterValues) {
  return apiRequest<RegisterResponse>("/api/auth/register/customer", {
    method: "POST",
    body: { email: values.email, password: values.password },
  });
}

export async function refreshAuthSession() {
  const current = readAuthSession();
  if (!current) return null;

  const session = await apiRequest<AuthSession>("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken: current.refreshToken },
  });

  saveAuthSession(session, Boolean(localStorage.getItem(storageKey)));
  return session;
}

export const onAuthChange = (listener: () => void) => {
  window.addEventListener(authChangedEvent, listener);
  return () => window.removeEventListener(authChangedEvent, listener);
};
