import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  capturePaypalOrder,
  confirmPaymentCallback,
  initiatePayment,
} from "@/features/payment/payment-api";

const session = {
  user: {
    userId: "customer-1",
    email: "customer@example.com",
    roleCode: "Customer",
    status: "active",
  },
  accessToken: "token-payment",
  refreshToken: "refresh-payment",
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

describe("payment api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("initiates payment with bearer token", async () => {
    const paymentRequest = {
      orderId: "o1",
      transactionId: "mock-txn-1",
      paymentMethod: "card",
      amount: "100000.00",
      currency: "VND",
      paymentUrl:
        "https://mock-payment.local/checkout?transactionId=mock-txn-1",
    };
    const fetchMock = mockFetchOnce(201, { data: paymentRequest });

    const result = await initiatePayment("o1", "card");

    expect(result).toEqual(paymentRequest);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/payments/initiate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      orderId: "o1",
      paymentMethod: "card",
    });
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer token-payment",
    );
  });

  it("confirms payment through the local server-side callback proxy", async () => {
    const order = {
      orderId: "o1",
      customerProfileId: "cp1",
      totalAmount: "100000.00",
      status: "completed",
      reason: null,
      createdAt: "2026-08-20T00:00:00.000Z",
      updatedAt: "2026-08-20T00:00:00.000Z",
      items: [],
      payments: [],
    };
    const fetchMock = mockFetchOnce(200, {
      data: { message: "Payment callback processed successfully.", order },
    });

    const result = await confirmPaymentCallback("o1", {
      status: "success",
      transactionId: "txn-1",
      paymentMethod: "card",
    });

    expect(result).toEqual(order);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/payments/callback");
    expect(JSON.parse(init.body as string)).toEqual({
      orderId: "o1",
      status: "success",
      transactionId: "txn-1",
      paymentMethod: "card",
    });
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer token-payment",
    );
  });

  it("throws with the backend error message when payment callback fails", async () => {
    mockFetchOnce(400, { error: "Invalid payment status" });

    await expect(
      confirmPaymentCallback("o1", {
        status: "success",
        transactionId: "txn-1",
        paymentMethod: "card",
      }),
    ).rejects.toThrow("Invalid payment status");
  });

  it("captures a PayPal order with bearer token", async () => {
    const order = {
      orderId: "o1",
      customerProfileId: "cp1",
      totalAmount: "200000.00",
      status: "completed",
      reason: null,
      createdAt: "2026-08-20T00:00:00.000Z",
      updatedAt: "2026-08-20T00:00:00.000Z",
      items: [],
      payments: [],
    };
    const fetchMock = mockFetchOnce(200, {
      data: { message: "PayPal payment captured successfully.", order },
    });

    const result = await capturePaypalOrder("o1");

    expect(result).toEqual(order);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/payments/paypal/capture");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ orderId: "o1" });
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer token-payment",
    );
  });
});
