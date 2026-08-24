ALTER TABLE "orders" DROP CONSTRAINT "orders_cartId_carts_cartId_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "cartId";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "subtotalAmount";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "discountAmount";