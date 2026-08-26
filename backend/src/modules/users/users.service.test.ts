import assert from "node:assert/strict";
import test from "node:test";
import type { AppRole, UserStatus } from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors/AppError";
import type { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

const existingUser = {
  userId: "00000000-0000-4000-8000-000000000001",
  email: "customer@example.com",
  roleCode: "Customer" as const,
  status: "active" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const partnerUser = {
  ...existingUser,
  userId: "00000000-0000-4000-8000-000000000002",
  email: "partner@example.com",
  roleCode: "Partner" as const,
};

const superAdminUser = {
  ...existingUser,
  userId: "00000000-0000-4000-8000-000000000003",
  email: "super-admin@example.com",
  roleCode: "Super_Admin" as const,
};

const createRepository = (overrides: Partial<UsersRepository> = {}) =>
  ({
    findAll: async () => ({ users: [], total: 0 }),
    findById: async () => existingUser,
    updateUser: async () => undefined,
    ...overrides,
  }) as UsersRepository;

test("returns users with pagination metadata", async () => {
  const repository = createRepository({
    findAll: async (page, limit, roles, status) => {
      assert.equal(page, 2);
      assert.equal(limit, 10);
      assert.deepEqual(roles, ["Customer"]);
      assert.equal(status, "active");
      return { users: [existingUser], total: 21 };
    },
  });
  const service = new UsersService(repository);

  const result = await service.getUsers({
    page: 2,
    limit: 10,
    role: "Customer",
    status: "active",
    actorRole: "Super_Admin",
  });

  assert.deepEqual(result.users, [existingUser]);
  assert.deepEqual(result.pagination, {
    page: 2,
    limit: 10,
    total: 21,
    totalPages: 3,
  });
});

test("limits Operational Admin user listings to Partner and Branch", async () => {
  const repository = createRepository({
    findAll: async (_page, _limit, roles) => {
      assert.deepEqual(roles, ["Partner", "Branch"]);
      return { users: [], total: 0 };
    },
  });
  const service = new UsersService(repository);

  await service.getUsers({
    page: 1,
    limit: 20,
    actorRole: "Operational_Admin",
  });
});

test("rejects an Operational Admin role filter outside their scope", async () => {
  const service = new UsersService(createRepository());

  await assert.rejects(
    service.getUsers({
      page: 1,
      limit: 20,
      role: "Customer",
      actorRole: "Operational_Admin",
    }),
    (error: unknown) =>
      error instanceof AppError && error.statusCode === 403,
  );
});

test("updates a user's status", async () => {
  const repository = createRepository({
    updateUser: async (
      userId: string,
      updates: { status?: UserStatus; roleCode?: AppRole },
    ) => ({
      ...existingUser,
      userId,
      ...updates,
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    }),
  });
  const service = new UsersService(repository);

  const result = await service.updateUser({
    userId: existingUser.userId,
    status: "banned",
    actorRole: "Super_Admin",
  });

  assert.equal(result.message, "User updated successfully.");
  assert.equal(result.user.status, "banned");
});

test("allows Operational Admin to update a Partner user's status", async () => {
  const repository = createRepository({
    findById: async () => partnerUser,
    updateUser: async (userId, updates) => ({
      ...partnerUser,
      userId,
      ...updates,
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    }),
  });
  const service = new UsersService(repository);

  const result = await service.updateUser({
    userId: partnerUser.userId,
    status: "banned",
    actorRole: "Operational_Admin",
  });

  assert.equal(result.message, "User updated successfully.");
  assert.equal(result.user.status, "banned");
});

test("prevents Operational Admin from updating a Super Admin's status", async () => {
  const service = new UsersService(createRepository({ findById: async () => superAdminUser }));

  await assert.rejects(
    service.updateUser({
      userId: superAdminUser.userId,
      status: "banned",
      actorRole: "Operational_Admin",
    }),
    (error: unknown) =>
      error instanceof AppError && error.statusCode === 403,
  );
});

test("prevents Operational Admin from updating a Customer's status", async () => {
  const service = new UsersService(createRepository({ findById: async () => existingUser }));

  await assert.rejects(
    service.updateUser({
      userId: existingUser.userId,
      status: "banned",
      actorRole: "Operational_Admin",
    }),
    (error: unknown) =>
      error instanceof AppError && error.statusCode === 403,
  );
});

test("throws 404 when Operational Admin updates a missing user", async () => {
  const service = new UsersService(createRepository({ findById: async () => null }));

  await assert.rejects(
    service.updateUser({
      userId: "00000000-0000-4000-8000-000000000099",
      status: "banned",
      actorRole: "Operational_Admin",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "User not found",
  );
});

test("allows Super Admin to update a user's role", async () => {
  const repository = createRepository({
    updateUser: async (userId, updates) => ({
      ...existingUser,
      ...updates,
      userId,
    }),
  });
  const service = new UsersService(repository);

  const result = await service.updateUser({
    userId: existingUser.userId,
    roleCode: "Operational_Admin",
    actorRole: "Super_Admin",
  });

  assert.equal(result.user.roleCode, "Operational_Admin");
});

test("prevents Operational Admin from updating user roles", async () => {
  const service = new UsersService(createRepository());

  await assert.rejects(
    service.updateUser({
      userId: existingUser.userId,
      roleCode: "Super_Admin",
      actorRole: "Operational_Admin",
    }),
    (error: unknown) =>
      error instanceof AppError && error.statusCode === 403,
  );
});

test("throws 404 when updating a missing user", async () => {
  const service = new UsersService(createRepository());

  await assert.rejects(
    service.updateUser({
      userId: "00000000-0000-4000-8000-000000000099",
      status: "active",
      actorRole: "Super_Admin",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "User not found",
  );
});
