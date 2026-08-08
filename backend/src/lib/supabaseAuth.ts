import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "SUPABASE_URL / SUPABASE_ANON_KEY is not configured - Supabase Auth calls will fail.",
  );
}

export const supabaseAuth = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } },
);
