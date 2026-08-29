import type { DiscountType } from "@/features/vouchers/voucher-product-api";

// Mirrors the backend's computeSalePrice/validateDiscountedPrice: the price a
// customer actually pays is originalPrice minus the discount, never the
// pre-discount face value shown on its own.
export function computeSalePrice(originalPrice: string | number, discountType: DiscountType, discountValue: string | number) {
  const original = Number(originalPrice);
  const discount = Number(discountValue);
  return discountType === "direct" ? original - discount : original * (1 - discount / 100);
}

export function computeDiscountPercent(originalPrice: string | number, discountType: DiscountType, discountValue: string | number) {
  const original = Number(originalPrice);
  const discount = Number(discountValue);
  return discountType === "percentage" ? discount : original > 0 ? (discount / original) * 100 : 0;
}
