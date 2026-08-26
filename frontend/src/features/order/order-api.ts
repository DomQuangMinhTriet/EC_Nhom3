import { apiClient, ApiError } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";
import type { DiscountType } from "@/features/vouchers/voucher-product-api";

export type OrderStatus = "pending_payment" | "completed" | "failed";
export type PaymentMethod = "bank_transfer" | "card";

export type OrderItemVoucherProduct = {
  voucherProductId: string;
  title: string;
  imageUrl: string | null;
  originalPrice: string;
  discountType: DiscountType;
  discountValue: string;
};

export type OrderItemVoucherCode = {
  voucherCodeId: string;
  code: string;
  status: string;
  expiredAt: string;
};

export type OrderItem = {
  orderItemId: string;
  voucherProductId: string;
  voucherCodeId: string | null;
  quantity: number;
  unitPrice: string;
  voucherProduct: OrderItemVoucherProduct;
  voucherCode: OrderItemVoucherCode | null;
};

export type OrderPayment = {
  paymentId: string;
  transactionId: string;
  paymentMethod: PaymentMethod;
  amount: string;
  currency: string;
  status: string;
};

export type Order = {
  orderId: string;
  customerProfileId: string;
  totalAmount: string;
  status: OrderStatus;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments: OrderPayment[];
};

export type OrderListResponse = {
  data: Order[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export async function createOrder(cartId: string) {
  const res = await apiClient<{ data: Order }>("/orders", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ cartId }),
  });
  return res.data;
}

export async function getMyOrders(params?: { page?: number; limit?: number; status?: OrderStatus }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  const queryString = query.toString();
  return await apiClient<OrderListResponse>(`/orders${queryString ? `?${queryString}` : ""}`, {
    headers: authHeaders(),
  });
}

export async function getOrderById(orderId: string) {
  const res = await apiClient<{ data: Order }>(`/orders/${orderId}`, { headers: authHeaders() });
  return res.data;
}

export async function cancelOrder(orderId: string, reason = "Customer cancelled order") {
  const res = await apiClient<{ data: Order }>(`/orders/${orderId}/cancel`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

export async function confirmOrderPayment(
  orderId: string,
  params: { status: "completed" | "failed"; transactionId?: string; paymentMethod?: PaymentMethod; reason?: string },
) {
  const response = await fetch("/api/payments/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ orderId, ...params }),
  });
  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = body as { error?: string; message?: string } | undefined;
    throw new ApiError(error?.error ?? error?.message ?? "Không thể xác nhận thanh toán.", response.status, body);
  }

  return (body as { data: Order }).data;
}
