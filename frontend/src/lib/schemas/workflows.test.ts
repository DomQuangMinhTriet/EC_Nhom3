import { describe, expect, it } from "vitest";
import { partnerVoucherSchema, redeemSchema, rejectionReasonSchema } from "@/lib/schemas/workflows";

describe("partner, branch and admin workflows", () => {
  it("validates a partner voucher ready to submit for approval", () => {
    expect(
      partnerVoucherSchema.safeParse({
        categoryId: "00000000-0000-4000-8000-000000000003",
        title: "Voucher combo bữa trưa",
        originalPrice: 200000,
        discountType: "percentage",
        discountValue: 20,
        startDate: "2026-08-20",
        endDate: "2026-09-20",
        validDurationDays: 30,
      }).success,
    ).toBe(true);
  });

  it("rejects a voucher whose end date is before its start date", () => {
    expect(
      partnerVoucherSchema.safeParse({
        categoryId: "00000000-0000-4000-8000-000000000003",
        title: "Voucher combo bữa trưa",
        originalPrice: 200000,
        discountType: "percentage",
        discountValue: 20,
        startDate: "2026-09-20",
        endDate: "2026-08-20",
        validDurationDays: 30,
      }).success,
    ).toBe(false);
  });

  it("requires a redeem code and mandatory rejection reason", () => {
    expect(redeemSchema.safeParse({ code: "EC-123456" }).success).toBe(true);
    expect(redeemSchema.safeParse({ code: "123" }).success).toBe(false);
    expect(rejectionReasonSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(rejectionReasonSchema.safeParse({ reason: "Thiếu điều kiện áp dụng" }).success).toBe(true);
  });
});
