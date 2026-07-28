import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  branchStatusEnum,
  genderEnum,
  partnerStatusEnum,
  profileTypeEnum,
  roleCodeEnum,
  userStatusEnum,
} from "./enums";

export const role = pgTable("roles", {
  roleId: uuid("roleId").defaultRandom().primaryKey(),
  roleCode: roleCodeEnum("roleCode").notNull().unique(),
  roleDescription: text("roleDescription").notNull().default(""),
});

/**
 * userId is NOT auto-generated: Supabase Auth owns identity in auth.users,
 * and a DB trigger inserts a matching row here with userId = auth.users.id.
 * There is no passwordHash column — Supabase Auth is the single source of
 * truth for credentials (see Data Dictionary v3.1 decision, 28/07/2026).
 */
export const user = pgTable("users", {
  userId: uuid("userId").primaryKey(),
  email: text("email").notNull().unique(),
  roleCode: roleCodeEnum("roleCode")
    .notNull()
    .references(() => role.roleCode),
  status: userStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const profile = pgTable("profiles", {
  profileId: uuid("profileId").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => user.userId),
  type: profileTypeEnum("type").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const customerProfile = pgTable("customer_profiles", {
  customerProfileId: uuid("customerProfileId").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => profile.userId),
  fullName: text("fullName").notNull(),
  phone: text("phone").notNull().default(""),
  birthDate: date("birthDate"),
  gender: genderEnum("gender"),
  avatarUrl: text("avatarUrl"),
  address: text("address").notNull().default(""),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const partnerProfile = pgTable("partner_profiles", {
  partnerProfileId: uuid("partnerProfileId").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => profile.userId),
  partnerProfileCode: text("partnerProfileCode").notNull().unique(),
  partnerName: text("partnerName").notNull(),
  taxCode: text("taxCode").notNull(),
  representativeName: text("representativeName").notNull(),
  status: partnerStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejectionReason").notNull().default(""),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const branchProfile = pgTable("branch_profiles", {
  branchProfileId: uuid("branchProfileId").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => profile.userId),
  partnerProfileId: uuid("partnerProfileId")
    .notNull()
    .references(() => partnerProfile.partnerProfileId),
  branchProfileCode: text("branchProfileCode").notNull().unique(),
  branchName: text("branchName").notNull(),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  email: text("email"),
  status: branchStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejectionReason").notNull().default(""),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
