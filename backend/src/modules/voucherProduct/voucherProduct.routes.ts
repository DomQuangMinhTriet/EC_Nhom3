import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { VoucherProductController } from "./voucherProduct.controller";

const voucherProductController = new VoucherProductController();

export const voucherProductRouter = Router();

voucherProductRouter.post(
  "/",
  requireAuth,
  authorizeRoles("Partner"),
  asyncHandler(voucherProductController.createVoucher),
);

voucherProductRouter.get(
  "/mine",
  requireAuth,
  authorizeRoles("Partner"),
  asyncHandler(voucherProductController.getPartnerVouchers),
);

voucherProductRouter.post(
  "/upload-image",
  requireAuth,
  authorizeRoles("Partner"),
  asyncHandler(voucherProductController.uploadImage),
);

voucherProductRouter.patch(
  "/:id",
  requireAuth,
  authorizeRoles("Partner"),
  asyncHandler(voucherProductController.updatePartnerVoucher),
);

voucherProductRouter.patch(
  "/:id/self-status",
  requireAuth,
  authorizeRoles("Partner"),
  asyncHandler(voucherProductController.updatePartnerVoucherStatus),
);

voucherProductRouter.get(
  "/",
  asyncHandler(voucherProductController.getVouchers),
);

voucherProductRouter.get(
  "/admin",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(voucherProductController.getVouchersForAdmin),
);

voucherProductRouter.get(
  "/partners",
  asyncHandler(voucherProductController.getActivePartners),
);

voucherProductRouter.get(
  "/:id",
  asyncHandler(voucherProductController.getVoucherById),
);

voucherProductRouter.patch(
  "/:id/status",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(voucherProductController.updateVoucherStatus),
);
