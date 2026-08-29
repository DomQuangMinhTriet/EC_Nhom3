import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";
import type { DiscountType } from "@/features/vouchers/voucher-product-api";

export type OrderStatus = "pending_payment" | "completed" | "failed";
export type PaymentMethod = "bank_transfer" | "card" | "paypal" | "vnpay" | "stripe";

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
  refundedAt: string | null;
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

export type AdminOrder = Order & { customer: { fullName: string; email: string } };

export async function getOrdersForAdmin(params?: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  from?: string;
  to?: string;
  customerProfileId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.customerProfileId) query.set("customerProfileId", params.customerProfileId);
  const queryString = query.toString();
  return await apiClient<{ data: AdminOrder[]; pagination: OrderListResponse["pagination"] }>(
    `/orders/admin${queryString ? `?${queryString}` : ""}`,
    { headers: authHeaders() },
  );
}

export async function getOrderByIdForAdmin(orderId: string) {
  const res = await apiClient<{ data: AdminOrder }>(`/orders/admin/${orderId}`, { headers: authHeaders() });
  return res.data;
}

export async function cancelOrderForAdmin(orderId: string, reason?: string) {
  const res = await apiClient<{ data: AdminOrder }>(`/orders/admin/${orderId}/cancel`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

export async function markOrderRefunded(orderId: string, reason?: string) {
  const res = await apiClient<{ data: AdminOrder }>(`/orders/admin/${orderId}/refund`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

