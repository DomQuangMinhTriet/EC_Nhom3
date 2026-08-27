import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { AppError } from "../../shared/errors/AppError";
import { PaymentService } from "./payment.service";

const userId = "00000000-0000-4000-8000-000000000001";
const customerProfileId = "00000000-0000-4000-8000-000000000002";
const orderId = "00000000-0000-4000-8000-000000000003";
const createdAt = new Date("2026-01-01T00:00:00.000Z");

const orderRecord = {
  orderId,
  customerProfileId,
  totalAmount: "200000.00",
  status: "pending_payment" as const,
  paymentCode: null,
  reason: null,
  createdAt,
  updatedAt: createdAt,
  items: [],
  payments: [],
};

const createOrderService = (overrides = {}) => ({
  getOrderById: async () => orderRecord,
  updateOrderBySystem: async () => ({
    ...orderRecord,
    status: "completed" as const,
    wasNewlyCompleted: true,
  }),
  ...overrides,
});

const createNotificationRepository = (overrides = {}) => ({
  create: async (record: {
    customerProfileId: string;
    title: string;
    body: string;
  }) => ({
    notificationId: "notification-1",
    isRead: false,
    createdAt,
    ...record,
  }),
  ...overrides,
});

const createPaymentRepository = (overrides = {}) => ({
  setPaymentCodeForOrder: async (input: {
    orderId: string;
    customerProfileId: string;
    paymentCode: string;
  }) => ({ ...orderRecord, paymentCode: input.paymentCode }),
  findOrderByPaymentCode: async () => ({
    ...orderRecord,
    paymentCode: "ECV0000000000004000",
  }),
  ...overrides,
});

