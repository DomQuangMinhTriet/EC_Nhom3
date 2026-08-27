import { createHmac, randomUUID } from "node:crypto";
import Stripe from "stripe";
import { AppError } from "../../shared/errors/AppError";
import { NotificationRepository } from "../notification/notification.repository";
import type { PaymentMethod } from "../order/order.repository";
import { OrderService } from "../order/order.service";
import { PaymentRepository } from "./payment.repository";

type InitiatePaymentInput = {
  orderId: string;
  paymentMethod: string;
  ipAddr?: string;
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
  "getOrderById" | "updateOrderBySystem"
>;

type NotificationWriter = Pick<NotificationRepository, "create">;

type SepayPaymentStore = Pick<
  PaymentRepository,
  "setPaymentCodeForOrder" | "findOrderByPaymentCode"
>;

const paymentMethods = ["bank_transfer", "card", "paypal", "vnpay", "stripe"] as const;
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

    // No \b anchor: bank transfer content is free text and often has no
    // separator before the code (e.g. "CHUYENTIENECV..."), which \b would
    // fail to match. buildSepayPaymentCode always emits exactly 16 hex
    // chars after "ECV", so an exact-length match stays precise without it.
    const matched = value.toUpperCase().match(/ECV[0-9A-F]{16}/);
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

// ---------------------------------------------------------------------------
// PayPal (Sandbox) — Orders API v2: create order -> customer approves on
// PayPal's hosted page -> our backend captures on return. Capture (not just
// approval) is what actually charges the buyer, so completion happens
// synchronously when the browser comes back — no separate webhook needed
// the way SePay/VNPay's async bank transfers require one.
// ---------------------------------------------------------------------------

// PayPal doesn't support VND at all — every amount must be quoted in a
// currency it supports. There's no free, reliable live FX source appropriate
// for this coursework demo, so this is a fixed illustrative rate, not a
// real-time one. Documented in docs/payment-integration/paypal-sandbox.md.
const VND_PER_USD = 25000;

const toUsdAmount = (vndAmount: string | number) => {
  const vnd = toVndInteger(vndAmount);
  return (vnd / VND_PER_USD).toFixed(2);
};

const getPaypalConfig = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const apiBase =
    process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

  if (!clientId || !clientSecret) {
    throw new AppError("PayPal is not configured", 500);
  }

  return { clientId, clientSecret, apiBase };
};

const getAppBaseUrl = () => {
  const baseUrl = process.env.APP_BASE_URL;

  if (!baseUrl) {
    throw new AppError("APP_BASE_URL is not configured", 500);
  }

  return baseUrl.replace(/\/+$/, "");
};

const getPaypalAccessToken = async () => {
  const { clientId, clientSecret, apiBase } = getPaypalConfig();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const body = (await response.json().catch(() => null)) as {
    access_token?: string;
  } | null;

  if (!response.ok || !body?.access_token) {
    throw new AppError("Could not authenticate with PayPal", 502);
  }

  return body.access_token;
};

const createPaypalOrder = async ({
  orderId,
  amountUsd,
}: {
  orderId: string;
  amountUsd: string;
}) => {
  const { apiBase } = getPaypalConfig();
  const accessToken = await getPaypalAccessToken();
  const appBaseUrl = getAppBaseUrl();

  const response = await fetch(`${apiBase}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          amount: { currency_code: "USD", value: amountUsd },
        },
      ],
      application_context: {
        return_url: `${appBaseUrl}/checkout/paypal-return?orderId=${orderId}`,
        cancel_url: `${appBaseUrl}/checkout/paypal-return?orderId=${orderId}&cancelled=1`,
        user_action: "PAY_NOW",
      },
    }),
  });

  const body = (await response.json().catch(() => null)) as {
    id?: string;
    links?: Array<{ rel: string; href: string }>;
  } | null;

  const approveUrl = body?.links?.find((link) => link.rel === "approve")
    ?.href;

  if (!response.ok || !body?.id || !approveUrl) {
    throw new AppError("Could not create PayPal order", 502);
  }

  return { paypalOrderId: body.id, approveUrl };
};

const capturePaypalOrderRequest = async (paypalOrderId: string) => {
  const { apiBase } = getPaypalConfig();
  const accessToken = await getPaypalAccessToken();

  const response = await fetch(
    `${apiBase}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  const body = (await response.json().catch(() => null)) as {
    status?: string;
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{ id?: string; amount?: { value?: string } }>;
      };
    }>;
  } | null;

  if (!response.ok || body?.status !== "COMPLETED") {
    throw new AppError("PayPal payment was not completed", 402);
  }

  const capture = body.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    captureId: capture?.id ?? paypalOrderId,
    amountUsd: capture?.amount?.value,
  };
};

