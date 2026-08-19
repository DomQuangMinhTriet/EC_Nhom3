"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCartItem, getCart, removeCartItem, updateCartItemQuantity } from "@/features/cart/cart-api";

export const cartKeys = { mine: ["cart", "mine"] as const };

export function useCart() {
  return useQuery({ queryKey: cartKeys.mine, queryFn: getCart });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ voucherProductId, quantity = 1 }: { voucherProductId: string; quantity?: number }) =>
      addCartItem(voucherProductId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.mine }),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => updateCartItemQuantity(cartItemId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.mine }),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId: string) => removeCartItem(cartItemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.mine }),
  });
}