const withSepayEnv = async (callback: () => Promise<void>) => {
  const previous = {
    SEPAY_BANK_ACCOUNT: process.env.SEPAY_BANK_ACCOUNT,
    SEPAY_BANK_NAME: process.env.SEPAY_BANK_NAME,
    SEPAY_ACCOUNT_NAME: process.env.SEPAY_ACCOUNT_NAME,
    SEPAY_WEBHOOK_API_KEY: process.env.SEPAY_WEBHOOK_API_KEY,
  };

  process.env.SEPAY_BANK_ACCOUNT = "9704221234567890";
  process.env.SEPAY_BANK_NAME = "MBBank";
  process.env.SEPAY_ACCOUNT_NAME = "EC VOUCHER DEMO";
  process.env.SEPAY_WEBHOOK_API_KEY = "sepay-test-key";

  try {
    await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

const withPaypalEnv = async (callback: () => Promise<void>) => {
  const previous = {
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    PAYPAL_API_BASE: process.env.PAYPAL_API_BASE,
    APP_BASE_URL: process.env.APP_BASE_URL,
  };

  process.env.PAYPAL_CLIENT_ID = "paypal-test-client-id";
  process.env.PAYPAL_CLIENT_SECRET = "paypal-test-secret";
  process.env.PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";
  process.env.APP_BASE_URL = "https://ec-voucher-demo.example";

  try {
    await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

const withVnpayEnv = async (callback: () => Promise<void>) => {
  const previous = {
    VNPAY_TMN_CODE: process.env.VNPAY_TMN_CODE,
    VNPAY_HASH_SECRET: process.env.VNPAY_HASH_SECRET,
    VNPAY_PAYMENT_URL: process.env.VNPAY_PAYMENT_URL,
    APP_BASE_URL: process.env.APP_BASE_URL,
  };

  process.env.VNPAY_TMN_CODE = "VNPAYTEST";
  process.env.VNPAY_HASH_SECRET = "vnpay-test-hash-secret";
  process.env.VNPAY_PAYMENT_URL =
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  process.env.APP_BASE_URL = "https://ec-voucher-demo.example";

  try {
    await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

test("initiatePayment returns a mock payment URL for a pending order", async () => {
  let capturedUserId: string | undefined;
  let capturedOrderId: string | undefined;
  const service = new PaymentService(
    createOrderService({
      getOrderById: async (requestedUserId: string, requestedOrderId: string) => {
        capturedUserId = requestedUserId;
        capturedOrderId = requestedOrderId;
        return orderRecord;
      },
    }),
    createNotificationRepository(),
    () => "mock-txn-1",
  );

  const result = await service.initiatePayment(userId, {
    orderId,
    paymentMethod: "card",
  });

  assert.equal(capturedUserId, userId);
  assert.equal(capturedOrderId, orderId);
  assert.equal(result.transactionId, "mock-txn-1");
  assert.equal(result.amount, "200000.00");
  assert.match(result.paymentUrl, /transactionId=mock-txn-1/);
  assert.match(result.paymentUrl, /paymentMethod=card/);
});

test("initiatePayment rejects non-pending orders", async () => {
  const service = new PaymentService(
    createOrderService({
      getOrderById: async () => ({
        ...orderRecord,
        status: "completed" as const,
      }),
    }),
    createNotificationRepository(),
  );

  await assert.rejects(
    service.initiatePayment(userId, { orderId, paymentMethod: "card" }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "Only pending orders can initiate payment",
  );
});

test("initiatePayment returns SePay QR information for bank transfers", async () => {
  await withSepayEnv(async () => {
    let captured:
      | { orderId: string; customerProfileId: string; paymentCode: string }
      | undefined;
    const service = new PaymentService(
      createOrderService(),
      createNotificationRepository(),
      () => "mock-txn-should-not-be-used",
      createPaymentRepository({
        setPaymentCodeForOrder: async (input: {
          orderId: string;
          customerProfileId: string;
          paymentCode: string;
        }) => {
          captured = input;
          return { ...orderRecord, paymentCode: input.paymentCode };
        },
      }),
    );

    const result = await service.initiatePayment(userId, {
      orderId,
      paymentMethod: "bank_transfer",
    });

    assert.equal(captured?.orderId, orderId);
    assert.equal(captured?.customerProfileId, customerProfileId);
    assert.ok(result.paymentCode);
    assert.ok(result.qrUrl);
    assert.ok(result.bankAccount);
    assert.equal(result.transactionId, result.paymentCode);
    assert.match(result.paymentCode, /^ECV[0-9A-F]+$/);
    assert.equal(result.bankAccount.accountNumber, "9704221234567890");
    assert.equal(result.bankAccount.bank, "MBBank");
    assert.equal(result.bankAccount.accountName, "EC VOUCHER DEMO");
    assert.match(result.qrUrl, /amount=200000/);
    assert.match(result.qrUrl, new RegExp(`des=${result.paymentCode}`));
    assert.equal(result.paymentUrl, result.qrUrl);
  });
});

test("handleCallback completes the order and creates a notification on success", async () => {
  let capturedUpdate: unknown[] | undefined;
  const notifications: unknown[] = [];
  const service = new PaymentService(
    createOrderService({
      updateOrderBySystem: async (
        requestedOrderId: string,
        input: Record<string, unknown>,
      ) => {
        capturedUpdate = [requestedOrderId, input];
        return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
      },
    }),
    createNotificationRepository({
      create: async (record: unknown) => {
        notifications.push(record);
        return record;
      },
    }),
  );

  const result = await service.handleCallback({
    orderId,
    status: "success",
    transactionId: "txn-123",
    paymentMethod: "card",
  });

  assert.deepEqual(capturedUpdate, [
    orderId,
    {
      status: "completed",
      transactionId: "txn-123",
      paymentMethod: "card",
      amount: undefined,
      currency: undefined,
      reason: undefined,
    },
  ]);
  assert.ok(result.order);
  assert.equal(result.order.status, "completed");
  assert.equal(notifications.length, 1);
  assert.deepEqual(notifications[0], {
    customerProfileId,
    title: "Payment successful",
    body: `Order ${orderId} has been paid successfully. Voucher codes are ready.`,
  });
  // wasNewlyCompleted is internal-only (used above to decide whether to
  // notify) and must not leak into the public payment/order API response.
  assert.equal("wasNewlyCompleted" in result.order, false);
});

test("handleCallback does not duplicate notification for an already completed order", async () => {
  let createCalled = false;
  const service = new PaymentService(
    createOrderService({
      // wasNewlyCompleted: false simulates a retried/duplicate callback for
      // an order OrderRepository.updateOrder's own locked transaction has
      // already determined was completed before this call.
      updateOrderBySystem: async () => ({
        ...orderRecord,
        status: "completed" as const,
        wasNewlyCompleted: false,
      }),
    }),
    createNotificationRepository({
      create: async () => {
        createCalled = true;
        return null;
      },
    }),
  );

  await service.handleCallback({
    orderId,
    status: "success",
    transactionId: "txn-123",
    paymentMethod: "card",
  });

  assert.equal(createCalled, false);
});

test("handleCallback fails the order with a payment reason", async () => {
  let capturedUpdate: unknown[] | undefined;
  const service = new PaymentService(
    createOrderService({
      updateOrderBySystem: async (
        requestedOrderId: string,
        input: Record<string, unknown>,
      ) => {
        capturedUpdate = [requestedOrderId, input];
        return {
          ...orderRecord,
          status: "failed" as const,
          reason: "Gateway rejected transaction",
          wasNewlyCompleted: false,
        };
      },
    }),
    createNotificationRepository(),
  );

  const result = await service.handleCallback({
    orderId,
    status: "failed",
    transactionId: "txn-124",
    paymentMethod: "bank_transfer",
    reason: "Gateway rejected transaction",
  });

  assert.deepEqual(capturedUpdate, [
    orderId,
    {
      status: "failed",
      transactionId: "txn-124",
      paymentMethod: "bank_transfer",
      amount: undefined,
      currency: undefined,
      reason: "Gateway rejected transaction",
    },
  ]);
  assert.ok(result.order);
  assert.equal(result.order.status, "failed");
});

test("handleCallback refuses to self-complete a bank_transfer order (must go through the SePay webhook)", async () => {
  let updateCalled = false;
  const service = new PaymentService(
    createOrderService({
      updateOrderBySystem: async () => {
        updateCalled = true;
        return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
      },
    }),
    createNotificationRepository(),
  );

  await assert.rejects(
    service.handleCallback({
      orderId,
      status: "success",
      transactionId: "self-declared-txn",
      paymentMethod: "bank_transfer",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message ===
        "bank_transfer payments must be confirmed via the SePay webhook",
  );
  assert.equal(updateCalled, false);
});

test("handleCallback still allows declaring a bank_transfer attempt as failed", async () => {
  const service = new PaymentService(
    createOrderService({
      updateOrderBySystem: async () => ({
        ...orderRecord,
        status: "failed" as const,
        wasNewlyCompleted: false,
      }),
    }),
    createNotificationRepository(),
  );

  const result = await service.handleCallback({
    orderId,
    status: "failed",
    transactionId: "self-declared-txn",
    paymentMethod: "bank_transfer",
  });

  assert.equal(result.order.status, "failed");
});

test("handleCallback rejects invalid callback status", async () => {
  const service = new PaymentService(
    createOrderService(),
    createNotificationRepository(),
  );

  await assert.rejects(
    service.handleCallback({
      orderId,
      status: "pending",
      transactionId: "txn-125",
      paymentMethod: "card",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "Invalid payment status",
  );
});

test("handleSepayWebhook rejects invalid API key", async () => {
  await withSepayEnv(async () => {
    const service = new PaymentService(
      createOrderService(),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository(),
    );

    await assert.rejects(
      service.handleSepayWebhook({
        authorization: "Apikey wrong-key",
        payload: { transferType: "in" },
      }),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 401 &&
        error.message === "Invalid SePay webhook API key",
    );
  });
});

test("handleSepayWebhook ignores outgoing transfers", async () => {
  await withSepayEnv(async () => {
    let lookupCalled = false;
    const service = new PaymentService(
      createOrderService(),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => {
          lookupCalled = true;
          return orderRecord;
        },
      }),
    );

    const result = await service.handleSepayWebhook({
      authorization: "Apikey sepay-test-key",
      payload: { transferType: "out" },
    });

    assert.equal(lookupCalled, false);
    assert.deepEqual(result, {
      success: true,
      ignored: true,
      reason: "transfer_not_inbound",
    });
  });
});

test("handleSepayWebhook ignores unknown payment codes", async () => {
  await withSepayEnv(async () => {
    const service = new PaymentService(
      createOrderService(),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => null,
      }),
    );

    const result = await service.handleSepayWebhook({
      authorization: "Apikey sepay-test-key",
      payload: {
        id: 92704,
        transferType: "in",
        transferAmount: 200000,
        content: "Thanh toan ECV0000000000004000",
      },
    });

    assert.equal(result.ignored, true);
    assert.equal(result.reason, "unknown_payment_code");
  });
});

test("handleSepayWebhook does not complete an order with the wrong amount", async () => {
  await withSepayEnv(async () => {
    let updateCalled = false;
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async () => {
          updateCalled = true;
          return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
        },
      }),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository(),
    );

    const result = await service.handleSepayWebhook({
      authorization: "Apikey sepay-test-key",
      payload: {
        id: 92704,
        transferType: "in",
        transferAmount: 199000,
        content: "Thanh toan ECV0000000000004000",
      },
    });

    assert.equal(updateCalled, false);
    assert.equal(result.ignored, true);
    assert.equal(result.reason, "amount_mismatch");
  });
});

test("handleSepayWebhook finds the payment code even with no separator before it", async () => {
  await withSepayEnv(async () => {
    let capturedUpdate: unknown[] | undefined;
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async (
          requestedOrderId: string,
          input: Record<string, unknown>,
        ) => {
          capturedUpdate = [requestedOrderId, input];
          return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
        },
      }),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository(),
    );

    const result = await service.handleSepayWebhook({
      authorization: "Apikey sepay-test-key",
      payload: {
        id: 92704,
        transferType: "in",
        transferAmount: 200000,
        // No space/separator before the code, as some bank apps produce.
        content: "CHUYENTIENECV0000000000004000",
      },
    });

    assert.equal(result.ignored, false);
    assert.ok(capturedUpdate);
  });
});

test("handleSepayWebhook completes a matching inbound transaction", async () => {
  await withSepayEnv(async () => {
    let capturedUpdate: unknown[] | undefined;
    const notifications: unknown[] = [];
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async (
          requestedOrderId: string,
          input: Record<string, unknown>,
        ) => {
          capturedUpdate = [requestedOrderId, input];
          return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
        },
      }),
      createNotificationRepository({
        create: async (record: unknown) => {
          notifications.push(record);
          return record;
        },
      }),
      () => "mock-txn-1",
      createPaymentRepository(),
    );

    const result = await service.handleSepayWebhook({
      authorization: "Apikey sepay-test-key",
      payload: {
        id: 92704,
        gateway: "Vietcombank",
        transactionDate: "2026-08-27 14:02:37",
        accountNumber: "9704221234567890",
        code: null,
        content: "Thanh toan ECV0000000000004000",
        transferType: "in",
        transferAmount: 200000,
        referenceCode: "MBVCB.3278907687",
        description: "",
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.ignored, false);
    assert.deepEqual(capturedUpdate, [
      orderId,
      {
        status: "completed",
        transactionId: "sepay_92704",
        paymentMethod: "bank_transfer",
        amount: "200000",
        currency: "VND",
        reason: undefined,
      },
    ]);
    assert.equal(notifications.length, 1);
  });
});

