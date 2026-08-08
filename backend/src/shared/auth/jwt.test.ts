import assert from "node:assert/strict";
import test from "node:test";
import { createTokenPair, verifyToken } from "./jwt";

process.env.JWT_SECRET_KEY = "test-secret-not-for-production";

const user = {
  sub: "00000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  roleCode: "Customer" as const,
  status: "active" as const,
};

test("creates access and refresh tokens with their required types", () => {
  const tokens = createTokenPair(user);

  assert.equal(verifyToken(tokens.accessToken, "access").type, "access");
  assert.equal(verifyToken(tokens.refreshToken, "refresh").type, "refresh");
});

test("rejects a token used for the wrong purpose or with a changed signature", () => {
  const { accessToken } = createTokenPair(user);

  assert.throws(() => verifyToken(accessToken, "refresh"));
  assert.throws(() =>
    verifyToken(`${accessToken.slice(0, -1)}x`, "access"),
  );
});
