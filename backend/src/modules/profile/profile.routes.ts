import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { ProfileController } from "./profile.controller";

const profileController = new ProfileController();

export const profileRouter = Router();

profileRouter.get(
  "/admin/partners",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(profileController.getAllPartners)
);

profileRouter.get(
  "/admin/branches",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(profileController.getAllBranches)
);

profileRouter.patch(
  "/:profileType/:profileId/status",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(profileController.updateProfileStatus),
);

profileRouter.post(
  "/avatar",
  requireAuth,
  authorizeRoles("Customer"),
  asyncHandler(profileController.uploadAvatar)
);

profileRouter.get(
  "/branches",
  requireAuth,
  authorizeRoles("Partner"),
  asyncHandler(profileController.getBranches)
);

profileRouter.use(requireAuth, authorizeRoles("Partner", "Branch", "Customer"));
profileRouter.get("/", asyncHandler(profileController.getProfile));
profileRouter.post("/", asyncHandler(profileController.createProfile));
profileRouter.patch("/", asyncHandler(profileController.updateProfile));