// ---------------------------------------------------------------------------
// PayPal
// ---------------------------------------------------------------------------

const mockPaypalFetch = (t: import("node:test").TestContext, options: {
  createOrderStatus?: number;
  captureStatus?: number;
  captureBody?: unknown;
} = {}) => {
  t.mock.method(globalThis, "fetch", async (url: string | URL) => {
    const href = url.toString();

    if (href.endsWith("/v1/oauth2/token")) {
      return new Response(JSON.stringify({ access_token: "mock-access-token" }), {
        status: 200,
      });
    }

    if (href.endsWith("/v2/checkout/orders")) {
      return new Response(
        JSON.stringify({
          id: "PAYPAL-ORDER-1",
          links: [{ rel: "approve", href: "https://sandbox.paypal.com/approve/PAYPAL-ORDER-1" }],
        }),
        { status: options.createOrderStatus ?? 201 },
      );
    }

    if (href.includes("/capture")) {
      return new Response(
        JSON.stringify(
          options.captureBody ?? {
            status: "COMPLETED",
            purchase_units: [
              { payments: { captures: [{ id: "CAPTURE-1", amount: { value: "4.00" } }] } },
            ],
          },
        ),
        { status: options.captureStatus ?? 200 },
      );
    }

    throw new Error(`Unexpected fetch call in test: ${href}`);
  });
};

