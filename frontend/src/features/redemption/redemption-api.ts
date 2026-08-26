import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";
import type { DiscountType } from "@/features/vouchers/voucher-product-api";

export type RedemptionVoucherStatus = "available" | "used" | "expired" | "cancelled";

export type RedemptionVoucherProduct = {
  voucherProductId: string;
  title: string;
  imageUrl: string | null;
  originalPrice: string;
  discountType: DiscountType;
  discountValue: string;
};

export type RedemptionCustomer = {
  customerProfileId: string;
  fullName: string;
  phone: string;
};

export type RedemptionDetail = {
  voucherCodeId: string;
  voucherProductId: string;
  customerProfileId: string;
  code: string;
  status: RedemptionVoucherStatus;
  expiredAt: string;
  createdAt: string;
  usedAt: string | null;
  redeemable: boolean;
  reason: string | null;
  customer: RedemptionCustomer;
  voucherProduct: RedemptionVoucherProduct;
};

export async function checkVoucherCode(code: string) {
  const res = await apiClient<{ data: RedemptionDetail }>(`/voucher-instances/redeem/${encodeURIComponent(code)}`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function confirmVoucherCode(code: string) {
  const res = await apiClient<{ data: RedemptionDetail }>(`/voucher-instances/redeem/${encodeURIComponent(code)}`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return res.data;
}
