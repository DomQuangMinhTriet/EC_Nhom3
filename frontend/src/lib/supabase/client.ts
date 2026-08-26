import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/config/env";

export function createSupabaseBrowserClient() {
  const url = env.supabaseUrl;
  const key = env.supabasePublishableKey;
  if (!url || !key || url.includes("your-project-ref") || key === "your-anon-key") {
    throw new Error("Supabase chưa được cấu hình. Hãy cập nhật frontend/.env.local.");
  }
  return createBrowserClient(
    url,
    key,
  );
}
