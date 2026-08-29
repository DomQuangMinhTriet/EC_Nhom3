import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { supabaseAuth } from "../../lib/supabaseAuth";
import type { AppRole, UserStatus } from "../../shared/auth/jwt";
import { createTokenPair, verifyToken } from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors/AppError";
import { AuthRepository } from "./auth.repository";

type CredentialsInput = {
  email: string;
  password: string;
};

type ManagedRole = "Super_Admin" | "Operational_Admin" | "Partner" | "Branch";

const authResponse = (user: {
  userId: string;
  email: string;
  roleCode: AppRole;
  status: UserStatus;
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

  async registerCustomer({ email, password }: CredentialsInput) {
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

  async registerSuperAdmin(input: CredentialsInput) {
    return this.registerManagedAccount({
      ...input,
      roleCode: "Super_Admin",
      status: "active",
      message: "Super Admin registered successfully.",
    });
  }

  async registerOperationalAdmin(input: CredentialsInput) {
    return this.registerManagedAccount({
      ...input,
      roleCode: "Operational_Admin",
      status: "active",
      message: "Operational Admin registered successfully.",
    });
  }

  async registerPartner(input: CredentialsInput) {
    return this.registerManagedAccount({
      ...input,
      roleCode: "Partner",
      status: "active",
      message: "Partner registered successfully.",
    });
  }

  async registerBranch(input: CredentialsInput) {
    return this.registerManagedAccount({
      ...input,
      roleCode: "Branch",
      status: "pending",
      message: "Branch registered successfully.",
    });
  }

  private async registerManagedAccount({
    email,
    password,
    roleCode,
    status,
    message,
  }: CredentialsInput & {
    roleCode: ManagedRole;
    status: UserStatus;
    message: string;
  }) {
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
      status,
    });

    if (!localUser) {
      throw new AppError("Could not create local user", 500);
    }

    return { message, user: localUser };
  }

  async login({ email, password }: CredentialsInput) {
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

  async forgotPassword(email: string) {
    const appBaseUrl = process.env.APP_BASE_URL;

    if (!appBaseUrl) {
      throw new AppError("APP_BASE_URL is not configured", 500);
    }

    // Supabase's own response here doesn't leak whether the email exists,
    // and we deliberately return the same generic message regardless so
    // this endpoint can't be used to enumerate registered accounts.
    await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${appBaseUrl}/update-password`,
    });

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const localUser = await this.authRepository.findUserById(userId);

    if (!localUser) {
      throw new AppError("User not found", 404);
    }

    const { error: verifyError } = await supabaseAuth.auth.signInWithPassword({
      email: localUser.email,
      password: currentPassword,
    });

    if (verifyError) {
      throw new AppError("Current password is incorrect", 401);
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (updateError) {
      throw new AppError(updateError.message, 400);
    }

    return { message: "Password updated successfully." };
  }
}
