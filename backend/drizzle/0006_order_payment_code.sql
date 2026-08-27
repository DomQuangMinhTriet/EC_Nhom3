ALTER TABLE "orders" ADD COLUMN "paymentCode" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_paymentCode_unique" UNIQUE("paymentCode");
