import { Router } from "express";
import { partnerProfileController } from "./partnerProfile.controller";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { requireAuth, authorizeRoles } from "../../shared/auth/auth.middleware";

const router = Router();

router.use(requireAuth);

// Client routes
router.get(
    "/partners/me",
    authorizeRoles("Partner"),
    asyncHandler(partnerProfileController.getProfile)
);
router.put(
    "/partners/me",
    authorizeRoles("Partner"),
    asyncHandler(partnerProfileController.updateProfile)
);
router.get(
    "/partners/me/branches",
    authorizeRoles("Partner"),
    asyncHandler(partnerProfileController.getBranches)
);

// Admin routes
router.get(
    "/admin/partners",
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(partnerProfileController.getAllPartners)
);
router.patch(
    "/admin/partners/:id/status",
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(partnerProfileController.updatePartnerStatus)
);

export default router;
