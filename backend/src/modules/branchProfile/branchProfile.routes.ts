import { Router } from "express";
import { branchProfileController } from "./branchProfile.controller";

const router = Router();

// Client routes
router.get("/branches/me", branchProfileController.getProfile);
router.put("/branches/me", branchProfileController.updateProfile);

// Admin routes
router.get("/admin/branches", branchProfileController.getAllBranches);
router.patch("/admin/branches/:id/status", branchProfileController.updateBranchStatus);

export default router;
