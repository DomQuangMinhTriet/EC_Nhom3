import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { AuthController } from "./auth.controller";
import type { AuthService } from "./auth.service";

test("registers every public signup as a Customer", async () => {
  let receivedInput: { email: string; password: string } | undefined;
  const payload = {
    message: "Registration successful.",
    user: {
      userId: "00000000-0000-4000-8000-000000000001",
      email: "customer@example.com",
      roleCode: "Customer" as const,
      status: "active" as const,
    },
  };
  const authService = {
    registerCustomer: async (input: { email: string; password: string }) => {
      receivedInput = input;
      return payload;
    },
  } as unknown as AuthService;
  const controller = new AuthController(authService);
  const req = {
    body: {
      email: "customer@example.com",
      password: "password",
      roleCode: "Partner",
    },
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

  await controller.registerCustomer(req, res);

  assert.deepEqual(receivedInput, {
    email: "customer@example.com",
    password: "password",
  });
  assert.equal(statusCode, 201);
  assert.deepEqual(responseBody, payload);
});

test("rejects Customer registration without credentials", async () => {
  const controller = new AuthController({} as AuthService);
  const req = { body: { email: "customer@example.com" } } as Request;

  await assert.rejects(
    controller.registerCustomer(req, {} as Response),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "email and password are required",
  );
});
