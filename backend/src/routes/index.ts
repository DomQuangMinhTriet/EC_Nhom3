import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { healthRouter } from "../modules/health/health.routes";
import { categoryTreeRouter } from "../modules/categoryTree/categoryTree.routes";
// import customerProfileRoutes from "../modules/customerProfile/customerProfile.routes";
// import partnerProfileRoutes from "../modules/partnerProfile/partnerProfile.routes";
// import branchProfileRoutes from "../modules/branchProfile/branchProfile.routes";

import { branchQuotaRouter } from "../modules/branchQuota/branchQuota.routes";
import { profileRouter } from "../modules/profile/profile.routes";
import { usersRouter } from "../modules/users/users.routes";
import { voucherProductRouter } from "../modules/voucherProduct/voucherProduct.routes";
import { cartRouter } from "../modules/cart/cart.routes";
import { voucherInstanceRouter } from "../modules/voucherInstance/voucherInstance.routes";
import { reviewRouter } from "../modules/review/review.routes";
import { notificationRouter } from "../modules/notification/notification.routes";

export const apiRouter = Router();

apiRouter.use("/api/auth", authRouter);
apiRouter.use("/api/profile", profileRouter);
apiRouter.use("/api/users", usersRouter);

// Categories
apiRouter.use("/api/categories", categoryTreeRouter);

// Vouchers
apiRouter.use("/api/vouchers", voucherProductRouter);

// Notifications
apiRouter.use("/api/notifications", notificationRouter);

// Profiles
// apiRouter.use("/", customerProfileRoutes);
// apiRouter.use("/", partnerProfileRoutes);
// apiRouter.use("/", branchProfileRoutes);

// Quotas
apiRouter.use("/api/quotas", branchQuotaRouter);

// Cart
apiRouter.use("/api/carts", cartRouter);

// Voucher Instances (My Vouchers)
apiRouter.use("/api/voucher-instances", voucherInstanceRouter);

// Reviews
apiRouter.use("/api/reviews", reviewRouter);