// ---------------------------------------------------------------------------
// VNPay (Sandbox) — redirect flow signed with HMAC-SHA512. No API call is
// needed to start a payment (unlike PayPal): the customer is redirected
// straight to a signed URL. Completion is confirmed the same way SePay's
// bank transfer is: an async server-to-server IPN call is the source of
// truth, while the browser's return redirect is only used for UX (matches
// processPaymentResult's existing idempotency guarantees).
// ---------------------------------------------------------------------------

const buildVnpayTxnRef = (orderId: string) =>
  `VNP${orderId.replaceAll("-", "").slice(0, 16).toUpperCase()}`;

const getVnpayConfig = () => {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  const paymentUrl =
    process.env.VNPAY_PAYMENT_URL ??
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

  if (!tmnCode || !hashSecret) {
    throw new AppError("VNPay is not configured", 500);
  }

  return { tmnCode, hashSecret, paymentUrl };
};

const formatVnpayDate = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14);

const sortedEntries = (params: Record<string, string>) =>
  Object.entries(params).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

const signVnpayParams = (params: Record<string, string>, hashSecret: string) =>
  createHmac("sha512", hashSecret)
    .update(new URLSearchParams(sortedEntries(params)).toString())
    .digest("hex");

const buildVnpayPaymentUrl = ({
  orderId,
  amount,
  ipAddr,
}: {
  orderId: string;
  amount: string;
  ipAddr: string;
}) => {
  const { tmnCode, hashSecret, paymentUrl } = getVnpayConfig();
  const appBaseUrl = getAppBaseUrl();
  const txnRef = buildVnpayTxnRef(orderId);

  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(toVndInteger(amount) * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: `${appBaseUrl}/checkout/vnpay-return?orderId=${orderId}`,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: formatVnpayDate(new Date()),
  };

  const secureHash = signVnpayParams(params, hashSecret);
  const url = new URL(paymentUrl);
  for (const [key, value] of sortedEntries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("vnp_SecureHash", secureHash);

  return { paymentUrl: url.toString(), txnRef };
};

const verifyVnpaySignature = (query: Record<string, string>) => {
  const { hashSecret } = getVnpayConfig();
  const { vnp_SecureHash, vnp_SecureHashType: _vnp_SecureHashType, ...rest } =
    query;

  return (
    typeof vnp_SecureHash === "string" &&
    vnp_SecureHash.toLowerCase() ===
      signVnpayParams(rest, hashSecret).toLowerCase()
  );
};

// ---------------------------------------------------------------------------
// Stripe (Sandbox) — Checkout Session
// ---------------------------------------------------------------------------

const getStripeConfig = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    throw new AppError("Stripe is not configured", 500);
  }

  return { secretKey, webhookSecret };
};

