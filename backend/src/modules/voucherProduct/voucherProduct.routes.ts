import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { VoucherProductController } from "./voucherProduct.controller";

const voucherProductController = new VoucherProductController();

export const voucherProductRouter = Router();

voucherProductRouter.post(
  "/partner/vouchers",
  requireAuth,
  authorizeRoles("Partner"),
  asyncHandler(voucherProductController.createVoucher),
);

voucherProductRouter.get(
  "/partner/vouchers",
  requireAuth,
  authorizeRoles("Partner"),
  asyncHandler(voucherProductController.getPartnerVouchers),
);

voucherProductRouter.patch(
  "/partner/vouchers/:id",
  requireAuth,
  authorizeRoles("Partner"),
  asyncHandler(voucherProductController.updatePartnerVoucher),
);

voucherProductRouter.get(
  "/vouchers",
  asyncHandler(voucherProductController.getVouchers),
);

voucherProductRouter.get(
  "/vouchers/:id",
  asyncHandler(voucherProductController.getVoucherById),
);

voucherProductRouter.patch(
  "/admin/vouchers/:id/status",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(voucherProductController.updateVoucherStatus),
);
