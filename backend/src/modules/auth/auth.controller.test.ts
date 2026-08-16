import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { AuthController } from "./auth.controller";
import type { AuthService } from "./auth.service";

test("registers a Branch account", async () => {
  let receivedInput: { email: string; password: string } | undefined;
  const payload = {
    message: "Branch registered successfully.",
    user: {
      userId: "00000000-0000-4000-8000-000000000001",
      email: "branch@example.com",
      roleCode: "Branch" as const,
      status: "pending" as const,
    },
  };
  const authService = {
    registerBranch: async (input: { email: string; password: string }) => {
      receivedInput = input;
      return payload;
    },
  } as unknown as AuthService;
  const controller = new AuthController(authService);
  const req = {
    body: { email: "branch@example.com", password: "password" },
  } as Request;
  let statusCode: number | undefined;
  let responseBody: unknown;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  } as Response;

  await controller.registerBranch(req, res);

  assert.deepEqual(receivedInput, {
    email: "branch@example.com",
    password: "password",
  });
  assert.equal(statusCode, 201);
  assert.deepEqual(responseBody, payload);
});

test("rejects Branch registration without credentials", async () => {
  const controller = new AuthController({} as AuthService);
  const req = { body: { email: "branch@example.com" } } as Request;

  await assert.rejects(
    controller.registerBranch(req, {} as Response),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "email and password are required",
  );
});
