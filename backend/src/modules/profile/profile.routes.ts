import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { ProfileController } from "./profile.controller";

const profileController = new ProfileController();

export const profileRouter = Router();

profileRouter.patch(
  "/:profileType/:profileId/status",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(profileController.updateProfileStatus),
);

profileRouter.use(requireAuth, authorizeRoles("Partner", "Branch", "Customer"));
profileRouter.post("/", asyncHandler(profileController.createProfile));
profileRouter.patch("/", asyncHandler(profileController.updateProfile));
