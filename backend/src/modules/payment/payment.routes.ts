import { Router } from "express";
import { requireEcVoucherApiKey } from "../../shared/auth/apiKey.middleware";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { PaymentController } from "./payment.controller";

export const paymentRouter = Router();
const paymentController = new PaymentController();

paymentRouter.post(
  "/initiate",
  requireAuth,
  authorizeRoles("Customer"),
  asyncHandler(paymentController.initiatePayment),
);

paymentRouter.post(
  "/callback",
  requireEcVoucherApiKey,
  asyncHandler(paymentController.handleCallback),
);

paymentRouter.post(
  "/sepay/webhook",
  asyncHandler(paymentController.handleSepayWebhook),
);

paymentRouter.post(
  "/paypal/capture",
  requireAuth,
  authorizeRoles("Customer"),
  asyncHandler(paymentController.capturePaypalPayment),
);

// No auth middleware, matching /sepay/webhook: VNPay calls this
// server-to-server and authenticates via the signed vnp_SecureHash query
// param instead, verified inline in PaymentService.handleVnpayIpn.
paymentRouter.get(
  "/vnpay/ipn",
  asyncHandler(paymentController.handleVnpayIpn),
);

paymentRouter.get(
  "/vnpay/return",
  asyncHandler(paymentController.handleVnpayReturn),
);
