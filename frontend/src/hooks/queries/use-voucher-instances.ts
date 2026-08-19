"use client";
import { useQuery } from "@tanstack/react-query";
import { getMyVoucherInstances, getVoucherInstanceDetail, type VoucherInstanceStatus } from "@/features/voucherInstance/voucher-instance-api";

export const voucherInstanceKeys = {
  mine: (status?: VoucherInstanceStatus) => ["voucherInstances", "mine", status ?? "all"] as const,
  detail: (id: string) => ["voucherInstances", "detail", id] as const,
};

export function useMyVoucherInstances(status?: VoucherInstanceStatus) {
  return useQuery({ queryKey: voucherInstanceKeys.mine(status), queryFn: () => getMyVoucherInstances(status) });
}

export function useVoucherInstanceDetail(id: string) {
  return useQuery({ queryKey: voucherInstanceKeys.detail(id), queryFn: () => getVoucherInstanceDetail(id), enabled: Boolean(id) });
}
