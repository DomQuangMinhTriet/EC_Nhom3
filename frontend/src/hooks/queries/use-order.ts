"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, createOrder, getMyOrders, getOrderById, type OrderStatus } from "@/features/order/order-api";
import { cartKeys } from "@/hooks/queries/use-cart";

export const orderKeys = {
  mine: (status?: OrderStatus) => ["orders", "mine", status ?? "all"] as const,
  detail: (orderId?: string) => ["orders", "detail", orderId ?? ""] as const,
};

export function useMyOrders(status?: OrderStatus) {
  return useQuery({ queryKey: orderKeys.mine(status), queryFn: () => getMyOrders({ status }) });
}

export function useOrderById(
  orderId?: string,
  options: { enabled?: boolean; refetchInterval?: number | false } = {},
) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderById(orderId!),
    enabled: Boolean(orderId) && (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartId: string) => createOrder(cartId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.mine }),
  });
}

export function useCancelOrder() {
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
  });
}
