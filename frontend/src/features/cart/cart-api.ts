import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";
import type { DiscountType, VoucherProductStatus } from "@/features/vouchers/voucher-product-api";

export type CartItemVoucherProduct = {
  voucherProductId: string;
  title: string;
  imageUrl: string | null;
  originalPrice: string;
  discountType: DiscountType;
  discountValue: string;
  status: VoucherProductStatus;
};

export type CartItem = {
  cartItemId: string;
  quantity: number;
  unitPrice: string;
  voucherProduct: CartItemVoucherProduct;
};

export type Cart = {
  cartId: string;
  customerProfileId: string;
  items: CartItem[];
};

export async function getCart() {
  const res = await apiClient<{ data: Cart }>("/carts/me", { headers: authHeaders() });
  return res.data;
}

export async function addCartItem(voucherProductId: string, quantity: number) {
  const res = await apiClient<{ data: CartItem }>("/carts/me/items", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ voucherProductId, quantity }),
  });
  return res.data;
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const res = await apiClient<{ data: CartItem }>(`/carts/me/items/${cartItemId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ quantity }),
  });
  return res.data;
}

export async function removeCartItem(cartItemId: string) {
  return apiClient<{ data: { message: string } }>(`/carts/me/items/${cartItemId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export function computeUnitPrice(voucher: Pick<CartItemVoucherProduct, "originalPrice" | "discountType" | "discountValue">) {
  const original = Number(voucher.originalPrice);
  const value = Number(voucher.discountValue);
  return voucher.discountType === "percentage" ? original * (1 - value / 100) : Math.max(original - value, 0);
}