test("initiatePayment converts VND to USD and returns PayPal's approval link", async (t) => {
  await withPaypalEnv(async () => {
    mockPaypalFetch(t);
    let captured: { orderId: string; paymentCode: string } | undefined;
    const service = new PaymentService(
      createOrderService(),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        setPaymentCodeForOrder: async (input: {
          orderId: string;
          customerProfileId: string;
          paymentCode: string;
        }) => {
          captured = input;
          return { ...orderRecord, paymentCode: input.paymentCode };
        },
      }),
    );

    const result = await service.initiatePayment(userId, {
      orderId,
      paymentMethod: "paypal",
    });

    // orderRecord.totalAmount is "200000.00" VND; VND_PER_USD is 25000.
    assert.equal(result.amount, "8.00");
    assert.equal(result.currency, "USD");
    assert.equal(result.transactionId, "PAYPAL-ORDER-1");
    assert.equal(result.paymentUrl, "https://sandbox.paypal.com/approve/PAYPAL-ORDER-1");
    assert.equal(captured?.paymentCode, "PAYPAL-ORDER-1");
  });
});

test("initiatePayment throws if PayPal is not configured", async () => {
  const service = new PaymentService(createOrderService(), createNotificationRepository());

  await assert.rejects(
    service.initiatePayment(userId, { orderId, paymentMethod: "paypal" }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 500 &&
      error.message === "PayPal is not configured",
  );
});

test("capturePaypalPayment captures and completes the order", async (t) => {
  await withPaypalEnv(async () => {
    mockPaypalFetch(t);
    const notifications: unknown[] = [];
    const service = new PaymentService(
      createOrderService({
        getOrderById: async () => ({
          ...orderRecord,
          paymentCode: "PAYPAL-ORDER-1",
        }),
        updateOrderBySystem: async () => ({
          ...orderRecord,
          status: "completed" as const,
          wasNewlyCompleted: true,
        }),
      }),
      createNotificationRepository({
        create: async (record: unknown) => {
          notifications.push(record);
          return record;
        },
      }),
    );

    const result = await service.capturePaypalPayment(userId, orderId);

    assert.equal(result.order.status, "completed");
    assert.equal(notifications.length, 1);
    assert.equal("wasNewlyCompleted" in result.order, false);
  });
});

test("capturePaypalPayment is idempotent for an already-completed order (does not call PayPal again)", async (t) => {
  await withPaypalEnv(async () => {
    let fetchCalled = false;
    t.mock.method(globalThis, "fetch", async () => {
      fetchCalled = true;
      throw new Error("should not be called");
    });

    const service = new PaymentService(
      createOrderService({
        getOrderById: async () => ({
          ...orderRecord,
          status: "completed" as const,
          paymentCode: "PAYPAL-ORDER-1",
        }),
      }),
      createNotificationRepository(),
    );

    const result = await service.capturePaypalPayment(userId, orderId);

    assert.equal(result.message, "Order already completed.");
    assert.equal(fetchCalled, false);
  });
});

test("capturePaypalPayment rejects a failed order", async () => {
  const service = new PaymentService(
    createOrderService({
      getOrderById: async () => ({ ...orderRecord, status: "failed" as const }),
    }),
    createNotificationRepository(),
  );

  await assert.rejects(
    service.capturePaypalPayment(userId, orderId),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "Failed orders cannot be completed",
  );
});

// ---------------------------------------------------------------------------
// VNPay
// ---------------------------------------------------------------------------

const signVnpayQuery = (params: Record<string, string>, hashSecret: string) => {
  const sorted = Object.fromEntries(
    Object.entries(params).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  return createHmac("sha512", hashSecret)
    .update(new URLSearchParams(sorted).toString())
    .digest("hex");
};

test("initiatePayment builds a signed VNPay redirect URL", async () => {
  await withVnpayEnv(async () => {
    let captured: { orderId: string; paymentCode: string } | undefined;
    const service = new PaymentService(
      createOrderService(),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        setPaymentCodeForOrder: async (input: {
          orderId: string;
          customerProfileId: string;
          paymentCode: string;
        }) => {
          captured = input;
          return { ...orderRecord, paymentCode: input.paymentCode };
        },
      }),
    );

    const result = await service.initiatePayment(userId, {
      orderId,
      paymentMethod: "vnpay",
      ipAddr: "203.0.113.5",
    });

    const url = new URL(result.paymentUrl);
    assert.equal(url.origin + url.pathname, "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
    assert.equal(url.searchParams.get("vnp_Amount"), "20000000"); // 200000.00 VND * 100
    assert.equal(url.searchParams.get("vnp_TxnRef"), result.transactionId);
    assert.ok(url.searchParams.get("vnp_SecureHash"));
    assert.match(result.transactionId, /^VNP[0-9A-F]+$/);
    assert.equal(captured?.paymentCode, result.transactionId);
  });
});

test("handleVnpayIpn rejects an invalid signature", async () => {
  await withVnpayEnv(async () => {
    const service = new PaymentService(createOrderService(), createNotificationRepository());

    const result = await service.handleVnpayIpn({
      vnp_TxnRef: "VNP0000000000000003",
      vnp_Amount: "20000000",
      vnp_ResponseCode: "00",
      vnp_SecureHash: "not-a-real-signature",
    });

    assert.deepEqual(result, { RspCode: "97", Message: "Invalid signature" });
  });
});

test("handleVnpayIpn completes a matching order on responseCode 00", async () => {
  await withVnpayEnv(async () => {
    const hashSecret = process.env.VNPAY_HASH_SECRET!;
    const notifications: unknown[] = [];
    let capturedUpdate: unknown[] | undefined;
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async (requestedOrderId: string, input: Record<string, unknown>) => {
          capturedUpdate = [requestedOrderId, input];
          return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
        },
      }),
      createNotificationRepository({
        create: async (record: unknown) => {
          notifications.push(record);
          return record;
        },
      }),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => ({
          ...orderRecord,
          paymentCode: "VNP0000000000000003",
        }),
      }),
    );

    const params = {
      vnp_TxnRef: "VNP0000000000000003",
      vnp_Amount: "20000000",
      vnp_ResponseCode: "00",
      vnp_TransactionNo: "14000123",
    };
    const result = await service.handleVnpayIpn({
      ...params,
      vnp_SecureHash: signVnpayQuery(params, hashSecret),
    });

    assert.deepEqual(result, { RspCode: "00", Message: "Confirm Success" });
    assert.equal((capturedUpdate?.[1] as Record<string, unknown>).status, "completed");
    assert.equal((capturedUpdate?.[1] as Record<string, unknown>).amount, "200000");
    assert.equal(notifications.length, 1);
  });
});

