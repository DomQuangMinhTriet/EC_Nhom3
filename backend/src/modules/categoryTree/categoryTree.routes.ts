import { Router } from "express";
import { CategoryTreeController } from "./categoryTree.controller";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { requireAuth, authorizeRoles } from "../../shared/auth/auth.middleware";

const categoryTreeController = new CategoryTreeController();

export const categoryTreeRouter = Router();

// Public routes
categoryTreeRouter.get(
    "/",
    asyncHandler(categoryTreeController.getAllCategories)
);

// Admin routes (require auth & roles)
categoryTreeRouter.post(
    "/",
    requireAuth,
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(categoryTreeController.createCategory)
);

categoryTreeRouter.put(
    "/:id",
    requireAuth,
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(categoryTreeController.updateCategory)
);

categoryTreeRouter.delete(
    "/:id",
    requireAuth,
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(categoryTreeController.deleteCategory)
);
