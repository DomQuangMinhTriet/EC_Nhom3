import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { HealthController } from "./health.controller";

const healthController = new HealthController();

export const healthRouter = Router();

healthRouter.get("/", healthController.getApiStatus);
healthRouter.get(
  "/api/health/db",
  asyncHandler(healthController.getDatabaseStatus),
);
