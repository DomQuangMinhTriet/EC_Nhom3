"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, confirmOrderPayment, createOrder, type PaymentMethod } from "@/features/order/order-api";
import { cartKeys } from "@/hooks/queries/use-cart";

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartId: string) => createOrder(cartId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.mine }),
  });
}

export function useConfirmOrderPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, transactionId, paymentMethod }: { orderId: string; transactionId: string; paymentMethod: PaymentMethod }) =>
      confirmOrderPayment(orderId, { status: "completed", transactionId, paymentMethod }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["voucherInstances"] }),
  });
}

export function useCancelOrder() {
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
  });
}
