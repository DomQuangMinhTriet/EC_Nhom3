import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelOrder, createOrder, getMyOrders, getOrderById } from "@/features/order/order-api";

const session = {
  user: { userId: "customer-1", email: "customer@example.com", roleCode: "Customer", status: "active" },
  accessToken: "token-order",
  refreshToken: "refresh-order",
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

describe("order api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("creates an order from the given cartId with the bearer token", async () => {
    const order = { orderId: "o1", customerProfileId: "cp1", totalAmount: "100000.00", status: "pending_payment", reason: null, items: [], payments: [] };
    const fetchMock = mockFetchOnce(201, { data: order });

    const result = await createOrder("cart-1");

    expect(result).toEqual(order);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/orders");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ cartId: "cart-1" });
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-order");
  });

  it("sends a PATCH with a reason when cancelling an order", async () => {
    const order = { orderId: "o1", customerProfileId: "cp1", totalAmount: "100000.00", status: "failed", reason: "Customer cancelled order", items: [], payments: [] };
    const fetchMock = mockFetchOnce(200, { data: order });

    const result = await cancelOrder("o1");

    expect(result).toEqual(order);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/orders/o1/cancel");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ reason: "Customer cancelled order" });
  });

  it("fetches the current customer's paginated orders with the bearer token", async () => {
    const listResponse = { data: [{ orderId: "o1", customerProfileId: "cp1", totalAmount: "100000.00", status: "completed", reason: null, createdAt: "2026-08-20T00:00:00.000Z", updatedAt: "2026-08-20T00:00:00.000Z", items: [], payments: [] }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } };
    const fetchMock = mockFetchOnce(200, listResponse);

    const result = await getMyOrders();

    expect(result).toEqual(listResponse);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/orders");
    expect(url).not.toContain("?");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-order");
  });

  it("builds the query string from page/limit/status filters", async () => {
    const fetchMock = mockFetchOnce(200, { data: [], pagination: { page: 2, limit: 5, total: 0, totalPages: 0 } });

    await getMyOrders({ page: 2, limit: 5, status: "completed" });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("page=2");
    expect(url).toContain("limit=5");
    expect(url).toContain("status=completed");
  });

  it("fetches a single order's detail by id", async () => {
    const order = { orderId: "o1", customerProfileId: "cp1", totalAmount: "100000.00", status: "completed", reason: null, createdAt: "2026-08-20T00:00:00.000Z", updatedAt: "2026-08-20T00:00:00.000Z", items: [], payments: [] };
    const fetchMock = mockFetchOnce(200, { data: order });

    const result = await getOrderById("o1");

    expect(result).toEqual(order);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/orders/o1");
  });
});
