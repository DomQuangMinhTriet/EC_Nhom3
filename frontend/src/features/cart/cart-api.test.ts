import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCartItem, getCart, removeCartItem, updateCartItemQuantity } from "@/features/cart/cart-api";

const session = {
  user: { userId: "customer-1", email: "customer@example.com", roleCode: "Customer", status: "active" },
  accessToken: "token-cart",
  refreshToken: "refresh-cart",
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

describe("cart api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("fetches the current cart with the bearer token", async () => {
    const cart = { cartId: "c1", customerProfileId: "cp1", items: [] };
    const fetchMock = mockFetchOnce(200, { data: cart });

    const result = await getCart();
    expect(result).toEqual(cart);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/carts/me");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-cart");
  });

  it("sends voucherProductId and quantity when adding an item", async () => {
    const fetchMock = mockFetchOnce(201, { data: { cartItemId: "ci1", quantity: 2 } });

    await addCartItem("v1", 2);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ voucherProductId: "v1", quantity: 2 });
  });

  it("sends a PUT with the new quantity", async () => {
    const fetchMock = mockFetchOnce(200, { data: { cartItemId: "ci1", quantity: 5 } });

    await updateCartItemQuantity("ci1", 5);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/carts/me/items/ci1");
    expect(init.method).toBe("PUT");
  });

  it("sends a DELETE to remove an item", async () => {
    const fetchMock = mockFetchOnce(200, { data: { message: "Item removed successfully" } });

    await removeCartItem("ci1");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("DELETE");
  });
});
