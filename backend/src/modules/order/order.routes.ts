import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { requireEcVoucherApiKey } from "../../shared/auth/apiKey.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { OrderController } from "./order.controller";

export const orderRouter = Router();
const orderController = new OrderController();

orderRouter.get(
  "/",
  requireAuth,
  authorizeRoles("Customer"),
  asyncHandler(orderController.getMyOrders),
);

// Must be registered before "/:id" or Express would treat "admin" as an :id value.
orderRouter.get(
  "/admin",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(orderController.getOrdersForAdmin),
);

orderRouter.get(
  "/admin/:id",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(orderController.getOrderByIdForAdmin),
);

orderRouter.patch(
  "/admin/:id/cancel",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(orderController.cancelOrderForAdmin),
);

orderRouter.patch(
  "/admin/:id/refund",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(orderController.markOrderRefunded),
);

orderRouter.get(
  "/:id",
  requireAuth,
  authorizeRoles("Customer"),
  asyncHandler(orderController.getOrderById),
);

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
