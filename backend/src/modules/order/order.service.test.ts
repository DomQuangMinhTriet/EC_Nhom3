import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../shared/errors/AppError";
import {
  DuplicateTransactionError,
  type CreateOrderRecord,
  type OrderRepository,
  StockReservationError,
} from "./order.repository";
import { OrderService } from "./order.service";

const userId = "00000000-0000-4000-8000-000000000001";
const customerProfileId = "00000000-0000-4000-8000-000000000002";
const cartId = "00000000-0000-4000-8000-000000000003";
const orderId = "00000000-0000-4000-8000-000000000004";
const voucherProductId = "00000000-0000-4000-8000-000000000005";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

const orderRecord = {
  orderId,
  customerProfileId,
  totalAmount: "200.00",
  status: "pending_payment" as const,
  paymentCode: null,
  reason: null,
  createdAt,
  updatedAt: createdAt,
};

const createRepository = (overrides: Partial<OrderRepository> = {}) =>
  ({
    getCustomerProfileIdByUserId: async () => customerProfileId,
    findCartByIdAndCustomer: async () => ({
      cartId,
      customerProfileId,
      createdAt,
      updatedAt: createdAt,
    }),
    getCartItemsWithProducts: async () => [
      {
        cartItemId: "00000000-0000-4000-8000-000000000006",
        voucherProductId,
        quantity: 2,
        unitPrice: "100.00",
        voucherProduct: {
          voucherProductId,
          title: "Voucher",
          originalPrice: "100.00",
          discountType: "percentage" as const,
          discountValue: "10.00",
          validDurationDays: 30,
          endDate: new Date("2026-12-31T00:00:00.000Z"),
          status: "active" as const,
        },
      },
    ],
    getAvailableStock: async () => 2,
    createOrderFromCart: async () => orderRecord,
    findOrderByIdAndCustomer: async () => orderRecord,
    findOrderById: async () => orderRecord,
    getOrderDetail: async () => ({ ...orderRecord, items: [], payments: [] }),
    getOrderDetailForAdmin: async () => ({
      ...orderRecord,
      customer: { fullName: "Nguyen Van A", email: "customer@example.com" },
      items: [],
      payments: [],
    }),
    updateOrder: async () => orderRecord,
    findOrdersByCustomer: async () => ({
      orders: [{ ...orderRecord, items: [], payments: [] }],
      total: 1,
    }),
    findOrdersForAdmin: async () => ({
      orders: [{ ...orderRecord, items: [], payments: [] }],
      total: 1,
    }),
    ...overrides,
  }) as unknown as OrderRepository;

test("createOrder creates a pending order preserving cart item quantity", async () => {
  let captured: CreateOrderRecord | undefined;
  const service = new OrderService(
    createRepository({
      createOrderFromCart: async (input) => {
        captured = input;
        return orderRecord;
      },
    }),
  );

  await service.createOrder(userId, cartId);

  assert.deepEqual(captured, {
    cartId,
    customerProfileId,
    totalAmount: "200.00",
    items: [{ voucherProductId, quantity: 2, unitPrice: "100.00" }],
  });
});

test("createOrder rejects an empty cart", async () => {
  const service = new OrderService(
    createRepository({
      getCartItemsWithProducts: async () => [],
    }),
  );

  await assert.rejects(
    service.createOrder(userId, cartId),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "Cart is empty",
  );
});

test("createOrder returns 400 if locked stock is no longer enough", async () => {
  const service = new OrderService(
    createRepository({
      createOrderFromCart: async () => {
        throw new StockReservationError(0);
      },
    }),
  );

  await assert.rejects(
    service.createOrder(userId, cartId),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "Not enough stock available. Available: 0",
  );
});

test("updateOrder completes a pending order and records successful payment details", async () => {
  let captured: Parameters<OrderRepository["updateOrder"]>[0] | undefined;
  const service = new OrderService(
    createRepository({
      updateOrder: async (input) => {
        captured = input;
        return { ...orderRecord, status: "completed" };
      },
    }),
  );

  await service.updateOrder(userId, orderId, {
    status: "completed",
    transactionId: "txn-123",
    paymentMethod: "card",
  });

  assert.deepEqual(captured, {
    orderId,
    customerProfileId,
    status: "completed",
    reason: null,
    payment: {
      transactionId: "txn-123",
      paymentMethod: "card",
      amount: "200.00",
      currency: "VND",
      status: "success",
      reason: undefined,
    },
  });
});

test("updateOrderBySystem completes a pending order without a customer token", async () => {
  let captured: Parameters<OrderRepository["updateOrder"]>[0] | undefined;
  const service = new OrderService(
    createRepository({
      updateOrder: async (input) => {
        captured = input;
        return { ...orderRecord, status: "completed" };
      },
    }),
  );

  await service.updateOrderBySystem(orderId, {
    status: "completed",
    transactionId: "txn-system-123",
    paymentMethod: "bank_transfer",
  });

  assert.deepEqual(captured, {
    orderId,
    customerProfileId,
    status: "completed",
    reason: null,
    payment: {
      transactionId: "txn-system-123",
      paymentMethod: "bank_transfer",
      amount: "200.00",
      currency: "VND",
      status: "success",
      reason: undefined,
    },
  });
});

