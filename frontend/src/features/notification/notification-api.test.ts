import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMyNotifications } from "@/features/notification/notification-api";

const session = {
  user: { userId: "customer-1", email: "customer@example.com", roleCode: "Customer", status: "active" },
  accessToken: "token-notification",
  refreshToken: "refresh-notification",
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

describe("notification api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("fetches the current customer's notifications with the bearer token", async () => {
    const notifications = [
      { notificationId: "n1", customerProfileId: "cp1", title: "Voucher approved", body: "Your voucher is ready.", isRead: false, createdAt: "2026-08-20T14:52:27.732Z" },
    ];
    const fetchMock = mockFetchOnce(200, { notifications });

    const result = await getMyNotifications();

    expect(result).toEqual(notifications);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/notifications");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-notification");
  });
});
