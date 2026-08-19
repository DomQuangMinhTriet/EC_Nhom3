import { describe, expect, it } from "vitest";
import {
  branchProfileSchema,
  createManagedAccountSchema,
  customerProfileSchema,
  partnerProfileSchema,
  profileStatusChangeSchema,
} from "@/lib/schemas/profile";

describe("profile form validation", () => {
  it("requires a full name for the customer profile", () => {
    expect(customerProfileSchema.safeParse({ fullName: "Nguyễn Văn An" }).success).toBe(true);
    expect(customerProfileSchema.safeParse({ fullName: "A" }).success).toBe(false);
  });

  it("requires all mandatory partner fields", () => {
    expect(
      partnerProfileSchema.safeParse({
        partnerProfileCode: "PARTNER001",
        partnerName: "Eco Partner",
        taxCode: "0312345678",
        representativeName: "Tran Thi B",
      }).success,
    ).toBe(true);
    expect(partnerProfileSchema.safeParse({ partnerProfileCode: "PARTNER001" }).success).toBe(false);
  });

  it("requires a valid partner profile id for a branch profile", () => {
    expect(
      branchProfileSchema.safeParse({
        partnerProfileId: "00000000-0000-4000-8000-000000000010",
        branchProfileCode: "BRANCH001",
        branchName: "Eco Branch 1",
      }).success,
    ).toBe(true);
    expect(
      branchProfileSchema.safeParse({
        partnerProfileId: "not-a-uuid",
        branchProfileCode: "BRANCH001",
        branchName: "Eco Branch 1",
      }).success,
    ).toBe(false);
  });

  it("requires matching passwords for a managed account", () => {
    expect(
      createManagedAccountSchema.safeParse({ email: "partner@example.com", password: "password123", confirmPassword: "password123" }).success,
    ).toBe(true);
    expect(
      createManagedAccountSchema.safeParse({ email: "partner@example.com", password: "password123", confirmPassword: "different" }).success,
    ).toBe(false);
  });

  it("requires a rejection reason only when rejecting", () => {
    expect(profileStatusChangeSchema.safeParse({ status: "active" }).success).toBe(true);
    expect(profileStatusChangeSchema.safeParse({ status: "rejected" }).success).toBe(false);
    expect(profileStatusChangeSchema.safeParse({ status: "rejected", rejectionReason: "Thiếu giấy tờ" }).success).toBe(true);
  });
});
