"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmPaymentCallback,
  initiatePayment,
  type PaymentCallbackStatus,
} from "@/features/payment/payment-api";
import type { PaymentMethod } from "@/features/order/order-api";

export function useInitiatePayment() {
  return useMutation({
    mutationFn: ({
      orderId,
      paymentMethod,
    }: {
      orderId: string;
      paymentMethod: PaymentMethod;
    }) => initiatePayment(orderId, paymentMethod),
  });
}

export function useConfirmPaymentCallback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      transactionId,
      paymentMethod,
      reason,
    }: {
      orderId: string;
      status: PaymentCallbackStatus;
      transactionId: string;
      paymentMethod: PaymentMethod;
      reason?: string;
    }) =>
      confirmPaymentCallback(orderId, {
        status,
        transactionId,
        paymentMethod,
        reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["voucherInstances"] });
    },
  });
}
