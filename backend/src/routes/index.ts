import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { healthRouter } from "../modules/health/health.routes";
import categoryTreeRoutes from "../modules/categoryTree/categoryTree.routes";
import customerProfileRoutes from "../modules/customerProfile/customerProfile.routes";
import partnerProfileRoutes from "../modules/partnerProfile/partnerProfile.routes";
import branchProfileRoutes from "../modules/branchProfile/branchProfile.routes";

import branchQuotaRoutes from "../modules/branchQuota/branchQuota.routes";
import { profileRouter } from "../modules/profile/profile.routes";
import { usersRouter } from "../modules/users/users.routes";

export const apiRouter = Router();

apiRouter.use("/api/auth", authRouter);
apiRouter.use("/api/profile", profileRouter);
apiRouter.use("/api/users", usersRouter);
apiRouter.use("/", healthRouter);

// Categories
apiRouter.use("/", categoryTreeRoutes);

// Profiles
apiRouter.use("/", customerProfileRoutes);
apiRouter.use("/", partnerProfileRoutes);
apiRouter.use("/", branchProfileRoutes);

// Quotas
apiRouter.use("/", branchQuotaRoutes);
