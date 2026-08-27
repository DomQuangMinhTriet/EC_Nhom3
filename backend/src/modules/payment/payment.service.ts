import { randomUUID } from "node:crypto";
import { AppError } from "../../shared/errors/AppError";
import { NotificationRepository } from "../notification/notification.repository";
import type { PaymentMethod } from "../order/order.repository";
import { OrderService } from "../order/order.service";
import { PaymentRepository } from "./payment.repository";

type InitiatePaymentInput = {
  orderId: string;
  paymentMethod: string;
};

type PaymentCallbackInput = {
  orderId: string;
  status: string;
  transactionId: string;
  paymentMethod: string;
  amount?: string | number;
  currency?: string;
  reason?: string | null;
};

type PaymentCallbackStatus = "success" | "failed";

type SepayWebhookInput = {
  authorization?: string | null;
  payload: unknown;
};

type OrderWorkflow = Pick<
  OrderService,
  "getOrderById" | "getOrderByIdForAdmin" | "updateOrderBySystem"
>;

type NotificationWriter = Pick<NotificationRepository, "create">;

type SepayPaymentStore = Pick<
  PaymentRepository,
  "setPaymentCodeForOrder" | "findOrderByPaymentCode"
>;

const paymentMethods = ["bank_transfer", "card"] as const;
const callbackStatuses = ["success", "failed"] as const;

const isPaymentMethod = (value: string): value is PaymentMethod =>
  paymentMethods.includes(value as PaymentMethod);

const isCallbackStatus = (value: string): value is PaymentCallbackStatus =>
  callbackStatuses.includes(value as PaymentCallbackStatus);

const parsePaymentMethod = (value: string) => {
  if (!isPaymentMethod(value)) {
    throw new AppError("Invalid paymentMethod", 400);
  }

  return value;
};

const parseCallbackStatus = (value: string) => {
  if (!isCallbackStatus(value)) {
    throw new AppError("Invalid payment status", 400);
  }

  return value;
};

const normalizeRequiredString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`${field} is required`, 400);
  }

  return value.trim();
};

const toVndInteger = (amount: string | number) => {
  const parsed = Number(amount);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError("amount must be a non-negative number", 400);
  }

  return Math.round(parsed);
};

const buildSepayPaymentCode = (orderId: string) =>
  `ECV${orderId.replaceAll("-", "").slice(0, 16).toUpperCase()}`;

const extractSepayPaymentCode = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value !== "string") continue;

    const matched = value.toUpperCase().match(/\bECV[A-Z0-9]{6,32}\b/);
    if (matched) {
      return matched[0];
    }
  }

  return null;
};

const getSepayBankConfig = () => {
  const bankAccount =
    process.env.SEPAY_BANK_ACCOUNT ??
    (process.env.NODE_ENV === "production" ? undefined : "0123456789");
  const bankName =
    process.env.SEPAY_BANK_NAME ??
    (process.env.NODE_ENV === "production" ? undefined : "MBBank");
  const accountName =
    process.env.SEPAY_ACCOUNT_NAME ??
    (process.env.NODE_ENV === "production" ? undefined : "EC VOUCHER DEMO");

  if (!bankAccount || !bankName || !accountName) {
    throw new AppError("SePay bank configuration is missing", 500);
  }

  return { bankAccount, bankName, accountName };
};

const buildSepayQrUrl = ({
  amount,
  paymentCode,
}: {
  amount: string;
  paymentCode: string;
}) => {
  const { bankAccount, bankName } = getSepayBankConfig();
  const url = new URL("https://vietqr.app/img");

  url.searchParams.set("acc", bankAccount);
  url.searchParams.set("bank", bankName);
  url.searchParams.set("amount", String(toVndInteger(amount)));
  url.searchParams.set("des", paymentCode);

  return url.toString();
};

const isSepayAuthorized = (authorization?: string | null) => {
  const apiKey = process.env.SEPAY_WEBHOOK_API_KEY;

  if (!apiKey) {
    throw new AppError("SEPAY_WEBHOOK_API_KEY is not configured", 500);
  }

  return authorization === `Apikey ${apiKey}`;
};

const getObjectField = (input: Record<string, unknown>, field: string) =>
  input[field];

const normalizeSepayPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Invalid SePay webhook payload", 400);
  }

  const record = payload as Record<string, unknown>;
  const transferType = getObjectField(record, "transferType");
  const transferAmount = getObjectField(record, "transferAmount");
  const id = getObjectField(record, "id");
  const referenceCode = getObjectField(record, "referenceCode");
  const code = getObjectField(record, "code");
  const content = getObjectField(record, "content");
  const description = getObjectField(record, "description");

  if (typeof transferType !== "string") {
    throw new AppError("transferType is required", 400);
  }

  if (transferType !== "in") {
    return { transferType };
  }

  const amount = Number(transferAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError("transferAmount must be a non-negative number", 400);
  }

  const transactionId =
    id !== undefined && id !== null && String(id).trim()
      ? `sepay_${String(id).trim()}`
      : typeof referenceCode === "string" && referenceCode.trim()
        ? `sepay_${referenceCode.trim()}`
        : null;

  if (!transactionId) {
    throw new AppError("SePay transaction id is required", 400);
  }

  return {
    transferType,
    transferAmount: Math.round(amount),
    transactionId,
    paymentCode: extractSepayPaymentCode(code, content, description),
  };
};

