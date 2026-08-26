import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";

export type RedemptionStatus = "available" | "used" | "expired" | "cancelled";

export type RedemptionVoucherProduct = {
  voucherProductId: string;
  title: string;
  imageUrl: string | null;
  originalPrice: string;
};

export type RedemptionCustomer = {
  fullName: string;
};

export type RedemptionDetail = {
  voucherCodeId: string;
  code: string;
  status: RedemptionStatus;
  expiredAt: string;
  usedAt: string | null;
  voucherProduct: RedemptionVoucherProduct;
  customer: RedemptionCustomer;
};

export async function checkVoucherCode(code: string) {
  const res = await apiClient<{ data: RedemptionDetail }>(`/redemptions/${encodeURIComponent(code)}`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function confirmVoucherCode(code: string) {
  const res = await apiClient<{ data: RedemptionDetail }>(`/redemptions/${encodeURIComponent(code)}/use`, {
    method: "POST",
    headers: authHeaders(),
  });
  return res.data;
}
