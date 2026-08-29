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

export type CredentialsValues = { email: string; password: string };

function requireBearerToken() {
  const session = readAuthSession();
  if (!session) throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
  return `Bearer ${session.accessToken}`;
}

export function registerPartner(values: CredentialsValues) {
  return apiRequest<RegisterResponse>("/api/auth/register/partner", {
    method: "POST",
    body: values,
    headers: { Authorization: requireBearerToken() },
  });
}

export function registerBranch(values: CredentialsValues) {
  return apiRequest<RegisterResponse>("/api/auth/register/branch", {
    method: "POST",
    body: values,
    headers: { Authorization: requireBearerToken() },
  });
}

export function forgotPassword(email: string) {
  return apiRequest<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export type ChangePasswordValues = { currentPassword: string; newPassword: string };

export function changePassword(values: ChangePasswordValues) {
  return apiRequest<{ message: string }>("/api/auth/change-password", {
    method: "POST",
    body: values,
    headers: { Authorization: requireBearerToken() },
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

const pendingProfileKey = (email: string) => `ec-voucher-pending-profile:${email.toLowerCase()}`;

export type PendingCustomerProfileDraft = { fullName: string; phone?: string };

export function savePendingCustomerProfileDraft(email: string, draft: PendingCustomerProfileDraft) {
  sessionStorage.setItem(pendingProfileKey(email), JSON.stringify(draft));
}

export function takePendingCustomerProfileDraft(email: string): PendingCustomerProfileDraft | null {
  const key = pendingProfileKey(email);
  const value = sessionStorage.getItem(key);
  if (!value) return null;

  sessionStorage.removeItem(key);
  try {
    return JSON.parse(value) as PendingCustomerProfileDraft;
  } catch {
    return null;
  }
}