const buildMockPaymentUrl = ({
  orderId,
  transactionId,
  amount,
  currency,
  paymentMethod,
}: {
  orderId: string;
  transactionId: string;
  amount: string;
  currency: string;
  paymentMethod: PaymentMethod;
}) => {
  const baseUrl =
    process.env.MOCK_PAYMENT_GATEWAY_URL ??
    "https://mock-payment.local/checkout";
  const url = new URL(baseUrl);

  url.searchParams.set("orderId", orderId);
  url.searchParams.set("transactionId", transactionId);
  url.searchParams.set("amount", amount);
  url.searchParams.set("currency", currency);
  url.searchParams.set("paymentMethod", paymentMethod);

  return url.toString();
};

export class PaymentService {
  constructor(
    private readonly orderService: OrderWorkflow = new OrderService(),
    private readonly notificationRepository: NotificationWriter =
      new NotificationRepository(),
    private readonly transactionIdFactory = () => `mock_${randomUUID()}`,
    private readonly paymentRepository: SepayPaymentStore =
      new PaymentRepository(),
  ) {}

  async initiatePayment(userId: string, input: InitiatePaymentInput) {
    const paymentMethod = parsePaymentMethod(input.paymentMethod);
    const order = await this.orderService.getOrderById(userId, input.orderId);

    if (order.status !== "pending_payment") {
      throw new AppError("Only pending orders can initiate payment", 400);
    }

    const currency = "VND";

    if (paymentMethod === "bank_transfer") {
      const paymentCode = buildSepayPaymentCode(order.orderId);
      const updatedOrder =
        await this.paymentRepository.setPaymentCodeForOrder({
          orderId: order.orderId,
          customerProfileId: order.customerProfileId,
          paymentCode,
        });

      if (!updatedOrder) {
        throw new AppError("Order not found", 404);
      }

      const qrUrl = buildSepayQrUrl({
        amount: order.totalAmount,
        paymentCode,
      });
      const { bankAccount, bankName, accountName } = getSepayBankConfig();

      return {
        orderId: order.orderId,
        transactionId: paymentCode,
        paymentMethod,
        amount: order.totalAmount,
        currency,
        paymentCode,
        qrUrl,
        paymentUrl: qrUrl,
        bankAccount: {
          bank: bankName,
          accountNumber: bankAccount,
          accountName,
        },
      };
    }

    const transactionId = this.transactionIdFactory();

    return {
      orderId: order.orderId,
      transactionId,
      paymentMethod,
      amount: order.totalAmount,
      currency,
      paymentUrl: buildMockPaymentUrl({
        orderId: order.orderId,
        transactionId,
        amount: order.totalAmount,
        currency,
        paymentMethod,
      }),
    };
  }

  async handleCallback(input: PaymentCallbackInput) {
    const transactionId = normalizeRequiredString(
      input.transactionId,
      "transactionId",
    );
    const paymentMethod = parsePaymentMethod(input.paymentMethod);
    const callbackStatus = parseCallbackStatus(input.status);

    const reason =
      callbackStatus === "failed"
        ? input.reason ?? "Payment failed"
        : input.reason;

    const order = await this.processPaymentResult({
      orderId: input.orderId,
      status: callbackStatus === "success" ? "completed" : "failed",
      transactionId,
      paymentMethod,
      amount: input.amount,
      currency: input.currency,
      reason,
    });

    return {
      message:
        callbackStatus === "success"
          ? "Payment callback processed successfully."
          : "Payment failure callback processed successfully.",
      order,
    };
  }

  async handleSepayWebhook({ authorization, payload }: SepayWebhookInput) {
    if (!isSepayAuthorized(authorization)) {
      throw new AppError("Invalid SePay webhook API key", 401);
    }

    const sepayPayload = normalizeSepayPayload(payload);

    if (sepayPayload.transferType !== "in") {
      return {
        success: true,
        ignored: true,
        reason: "transfer_not_inbound",
      };
    }

    if (!sepayPayload.paymentCode) {
      return {
        success: true,
        ignored: true,
        reason: "payment_code_not_found",
      };
    }

    const order = await this.paymentRepository.findOrderByPaymentCode(
      sepayPayload.paymentCode,
    );

    if (!order) {
      return {
        success: true,
        ignored: true,
        reason: "unknown_payment_code",
      };
    }

    const expectedAmount = toVndInteger(order.totalAmount);

    if (sepayPayload.transferAmount !== expectedAmount) {
      return {
        success: true,
        ignored: true,
        reason: "amount_mismatch",
        expectedAmount,
        receivedAmount: sepayPayload.transferAmount,
      };
    }

    if (order.status === "failed") {
      throw new AppError("Failed orders cannot be completed", 409);
    }

    const updatedOrder = await this.processPaymentResult({
      orderId: order.orderId,
      status: "completed",
      transactionId: sepayPayload.transactionId,
      paymentMethod: "bank_transfer",
      amount: String(sepayPayload.transferAmount),
      currency: "VND",
    });

    return {
      success: true,
      ignored: false,
      order: updatedOrder,
    };
  }

  private async processPaymentResult(input: {
    orderId: string;
    status: "completed" | "failed";
    transactionId: string;
    paymentMethod: PaymentMethod;
    amount?: string | number;
    currency?: string;
    reason?: string | null;
  }) {
    const existingOrder = await this.orderService.getOrderByIdForAdmin(
      input.orderId,
    );

    const order = await this.orderService.updateOrderBySystem(input.orderId, {
      status: input.status,
      transactionId: input.transactionId,
      paymentMethod: input.paymentMethod,
      amount: input.amount,
      currency: input.currency,
      reason: input.reason,
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (
      input.status === "completed" &&
      existingOrder.status !== "completed" &&
      order.status === "completed"
    ) {
      await this.notificationRepository.create({
        customerProfileId: order.customerProfileId,
        title: "Payment successful",
        body: `Order ${order.orderId} has been paid successfully. Voucher codes are ready.`,
      });
    }

    return order;
  }
}
