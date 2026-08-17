import { Router } from "express";
import { branchProfileController } from "./branchProfile.controller";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { requireAuth, authorizeRoles } from "../../shared/auth/auth.middleware";

const router = Router();

router.use(requireAuth);

// Client routes
router.get(
    "/branches/me",
    authorizeRoles("Branch"),
    asyncHandler(branchProfileController.getProfile)
);
router.put(
    "/branches/me",
    authorizeRoles("Branch"),
    asyncHandler(branchProfileController.updateProfile)
);

// Admin routes
router.get(
    "/admin/branches",
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(branchProfileController.getAllBranches)
);
router.patch(
    "/admin/branches/:id/status",
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(branchProfileController.updateBranchStatus)
);

export default router;
