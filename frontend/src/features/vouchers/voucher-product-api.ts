import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";

export type DiscountType = "direct" | "percentage";
export type VoucherProductStatus = "pending" | "out_of_stock" | "active" | "inactive" | "rejected" | "expired";
export type AdminVoucherStatus = "active" | "inactive" | "rejected";

export type VoucherProduct = {
  voucherProductId: string;
  categoryId: string;
  partnerProfileId: string;
  title: string;
  description: string;
  originalPrice: string;
  discountType: DiscountType;
  discountValue: string;
  startDate: string;
  endDate: string;
  validDurationDays: number;
  minLimit: number;
  maxLimit: number | null;
  imageUrl: string | null;
  status: VoucherProductStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Category = { categoryId: string; name: string; parentCategoryId: string | null };

export type CreateVoucherProductInput = {
  categoryId: string;
  title: string;
  description?: string;
  originalPrice: string | number;
  discountType: DiscountType;
  discountValue: string | number;
  startDate: string;
  endDate: string;
  validDurationDays: number;
  minLimit?: number;
  maxLimit?: number | null;
  imageUrl?: string | null;
};

export type UpdateVoucherProductInput = Partial<CreateVoucherProductInput>;

export type ListVoucherProductsParams = {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  status?: VoucherProductStatus;
  search?: string;
};

export type ListVoucherProductsResult = {
  vouchers: VoucherProduct[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

function toQuery(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined) as [string, string | number][];
  const search = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  return search.size ? `?${search}` : "";
}

export async function createPartnerVoucher(input: CreateVoucherProductInput) {
  const res = await apiClient<{ voucher: VoucherProduct }>("/vouchers", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return res.voucher;
}

export async function getPartnerVouchers() {
  const res = await apiClient<{ vouchers: VoucherProduct[] }>("/vouchers/mine", { headers: authHeaders() });
  return res.vouchers;
}

export async function updatePartnerVoucher(voucherProductId: string, input: UpdateVoucherProductInput) {
  const res = await apiClient<{ voucher: VoucherProduct }>(`/vouchers/${voucherProductId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return res.voucher;
}

export async function listVoucherProducts(params: ListVoucherProductsParams = {}) {
  return apiClient<ListVoucherProductsResult>(`/vouchers${toQuery(params)}`);
}

export async function listVoucherProductsForAdmin(params: ListVoucherProductsParams = {}) {
  return apiClient<ListVoucherProductsResult>(`/vouchers/admin${toQuery(params)}`, {
    headers: authHeaders(),
  });
}

export async function getVoucherProductById(voucherProductId: string) {
  const res = await apiClient<{ voucher: VoucherProduct }>(`/vouchers/${voucherProductId}`);
  return res.voucher;
}

export async function updateVoucherProductStatus(voucherProductId: string, status: AdminVoucherStatus, rejectionReason?: string) {
  const res = await apiClient<{ message: string; voucher: VoucherProduct }>(`/vouchers/${voucherProductId}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, rejectionReason }),
  });
  return res.voucher;
}

export async function getCategories() {
  const res = await apiClient<{ data: Category[] }>("/categories");
  return res.data;
}
