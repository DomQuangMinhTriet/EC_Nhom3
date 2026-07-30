CREATE TYPE "public"."branch_status" AS ENUM('pending', 'active', 'suspended', 'closed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('direct', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('Nam', 'Nữ');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."partner_status" AS ENUM('pending', 'active', 'suspended', 'terminated', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'card');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."profile_type" AS ENUM('customer', 'partner', 'branch');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('active', 'deleted', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."role_code" AS ENUM('Super_Admin', 'Operational_Admin', 'Customer', 'Partner', 'Branch');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('banned', 'pending', 'active', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."voucher_code_status" AS ENUM('used', 'expired', 'cancelled', 'available');--> statement-breakpoint
CREATE TYPE "public"."voucher_product_status" AS ENUM('pending', 'out_of_stock', 'active', 'inactive', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE "branch_profiles" (
	"branchProfileId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"partnerProfileId" uuid NOT NULL,
	"branchProfileCode" text NOT NULL,
	"branchName" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"email" text,
	"status" "branch_status" DEFAULT 'pending' NOT NULL,
	"rejectionReason" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branch_profiles_userId_unique" UNIQUE("userId"),
	CONSTRAINT "branch_profiles_branchProfileCode_unique" UNIQUE("branchProfileCode")
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"customerProfileId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"fullName" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"birthDate" date,
	"gender" "gender",
	"avatarUrl" text,
	"address" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "partner_profiles" (
	"partnerProfileId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"partnerProfileCode" text NOT NULL,
	"partnerName" text NOT NULL,
	"taxCode" text NOT NULL,
	"representativeName" text NOT NULL,
	"status" "partner_status" DEFAULT 'pending' NOT NULL,
	"rejectionReason" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_profiles_userId_unique" UNIQUE("userId"),
	CONSTRAINT "partner_profiles_partnerProfileCode_unique" UNIQUE("partnerProfileCode")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"profileId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" "profile_type" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"roleId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roleCode" "role_code" NOT NULL,
	"roleDescription" text DEFAULT '' NOT NULL,
	CONSTRAINT "roles_roleCode_unique" UNIQUE("roleCode")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"roleCode" "role_code" NOT NULL,
	"status" "user_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "branch_voucher_products" (
	"branchProfileId" uuid NOT NULL,
	"voucherProductId" uuid NOT NULL,
	"totalQuantity" integer NOT NULL,
	"soldQuantity" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "branch_voucher_products_branchProfileId_voucherProductId_pk" PRIMARY KEY("branchProfileId","voucherProductId")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"categoryId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"parentCategoryId" uuid
);
--> statement-breakpoint
CREATE TABLE "voucher_codes" (
	"voucherCodeId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voucherProductId" uuid NOT NULL,
	"customerProfileId" uuid NOT NULL,
	"code" text NOT NULL,
	"qr" text NOT NULL,
	"expiredAt" timestamp with time zone NOT NULL,
	"status" "voucher_code_status" DEFAULT 'available' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"usedAt" timestamp with time zone,
	CONSTRAINT "voucher_codes_code_unique" UNIQUE("code"),
	CONSTRAINT "voucher_codes_qr_unique" UNIQUE("qr")
);
--> statement-breakpoint
CREATE TABLE "voucher_products" (
	"voucherProductId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoryId" uuid NOT NULL,
	"partnerProfileId" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"originalPrice" numeric(15, 2) DEFAULT '0' NOT NULL,
	"discountType" "discount_type" NOT NULL,
	"discountValue" numeric(9, 2) DEFAULT '0' NOT NULL,
	"startDate" timestamp with time zone NOT NULL,
	"endDate" timestamp with time zone NOT NULL,
	"validDurationDays" integer DEFAULT 0 NOT NULL,
	"minLimit" integer DEFAULT 1 NOT NULL,
	"maxLimit" integer,
	"imageUrl" text,
	"status" "voucher_product_status" DEFAULT 'pending' NOT NULL,
	"rejectionReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"cartId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customerProfileId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carts_customerProfileId_unique" UNIQUE("customerProfileId")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"cartId" uuid NOT NULL,
	"cartItemId" uuid DEFAULT gen_random_uuid() NOT NULL,
	"voucherProductId" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" numeric(9, 2) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_cartId_cartItemId_pk" PRIMARY KEY("cartId","cartItemId"),
	CONSTRAINT "cart_items_cartId_voucherProductId_unique" UNIQUE("cartId","voucherProductId")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"orderId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cartId" uuid NOT NULL,
	"customerProfileId" uuid NOT NULL,
	"subtotalAmount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"totalAmount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" "order_status" NOT NULL,
	"reason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_cartId_unique" UNIQUE("cartId")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"orderId" uuid NOT NULL,
	"orderItemId" uuid DEFAULT gen_random_uuid() NOT NULL,
	"voucherCodeId" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" numeric(9, 2) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_orderId_orderItemId_pk" PRIMARY KEY("orderId","orderItemId")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"paymentId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transactionId" text NOT NULL,
	"orderId" uuid NOT NULL,
	"paymentMethod" "payment_method" NOT NULL,
	"amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'VND' NOT NULL,
	"status" "payment_status" NOT NULL,
	"reason" text,
	"paidAt" timestamp with time zone DEFAULT now() NOT NULL,
	"refundedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_transactionId_unique" UNIQUE("transactionId")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"reviewId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customerProfileId" uuid NOT NULL,
	"voucherProductId" uuid NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"status" "review_status" DEFAULT 'active' NOT NULL,
	"isEdited" boolean DEFAULT false NOT NULL,
	"editedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"notificationId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customerProfileId" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branch_profiles" ADD CONSTRAINT "branch_profiles_userId_profiles_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("userId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_profiles" ADD CONSTRAINT "branch_profiles_partnerProfileId_partner_profiles_partnerProfileId_fk" FOREIGN KEY ("partnerProfileId") REFERENCES "public"."partner_profiles"("partnerProfileId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_userId_profiles_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("userId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_profiles" ADD CONSTRAINT "partner_profiles_userId_profiles_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("userId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_users_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_roleCode_roles_roleCode_fk" FOREIGN KEY ("roleCode") REFERENCES "public"."roles"("roleCode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_voucher_products" ADD CONSTRAINT "branch_voucher_products_branchProfileId_branch_profiles_branchProfileId_fk" FOREIGN KEY ("branchProfileId") REFERENCES "public"."branch_profiles"("branchProfileId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_voucher_products" ADD CONSTRAINT "branch_voucher_products_voucherProductId_voucher_products_voucherProductId_fk" FOREIGN KEY ("voucherProductId") REFERENCES "public"."voucher_products"("voucherProductId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentCategoryId_categories_categoryId_fk" FOREIGN KEY ("parentCategoryId") REFERENCES "public"."categories"("categoryId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_codes" ADD CONSTRAINT "voucher_codes_voucherProductId_voucher_products_voucherProductId_fk" FOREIGN KEY ("voucherProductId") REFERENCES "public"."voucher_products"("voucherProductId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_codes" ADD CONSTRAINT "voucher_codes_customerProfileId_customer_profiles_customerProfileId_fk" FOREIGN KEY ("customerProfileId") REFERENCES "public"."customer_profiles"("customerProfileId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_products" ADD CONSTRAINT "voucher_products_categoryId_categories_categoryId_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("categoryId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_products" ADD CONSTRAINT "voucher_products_partnerProfileId_partner_profiles_partnerProfileId_fk" FOREIGN KEY ("partnerProfileId") REFERENCES "public"."partner_profiles"("partnerProfileId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customerProfileId_customer_profiles_customerProfileId_fk" FOREIGN KEY ("customerProfileId") REFERENCES "public"."customer_profiles"("customerProfileId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_carts_cartId_fk" FOREIGN KEY ("cartId") REFERENCES "public"."carts"("cartId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_voucherProductId_voucher_products_voucherProductId_fk" FOREIGN KEY ("voucherProductId") REFERENCES "public"."voucher_products"("voucherProductId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cartId_carts_cartId_fk" FOREIGN KEY ("cartId") REFERENCES "public"."carts"("cartId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerProfileId_customer_profiles_customerProfileId_fk" FOREIGN KEY ("customerProfileId") REFERENCES "public"."customer_profiles"("customerProfileId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_orders_orderId_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("orderId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_voucherCodeId_voucher_codes_voucherCodeId_fk" FOREIGN KEY ("voucherCodeId") REFERENCES "public"."voucher_codes"("voucherCodeId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_orders_orderId_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("orderId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerProfileId_customer_profiles_customerProfileId_fk" FOREIGN KEY ("customerProfileId") REFERENCES "public"."customer_profiles"("customerProfileId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_voucherProductId_voucher_products_voucherProductId_fk" FOREIGN KEY ("voucherProductId") REFERENCES "public"."voucher_products"("voucherProductId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customerProfileId_customer_profiles_customerProfileId_fk" FOREIGN KEY ("customerProfileId") REFERENCES "public"."customer_profiles"("customerProfileId") ON DELETE no action ON UPDATE no action;