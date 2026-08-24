import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { requireEcVoucherApiKey } from "../../shared/auth/apiKey.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { OrderController } from "./order.controller";

export const orderRouter = Router();
const orderController = new OrderController();

orderRouter.post(
  "/",
  requireAuth,
  authorizeRoles("Customer"),
  asyncHandler(orderController.createOrder),
);

orderRouter.patch(
  "/:id/cancel",
  requireAuth,
  authorizeRoles("Customer"),
  asyncHandler(orderController.cancelOrder),
);

orderRouter.put(
  "/:id",
  requireEcVoucherApiKey,
  asyncHandler(orderController.updateOrder),
);
