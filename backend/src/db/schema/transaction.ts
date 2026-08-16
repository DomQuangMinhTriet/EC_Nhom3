import {
  boolean,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  orderStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
  reviewStatusEnum,
} from "./enums";
import { customerProfile } from "./account";
import { voucherCode, voucherProduct } from "./product";

export const cart = pgTable("carts", {
  cartId: uuid("cartId").defaultRandom().primaryKey(),
  customerProfileId: uuid("customerProfileId")
    .notNull()
    .unique()
    .references(() => customerProfile.customerProfileId),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cartItem = pgTable(
  "cart_items",
  {
    cartId: uuid("cartId")
      .notNull()
      .references(() => cart.cartId),
    cartItemId: uuid("cartItemId").defaultRandom().notNull(),
    voucherProductId: uuid("voucherProductId")
      .notNull()
      .references(() => voucherProduct.voucherProductId),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unitPrice", { precision: 9, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.cartId, table.cartItemId] }),
    unique().on(table.cartId, table.voucherProductId),
  ],
);

export const order = pgTable("orders", {
  orderId: uuid("orderId").defaultRandom().primaryKey(),
  cartId: uuid("cartId")
    .notNull()
    .unique()
    .references(() => cart.cartId),
  customerProfileId: uuid("customerProfileId")
    .notNull()
    .references(() => customerProfile.customerProfileId),
  subtotalAmount: numeric("subtotalAmount", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  discountAmount: numeric("discountAmount", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  totalAmount: numeric("totalAmount", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  status: orderStatusEnum("status").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orderItem = pgTable(
  "order_items",
  {
    orderId: uuid("orderId")
      .notNull()
      .references(() => order.orderId),
    orderItemId: uuid("orderItemId").defaultRandom().notNull(),
    voucherCodeId: uuid("voucherCodeId")
      .notNull()
      .references(() => voucherCode.voucherCodeId),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unitPrice", { precision: 9, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.orderId, table.orderItemId] })],
);

export const payment = pgTable("payments", {
  paymentId: uuid("paymentId").defaultRandom().primaryKey(),
  transactionId: text("transactionId").notNull().unique(),
  orderId: uuid("orderId")
    .notNull()
    .references(() => order.orderId),
  paymentMethod: paymentMethodEnum("paymentMethod").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("VND"),
  status: paymentStatusEnum("status").notNull(),
  reason: text("reason"),
  paidAt: timestamp("paidAt", { withTimezone: true }).notNull().defaultNow(),
  refundedAt: timestamp("refundedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const review = pgTable("reviews", {
  reviewId: uuid("reviewId").defaultRandom().primaryKey(),
  customerProfileId: uuid("customerProfileId")
    .notNull()
    .references(() => customerProfile.customerProfileId),
  voucherProductId: uuid("voucherProductId")
    .notNull()
    .references(() => voucherProduct.voucherProductId),
  rating: integer("rating").notNull().default(0),
  comment: text("comment").notNull().default(""),
  status: reviewStatusEnum("status").notNull().default("active"),
  isEdited: boolean("isEdited").notNull().default(false),
  editedAt: timestamp("editedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
