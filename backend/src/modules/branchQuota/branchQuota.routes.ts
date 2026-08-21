import { Router } from "express";
import { BranchQuotaController } from "./branchQuota.controller";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { requireAuth, authorizeRoles } from "../../shared/auth/auth.middleware";

const branchQuotaController = new BranchQuotaController();

export const branchQuotaRouter = Router();

branchQuotaRouter.use(requireAuth);
branchQuotaRouter.use(authorizeRoles("Partner"));

branchQuotaRouter.post(
    "/vouchers/:id/branches",
    asyncHandler(branchQuotaController.allocateVouchers)
);

branchQuotaRouter.get(
    "/vouchers/:id/branches",
    asyncHandler(branchQuotaController.getAllocations)
);

branchQuotaRouter.put(
    "/vouchers/:id/branches/:branchId",
    asyncHandler(branchQuotaController.updateAllocation)
);

branchQuotaRouter.delete(
    "/vouchers/:id/branches/:branchId",
    asyncHandler(branchQuotaController.deleteAllocation)
);
