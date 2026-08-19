"use client";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPartnerVoucher,
  getCategories,
  getPartnerVouchers,
  getVoucherProductById,
  listVoucherProducts,
  updatePartnerVoucher,
  updateVoucherProductStatus,
  type AdminVoucherStatus,
  type CreateVoucherProductInput,
  type ListVoucherProductsParams,
  type UpdateVoucherProductInput,
} from "@/features/vouchers/voucher-product-api";

export const voucherProductKeys = {
  mine: ["voucherProducts", "mine"] as const,
  detail: (id: string) => ["voucherProducts", "detail", id] as const,
  list: (params: ListVoucherProductsParams) => ["voucherProducts", "list", params] as const,
  categories: ["categories"] as const,
};

export function usePartnerVouchers() {
  return useQuery({ queryKey: voucherProductKeys.mine, queryFn: getPartnerVouchers });
}

// GET /vouchers/:id only returns active vouchers (public endpoint) — use this for
// the partner's own edit form instead, since it must work for pending/rejected too.
export function usePartnerVoucherById(id?: string) {
  const listQuery = useQuery({ queryKey: voucherProductKeys.mine, queryFn: getPartnerVouchers, enabled: Boolean(id) });
  return { ...listQuery, data: listQuery.data?.find((voucher) => voucher.voucherProductId === id) };
}

export function useVoucherProduct(id: string) {
  return useQuery({ queryKey: voucherProductKeys.detail(id), queryFn: () => getVoucherProductById(id), enabled: Boolean(id) });
}

export function useVoucherProductList(params: ListVoucherProductsParams = {}) {
  return useQuery({ queryKey: voucherProductKeys.list(params), queryFn: () => listVoucherProducts(params) });
}

export function useCategories() {
  return useQuery({ queryKey: voucherProductKeys.categories, queryFn: getCategories, staleTime: 5 * 60_000 });
}

export function useCategoryNameMap() {
  const categoriesQuery = useCategories();
  return useMemo(() => new Map(categoriesQuery.data?.map((category) => [category.categoryId, category.name])), [categoriesQuery.data]);
}

export function useCreatePartnerVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVoucherProductInput) => createPartnerVoucher(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: voucherProductKeys.mine }),
  });
}

export function useUpdatePartnerVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVoucherProductInput }) => updatePartnerVoucher(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: voucherProductKeys.mine }),
  });
}

export function useUpdateVoucherProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: AdminVoucherStatus; rejectionReason?: string }) =>
      updateVoucherProductStatus(id, status, rejectionReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["voucherProducts", "list"] }),
  });
}
