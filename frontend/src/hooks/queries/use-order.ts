"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  cancelOrderForAdmin,
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderByIdForAdmin,
  getOrdersForAdmin,
  markOrderRefunded,
  type OrderStatus,
} from "@/features/order/order-api";
import { cartKeys } from "@/hooks/queries/use-cart";

export const orderKeys = {
  mine: (status?: OrderStatus) => ["orders", "mine", status ?? "all"] as const,
  detail: (orderId?: string) => ["orders", "detail", orderId ?? ""] as const,
  adminList: (params: Record<string, string | number | undefined>) => ["orders", "admin", "list", params] as const,
  adminDetail: (orderId?: string) => ["orders", "admin", "detail", orderId ?? ""] as const,
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useOrdersForAdmin(params: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  from?: string;
  to?: string;
} = {}) {
  return useQuery({
    queryKey: orderKeys.adminList(params),
    queryFn: () => getOrdersForAdmin(params),
  });
}

export function useOrderByIdForAdmin(orderId?: string) {
  return useQuery({
    queryKey: orderKeys.adminDetail(orderId),
    queryFn: () => getOrderByIdForAdmin(orderId!),
    enabled: Boolean(orderId),
  });
}

export function useCancelOrderForAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) => cancelOrderForAdmin(orderId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", "admin"] }),
  });
}

export function useMarkOrderRefunded() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) => markOrderRefunded(orderId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", "admin"] }),
  });
}
