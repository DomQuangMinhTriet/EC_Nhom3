import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { healthRouter } from "../modules/health/health.routes";
import { profileRouter } from "../modules/profile/profile.routes";
import { usersRouter } from "../modules/users/users.routes";

export const apiRouter = Router();

apiRouter.use("/api/auth", authRouter);
apiRouter.use("/api/profile", profileRouter);
apiRouter.use("/api/users", usersRouter);
apiRouter.use("/", healthRouter);
