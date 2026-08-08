import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { AuthController } from "./auth.controller";

const authController = new AuthController();

export const authRouter = Router();

authRouter.post("/register", asyncHandler(authController.register));
authRouter.post("/login", asyncHandler(authController.login));
authRouter.post("/refresh", asyncHandler(authController.refresh));
