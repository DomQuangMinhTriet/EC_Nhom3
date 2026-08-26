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

describe("redemption api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("checks a voucher code with the bearer token", async () => {
    const detail = {
      voucherCodeId: "vc1",
      code: "ABC123",
      status: "available",
      expiredAt: "2026-12-31T00:00:00.000Z",
      usedAt: null,
      voucherProduct: { voucherProductId: "vp1", title: "Voucher", imageUrl: null, originalPrice: "100000.00" },
      customer: { fullName: "Nguyen Van A" },
    };
    const fetchMock = mockFetchOnce(200, { data: detail });

    const result = await checkVoucherCode("ABC123");

    expect(result).toEqual(detail);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/redemptions/ABC123");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-branch");
  });

  it("URL-encodes the code when checking", async () => {
    const fetchMock = mockFetchOnce(200, { data: {} });

    await checkVoucherCode("ABC/123");

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/redemptions/ABC%2F123");
  });

  it("sends a POST to confirm use of a voucher code", async () => {
    const detail = {
      voucherCodeId: "vc1",
      code: "ABC123",
      status: "used",
      expiredAt: "2026-12-31T00:00:00.000Z",
      usedAt: "2026-08-25T00:00:00.000Z",
      voucherProduct: { voucherProductId: "vp1", title: "Voucher", imageUrl: null, originalPrice: "100000.00" },
      customer: { fullName: "Nguyen Van A" },
    };
    const fetchMock = mockFetchOnce(200, { data: detail });

    const result = await confirmVoucherCode("ABC123");

    expect(result).toEqual(detail);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/redemptions/ABC123/use");
    expect(init.method).toBe("POST");
  });

  it("throws with the backend error message when a code is already used", async () => {
    mockFetchOnce(400, { error: "Voucher code is not available" });

    await expect(confirmVoucherCode("ABC123")).rejects.toThrow("Voucher code is not available");
  });
});