const createStripeCheckoutSession = async ({
  orderId,
  amountUsd,
}: {
  orderId: string;
  amountUsd: string;
}) => {
  const { secretKey } = getStripeConfig();
  const stripe = new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });
  const appBaseUrl = getAppBaseUrl();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Order ${orderId}`,
          },
          unit_amount: Math.round(Number(amountUsd) * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${appBaseUrl}/checkout/stripe-return?orderId=${orderId}`,
    cancel_url: `${appBaseUrl}/checkout/stripe-return?orderId=${orderId}&cancelled=1`,
    client_reference_id: orderId,
  });

  if (!session.url) {
    throw new AppError("Could not create Stripe checkout session", 502);
  }

  return { stripeSessionId: session.id, checkoutUrl: session.url };
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

    if (paymentMethod === "paypal") {
      const amountUsd = toUsdAmount(order.totalAmount);
      const { paypalOrderId, approveUrl } = await createPaypalOrder({
        orderId: order.orderId,
        amountUsd,
      });

      const updatedOrder = await this.paymentRepository.setPaymentCodeForOrder(
        {
          orderId: order.orderId,
          customerProfileId: order.customerProfileId,
          paymentCode: paypalOrderId,
        },
      );

      if (!updatedOrder) {
        throw new AppError("Order not found", 404);
      }

      return {
        orderId: order.orderId,
        transactionId: paypalOrderId,
        paymentMethod,
        amount: amountUsd,
        currency: "USD",
        paymentUrl: approveUrl,
      };
    }

    if (paymentMethod === "vnpay") {
      const { paymentUrl, txnRef } = buildVnpayPaymentUrl({
        orderId: order.orderId,
        amount: order.totalAmount,
        ipAddr: input.ipAddr ?? "127.0.0.1",
      });

      const updatedOrder = await this.paymentRepository.setPaymentCodeForOrder(
        {
          orderId: order.orderId,
          customerProfileId: order.customerProfileId,
          paymentCode: txnRef,
        },
      );

      if (!updatedOrder) {
        throw new AppError("Order not found", 404);
      }

      return {
        orderId: order.orderId,
        transactionId: txnRef,
        paymentMethod,
        amount: order.totalAmount,
        currency,
        paymentUrl,
      };
    }

    if (paymentMethod === "stripe") {
      const amountUsd = toUsdAmount(order.totalAmount);
      const { stripeSessionId, checkoutUrl } = await createStripeCheckoutSession({
        orderId: order.orderId,
        amountUsd,
      });

      const updatedOrder = await this.paymentRepository.setPaymentCodeForOrder(
        {
          orderId: order.orderId,
          customerProfileId: order.customerProfileId,
          paymentCode: stripeSessionId,
        },
      );

      if (!updatedOrder) {
        throw new AppError("Order not found", 404);
      }

      return {
        orderId: order.orderId,
        transactionId: stripeSessionId,
        paymentMethod,
        amount: amountUsd,
        currency: "USD",
        paymentUrl: checkoutUrl,
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

    // This callback is the mock/demo confirmation path — a customer's own
    // client can call it with a self-declared status. bank_transfer has a
    // real confirmation mechanism (the SePay webhook, amount-verified against
    // the order), so a self-declared "success" must never complete a
    // bank_transfer order here, or a customer could "pay" without ever
    // transferring money. Declaring one's own bank_transfer attempt failed is
    // harmless (equivalent to cancelling), so only "success" is blocked.
    if (paymentMethod === "bank_transfer" && callbackStatus === "success") {
      throw new AppError(
        "bank_transfer payments must be confirmed via the SePay webhook",
        400,
      );
    }

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

    // Match the sibling ignored-cases above: acknowledge with 200 instead of
    // throwing, so SePay's delivery system marks this delivered rather than
    // retrying money that requires manual reconciliation regardless. Also
    // covers the (already-)completed case, so a second genuine transfer for
    // the same paymentCode doesn't insert a duplicate payment row.
    if (order.status === "failed") {
      return {
        success: true,
        ignored: true,
        reason: "order_already_failed",
      };
    }

    if (order.status === "completed") {
      return {
        success: true,
        ignored: true,
        reason: "order_already_completed",
      };
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

  async handleStripeWebhook(signature: string | undefined, payload: Buffer) {
    const { secretKey, webhookSecret } = getStripeConfig();
    const stripe = new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });

    if (!signature) {
      throw new AppError("Missing Stripe signature", 401);
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new AppError("Invalid Stripe signature", 401);
    }

    if (event.type !== "checkout.session.completed") {
      return { success: true, ignored: true, reason: "event_not_supported" };
    }

    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.payment_status !== "paid") {
      return { success: true, ignored: true, reason: "payment_not_paid" };
    }

    const stripeSessionId = session.id;

    const order = await this.paymentRepository.findOrderByPaymentCode(
      stripeSessionId,
    );

    if (!order) {
      return { success: true, ignored: true, reason: "order_not_found" };
    }

    if (order.status === "failed") {
      return { success: true, ignored: true, reason: "order_already_failed" };
    }

    if (order.status === "completed") {
      return { success: true, ignored: true, reason: "order_already_completed" };
    }

    const updatedOrder = await this.processPaymentResult({
      orderId: order.orderId,
      status: "completed",
      transactionId: `stripe_${session.payment_intent ?? stripeSessionId}`,
      paymentMethod: "stripe",
      amount: String((session.amount_total ?? 0) / 100),
      currency: "USD",
    });

    return { success: true, ignored: false, order: updatedOrder };
  }

  async capturePaypalPayment(userId: string, orderId: string) {
    // getOrderById enforces ownership — only the customer who created this
    // order can trigger its capture, matching /initiate's auth model.
    const order = await this.orderService.getOrderById(userId, orderId);

    if (order.status === "completed") {
      return { message: "Order already completed.", order };
    }

    if (order.status === "failed") {
      throw new AppError("Failed orders cannot be completed", 400);
    }

    if (!order.paymentCode) {
      throw new AppError(
        "No PayPal order is associated with this order yet",
        400,
      );
    }

    const capture = await capturePaypalOrderRequest(order.paymentCode);

    const updatedOrder = await this.processPaymentResult({
      orderId: order.orderId,
      status: "completed",
      transactionId: capture.captureId,
      paymentMethod: "paypal",
      amount: capture.amountUsd,
      currency: "USD",
    });

    return { message: "PayPal payment captured successfully.", order: updatedOrder };
  }

  async handleVnpayIpn(query: Record<string, string>) {
    if (!verifyVnpaySignature(query)) {
      return { RspCode: "97", Message: "Invalid signature" };
    }

    const order = await this.paymentRepository.findOrderByPaymentCode(
      query.vnp_TxnRef ?? "",
    );

    if (!order) {
      return { RspCode: "01", Message: "Order not found" };
    }

    const expectedAmount = String(toVndInteger(order.totalAmount) * 100);
    if (query.vnp_Amount !== expectedAmount) {
      return { RspCode: "04", Message: "Invalid amount" };
    }

    // Same idempotency guarantee as the SePay webhook: don't reprocess an
    // order that's already reached a final state, regardless of how many
    // times VNPay redelivers the IPN.
    if (order.status === "completed" || order.status === "failed") {
      return { RspCode: "02", Message: "Order already confirmed" };
    }

    const transactionId = `vnpay_${query.vnp_TransactionNo ?? query.vnp_TxnRef}`;
    const amount = String(Number(query.vnp_Amount) / 100);

    if (query.vnp_ResponseCode !== "00") {
      await this.processPaymentResult({
        orderId: order.orderId,
        status: "failed",
        transactionId,
        paymentMethod: "vnpay",
        amount,
        currency: "VND",
        reason: `VNPay responseCode ${query.vnp_ResponseCode}`,
      });
      return { RspCode: "00", Message: "Confirm Success" };
    }

    await this.processPaymentResult({
      orderId: order.orderId,
      status: "completed",
      transactionId,
      paymentMethod: "vnpay",
      amount,
      currency: "VND",
    });

    return { RspCode: "00", Message: "Confirm Success" };
  }

  // Purely informational for the browser's redirect-back — verifies the
  // signature so a tampered URL can't lie to the customer, but never
  // mutates the order itself. handleVnpayIpn is the only path that
  // completes an order, matching the SePay webhook's role as sole source
  // of truth while checkout-screen polls for the result.
  handleVnpayReturn(query: Record<string, string>) {
    const valid = verifyVnpaySignature(query);
    return { valid, success: valid && query.vnp_ResponseCode === "00" };
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

    // wasNewlyCompleted is computed inside OrderRepository.updateOrder's own
    // row-locked transaction, so it's safe against concurrent/retried
    // webhook deliveries for the same order — unlike comparing a separate,
    // unlocked pre-read of order status against the post-update result.
    if (order.wasNewlyCompleted) {
      await this.notificationRepository.create({
        customerProfileId: order.customerProfileId,
        title: "Payment successful",
        body: `Order ${order.orderId} has been paid successfully. Voucher codes are ready.`,
      });
    }

    // wasNewlyCompleted is internal-only — used above to decide whether to
    // notify, but not part of the documented order/payment API contract.
    const { wasNewlyCompleted: _wasNewlyCompleted, ...publicOrder } = order;
    return publicOrder;
  }
}
