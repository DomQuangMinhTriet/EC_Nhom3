import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getUsers, updateUser } from "@/features/users/users-api";

const session = {
  user: { userId: "admin-1", email: "admin@example.com", roleCode: "Super_Admin", status: "active" },
  accessToken: "token-abc",
  refreshToken: "refresh-abc",
};

function mockFetchOnce(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("users api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("builds the query string from page/limit/role/status and attaches the bearer token", async () => {
    const fetchMock = mockFetchOnce(200, { users: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    await getUsers({ page: 2, limit: 10, role: "Partner", status: "pending" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
    expect(url).toContain("role=Partner");
    expect(url).toContain("status=pending");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-abc");
  });

  it("omits undefined filters from the query string", async () => {
    const fetchMock = mockFetchOnce(200, { users: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    await getUsers();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.endsWith("/users")).toBe(true);
  });

  it("sends the status/role update body and returns the updated user", async () => {
    const updatedUser = { userId: "u1", email: "branch@example.com", roleCode: "Branch", status: "active", createdAt: "", updatedAt: "" };
    const fetchMock = mockFetchOnce(200, { message: "User updated successfully.", user: updatedUser });

    const result = await updateUser("u1", { status: "active" });

    expect(result).toEqual(updatedUser);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ status: "active" });
  });
});
