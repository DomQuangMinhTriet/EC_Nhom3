import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/schemas/auth";

describe("auth form validation", () => {
  it("accepts a valid customer registration", () => {
    expect(registerSchema.safeParse({ firstName: "Nguyễn", lastName: "An", email: "an@example.com", phone: "0901234567", password: "password123", confirmPassword: "password123", terms: true }).success).toBe(true);
  });

  it("rejects mismatched passwords and invalid login input", () => {
    expect(registerSchema.safeParse({ firstName: "Nguyễn", lastName: "An", email: "an@example.com", phone: "0901234567", password: "password123", confirmPassword: "different", terms: true }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "invalid", password: "short" }).success).toBe(false);
  });
});
