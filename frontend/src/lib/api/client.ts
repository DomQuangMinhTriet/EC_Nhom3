export class ApiError extends Error {
  constructor(message: string, public status: number, public detail?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = typeof window === "undefined" ? `${backendUrl}/api` : "/api/backend";
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = body as { error?: string; message?: string } | undefined;
    throw new ApiError(error?.error ?? error?.message ?? "Yêu cầu không thành công", response.status, body);
  }

  return body as T;
}
