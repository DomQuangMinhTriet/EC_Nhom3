import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";

export type DashboardSummary = {
  range: { from: string | null; to: string | null };
  users: { byRole: Record<string, number>; total: number };
  partners: { byStatus: Record<string, number>; total: number };
  vouchers: { byStatus: Record<string, number>; total: number };
  voucherCodes: { byStatus: Record<string, number>; total: number };
  orders: {
    byStatus: Record<string, { count: number; revenue: string }>;
    total: number;
  };
  revenue: { completed: string; currency: string };
};

export type GetDashboardSummaryParams = {
  from?: string;
  to?: string;
};

function toQuery(params: GetDashboardSummaryParams) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined) as [string, string][];
  const search = new URLSearchParams(entries);
  return search.size ? `?${search}` : "";
}

export async function getAdminDashboardSummary(params: GetDashboardSummaryParams = {}) {
  const res = await apiClient<{ data: DashboardSummary }>(`/dashboard/summary${toQuery(params)}`, {
    headers: authHeaders(),
  });
  return res.data;
}
