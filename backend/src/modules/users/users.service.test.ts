import assert from "node:assert/strict";
import test from "node:test";
import type { UserStatus } from "../../shared/auth/jwt";
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

const createRepository = (overrides: Partial<UsersRepository> = {}) =>
  ({
    findAll: async () => ({ users: [], total: 0 }),
    updateStatus: async () => undefined,
    ...overrides,
  }) as UsersRepository;

test("returns users with pagination metadata", async () => {
  const repository = createRepository({
    findAll: async (page, limit, role, status) => {
      assert.equal(page, 2);
      assert.equal(limit, 10);
      assert.equal(role, "Customer");
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
  });

  assert.deepEqual(result.users, [existingUser]);
  assert.deepEqual(result.pagination, {
    page: 2,
    limit: 10,
    total: 21,
    totalPages: 3,
  });
});

test("updates a user's status", async () => {
  const repository = createRepository({
    updateStatus: async (userId: string, status: UserStatus) => ({
      ...existingUser,
      userId,
      status,
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    }),
  });
  const service = new UsersService(repository);

  const result = await service.updateStatus({
    userId: existingUser.userId,
    status: "banned",
  });

  assert.equal(result.message, "User status updated successfully.");
  assert.equal(result.user.status, "banned");
});

test("throws 404 when updating a missing user", async () => {
  const service = new UsersService(createRepository());

  await assert.rejects(
    service.updateStatus({
      userId: "00000000-0000-4000-8000-000000000099",
      status: "active",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "User not found",
  );
});
