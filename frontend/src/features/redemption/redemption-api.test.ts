import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkVoucherCode, confirmVoucherCode } from "@/features/redemption/redemption-api";

const session = {
  user: { userId: "branch-1", email: "branch@example.com", roleCode: "Branch", status: "active" },
  accessToken: "token-branch",
  refreshToken: "refresh-branch",
};

function mockFetchOnce(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const detail = {
  voucherCodeId: "vc1",
  voucherProductId: "vp1",
  customerProfileId: "cp1",
  code: "ABC123",
  status: "available",
  expiredAt: "2026-12-31T00:00:00.000Z",
  createdAt: "2026-08-01T00:00:00.000Z",
  usedAt: null,
  redeemable: true,
  reason: null,
  customer: { customerProfileId: "cp1", fullName: "Nguyen Van A", phone: "0900000000" },
  voucherProduct: { voucherProductId: "vp1", title: "Voucher", imageUrl: null, originalPrice: "100000.00", discountType: "percentage" as const, discountValue: "10.00" },
};

describe("redemption api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("checks a voucher code with the bearer token", async () => {
    const fetchMock = mockFetchOnce(200, { data: detail });

    const result = await checkVoucherCode("ABC123");

    expect(result).toEqual(detail);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/voucher-instances/redeem/ABC123");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-branch");
  });

  it("URL-encodes the code when checking", async () => {
    const fetchMock = mockFetchOnce(200, { data: detail });

    await checkVoucherCode("ABC/123");

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/voucher-instances/redeem/ABC%2F123");
  });

  it("returns a 200 with redeemable=false when the code is already used, instead of throwing", async () => {
    mockFetchOnce(200, { data: { ...detail, status: "used", usedAt: "2026-08-25T10:30:00.000Z", redeemable: false, reason: "Voucher has already been used" } });

    const result = await checkVoucherCode("ABC123");

    expect(result.redeemable).toBe(false);
    expect(result.reason).toBe("Voucher has already been used");
  });

  it("sends a PATCH to confirm use of a voucher code", async () => {
    const usedDetail = { ...detail, status: "used" as const, usedAt: "2026-08-25T10:30:00.000Z", redeemable: false, reason: null };
    const fetchMock = mockFetchOnce(200, { data: usedDetail });

    const result = await confirmVoucherCode("ABC123");

    expect(result).toEqual(usedDetail);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/voucher-instances/redeem/ABC123");
    expect(init.method).toBe("PATCH");
  });

  it("throws with the backend error message when a code is already used", async () => {
    mockFetchOnce(400, { error: "Voucher has already been used" });

    await expect(confirmVoucherCode("ABC123")).rejects.toThrow("Voucher has already been used");
  });

  it("throws when the voucher isn't allocated to this branch", async () => {
    mockFetchOnce(403, { error: "Voucher cannot be redeemed at this branch" });

    await expect(checkVoucherCode("ABC123")).rejects.toThrow("Voucher cannot be redeemed at this branch");
  });
});
