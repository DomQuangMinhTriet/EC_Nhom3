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
import { cartRouter } from "../modules/cart/cart.routes";
import { voucherInstanceRouter } from "../modules/voucherInstance/voucherInstance.routes";
import { reviewRouter } from "../modules/review/review.routes";

export const apiRouter = Router();

apiRouter.use("/api/auth", authRouter);
apiRouter.use("/api/profile", profileRouter);
apiRouter.use("/api/users", usersRouter);
apiRouter.use("/", healthRouter);

// Categories
apiRouter.use("/api", categoryTreeRouter);

// Profiles
// apiRouter.use("/", customerProfileRoutes);
// apiRouter.use("/", partnerProfileRoutes);
// apiRouter.use("/", branchProfileRoutes);

// Quotas
apiRouter.use("/api", branchQuotaRouter);

// Cart
apiRouter.use("/api", cartRouter);

// Voucher Instances (My Vouchers)
apiRouter.use("/api", voucherInstanceRouter);

// Reviews
apiRouter.use("/api", reviewRouter);
