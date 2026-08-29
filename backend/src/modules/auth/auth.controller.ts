import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  registerCustomer = async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      throw new AppError("email and password are required", 400);
    }

    res
      .status(201)
      .json(await this.authService.registerCustomer({ email, password }));
  };

  registerSuperAdmin = async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      throw new AppError("email and password are required", 400);
    }

    res
      .status(201)
      .json(await this.authService.registerSuperAdmin({ email, password }));
  };

  registerOperationalAdmin = async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      throw new AppError("email and password are required", 400);
    }

    res
      .status(201)
      .json(
        await this.authService.registerOperationalAdmin({ email, password }),
      );
  };

  registerPartner = async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      throw new AppError("email and password are required", 400);
    }

    res
      .status(201)
      .json(await this.authService.registerPartner({ email, password }));
  };

  registerBranch = async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      throw new AppError("email and password are required", 400);
    }

    res
      .status(201)
      .json(await this.authService.registerBranch({ email, password }));
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

  forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };

    if (!email) {
      throw new AppError("email is required", 400);
    }

    res.json(await this.authService.forgotPassword(email));
  };

  changePassword = async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      throw new AppError(
        "currentPassword and newPassword are required",
        400,
      );
    }

    if (newPassword.length < 8) {
      throw new AppError("newPassword must be at least 8 characters", 400);
    }

    res.json(
      await this.authService.changePassword(
        req.user!.userId,
        currentPassword,
        newPassword,
      ),
    );
  };
}
