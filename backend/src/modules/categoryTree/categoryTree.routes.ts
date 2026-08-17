import { Router } from "express";
import { categoryTreeController } from "./categoryTree.controller";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { requireAuth, authorizeRoles } from "../../shared/auth/auth.middleware";

const router = Router();

// Public routes
router.get(
    "/categories",
    asyncHandler(categoryTreeController.getAllCategories)
);

// Admin routes (require auth & roles)
router.post(
    "/admin/categories",
    requireAuth,
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(categoryTreeController.createCategory)
);

router.put(
    "/admin/categories/:id",
    requireAuth,
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(categoryTreeController.updateCategory)
);

router.delete(
    "/admin/categories/:id",
    requireAuth,
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(categoryTreeController.deleteCategory)
);

export default router;
