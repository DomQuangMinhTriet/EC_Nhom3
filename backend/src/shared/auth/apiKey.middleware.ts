import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError";

export const requireEcVoucherApiKey: RequestHandler = (req, _res, next) => {
  const configuredApiKey = process.env.EC_VOUCHER_API_KEY;
  const requestApiKey = req.header("ec-voucher-api-key");

  if (!configuredApiKey) {
    throw new AppError("EC_VOUCHER_API_KEY is not configured", 500);
  }

  if (requestApiKey !== configuredApiKey) {
    throw new AppError("Invalid EC Voucher API key", 401);
  }

  next();
};
