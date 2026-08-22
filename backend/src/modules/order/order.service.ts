import { AppError } from "../../shared/errors/AppError";
import {
  type CreateOrderItemRecord,
  type CreatePaymentRecord,
  type OrderStatus,
  type PaymentMethod,
  OrderRepository,
} from "./order.repository";

type UpdateOrderInput = {
  status?: string;
  reason?: string | null;
  transactionId?: string;
  paymentMethod?: string;
  amount?: string | number;
  currency?: string;
};

const orderStatuses = ["pending_payment", "completed", "failed"] as const;
const paymentMethods = ["bank_transfer", "card"] as const;

const isOrderStatus = (value: string): value is OrderStatus =>
  orderStatuses.includes(value as OrderStatus);

const isPaymentMethod = (value: string): value is PaymentMethod =>
  paymentMethods.includes(value as PaymentMethod);

const toMoney = (amount: number) => Math.max(0, amount).toFixed(2);

const parseMoney = (value: string | number, field: string) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(`${field} must be a non-negative number`, 400);
  }

  return toMoney(parsed);
};

export class OrderService {
  constructor(private readonly orderRepository = new OrderRepository()) {}

  private async getCustomerProfileId(userId: string): Promise<string> {
    const customerProfileId =
      await this.orderRepository.getCustomerProfileIdByUserId(userId);

    if (!customerProfileId) {
      throw new AppError("Customer profile not found", 404);
    }

    return customerProfileId;
  }

  async createOrder(userId: string, cartId: string) {
    const customerProfileId = await this.getCustomerProfileId(userId);
    const cart = await this.orderRepository.findCartByIdAndCustomer(
      cartId,
      customerProfileId,
    );

    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    const existingOrder = await this.orderRepository.findOrderByCartId(cartId);
    if (existingOrder) {
      throw new AppError("Order already exists for this cart", 409);
    }

    const cartItems =
      await this.orderRepository.getCartItemsWithProducts(cartId);
    if (cartItems.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    let subtotalAmount = 0;
    const orderItems: CreateOrderItemRecord[] = [];

    for (const item of cartItems) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new AppError("Cart item quantity is invalid", 400);
      }

      if (item.voucherProduct.status !== "active") {
        throw new AppError("Voucher product is not active", 400);
      }

      const availableStock = await this.orderRepository.getAvailableStock(
        item.voucherProductId,
      );

      if (item.quantity > availableStock) {
        throw new AppError(
          `Not enough stock available. Available: ${availableStock}`,
          400,
        );
      }

      const unitPrice = Number(item.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new AppError("Cart item unitPrice is invalid", 400);
      }

      subtotalAmount += unitPrice * item.quantity;

      orderItems.push({
        voucherProductId: item.voucherProductId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }

    const createdOrder = await this.orderRepository.createOrderFromCart({
      cartId,
      customerProfileId,
      subtotalAmount: toMoney(subtotalAmount),
      discountAmount: "0.00",
      totalAmount: toMoney(subtotalAmount),
      items: orderItems,
    });

    if (!createdOrder) {
      throw new AppError("Could not create order", 500);
    }

    return await this.orderRepository.getOrderDetail(
      createdOrder.orderId,
      customerProfileId,
    );
  }

  async updateOrder(userId: string, orderId: string, input: UpdateOrderInput) {
    const customerProfileId = await this.getCustomerProfileId(userId);
    const existingOrder = await this.orderRepository.findOrderByIdAndCustomer(
      orderId,
      customerProfileId,
    );

    if (!existingOrder) {
      throw new AppError("Order not found", 404);
    }

    return await this.updateExistingOrder(existingOrder, input);
  }

  async updateOrderBySystem(orderId: string, input: UpdateOrderInput) {
    const existingOrder = await this.orderRepository.findOrderById(orderId);

    if (!existingOrder) {
      throw new AppError("Order not found", 404);
    }

    return await this.updateExistingOrder(existingOrder, input);
  }

  private async updateExistingOrder(
    existingOrder: NonNullable<
      Awaited<ReturnType<OrderRepository["findOrderById"]>>
    >,
    input: UpdateOrderInput,
  ) {
    const hasPaymentFields =
      input.transactionId !== undefined ||
      input.paymentMethod !== undefined ||
      input.amount !== undefined ||
      input.currency !== undefined;

    if (
      input.status === undefined &&
      input.reason === undefined &&
      !hasPaymentFields
    ) {
      throw new AppError(
        "status, reason or payment information is required",
        400,
      );
    }

    if (
      input.reason !== undefined &&
      input.reason !== null &&
      typeof input.reason !== "string"
    ) {
      throw new AppError("reason must be a string", 400);
    }

    const nextStatus = input.status ?? existingOrder.status;
    if (typeof nextStatus !== "string") {
      throw new AppError("Invalid order status", 400);
    }

    if (!isOrderStatus(nextStatus)) {
      throw new AppError("Invalid order status", 400);
    }

    if (existingOrder.status === "completed" && nextStatus !== "completed") {
      throw new AppError(
        "Completed orders cannot be changed to another status",
        400,
      );
    }

    if (existingOrder.status === "failed" && nextStatus === "completed") {
      throw new AppError("Failed orders cannot be completed", 400);
    }

    const payment = this.buildPayment(
      input,
      nextStatus,
      existingOrder.totalAmount,
    );

    const updatedOrder = await this.orderRepository.updateOrder({
      orderId: existingOrder.orderId,
      customerProfileId: existingOrder.customerProfileId,
      status: nextStatus,
      reason: input.reason !== undefined ? input.reason : existingOrder.reason,
      payment,
    });

    if (!updatedOrder) {
      throw new AppError("Order not found", 404);
    }

    return await this.orderRepository.getOrderDetail(
      existingOrder.orderId,
      existingOrder.customerProfileId,
    );
  }

  private buildPayment(
    input: UpdateOrderInput,
    status: OrderStatus,
    defaultAmount: string,
  ): CreatePaymentRecord | undefined {
    const hasPaymentFields =
      input.transactionId !== undefined ||
      input.paymentMethod !== undefined ||
      input.amount !== undefined ||
      input.currency !== undefined;

    if (!hasPaymentFields) {
      return undefined;
    }

    if (status === "pending_payment") {
      throw new AppError(
        "Payment information can only be recorded for completed or failed orders",
        400,
      );
    }

    if (
      typeof input.transactionId !== "string" ||
      typeof input.paymentMethod !== "string" ||
      !input.transactionId ||
      !input.paymentMethod
    ) {
      throw new AppError("transactionId and paymentMethod are required", 400);
    }

    if (!isPaymentMethod(input.paymentMethod)) {
      throw new AppError("Invalid paymentMethod", 400);
    }

    if (input.currency !== undefined && typeof input.currency !== "string") {
      throw new AppError("currency must be a string", 400);
    }

    return {
      transactionId: input.transactionId,
      paymentMethod: input.paymentMethod,
      amount:
        input.amount === undefined
          ? defaultAmount
          : parseMoney(input.amount, "amount"),
      currency: input.currency ?? "VND",
      status: status === "completed" ? "success" : "failed",
      reason: input.reason,
    };
  }
}
