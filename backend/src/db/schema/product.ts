import {
  type AnyPgColumn,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  discountTypeEnum,
  voucherCodeStatusEnum,
  voucherProductStatusEnum,
} from "./enums";
import { branchProfile, customerProfile, partnerProfile } from "./account";

export const category = pgTable("categories", {
  categoryId: uuid("categoryId").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  parentCategoryId: uuid("parentCategoryId").references(
    (): AnyPgColumn => category.categoryId,
  ),
});

/**
 * Numeric bounds (originalPrice >= 0, minLimit >= 1, maxLimit >= minLimit,
 * startDate/endDate >= now, ...) are enforced in the service layer, mirroring
 * the previous Sequelize `validate` blocks — see Phase 3 "Validation + Test".
 */
export const voucherProduct = pgTable("voucher_products", {
  voucherProductId: uuid("voucherProductId").defaultRandom().primaryKey(),
  categoryId: uuid("categoryId")
    .notNull()
    .references(() => category.categoryId),
  partnerProfileId: uuid("partnerProfileId")
    .notNull()
    .references(() => partnerProfile.partnerProfileId),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  originalPrice: numeric("originalPrice", { precision: 15, scale: 2 }).notNull().default("0"),
  discountType: discountTypeEnum("discountType").notNull(),
  discountValue: numeric("discountValue", { precision: 9, scale: 2 }).notNull().default("0"),
  startDate: timestamp("startDate", { withTimezone: true }).notNull(),
  endDate: timestamp("endDate", { withTimezone: true }).notNull(),
  validDurationDays: integer("validDurationDays").notNull().default(0),
  minLimit: integer("minLimit").notNull().default(1),
  maxLimit: integer("maxLimit"),
  imageUrl: text("imageUrl"),
  status: voucherProductStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const branchVoucherProduct = pgTable(
  "branch_voucher_products",
  {
    branchProfileId: uuid("branchProfileId")
      .notNull()
      .references(() => branchProfile.branchProfileId),
    voucherProductId: uuid("voucherProductId")
      .notNull()
      .references(() => voucherProduct.voucherProductId),
    totalQuantity: integer("totalQuantity").notNull(),
    soldQuantity: integer("soldQuantity").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.branchProfileId, table.voucherProductId] })],
);

export const voucherCode = pgTable("voucher_codes", {
  voucherCodeId: uuid("voucherCodeId").defaultRandom().primaryKey(),
  voucherProductId: uuid("voucherProductId")
    .notNull()
    .references(() => voucherProduct.voucherProductId),
  customerProfileId: uuid("customerProfileId")
    .notNull()
    .references(() => customerProfile.customerProfileId),
  code: text("code").notNull().unique(),
  qr: text("qr").notNull().unique(),
  expiredAt: timestamp("expiredAt", { withTimezone: true }).notNull(),
  status: voucherCodeStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  usedAt: timestamp("usedAt", { withTimezone: true }),
});
