import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { customerProfile } from "./account";

export const notification = pgTable("notifications", {
  notificationId: uuid("notificationId").defaultRandom().primaryKey(),
  customerProfileId: uuid("customerProfileId")
    .notNull()
    .references(() => customerProfile.customerProfileId),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
});
