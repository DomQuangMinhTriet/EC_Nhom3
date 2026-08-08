import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError";
import type { AppRole } from "./jwt";
import { verifyToken } from "./jwt";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.header("authorization")?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Missing bearer token", 401);
  }

  const payload = verifyToken(token, "access");

  if (payload.status === "banned" || payload.status === "deactivated") {
    throw new AppError("User is not allowed to access this resource", 403);
  }

  req.user = {
    userId: payload.sub,
    email: payload.email,
    roleCode: payload.roleCode,
    status: payload.status,
  };

  next();
};

export const authorizeRoles =
  (...roles: AppRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!roles.includes(req.user.roleCode)) {
      throw new AppError("Insufficient permissions", 403);
    }

    next();
  };