test("handleVnpayIpn marks the order failed on a non-success responseCode", async () => {
  await withVnpayEnv(async () => {
    const hashSecret = process.env.VNPAY_HASH_SECRET!;
    let capturedUpdate: unknown[] | undefined;
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async (requestedOrderId: string, input: Record<string, unknown>) => {
          capturedUpdate = [requestedOrderId, input];
          return { ...orderRecord, status: "failed" as const, wasNewlyCompleted: false };
        },
      }),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => ({
          ...orderRecord,
          paymentCode: "VNP0000000000000003",
        }),
      }),
    );

    const params = {
      vnp_TxnRef: "VNP0000000000000003",
      vnp_Amount: "20000000",
      vnp_ResponseCode: "24", // VNPay's "customer cancelled" code
    };
    const result = await service.handleVnpayIpn({
      ...params,
      vnp_SecureHash: signVnpayQuery(params, hashSecret),
    });

    assert.deepEqual(result, { RspCode: "00", Message: "Confirm Success" });
    assert.equal((capturedUpdate?.[1] as Record<string, unknown>).status, "failed");
  });
});

test("handleVnpayIpn ignores an unknown vnp_TxnRef", async () => {
  await withVnpayEnv(async () => {
    const hashSecret = process.env.VNPAY_HASH_SECRET!;
    const service = new PaymentService(
      createOrderService(),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({ findOrderByPaymentCode: async () => null }),
    );

    const params = { vnp_TxnRef: "VNP-UNKNOWN", vnp_Amount: "20000000", vnp_ResponseCode: "00" };
    const result = await service.handleVnpayIpn({
      ...params,
      vnp_SecureHash: signVnpayQuery(params, hashSecret),
    });

    assert.deepEqual(result, { RspCode: "01", Message: "Order not found" });
  });
});

