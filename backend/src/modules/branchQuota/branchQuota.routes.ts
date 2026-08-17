import { Router } from "express";
import { branchQuotaController } from "./branchQuota.controller";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { requireAuth, authorizeRoles } from "../../shared/auth/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(authorizeRoles("Partner"));

router.post(
    "/partner/vouchers/:id/branches",
    asyncHandler(branchQuotaController.allocateVouchers)
);

router.get(
    "/partner/vouchers/:id/branches",
    asyncHandler(branchQuotaController.getAllocations)
);

router.put(
    "/partner/vouchers/:id/branches/:branchId",
    asyncHandler(branchQuotaController.updateAllocation)
);

router.delete(
    "/partner/vouchers/:id/branches/:branchId",
    asyncHandler(branchQuotaController.deleteAllocation)
);

export default router;
