import "dotenv/config";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "SUPABASE_URL / SUPABASE_ANON_KEY is not configured - Supabase Auth calls will fail.",
  );
}

export const supabaseAuth = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY ?? "",
  {
    auth: { autoRefreshToken: false, persistSession: false },
    // The project supports Node 20, whose runtime has no native WebSocket.
    realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor },
  },
);
