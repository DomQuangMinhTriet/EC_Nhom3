import { Router } from "express";
import { customerProfileController } from "./customerProfile.controller";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { requireAuth, authorizeRoles } from "../../shared/auth/auth.middleware";

const router = Router();

router.use(requireAuth);

// Client routes
router.get(
    "/customers/me",
    authorizeRoles("Customer"),
    asyncHandler(customerProfileController.getProfile)
);
router.put(
    "/customers/me",
    authorizeRoles("Customer"),
    asyncHandler(customerProfileController.updateProfile)
);
router.post(
    "/customers/me/avatar",
    authorizeRoles("Customer"),
    asyncHandler(customerProfileController.uploadAvatar)
);

export default router;
