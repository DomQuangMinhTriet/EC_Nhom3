import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMyVoucherInstances, getVoucherInstanceDetail } from "@/features/voucherInstance/voucher-instance-api";

const session = {
  user: { userId: "customer-1", email: "customer@example.com", roleCode: "Customer", status: "active" },
  accessToken: "token-instance",
  refreshToken: "refresh-instance",
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

describe("voucher instance api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("omits the status query param when not provided", async () => {
    const fetchMock = mockFetchOnce(200, { data: [] });

    await getMyVoucherInstances();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.endsWith("/voucher-instances")).toBe(true);
  });

  it("appends the status filter when provided", async () => {
    const fetchMock = mockFetchOnce(200, { data: [] });

    await getMyVoucherInstances("used");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("status=used");
  });

  it("returns the voucher detail including the generated QR data URI", async () => {
    const detail = { voucherCodeId: "vc1", code: "EC-1234", qrDataUri: "data:image/png;base64,xyz" };
    mockFetchOnce(200, { data: detail });

    const result = await getVoucherInstanceDetail("vc1");
    expect(result).toEqual(detail);
  });
});