test("updateOrderBySystem returns 409 if transactionId belongs to another order", async () => {
  const service = new OrderService(
    createRepository({
      updateOrder: async () => {
        throw new DuplicateTransactionError();
      },
    }),
  );

  await assert.rejects(
    service.updateOrderBySystem(orderId, {
      status: "completed",
      transactionId: "txn-system-123",
      paymentMethod: "bank_transfer",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 409 &&
      error.message === "transactionId already exists for another order",
  );
});

test("cancelOrder changes a customer order to failed", async () => {
  let captured: Parameters<OrderRepository["updateOrder"]>[0] | undefined;
  const service = new OrderService(
    createRepository({
      updateOrder: async (input) => {
        captured = input;
        return { ...orderRecord, status: "failed" };
      },
    }),
  );

  await service.cancelOrder(userId, orderId, "Changed my mind");

  assert.deepEqual(captured, {
    orderId,
    customerProfileId,
    status: "failed",
    reason: "Changed my mind",
    payment: undefined,
  });
});

test("getMyOrders returns the customer's paginated orders", async () => {
  let captured: { page: number; limit: number; status?: string } | undefined;
  const service = new OrderService(
    createRepository({
      findOrdersByCustomer: async (_customerProfileId, params) => {
        captured = params;
        return { orders: [{ ...orderRecord, items: [], payments: [] }], total: 1 };
      },
    }),
  );

  const result = await service.getMyOrders(userId, { page: 1, limit: 20, status: "completed" });

  assert.deepEqual(captured, { page: 1, limit: 20, status: "completed" });
  assert.equal(result.data.length, 1);
  assert.deepEqual(result.pagination, { page: 1, limit: 20, total: 1, totalPages: 1 });
});

test("getMyOrders rejects an invalid status filter", async () => {
  const service = new OrderService(createRepository());

  await assert.rejects(
    service.getMyOrders(userId, { page: 1, limit: 20, status: "not-a-status" }),
    (error: unknown) => error instanceof AppError && error.statusCode === 400,
  );
});

test("getOrderById returns the order detail for its owner", async () => {
  const service = new OrderService(
    createRepository({
      getOrderDetail: async () => ({ ...orderRecord, items: [], payments: [] }),
    }),
  );

  const result = await service.getOrderById(userId, orderId);

  assert.equal(result.orderId, orderId);
});

test("getOrderById throws 404 when the order does not belong to the customer", async () => {
  const service = new OrderService(
    createRepository({
      getOrderDetail: async () => null,
    }),
  );

  await assert.rejects(
    service.getOrderById(userId, orderId),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "Order not found",
  );
});

test("getOrdersForAdmin returns paginated orders across all customers", async () => {
  let captured:
    | { page: number; limit: number; status?: string; customerProfileId?: string }
    | undefined;
  const service = new OrderService(
    createRepository({
      findOrdersForAdmin: async (params) => {
        captured = params;
        return {
          orders: [
            {
              ...orderRecord,
              items: [],
              payments: [],
              customer: { fullName: "Nguyen Van A", email: "customer@example.com" },
            },
          ],
          total: 1,
        };
      },
    }),
  );

  const result = await service.getOrdersForAdmin({
    page: 1,
    limit: 20,
    status: "completed",
    customerProfileId,
  });

  assert.equal(captured?.status, "completed");
  assert.equal(captured?.customerProfileId, customerProfileId);
  assert.deepEqual(result.pagination, { page: 1, limit: 20, total: 1, totalPages: 1 });
});

test("getOrderByIdForAdmin returns any order detail with customer info", async () => {
  let capturedOrderId: string | undefined;
  const service = new OrderService(
    createRepository({
      getCustomerProfileIdByUserId: async () => {
        throw new Error("customer lookup should not be required for admin detail");
      },
      getOrderDetailForAdmin: async (requestedOrderId) => {
        capturedOrderId = requestedOrderId;
        return {
          ...orderRecord,
          customer: { fullName: "Nguyen Van A", email: "customer@example.com" },
          items: [],
          payments: [],
        };
      },
    }),
  );

  const result = await service.getOrderByIdForAdmin(orderId);

  assert.equal(capturedOrderId, orderId);
  assert.equal(result.orderId, orderId);
  assert.deepEqual(result.customer, {
    fullName: "Nguyen Van A",
    email: "customer@example.com",
  });
});

test("getOrderByIdForAdmin throws 404 when order does not exist", async () => {
  const service = new OrderService(
    createRepository({
      getOrderDetailForAdmin: async () => null,
    }),
  );

  await assert.rejects(
    service.getOrderByIdForAdmin(orderId),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "Order not found",
  );
});

test("updateOrder does not allow failed orders to be completed", async () => {
  const service = new OrderService(
    createRepository({
      findOrderByIdAndCustomer: async () => ({
        ...orderRecord,
        status: "failed",
      }),
    }),
  );

  await assert.rejects(
    service.updateOrder(userId, orderId, { status: "completed" }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "Failed orders cannot be completed",
  );
});
