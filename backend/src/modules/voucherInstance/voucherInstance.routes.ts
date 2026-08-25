import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { VoucherInstanceController } from "./voucherInstance.controller";

export const voucherInstanceRouter = Router();
const voucherInstanceController = new VoucherInstanceController();

voucherInstanceRouter.use(requireAuth);

voucherInstanceRouter.get(
  "/redeem/:code",
  authorizeRoles("Branch"),
  asyncHandler(voucherInstanceController.lookupVoucherForRedemption),
);

voucherInstanceRouter.patch(
  "/redeem/:code",
  authorizeRoles("Branch"),
  asyncHandler(voucherInstanceController.redeemVoucher),
);

voucherInstanceRouter.get(
  "/",
  authorizeRoles("Customer"),
  asyncHandler(voucherInstanceController.getMyVouchers),
);

voucherInstanceRouter.get(
  "/:id",
  authorizeRoles("Customer"),
  asyncHandler(voucherInstanceController.getVoucherDetail),
);
