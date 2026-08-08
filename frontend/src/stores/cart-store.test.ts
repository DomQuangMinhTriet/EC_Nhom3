import { beforeEach, describe, expect, it } from "vitest";
import { voucherMocks } from "@/lib/mocks/vouchers";
import { useCartStore } from "@/stores/cart-store";

describe("customer cart happy path", () => {
  beforeEach(() => useCartStore.getState().clear());

  it("adds a voucher, increments it, updates quantity and clears after checkout", () => {
    const voucher = voucherMocks[0];
    const cart = useCartStore.getState();
    cart.add(voucher);
    cart.add(voucher);
    expect(useCartStore.getState().items).toEqual([expect.objectContaining({ id: voucher.id, quantity: 2 })]);
    useCartStore.getState().updateQuantity(voucher.id, 1);
    expect(useCartStore.getState().items[0]?.quantity).toBe(1);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });
});
