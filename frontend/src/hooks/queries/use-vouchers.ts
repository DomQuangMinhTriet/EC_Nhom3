"use client";
import { useQuery } from "@tanstack/react-query";
import { getVoucher, getVouchers, type VoucherFilters } from "@/features/vouchers/api";
export const voucherKeys = { all: ["vouchers"] as const, list: (filters: VoucherFilters) => ["vouchers", "list", filters] as const, detail: (id: string) => ["vouchers", "detail", id] as const };
export const useVouchers = (filters: VoucherFilters = {}) => useQuery({ queryKey: voucherKeys.list(filters), queryFn: () => getVouchers(filters) });
export const useVoucher = (id: string) => useQuery({ queryKey: voucherKeys.detail(id), queryFn: () => getVoucher(id) });
