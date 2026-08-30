import assert from "node:assert/strict";
import test from "node:test";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { supabaseAuth } from "../../lib/supabaseAuth";
import { createRefreshToken } from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors/AppError";
import type { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

process.env.JWT_SECRET_KEY ??= "test-secret";
// Force this rather than `??=` — local dev's .env already sets APP_BASE_URL
// to localhost, which would otherwise silently win here and break the
// redirectTo assertion below.
process.env.APP_BASE_URL = "https://ec-voucher-demo.example";

const credentials = {
  email: "account@example.com",
  password: "strong-password",
};

const userId = "00000000-0000-4000-8000-000000000001";

const localUser = {
  userId,
  email: credentials.email,
  roleCode: "Customer" as const,
  status: "active" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const supabaseUser = {
  id: userId,
  email: credentials.email,
};

const createRepository = (overrides: Partial<AuthRepository> = {}) =>
  ({
    findUserById: async () => localUser,
    findUserByEmail: async () => localUser,
    upsertUser: async () => localUser,
    findPartnerStatusByUserId: async () => null,
    findBranchStatusByUserId: async () => null,
    ...overrides,
  }) as AuthRepository;

const withSupabaseAuth = async <T>(
  overrides: Record<string, unknown>,
  run: () => Promise<T>,
) => {
  const originals = new Map<PropertyKey, unknown>();

  for (const [key, value] of Object.entries(overrides)) {
    originals.set(key, supabaseAuth.auth[key as keyof typeof supabaseAuth.auth]);
    Object.assign(supabaseAuth.auth, { [key]: value });
  }

  try {
    return await run();
  } finally {
    for (const [key, value] of originals) {
      Object.assign(supabaseAuth.auth, { [key]: value });
    }
  }
};

const withSupabaseAdminAuth = async <T>(
  overrides: Record<string, unknown>,
  run: () => Promise<T>,
) => {
  const originals = new Map<PropertyKey, unknown>();

  for (const [key, value] of Object.entries(overrides)) {
    originals.set(
      key,
      supabaseAdmin.auth.admin[key as keyof typeof supabaseAdmin.auth.admin],
    );
    Object.assign(supabaseAdmin.auth.admin, { [key]: value });
  }

  try {
    return await run();
  } finally {
    for (const [key, value] of originals) {
      Object.assign(supabaseAdmin.auth.admin, { [key]: value });
    }
  }
};

test("registers a customer through Supabase Auth and creates an active local user", async () => {
  const repository = createRepository({
    upsertUser: async (input) => {
      assert.deepEqual(input, {
        userId,
        email: credentials.email,
        roleCode: "Customer",
        status: "active",
      });

      return { ...localUser, ...input };
    },
  });
  const service = new AuthService(repository);

  await withSupabaseAuth(
    {
      signUp: async (input: unknown) => {
        assert.deepEqual(input, {
          ...credentials,
          options: { data: { roleCode: "Customer" } },
        });

        return { data: { user: supabaseUser }, error: null };
      },
    },
    async () => {
      const result = await service.registerCustomer(credentials);

      assert.equal(result.message, "Registration successful.");
      assert.equal(result.user.roleCode, "Customer");
      assert.equal(result.user.status, "active");
    },
  );
});

test("registers managed accounts with the expected roles and statuses", async () => {
  const cases = [
    {
      name: "super admin",
      register: (service: AuthService) => service.registerSuperAdmin(credentials),
      roleCode: "Super_Admin",
      status: "active",
      message: "Super Admin registered successfully.",
    },
    {
      name: "operational admin",
      register: (service: AuthService) =>
        service.registerOperationalAdmin(credentials),
      roleCode: "Operational_Admin",
      status: "active",
      message: "Operational Admin registered successfully.",
    },
    {
      name: "partner",
      register: (service: AuthService) => service.registerPartner(credentials),
      roleCode: "Partner",
      status: "active",
      message: "Partner registered successfully.",
    },
    {
      name: "branch",
      register: (service: AuthService) => service.registerBranch(credentials),
      roleCode: "Branch",
      status: "pending",
      message: "Branch registered successfully.",
    },
  ] as const;

  for (const item of cases) {
    const repository = createRepository({
      upsertUser: async (input) => {
        assert.equal(input.roleCode, item.roleCode, item.name);
        assert.equal(input.status, item.status, item.name);
        return { ...localUser, ...input };
      },
    });
    const service = new AuthService(repository);

    await withSupabaseAdminAuth(
      {
        createUser: async (input: unknown) => {
          assert.deepEqual(
            input,
            {
              ...credentials,
              email_confirm: true,
              user_metadata: { roleCode: item.roleCode },
            },
            item.name,
          );

          return { data: { user: supabaseUser }, error: null };
        },
      },
      async () => {
        const result = await item.register(service);

        assert.equal(result.message, item.message);
        assert.equal(result.user.roleCode, item.roleCode);
        assert.equal(result.user.status, item.status);
      },
    );
  }
});

test("surfaces Supabase registration errors as 400", async () => {
  const service = new AuthService(createRepository());

  await withSupabaseAuth(
    {
      signUp: async () => ({
        data: { user: null },
        error: { message: "Email already registered" },
      }),
    },
    async () => {
      await assert.rejects(
        service.registerCustomer(credentials),
        (error: unknown) =>
          error instanceof AppError &&
          error.statusCode === 400 &&
          error.message === "Email already registered",
      );
    },
  );
});

test("rejects login when Supabase denies credentials", async () => {
  const service = new AuthService(createRepository());

  await withSupabaseAuth(
    {
      signInWithPassword: async () => ({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      }),
    },
    async () => {
      await assert.rejects(
        service.login(credentials),
        (error: unknown) =>
          error instanceof AppError &&
          error.statusCode === 401 &&
          error.message === "Invalid login credentials",
      );
    },
  );
});

test("logs in active users and returns token pair", async () => {
  const service = new AuthService(createRepository());

  await withSupabaseAuth(
    {
      signInWithPassword: async (input: unknown) => {
        assert.deepEqual(input, credentials);
        return { data: { user: supabaseUser }, error: null };
      },
    },
    async () => {
      const result = await service.login(credentials);

      assert.equal(result.user.userId, userId);
      assert.equal(result.user.status, "active");
      assert.equal(typeof result.accessToken, "string");
      assert.equal(typeof result.refreshToken, "string");
    },
  );
});

test("creates a local user during login when one does not exist", async () => {
  const repository = createRepository({
    findUserById: async () => undefined,
    upsertUser: async (input) => {
      assert.deepEqual(input, {
        userId,
        email: credentials.email,
      });

      return localUser;
    },
  });
  const service = new AuthService(repository);

  await withSupabaseAuth(
    {
      signInWithPassword: async () => ({
        data: { user: supabaseUser },
        error: null,
      }),
    },
    async () => {
      const result = await service.login(credentials);

      assert.equal(result.user.userId, userId);
    },
  );
});

test("rejects login for inactive local users", async () => {
  const service = new AuthService(
    createRepository({
      findUserById: async () => ({ ...localUser, status: "pending" }),
    }),
  );

  await withSupabaseAuth(
    {
      signInWithPassword: async () => ({
        data: { user: supabaseUser },
        error: null,
      }),
    },
    async () => {
      await assert.rejects(
        service.login(credentials),
        (error: unknown) =>
          error instanceof AppError &&
          error.statusCode === 403 &&
          error.message === "Account is not active",
      );
    },
  );
});

test("logs in a Partner who hasn't created a profile yet (no profile row means allowed)", async () => {
  const service = new AuthService(
    createRepository({
      findUserById: async () => ({ ...localUser, roleCode: "Partner" }),
      findPartnerStatusByUserId: async () => null,
    }),
  );

  await withSupabaseAuth(
    {
      signInWithPassword: async () => ({ data: { user: supabaseUser }, error: null }),
    },
    async () => {
      const result = await service.login(credentials);
      assert.equal(result.user.userId, userId);
    },
  );
});

test("rejects login for a suspended Partner even though users.status is active", async () => {
  const service = new AuthService(
    createRepository({
      findUserById: async () => ({ ...localUser, roleCode: "Partner" }),
      findPartnerStatusByUserId: async () => "suspended",
    }),
  );

  await withSupabaseAuth(
    {
      signInWithPassword: async () => ({ data: { user: supabaseUser }, error: null }),
    },
    async () => {
      await assert.rejects(
        service.login(credentials),
        (error: unknown) =>
          error instanceof AppError &&
          error.statusCode === 403 &&
          error.message === "Partner account is not active",
      );
    },
  );
});

test("rejects login for a terminated Branch even though users.status is active", async () => {
  const service = new AuthService(
    createRepository({
      findUserById: async () => ({ ...localUser, roleCode: "Branch" }),
      findBranchStatusByUserId: async () => "closed",
    }),
  );

  await withSupabaseAuth(
    {
      signInWithPassword: async () => ({ data: { user: supabaseUser }, error: null }),
    },
    async () => {
      await assert.rejects(
        service.login(credentials),
        (error: unknown) =>
          error instanceof AppError &&
          error.statusCode === 403 &&
          error.message === "Branch account is not active",
      );
    },
  );
});

test("refreshes tokens for an existing user", async () => {
  const service = new AuthService(createRepository());
  const refreshToken = createRefreshToken({
    sub: localUser.userId,
    email: localUser.email,
    roleCode: localUser.roleCode,
    status: localUser.status,
  });

  const result = await service.refresh(refreshToken);

  assert.equal(result.user.userId, userId);
  assert.equal(typeof result.accessToken, "string");
  assert.equal(typeof result.refreshToken, "string");
});

test("rejects refresh tokens for missing users", async () => {
  const service = new AuthService(
    createRepository({
      findUserById: async () => undefined,
    }),
  );
  const refreshToken = createRefreshToken({
    sub: localUser.userId,
    email: localUser.email,
    roleCode: localUser.roleCode,
    status: localUser.status,
  });

  await assert.rejects(
    service.refresh(refreshToken),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 401 &&
      error.message === "User not found",
  );
});

test("rejects refresh for a user banned after the refresh token was issued", async () => {
  const service = new AuthService(
    createRepository({
      findUserById: async () => ({ ...localUser, status: "banned" }),
    }),
  );
  const refreshToken = createRefreshToken({
    sub: localUser.userId,
    email: localUser.email,
    roleCode: localUser.roleCode,
    status: localUser.status,
  });

  await assert.rejects(
    service.refresh(refreshToken),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 403 &&
      error.message === "Account is not active",
  );
});

test("rejects refresh for a Partner suspended after the refresh token was issued", async () => {
  const service = new AuthService(
    createRepository({
      findUserById: async () => ({ ...localUser, roleCode: "Partner" }),
      findPartnerStatusByUserId: async () => "terminated",
    }),
  );
  const refreshToken = createRefreshToken({
    sub: localUser.userId,
    email: localUser.email,
    roleCode: "Partner",
    status: localUser.status,
  });

  await assert.rejects(
    service.refresh(refreshToken),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 403 &&
      error.message === "Partner account is not active",
  );
});

test("forgotPassword always returns a generic message", async () => {
  const service = new AuthService(createRepository());

  await withSupabaseAuth(
    {
      resetPasswordForEmail: async (email: string, options: unknown) => {
        assert.equal(email, credentials.email);
        assert.deepEqual(options, {
          redirectTo: "https://ec-voucher-demo.example/update-password",
        });
        return { data: {}, error: null };
      },
    },
    async () => {
      const result = await service.forgotPassword(credentials.email);
      assert.equal(
        result.message,
        "If an account with that email exists, a password reset link has been sent.",
      );
    },
  );
});

test("changePassword succeeds when the current password is correct", async () => {
  const service = new AuthService(createRepository());

  await withSupabaseAuth(
    {
      signInWithPassword: async (input: unknown) => {
        assert.deepEqual(input, {
          email: credentials.email,
          password: "current-password",
        });
        return { data: { user: supabaseUser }, error: null };
      },
    },
    () =>
      withSupabaseAdminAuth(
        {
          updateUserById: async (id: string, attrs: unknown) => {
            assert.equal(id, userId);
            assert.deepEqual(attrs, { password: "new-password-123" });
            return { data: { user: supabaseUser }, error: null };
          },
        },
        async () => {
          const result = await service.changePassword(
            userId,
            "current-password",
            "new-password-123",
          );
          assert.equal(result.message, "Password updated successfully.");
        },
      ),
  );
});

test("changePassword rejects an incorrect current password", async () => {
  const service = new AuthService(createRepository());

  await withSupabaseAuth(
    {
      signInWithPassword: async () => ({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      }),
    },
    async () => {
      await assert.rejects(
        service.changePassword(userId, "wrong-password", "new-password-123"),
        (error: unknown) =>
          error instanceof AppError &&
          error.statusCode === 401 &&
          error.message === "Current password is incorrect",
      );
    },
  );
});

test("changePassword rejects when the user no longer exists", async () => {
  const service = new AuthService(
    createRepository({ findUserById: async () => undefined }),
  );

  await assert.rejects(
    service.changePassword(userId, "current-password", "new-password-123"),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "User not found",
  );
});
