import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPartnerVoucher, getPartnerVouchers, listVoucherProducts, updateVoucherProductStatus } from "@/features/vouchers/voucher-product-api";

const session = {
  user: { userId: "partner-1", email: "partner@example.com", roleCode: "Partner", status: "active" },
  accessToken: "token-xyz",
  refreshToken: "refresh-xyz",
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

describe("voucher product api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("sends the create payload with a bearer token and returns the voucher", async () => {
    const voucher = { voucherProductId: "v1", status: "pending" };
    const fetchMock = mockFetchOnce(201, { voucher });

    const result = await createPartnerVoucher({
      categoryId: "c1",
      title: "Eco Coffee Voucher",
      originalPrice: 100000,
      discountType: "percentage",
      discountValue: 20,
      startDate: "2026-08-20",
      endDate: "2026-09-20",
      validDurationDays: 30,
    });

    expect(result).toEqual(voucher);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/vouchers");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-xyz");
    expect(JSON.parse(init.body as string)).toMatchObject({ categoryId: "c1", title: "Eco Coffee Voucher" });
  });

  it("throws without a session before hitting the network", async () => {
    localStorage.clear();
    const fetchMock = mockFetchOnce(200, { vouchers: [] });

    await expect(getPartnerVouchers()).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches the partner's own vouchers from /vouchers/mine", async () => {
    const fetchMock = mockFetchOnce(200, { vouchers: [] });

    await getPartnerVouchers();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/vouchers/mine");
  });

  it("lists public vouchers without requiring auth", async () => {
    const fetchMock = mockFetchOnce(200, { vouchers: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
    localStorage.clear();

    await listVoucherProducts({ status: "active", page: 2 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("status=active");
    expect(url).toContain("page=2");
    expect(init.headers ? (init.headers as Record<string, string>).Authorization : undefined).toBeUndefined();
  });

  it("requires a rejection reason to be forwarded when rejecting", async () => {
    const fetchMock = mockFetchOnce(200, { message: "ok", voucher: { voucherProductId: "v1", status: "rejected" } });

    await updateVoucherProductStatus("v1", "rejected", "Thiếu điều kiện áp dụng");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ status: "rejected", rejectionReason: "Thiếu điều kiện áp dụng" });
  });
});
