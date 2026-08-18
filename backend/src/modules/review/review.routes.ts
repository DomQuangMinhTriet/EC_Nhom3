import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { ReviewController } from "./review.controller";

export const reviewRouter = Router();
const reviewController = new ReviewController();

// Create review (Customer only)
reviewRouter.post(
    "/customers/me/reviews",
    requireAuth,
    authorizeRoles("Customer"),
    asyncHandler(reviewController.createReview)
);

// Edit review (Customer only)
reviewRouter.put(
    "/customers/me/reviews/:id",
    requireAuth,
    authorizeRoles("Customer"),
    asyncHandler(reviewController.editReview)
);

// Get reviews (Partner and Admins)
reviewRouter.get(
    "/vouchers/:id/reviews",
    requireAuth,
    authorizeRoles("Partner", "Super_Admin", "Operational_Admin"),
    asyncHandler(reviewController.getVoucherReviews)
);

// Change review status (Admins only)
reviewRouter.patch(
    "/admin/reviews/:id/status",
    requireAuth,
    authorizeRoles("Super_Admin", "Operational_Admin"),
    asyncHandler(reviewController.changeReviewStatus)
);
