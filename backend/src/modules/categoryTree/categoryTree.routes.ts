import { Router } from "express";
import { CategoryTreeController } from "./categoryTree.controller";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { requireAuth, authorizeRoles } from "../../shared/auth/auth.middleware";

const categoryTreeController = new CategoryTreeController();

export const categoryTreeRouter = Router();

// Public routes
categoryTreeRouter.get(
    "/categories",
    asyncHandler(categoryTreeController.getAllCategories)
);

// Admin routes (require auth & roles)
categoryTreeRouter.post(
    "/admin/categories",
    requireAuth,
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(categoryTreeController.createCategory)
);

categoryTreeRouter.put(
    "/admin/categories/:id",
    requireAuth,
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(categoryTreeController.updateCategory)
);

categoryTreeRouter.delete(
    "/admin/categories/:id",
    requireAuth,
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(categoryTreeController.deleteCategory)
);
