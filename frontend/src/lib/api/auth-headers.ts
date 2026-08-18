import { ApiError } from "@/lib/api/client";
import { readAuthSession } from "@/features/auth/auth-api";

export function authHeaders() {
  const session = readAuthSession();
  if (!session) throw new ApiError("Bạn cần đăng nhập để tiếp tục.", 401);
  return { Authorization: `Bearer ${session.accessToken}` };
}
