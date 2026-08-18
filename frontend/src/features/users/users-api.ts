import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";

export type AppRole = "Super_Admin" | "Operational_Admin" | "Customer" | "Partner" | "Branch";
export type UserStatus = "banned" | "pending" | "active" | "deactivated";

export type UserRecord = {
  userId: string;
  email: string;
  roleCode: AppRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type GetUsersParams = {
  page?: number;
  limit?: number;
  role?: AppRole;
  status?: UserStatus;
};

export type GetUsersResult = {
  users: UserRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type UpdateUserInput = { status?: UserStatus; roleCode?: AppRole };

function toQuery(params: GetUsersParams) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined) as [string, string | number][];
  const search = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  return search.size ? `?${search}` : "";
}

export async function getUsers(params: GetUsersParams = {}) {
  return apiClient<GetUsersResult>(`/users${toQuery(params)}`, { headers: authHeaders() });
}

export async function updateUser(userId: string, input: UpdateUserInput) {
  const res = await apiClient<{ message: string; user: UserRecord }>(`/users/${userId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return res.user;
}
