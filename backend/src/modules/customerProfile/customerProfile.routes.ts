import { Router } from "express";
import { customerProfileController } from "./customerProfile.controller";

const router = Router();

// Client routes
router.get("/customers/me", customerProfileController.getProfile);
router.put("/customers/me", customerProfileController.updateProfile);
router.post("/customers/me/avatar", customerProfileController.uploadAvatar);

export default router;
