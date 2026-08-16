import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { AuthController } from "./auth.controller";

const authController = new AuthController();

export const authRouter = Router();

const credentialRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts. Please try again later.",
  },
});

authRouter.post(
  "/register/super-admin",
  requireAuth,
  authorizeRoles("Super_Admin"),
  credentialRateLimit,
  asyncHandler(authController.registerSuperAdmin),
);

authRouter.post(
  "/register",
  credentialRateLimit,
  asyncHandler(authController.register),
);
authRouter.post(
  "/login",
  credentialRateLimit,
  asyncHandler(authController.login),
);
authRouter.post("/refresh", asyncHandler(authController.refresh));
