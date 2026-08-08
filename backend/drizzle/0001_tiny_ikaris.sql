ALTER TABLE "branch_profiles" DROP CONSTRAINT IF EXISTS "branch_profiles_userId_profiles_userId_fk";
--> statement-breakpoint
ALTER TABLE "customer_profiles" DROP CONSTRAINT IF EXISTS "customer_profiles_userId_profiles_userId_fk";
--> statement-breakpoint
ALTER TABLE "partner_profiles" DROP CONSTRAINT IF EXISTS "partner_profiles_userId_profiles_userId_fk";
--> statement-breakpoint
ALTER TABLE IF EXISTS "profiles" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP TABLE IF EXISTS "profiles";
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'branch_profiles_userId_users_userId_fk'
  ) THEN
    ALTER TABLE "branch_profiles"
      ADD CONSTRAINT "branch_profiles_userId_users_userId_fk"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("userId")
      ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_profiles_userId_users_userId_fk'
  ) THEN
    ALTER TABLE "customer_profiles"
      ADD CONSTRAINT "customer_profiles_userId_users_userId_fk"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("userId")
      ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_profiles_userId_users_userId_fk'
  ) THEN
    ALTER TABLE "partner_profiles"
      ADD CONSTRAINT "partner_profiles_userId_users_userId_fk"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("userId")
      ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."profile_type";
