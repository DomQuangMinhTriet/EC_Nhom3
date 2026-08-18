import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { VoucherInstanceController } from "./voucherInstance.controller";

export const voucherInstanceRouter = Router();
const voucherInstanceController = new VoucherInstanceController();

voucherInstanceRouter.use(requireAuth);
voucherInstanceRouter.use(authorizeRoles("Customer"));

voucherInstanceRouter.get(
    "/customers/me/vouchers",
    asyncHandler(voucherInstanceController.getMyVouchers)
);

voucherInstanceRouter.get(
    "/customers/me/vouchers/:id",
    asyncHandler(voucherInstanceController.getVoucherDetail)
);
