import { Router } from "express";
import { partnerProfileController } from "./partnerProfile.controller";

const router = Router();

// Client routes
router.get("/partners/me", partnerProfileController.getProfile);
router.put("/partners/me", partnerProfileController.updateProfile);
router.get("/partners/me/branches", partnerProfileController.getBranches);

// Admin routes
router.get("/admin/partners", partnerProfileController.getAllPartners);
router.patch("/admin/partners/:id/status", partnerProfileController.updatePartnerStatus);

export default router;
