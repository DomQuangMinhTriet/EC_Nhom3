import { supabaseAuth } from "../../lib/supabaseAuth";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { AppError } from "../../shared/errors/AppError";
import { createTokenPair, verifyToken } from "../../shared/auth/jwt";
import type { AppRole } from "../../shared/auth/jwt";
import { AuthRepository } from "./auth.repository";

type RegisterInput = {
  email: string;
  password: string;
  roleCode?: AppRole;
};

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

  async registerBranch({ email, password }: LoginInput) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { roleCode: "Branch" },
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
      roleCode: "Branch",
      status: "pending",
    });

    if (!localUser) {
      throw new AppError("Could not create local user", 500);
    }

    return {
      message: "Branch registered successfully.",
      user: localUser,
    };
  }

  async register({ email, password, roleCode = "Customer" }: RegisterInput) {
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { roleCode },
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
      roleCode,
    });

    if (!localUser) {
      throw new AppError("Could not create local user", 500);
    }

    return {
      message:
        "Registration successful. Please verify your email before logging in.",
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
