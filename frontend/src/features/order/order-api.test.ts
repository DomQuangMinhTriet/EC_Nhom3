import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelOrder, confirmOrderPayment, createOrder } from "@/features/order/order-api";

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

  it("confirms payment through the local payment-confirm route, not the backend directly", async () => {
    const order = { orderId: "o1", customerProfileId: "cp1", totalAmount: "100000.00", status: "completed", reason: null, items: [], payments: [] };
    const fetchMock = mockFetchOnce(200, { data: order });

    const result = await confirmOrderPayment("o1", { status: "completed", transactionId: "txn-1", paymentMethod: "card" });

    expect(result).toEqual(order);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/payments/confirm");
    expect(JSON.parse(init.body as string)).toEqual({ orderId: "o1", status: "completed", transactionId: "txn-1", paymentMethod: "card" });
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-order");
  });

  it("throws with the backend error message when payment confirmation fails", async () => {
    mockFetchOnce(400, { error: "Order khong o trang thai pending_payment" });

    await expect(confirmOrderPayment("o1", { status: "completed" })).rejects.toThrow("Order khong o trang thai pending_payment");
  });
});
