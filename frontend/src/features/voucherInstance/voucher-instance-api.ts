import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";
import type { DiscountType } from "@/features/vouchers/voucher-product-api";

export type VoucherInstanceStatus = "available" | "used" | "expired" | "cancelled";

export type VoucherInstanceProduct = {
  voucherProductId: string;
  title: string;
  imageUrl: string | null;
  originalPrice: string;
  discountType: DiscountType;
  discountValue: string;
};

export type VoucherInstance = {
  voucherCodeId: string;
  code: string;
  qr: string;
  status: VoucherInstanceStatus;
  expiredAt: string;
  createdAt: string;
  usedAt: string | null;
  voucherProduct: VoucherInstanceProduct;
};

export type VoucherInstanceDetail = VoucherInstance & { qrDataUri: string };

export async function getMyVoucherInstances(status?: VoucherInstanceStatus) {
  const query = status ? `?status=${status}` : "";
  const res = await apiClient<{ data: VoucherInstance[] }>(`/voucher-instances${query}`, { headers: authHeaders() });
  return res.data;
}

export async function getVoucherInstanceDetail(voucherCodeId: string) {
  const res = await apiClient<{ data: VoucherInstanceDetail }>(`/voucher-instances/${voucherCodeId}`, { headers: authHeaders() });
  return res.data;
}
