ALTER TABLE "order_items" ALTER COLUMN "voucherCodeId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "voucherProductId" uuid;--> statement-breakpoint
UPDATE "order_items"
SET "voucherProductId" = "voucher_codes"."voucherProductId"
FROM "voucher_codes"
WHERE "order_items"."voucherCodeId" = "voucher_codes"."voucherCodeId";--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "voucherProductId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_voucherProductId_voucher_products_voucherProductId_fk" FOREIGN KEY ("voucherProductId") REFERENCES "public"."voucher_products"("voucherProductId") ON DELETE no action ON UPDATE no action;
