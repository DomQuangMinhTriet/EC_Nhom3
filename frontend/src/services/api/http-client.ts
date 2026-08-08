import { env } from "@/config/env";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { body, headers, ...requestOptions } = options;
  const apiPath = path.replace(/^\/api/, "");
  const baseUrl = typeof window === "undefined" ? env.apiUrl : "/api/backend";
  const response = await fetch(`${baseUrl}${apiPath}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
