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
  "/stripe/webhook",
  asyncHandler(paymentController.handleStripeWebhook),
);
