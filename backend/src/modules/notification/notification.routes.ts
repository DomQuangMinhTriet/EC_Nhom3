import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { requireEcVoucherApiKey } from "../../shared/auth/apiKey.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { NotificationController } from "./notification.controller";

const notificationController = new NotificationController();

export const notificationRouter = Router();

notificationRouter.post(
  "/email",
  requireEcVoucherApiKey,
  asyncHandler(notificationController.sendEmail),
);

notificationRouter.get(
  "/",
  requireAuth,
  authorizeRoles("Customer"),
  asyncHandler(notificationController.getMyNotifications),
);
