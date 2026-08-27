import assert from "node:assert/strict";
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
  getOrderByIdForAdmin: async () => ({
    ...orderRecord,
    customer: { fullName: "Nguyen Van A", email: "customer@example.com" },
  }),
  updateOrderBySystem: async () => ({
    ...orderRecord,
    status: "completed" as const,
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
        return { ...orderRecord, status: "completed" as const };
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
});

test("handleCallback does not duplicate notification for an already completed order", async () => {
  let createCalled = false;
  const service = new PaymentService(
    createOrderService({
      getOrderByIdForAdmin: async () => ({
        ...orderRecord,
        status: "completed" as const,
        customer: { fullName: "Nguyen Van A", email: "customer@example.com" },
      }),
      updateOrderBySystem: async () => ({
        ...orderRecord,
        status: "completed" as const,
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
          return { ...orderRecord, status: "completed" as const };
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

test("handleSepayWebhook completes a matching inbound transaction", async () => {
  await withSepayEnv(async () => {
    let capturedUpdate: unknown[] | undefined;
    const service = new PaymentService(
      createOrderService({
        updateOrderBySystem: async (
          requestedOrderId: string,
          input: Record<string, unknown>,
        ) => {
          capturedUpdate = [requestedOrderId, input];
          return { ...orderRecord, status: "completed" as const };
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
  });
});
