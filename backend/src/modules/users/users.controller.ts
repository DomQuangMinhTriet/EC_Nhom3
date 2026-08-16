import type { Request, Response } from "express";
import type { AppRole, UserStatus } from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors/AppError";
import { UsersService } from "./users.service";

const userStatuses = [
  "banned",
  "pending",
  "active",
  "deactivated",
] as const satisfies readonly UserStatus[];

const isUserStatus = (value: string): value is UserStatus =>
  userStatuses.includes(value as UserStatus);

const appRoles = [
  "Super_Admin",
  "Operational_Admin",
  "Customer",
  "Partner",
  "Branch",
] as const satisfies readonly AppRole[];

const isAppRole = (value: string): value is AppRole =>
  appRoles.includes(value as AppRole);

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parsePositiveInteger = (
  value: unknown,
  fallback: number,
  field: string,
) => {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError(`${field} must be a positive integer`, 400);
  }

  return parsed;
};

export class UsersController {
  constructor(private readonly usersService = new UsersService()) {}

  getUsers = async (req: Request, res: Response) => {
    const page = parsePositiveInteger(req.query.page, 1, "page");
    const limit = parsePositiveInteger(req.query.limit, 20, "limit");
    const role = req.query.role;
    const status = req.query.status;

    if (limit > 100) {
      throw new AppError("limit must not exceed 100", 400);
    }

    if (role !== undefined && (typeof role !== "string" || !isAppRole(role))) {
      throw new AppError("Invalid role", 400);
    }

    if (
      status !== undefined &&
      (typeof status !== "string" || !isUserStatus(status))
    ) {
      throw new AppError("Invalid status", 400);
    }

    res.json(await this.usersService.getUsers({ page, limit, role, status }));
  };

  updateStatus = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status } = req.body as { status?: string };

    if (typeof userId !== "string" || !userId) {
      throw new AppError("userId is required", 400);
    }

    if (!uuidPattern.test(userId)) {
      throw new AppError("Invalid userId", 400);
    }

    if (!status) {
      throw new AppError("status is required", 400);
    }

    if (!isUserStatus(status)) {
      throw new AppError("Invalid status", 400);
    }

    res.json(await this.usersService.updateStatus({ userId, status }));
  };
}
