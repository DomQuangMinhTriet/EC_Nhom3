"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  allocateBranches,
  deleteAllocation,
  getAllocations,
  getPublicBranchStock,
  updateAllocation,
  type AllocateBranchesInput,
} from "@/features/branchQuota/branch-quota-api";

export const branchQuotaKeys = {
  allocations: (voucherProductId: string) => ["branchQuota", "allocations", voucherProductId] as const,
  publicStock: (voucherProductId: string) => ["branchQuota", "publicStock", voucherProductId] as const,
};

export function usePublicBranchStock(voucherProductId?: string) {
  return useQuery({
    queryKey: branchQuotaKeys.publicStock(voucherProductId ?? ""),
    queryFn: () => getPublicBranchStock(voucherProductId as string),
    enabled: Boolean(voucherProductId),
  });
}

export function useAllocations(voucherProductId: string) {
  return useQuery({
    queryKey: branchQuotaKeys.allocations(voucherProductId),
    queryFn: () => getAllocations(voucherProductId, { pageSize: 100 }),
    enabled: Boolean(voucherProductId),
  });
}

export function useAllocateBranches(voucherProductId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AllocateBranchesInput) => allocateBranches(voucherProductId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchQuotaKeys.allocations(voucherProductId) }),
  });
}

export function useUpdateAllocation(voucherProductId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchProfileId, totalQuantity }: { branchProfileId: string; totalQuantity: number }) =>
      updateAllocation(voucherProductId, branchProfileId, totalQuantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchQuotaKeys.allocations(voucherProductId) }),
  });
}

export function useDeleteAllocation(voucherProductId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchProfileId: string) => deleteAllocation(voucherProductId, branchProfileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchQuotaKeys.allocations(voucherProductId) }),
  });
}
