import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { changeReviewStatus, createReview, getVoucherReviews } from "@/features/review/review-api";

const session = {
  user: { userId: "customer-1", email: "customer@example.com", roleCode: "Customer", status: "active" },
  accessToken: "token-review",
  refreshToken: "refresh-review",
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

describe("review api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("sends voucherCodeId (camelCase) when creating a review", async () => {
    const fetchMock = mockFetchOnce(201, { data: { reviewId: "r1", rating: 5, comment: "Tốt" } });

    await createReview("vc1", 5, "Tốt");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/reviews");
    expect(JSON.parse(init.body as string)).toEqual({ voucherCodeId: "vc1", rating: 5, comment: "Tốt" });
  });

  it("fetches reviews and average for a voucher product", async () => {
    const payload = { averageRating: 4.5, reviews: [] };
    mockFetchOnce(200, { data: payload });

    const result = await getVoucherReviews("v1");
    expect(result).toEqual(payload);
  });

  it("sends the target status when moderating a review", async () => {
    const fetchMock = mockFetchOnce(200, { data: { reviewId: "r1", status: "hidden" } });

    await changeReviewStatus("r1", "hidden");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/reviews/r1/status");
    expect(JSON.parse(init.body as string)).toEqual({ status: "hidden" });
  });
});
