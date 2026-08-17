import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const fallbackSupabaseUrl = "http://127.0.0.1:54321";
const fallbackServiceRoleKey = "missing-supabase-service-role-key";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình — supabaseAdmin sẽ lỗi khi gọi.",
  );
}

/**
 * Server-side client using the service role key: verify JWTs, run admin
 * operations (approve partner/branch, etc). Never expose this key to the
 * frontend — that's what SUPABASE_ANON_KEY + supabase-js (client) is for.
 */
export const supabaseAdmin = createClient(
  SUPABASE_URL ?? fallbackSupabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY ?? fallbackServiceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
