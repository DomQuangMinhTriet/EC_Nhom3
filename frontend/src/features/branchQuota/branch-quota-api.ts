import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";

export type BranchAllocation = {
  branchProfileId: string;
  voucherProductId: string;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  branchName?: string;
  address?: string;
  phone?: string;
};

export type AllocateBranchesInput = { branchProfileId: string; totalQuantity: number }[];

export type GetAllocationsResult = {
  data: BranchAllocation[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export async function allocateBranches(voucherProductId: string, input: AllocateBranchesInput) {
  return apiClient<{ data: BranchAllocation[]; message: string }>(`/quotas/vouchers/${voucherProductId}/branches`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
}

export async function getAllocations(voucherProductId: string, params: { page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const query = search.size ? `?${search}` : "";

  return apiClient<GetAllocationsResult>(`/quotas/vouchers/${voucherProductId}/branches${query}`, { headers: authHeaders() });
}

export async function updateAllocation(voucherProductId: string, branchProfileId: string, totalQuantity: number) {
  const res = await apiClient<{ data: BranchAllocation; message: string }>(
    `/quotas/vouchers/${voucherProductId}/branches/${branchProfileId}`,
    { method: "PUT", headers: authHeaders(), body: JSON.stringify({ totalQuantity }) },
  );
  return res.data;
}

export async function deleteAllocation(voucherProductId: string, branchProfileId: string) {
  return apiClient<{ message: string }>(`/quotas/vouchers/${voucherProductId}/branches/${branchProfileId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
