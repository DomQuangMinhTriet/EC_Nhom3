import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { DashboardController } from "./dashboard.controller";

export const dashboardRouter = Router();
const dashboardController = new DashboardController();

dashboardRouter.get(
  "/summary",
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
  asyncHandler(dashboardController.getSummary),
);

dashboardRouter.get(
  "/partner-summary",
  requireAuth,
  authorizeRoles("Partner"),
  asyncHandler(dashboardController.getPartnerSummary),
);