test("handleVnpayIpn rejects a mismatched amount", async () => {
  await withVnpayEnv(async () => {
    const hashSecret = process.env.VNPAY_HASH_SECRET!;
    const service = new PaymentService(
      createOrderService(),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => ({
          ...orderRecord,
          paymentCode: "VNP0000000000000003",
        }),
      }),
    );

    const params = {
      vnp_TxnRef: "VNP0000000000000003",
      vnp_Amount: "1", // orderRecord total is 200000.00 VND -> expects 20000000
      vnp_ResponseCode: "00",
    };
    const result = await service.handleVnpayIpn({
      ...params,
      vnp_SecureHash: signVnpayQuery(params, hashSecret),
    });

    assert.deepEqual(result, { RspCode: "04", Message: "Invalid amount" });
  });
});

test("handleVnpayIpn ignores a re-delivery for an already-completed order", async () => {
  await withVnpayEnv(async () => {
    const hashSecret = process.env.VNPAY_HASH_SECRET!;
    let updateCalled = false;
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async () => {
          updateCalled = true;
          return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
        },
      }),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => ({
          ...orderRecord,
          status: "completed" as const,
          paymentCode: "VNP0000000000000003",
        }),
      }),
    );

    const params = { vnp_TxnRef: "VNP0000000000000003", vnp_Amount: "20000000", vnp_ResponseCode: "00" };
    const result = await service.handleVnpayIpn({
      ...params,
      vnp_SecureHash: signVnpayQuery(params, hashSecret),
    });

    assert.deepEqual(result, { RspCode: "02", Message: "Order already confirmed" });
    assert.equal(updateCalled, false);
  });
});

