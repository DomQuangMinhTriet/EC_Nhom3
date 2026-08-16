import type { Request, Response } from "express";
import type { AppRole } from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors/AppError";
import { AuthService } from "./auth.service";

const appRoles = [
  "Super_Admin",
  "Operational_Admin",
  "Customer",
  "Partner",
  "Branch",
] as const satisfies readonly AppRole[];

const isAppRole = (value: string): value is AppRole =>
  appRoles.includes(value as AppRole);

const selfRegisterRoles = ["Customer", "Partner", "Branch"] as const satisfies readonly AppRole[];

const isSelfRegisterRole = (value: AppRole) =>
  selfRegisterRoles.includes(value as (typeof selfRegisterRoles)[number]);

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  register = async (req: Request, res: Response) => {
    const { email, password, roleCode } = req.body as {
      email?: string;
      password?: string;
      roleCode?: string;
    };

    if (!email || !password) {
      throw new AppError("email and password are required", 400);
    }

    let registerRoleCode: AppRole | undefined;

    if (roleCode) {
      if (!isAppRole(roleCode)) {
        throw new AppError("Invalid roleCode", 400);
      }

      if (!isSelfRegisterRole(roleCode)) {
        throw new AppError("This role cannot self-register", 403);
      }

      registerRoleCode = roleCode;
    }

    const result = await this.authService.register({
      email,
      password,
      roleCode: registerRoleCode,
    });

    res.status(201).json(result);
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      throw new AppError("email and password are required", 400);
    }

    res.json(await this.authService.login({ email, password }));
  };

  refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      throw new AppError("refreshToken is required", 400);
    }

    res.json(await this.authService.refresh(refreshToken));
  };
}
