"use client";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminDashboardSummary,
  getPartnerDashboardSummary,
  type GetDashboardSummaryParams,
} from "@/features/dashboard/dashboard-api";

export const dashboardKeys = {
  summary: (params: GetDashboardSummaryParams) => ["dashboard", "summary", params] as const,
  partnerSummary: () => ["dashboard", "partnerSummary"] as const,
};

export function useAdminDashboardSummary(params: GetDashboardSummaryParams = {}) {
  return useQuery({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => getAdminDashboardSummary(params),
  });
}

export function usePartnerDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.partnerSummary(),
    queryFn: () => getPartnerDashboardSummary(),
  });
}
