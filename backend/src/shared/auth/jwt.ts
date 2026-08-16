import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "../errors/AppError";

const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;
const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

export type AppRole =
  "Super_Admin" | "Operational_Admin" | "Customer" | "Partner" | "Branch";

export type UserStatus = "banned" | "pending" | "active" | "deactivated";

export type TokenType = "access" | "refresh";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  roleCode: AppRole;
  status: UserStatus;
  type: TokenType;
};

type JwtPayload = AuthTokenPayload & {
  iat: number;
  exp: number;
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET_KEY;

  if (!secret) {
    throw new AppError("JWT_SECRET_KEY is not configured", 500);
  }

  return secret;
};

const encodeBase64Url = (value: string | Buffer) =>
  Buffer.from(value).toString("base64url");

const decodeBase64Url = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const signPart = (value: string) =>
  createHmac("sha256", getJwtSecret()).update(value).digest("base64url");

const signToken = (payload: AuthTokenPayload, expiresInSeconds: number) => {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encodeBase64Url(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds }),
  );
  const unsignedToken = `${header}.${body}`;
  const signature = signPart(unsignedToken);

  return `${unsignedToken}.${signature}`;
};

export const createAccessToken = (payload: Omit<AuthTokenPayload, "type">) =>
  signToken({ ...payload, type: "access" }, ACCESS_TOKEN_EXPIRES_IN_SECONDS);

export const createRefreshToken = (payload: Omit<AuthTokenPayload, "type">) =>
  signToken({ ...payload, type: "refresh" }, REFRESH_TOKEN_EXPIRES_IN_SECONDS);

export const verifyToken = (token: string, expectedType: TokenType) => {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    throw new AppError("Invalid token", 401);
  }

  const expectedSignature = signPart(`${header}.${body}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new AppError("Invalid token", 401);
  }

  let payload: JwtPayload;

  try {
    payload = JSON.parse(decodeBase64Url(body)) as JwtPayload;
  } catch {
    throw new AppError("Invalid token", 401);
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload.exp <= now) {
    throw new AppError("Token expired", 401);
  }

  if (payload.type !== expectedType) {
    throw new AppError("Invalid token type", 401);
  }

  return payload;
};

export const createTokenPair = (payload: Omit<AuthTokenPayload, "type">) => ({
  accessToken: createAccessToken(payload),
  refreshToken: createRefreshToken(payload),
});
