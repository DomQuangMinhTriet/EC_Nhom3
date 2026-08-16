import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { AuthController } from "./auth.controller";
import type { AuthService } from "./auth.service";

const credentials = {
  email: "account@example.com",
  password: "password",
};

const createResponse = () => {
  let statusCode: number | undefined;
  let body: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  } as Response;

  return {
    response,
    result: () => ({ statusCode, body }),
  };
};

test("delegates each registration flow to its matching service method", async () => {
  const calls: string[] = [];
  const register = (name: string) => async (input: typeof credentials) => {
    calls.push(name);
    assert.deepEqual(input, credentials);
    return { message: name };
  };
  const service = {
    registerCustomer: register("customer"),
    registerSuperAdmin: register("super-admin"),
    registerOperationalAdmin: register("operational-admin"),
    registerBranch: register("branch"),
  } as unknown as AuthService;
  const controller = new AuthController(service);
  const request = { body: credentials } as Request;

  for (const handler of [
    controller.registerCustomer,
    controller.registerSuperAdmin,
    controller.registerOperationalAdmin,
    controller.registerBranch,
  ]) {
    const { response, result } = createResponse();
    await handler(request, response);
    assert.equal(result().statusCode, 201);
  }

  assert.deepEqual(calls, [
    "customer",
    "super-admin",
    "operational-admin",
    "branch",
  ]);
});

test("rejects registration without complete credentials", async () => {
  const controller = new AuthController({} as AuthService);
  const request = { body: { email: "account@example.com" } } as Request;

  for (const handler of [
    controller.registerCustomer,
    controller.registerSuperAdmin,
    controller.registerOperationalAdmin,
    controller.registerBranch,
  ]) {
    await assert.rejects(
      handler(request, {} as Response),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 400 &&
        error.message === "email and password are required",
    );
  }
});
