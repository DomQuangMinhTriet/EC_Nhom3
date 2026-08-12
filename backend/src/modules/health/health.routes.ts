import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { HealthController } from "./health.controller";

const healthController = new HealthController();

export const healthRouter = Router();

healthRouter.get("/", healthController.getApiStatus);
healthRouter.get(
  "/api/health/db",
  requireAuth,
  authorizeRoles(
    "Super_Admin",
    "Operational_Admin",
    "Customer",
    "Partner",
    "Branch",
  ),
  asyncHandler(healthController.getDatabaseStatus),
);
