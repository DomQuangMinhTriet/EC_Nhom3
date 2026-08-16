import { supabaseAuth } from "../../lib/supabaseAuth";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { AppError } from "../../shared/errors/AppError";
import { createTokenPair, verifyToken } from "../../shared/auth/jwt";
import type { AppRole } from "../../shared/auth/jwt";
import { AuthRepository } from "./auth.repository";

type LoginInput = {
  email: string;
  password: string;
};

const authResponse = (user: {
  userId: string;
  email: string;
  roleCode: AppRole;
  status: "banned" | "pending" | "active" | "deactivated";
}) => ({
  user,
  ...createTokenPair({
    sub: user.userId,
    email: user.email,
    roleCode: user.roleCode,
    status: user.status,
  }),
});

export class AuthService {
  constructor(private readonly authRepository = new AuthRepository()) {}

  async registerSuperAdmin({ email, password }: LoginInput) {
    return this.registerAdmin(
      email,
      password,
      "Super_Admin",
      "Super Admin registered successfully.",
    );
  }

  async registerOperationalAdmin({ email, password }: LoginInput) {
    return this.registerAdmin(
      email,
      password,
      "Operational_Admin",
      "Operational Admin registered successfully.",
    );
  }

  async registerCustomer({ email, password }: LoginInput) {
    return this.registerSelf({
      email,
      password,
    });
  }

  private async registerAdmin(
    email: string,
    password: string,
    roleCode: "Super_Admin" | "Operational_Admin",
    message: string,
  ) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { roleCode },
    });

    if (error) {
      throw new AppError(error.message, 400);
    }

    if (!data.user?.id || !data.user.email) {
      throw new AppError("Supabase did not return a registered user", 502);
    }

    const localUser = await this.authRepository.upsertUser({
      userId: data.user.id,
      email: data.user.email,
      roleCode,
      status: "active",
    });

    if (!localUser) {
      throw new AppError("Could not create local user", 500);
    }

    return {
      message,
      user: localUser,
    };
  }

  private async registerSelf({ email, password }: LoginInput) {
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { roleCode: "Customer" },
      },
    });

    if (error) {
      throw new AppError(error.message, 400);
    }

    if (!data.user?.id || !data.user.email) {
      throw new AppError("Supabase did not return a registered user", 502);
    }

    const localUser = await this.authRepository.upsertUser({
      userId: data.user.id,
      email: data.user.email,
      roleCode: "Customer",
      status: "active",
    });

    if (!localUser) {
      throw new AppError("Could not create local user", 500);
    }

    return {
      message: "Registration successful.",
      user: localUser,
    };
  }

  async login({ email, password }: LoginInput) {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError(error.message, 401);
    }

    if (!data.user?.id || !data.user.email) {
      throw new AppError("Supabase did not return an authenticated user", 502);
    }

    let localUser = await this.authRepository.findUserById(data.user.id);

    if (!localUser) {
      localUser = await this.authRepository.upsertUser({
        userId: data.user.id,
        email: data.user.email,
      });
    }

    if (!localUser) {
      throw new AppError("Could not load local user", 500);
    }

    if (localUser.status !== "active") {
      throw new AppError("Account is not active", 403);
    }

    return authResponse(localUser);
  }

  async refresh(refreshToken: string) {
    const payload = verifyToken(refreshToken, "refresh");
    const localUser = await this.authRepository.findUserById(payload.sub);

    if (!localUser) {
      throw new AppError("User not found", 401);
    }

    return authResponse(localUser);
  }
}
