import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allocateBranches, deleteAllocation, getAllocations, updateAllocation } from "@/features/branchQuota/branch-quota-api";

const session = {
  user: { userId: "partner-1", email: "partner@example.com", roleCode: "Partner", status: "active" },
  accessToken: "token-quota",
  refreshToken: "refresh-quota",
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

describe("branch quota api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("sends an array body when allocating branches", async () => {
    const fetchMock = mockFetchOnce(201, { data: [], message: "Allocations created successfully" });

    await allocateBranches("v1", [{ branchProfileId: "b1", totalQuantity: 100 }]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/quotas/vouchers/v1/branches");
    expect(JSON.parse(init.body as string)).toEqual([{ branchProfileId: "b1", totalQuantity: 100 }]);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-quota");
  });

  it("builds the pagination query string when listing allocations", async () => {
    const fetchMock = mockFetchOnce(200, { data: [], pagination: { page: 2, pageSize: 10, total: 0, totalPages: 0 } });

    await getAllocations("v1", { page: 2, pageSize: 10 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/quotas/vouchers/v1/branches");
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=10");
  });

  it("returns the updated allocation from PUT", async () => {
    const allocation = { branchProfileId: "b1", voucherProductId: "v1", totalQuantity: 120, soldQuantity: 20, remainingQuantity: 100 };
    mockFetchOnce(200, { data: allocation, message: "Allocation updated successfully" });

    const result = await updateAllocation("v1", "b1", 120);
    expect(result).toEqual(allocation);
  });

  it("sends DELETE when revoking an allocation", async () => {
    const fetchMock = mockFetchOnce(200, { message: "Allocation deleted successfully" });

    await deleteAllocation("v1", "b1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/quotas/vouchers/v1/branches/b1");
    expect(init.method).toBe("DELETE");
  });
});
