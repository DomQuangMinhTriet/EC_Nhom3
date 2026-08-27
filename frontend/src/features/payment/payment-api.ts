import { ApiError, apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";
import type { Order, PaymentMethod } from "@/features/order/order-api";

export type PaymentCallbackStatus = "success" | "failed";

export type PaymentRequest = {
  orderId: string;
  transactionId: string;
  paymentMethod: PaymentMethod;
  amount: string;
  currency: string;
  paymentCode?: string;
  qrUrl?: string;
  paymentUrl: string;
  bankAccount?: {
    bank: string;
    accountNumber: string;
    accountName: string;
  };
};

export async function initiatePayment(
  orderId: string,
  paymentMethod: PaymentMethod,
) {
  const res = await apiClient<{ data: PaymentRequest }>("/payments/initiate", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ orderId, paymentMethod }),
  });

  return res.data;
}

export async function confirmPaymentCallback(
  orderId: string,
  params: {
    status: PaymentCallbackStatus;
    transactionId: string;
    paymentMethod: PaymentMethod;
    reason?: string;
  },
) {
  const response = await fetch("/api/payments/callback", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ orderId, ...params }),
  });
  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = body as { error?: string; message?: string } | undefined;
    throw new ApiError(
      error?.error ?? error?.message ?? "Khong the xac nhan thanh toan.",
      response.status,
      body,
    );
  }

  return (body as { data: { order: Order } }).data.order;
}