test("handleVnpayReturn reports validity and success without mutating the order", async () => {
  await withVnpayEnv(async () => {
    const hashSecret = process.env.VNPAY_HASH_SECRET!;
    const service = new PaymentService(createOrderService(), createNotificationRepository());

    const params = { vnp_TxnRef: "VNP0000000000000003", vnp_ResponseCode: "00" };
    const validResult = service.handleVnpayReturn({
      ...params,
      vnp_SecureHash: signVnpayQuery(params, hashSecret),
    });
    assert.deepEqual(validResult, { valid: true, success: true });

    const tamperedResult = service.handleVnpayReturn({ ...params, vnp_SecureHash: "wrong" });
    assert.deepEqual(tamperedResult, { valid: false, success: false });
  });
});

test("handleSepayWebhook acknowledges (does not throw) a transfer for an already-failed order", async () => {
  await withSepayEnv(async () => {
    let updateCalled = false;
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async () => {
          updateCalled = true;
          return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
        },
      }),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => ({
          ...orderRecord,
          status: "failed" as const,
          paymentCode: "ECV0000000000004000",
        }),
      }),
    );

    const result = await service.handleSepayWebhook({
      authorization: "Apikey sepay-test-key",
      payload: {
        id: 92704,
        transferType: "in",
        transferAmount: 200000,
        content: "Thanh toan ECV0000000000004000",
      },
    });

    // Matches the sibling ignored-cases (transfer_not_inbound,
    // unknown_payment_code, amount_mismatch): ack with 200 instead of
    // throwing, so SePay's delivery system doesn't retry indefinitely.
    assert.deepEqual(result, {
      success: true,
      ignored: true,
      reason: "order_already_failed",
    });
    assert.equal(updateCalled, false);
  });
});

test("handleSepayWebhook acknowledges a second transfer for an already-completed order without inserting a duplicate payment", async () => {
  await withSepayEnv(async () => {
    let updateCalled = false;
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async () => {
          updateCalled = true;
          return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
        },
      }),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => ({
          ...orderRecord,
          status: "completed" as const,
          paymentCode: "ECV0000000000004000",
        }),
      }),
    );

    const result = await service.handleSepayWebhook({
      authorization: "Apikey sepay-test-key",
      payload: {
        id: 92705,
        transferType: "in",
        transferAmount: 200000,
        content: "Thanh toan lan 2 ECV0000000000004000",
      },
    });

    assert.deepEqual(result, {
      success: true,
      ignored: true,
      reason: "order_already_completed",
    });
    // Must not call back into updateOrderBySystem at all for an
    // already-completed order, or a second matching transfer would insert
    // an extra payment row for an order that's already fully paid.
    assert.equal(updateCalled, false);
  });
});
// ---------------------------------------------------------------------------
// Stripe
// ---------------------------------------------------------------------------

const withStripeEnv = async (callback: () => Promise<void>) => {
  const previous = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    APP_BASE_URL: process.env.APP_BASE_URL,
  };

  process.env.STRIPE_SECRET_KEY = "sk_test_stripe_secret_key";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_stripe_webhook_secret";
  process.env.APP_BASE_URL = "https://ec-voucher-demo.example";

  try {
    await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

const mockStripeFetch = (t: import("node:test").TestContext, options: {
  checkoutStatus?: number;
  checkoutBody?: unknown;
} = {}) => {
  t.mock.method(globalThis, "fetch", async (input: Request | string | URL) => {
    let href = "";
    if (typeof input === "string") {
      href = input;
    } else if (input instanceof URL) {
      href = input.toString();
    } else if (input && typeof input === "object" && "url" in input) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href = (input as any).url;
    }

    if (href.includes("/v1/checkout/sessions")) {
      return new Response(
        JSON.stringify(
          options.checkoutBody ?? {
            id: "cs_test_stripe123",
            url: "https://checkout.stripe.com/pay/cs_test_stripe123",
          },
        ),
        { status: options.checkoutStatus ?? 200 },
      );
    }

    throw new Error(`Unexpected fetch call in test: ${href}`);
  });
};

test("initiatePayment converts VND to USD and returns Stripe's checkout session url", async (t) => {
  await withStripeEnv(async () => {
    mockStripeFetch(t);
    let captured: { orderId: string; paymentCode: string } | undefined;
    const service = new PaymentService(
      createOrderService(),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        setPaymentCodeForOrder: async (input: {
          orderId: string;
          customerProfileId: string;
          paymentCode: string;
        }) => {
          captured = input;
          return { ...orderRecord, paymentCode: input.paymentCode };
        },
      }),
    );

    const result = await service.initiatePayment(userId, {
      orderId,
      paymentMethod: "stripe",
    });

    assert.equal(result.amount, "8.00");
    assert.equal(result.currency, "USD");
    assert.equal(result.transactionId, "cs_test_stripe123");
    assert.equal(result.paymentUrl, "https://checkout.stripe.com/pay/cs_test_stripe123");
    assert.equal(captured?.paymentCode, "cs_test_stripe123");
  });
});

