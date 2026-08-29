import { Router } from "express";
import { BranchQuotaController } from "./branchQuota.controller";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { requireAuth, authorizeRoles } from "../../shared/auth/auth.middleware";

const branchQuotaController = new BranchQuotaController();

export const branchQuotaRouter = Router();

// Public: lets a customer see, per branch, how much stock of this active
// voucher is left before deciding where to redeem — must be registered
// before the requireAuth/Partner-only middleware below.
branchQuotaRouter.get(
    "/vouchers/:id/branches/public",
    asyncHandler(branchQuotaController.getPublicAllocations)
);

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
