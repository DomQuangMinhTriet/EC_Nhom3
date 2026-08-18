import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMyProfile, getMyProfile, isProfileConflict, isProfileNotFound, updateMyProfile } from "@/features/profile/profile-api";

const session = {
  user: { userId: "u1", email: "partner@example.com", roleCode: "Partner", status: "active" },
  accessToken: "token-123",
  refreshToken: "refresh-123",
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

describe("profile api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("attaches the bearer token from the stored session", async () => {
    const fetchMock = mockFetchOnce(200, { profile: { partnerProfileId: "p1" } });
    await getMyProfile();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-123");
  });

  it("flags a 404 response as profile-not-found", async () => {
    mockFetchOnce(404, { error: "Customer profile not found" });

    try {
      await getMyProfile();
      expect.unreachable("expected getMyProfile to reject");
    } catch (error) {
      expect(isProfileNotFound(error)).toBe(true);
    }
  });

  it("flags a 409 response as profile-conflict", async () => {
    mockFetchOnce(409, { error: "Profile already exists" });

    try {
      await createMyProfile({ fullName: "Nguyen Van A" });
      expect.unreachable("expected createMyProfile to reject");
    } catch (error) {
      expect(isProfileConflict(error)).toBe(true);
    }
  });

  it("throws before calling the network when no session is stored", async () => {
    localStorage.clear();
    const fetchMock = mockFetchOnce(200, { profile: {} });

    await expect(updateMyProfile({ fullName: "Nguyen Van A" })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
