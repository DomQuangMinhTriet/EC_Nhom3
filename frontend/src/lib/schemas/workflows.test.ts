import { describe, expect, it } from "vitest";
import { partnerVoucherSchema, redeemSchema, rejectionReasonSchema } from "@/lib/schemas/workflows";

describe("partner, branch and admin workflows", () => {
  it("validates a partner voucher ready to submit for approval", () => {
    expect(partnerVoucherSchema.safeParse({ title: "Voucher combo bữa trưa", category: "Ăn uống", originalPrice: 200000, salePrice: 140000, stock: 500, expiry: "2026-12-31" }).success).toBe(true);
  });

  it("requires a redeem code and mandatory rejection reason", () => {
    expect(redeemSchema.safeParse({ code: "EC-123456" }).success).toBe(true);
    expect(redeemSchema.safeParse({ code: "123" }).success).toBe(false);
    expect(rejectionReasonSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(rejectionReasonSchema.safeParse({ reason: "Thiếu điều kiện áp dụng" }).success).toBe(true);
  });
});