test("initiatePayment throws if Stripe is not configured", async () => {
  const previous = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  const service = new PaymentService(createOrderService(), createNotificationRepository());

  try {
    await assert.rejects(
      service.initiatePayment(userId, { orderId, paymentMethod: "stripe" }),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 500 &&
        error.message === "Stripe is not configured",
    );
  } finally {
    process.env.STRIPE_SECRET_KEY = previous;
  }
});

test("handleStripeWebhook completes the order on paid session", async () => {
  await withStripeEnv(async () => {
    let capturedUpdate: unknown[] | undefined;
    const notifications: unknown[] = [];
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async (
          requestedOrderId: string,
          input: Record<string, unknown>,
        ) => {
          capturedUpdate = [requestedOrderId, input];
          return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
        },
      }),
      createNotificationRepository({
        create: async (record: unknown) => {
          notifications.push(record);
          return record;
        },
      }),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => ({
          ...orderRecord,
          paymentCode: "cs_test_stripe123",
        }),
      }),
    );

    const payload = Buffer.from(JSON.stringify({
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_stripe123",
          payment_status: "paid",
          payment_intent: "pi_test_123",
          amount_total: 800,
        },
      },
    }));

    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload.toString()}`;
    const signature = createHmac("sha256", "whsec_stripe_webhook_secret").update(signedPayload).digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    const result = await service.handleStripeWebhook(header, payload);

    assert.equal(result.success, true);
    assert.equal(result.ignored, false);
    assert.deepEqual(capturedUpdate, [
      orderId,
      {
        status: "completed",
        transactionId: "stripe_pi_test_123",
        paymentMethod: "stripe",
        amount: "8",
        currency: "USD",
        reason: undefined,
      },
    ]);
    assert.equal(notifications.length, 1);
  });
});

test("handleStripeWebhook rejects invalid signature", async () => {
  await withStripeEnv(async () => {
    const service = new PaymentService(
      createOrderService(),
      createNotificationRepository(),
    );

    const payload = Buffer.from(JSON.stringify({}));
    const header = `t=123,v1=invalid_signature`;

    await assert.rejects(
      service.handleStripeWebhook(header, payload),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 401 &&
        error.message === "Invalid Stripe signature",
    );
  });
});

test("handleStripeWebhook idempotency: ignores an already completed order", async () => {
  await withStripeEnv(async () => {
    let updateCalled = false;
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async () => {
          updateCalled = true;
          return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
        },
      }),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => ({
          ...orderRecord,
          status: "completed" as const,
          paymentCode: "cs_test_stripe123",
        }),
      }),
    );

    const payload = Buffer.from(JSON.stringify({
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_stripe123",
          payment_status: "paid",
          payment_intent: "pi_test_123",
          amount_total: 800,
        },
      },
    }));

    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload.toString()}`;
    const signature = createHmac("sha256", "whsec_stripe_webhook_secret").update(signedPayload).digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    const result = await service.handleStripeWebhook(header, payload);

    assert.equal(result.ignored, true);
    assert.equal(result.reason, "order_already_completed");
    assert.equal(updateCalled, false);
  });
});

test("handleStripeWebhook idempotency: ignores an already failed order", async () => {
  await withStripeEnv(async () => {
    let updateCalled = false;
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async () => {
          updateCalled = true;
          return { ...orderRecord, status: "completed" as const, wasNewlyCompleted: true };
        },
      }),
      createNotificationRepository(),
      () => "mock-txn-1",
      createPaymentRepository({
        findOrderByPaymentCode: async () => ({
          ...orderRecord,
          status: "failed" as const,
          paymentCode: "cs_test_stripe123",
        }),
      }),
    );

    const payload = Buffer.from(JSON.stringify({
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_stripe123",
          payment_status: "paid",
          payment_intent: "pi_test_123",
          amount_total: 800,
        },
      },
    }));

    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload.toString()}`;
    const signature = createHmac("sha256", "whsec_stripe_webhook_secret").update(signedPayload).digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    const result = await service.handleStripeWebhook(header, payload);

    assert.equal(result.ignored, true);
    assert.equal(result.reason, "order_already_failed");
    assert.equal(updateCalled, false);
  });
});
