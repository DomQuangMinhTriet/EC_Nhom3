import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { UsersController } from "./users.controller";

const usersController = new UsersController();

export const usersRouter = Router();

usersRouter.use(
  requireAuth,
  authorizeRoles("Super_Admin", "Operational_Admin"),
);
usersRouter.get("/", asyncHandler(usersController.getUsers));
usersRouter.patch(
  "/:userId/status",
  asyncHandler(usersController.updateStatus),
);
