import { pgEnum } from "drizzle-orm/pg-core";

export const roleCodeEnum = pgEnum("role_code", [
  "Super_Admin",
  "Operational_Admin",
  "Customer",
  "Partner",
  "Branch",
]);

export const userStatusEnum = pgEnum("user_status", [
  "banned",
  "pending",
  "active",
  "deactivated",
]);

export const genderEnum = pgEnum("gender", ["Nam", "Nữ"]);

export const partnerStatusEnum = pgEnum("partner_status", [
  "pending",
  "active",
  "suspended",
  "terminated",
  "rejected",
]);

export const branchStatusEnum = pgEnum("branch_status", [
  "pending",
  "active",
  "suspended",
  "closed",
  "rejected",
]);

export const discountTypeEnum = pgEnum("discount_type", ["direct", "percentage"]);

export const voucherProductStatusEnum = pgEnum("voucher_product_status", [
  "pending",
  "out_of_stock",
  "active",
  "inactive",
  "rejected",
  "expired",
]);

export const voucherCodeStatusEnum = pgEnum("voucher_code_status", [
  "used",
  "expired",
  "cancelled",
  "available",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "completed",
  "failed",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["bank_transfer", "card"]);

export const paymentStatusEnum = pgEnum("payment_status", ["success", "failed"]);

export const reviewStatusEnum = pgEnum("review_status", ["active", "deleted", "hidden"]);
