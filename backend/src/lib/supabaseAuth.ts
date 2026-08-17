import "dotenv/config";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
const fallbackSupabaseUrl = "http://127.0.0.1:54321";
const fallbackAnonKey = "missing-supabase-anon-key";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "SUPABASE_URL / SUPABASE_ANON_KEY is not configured - Supabase Auth calls will fail.",
  );
}

export const supabaseAuth = createClient(
  SUPABASE_URL ?? fallbackSupabaseUrl,
  SUPABASE_ANON_KEY ?? fallbackAnonKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    // The project supports Node 20, whose runtime has no native WebSocket.
    realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor },
  },
);
