import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCategory, deleteCategory, updateCategory } from "@/features/category/category-tree-api";

const session = {
  user: { userId: "admin-1", email: "admin@example.com", roleCode: "Super_Admin", status: "active" },
  accessToken: "token-cat",
  refreshToken: "refresh-cat",
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

describe("category tree api", () => {
  beforeEach(() => {
    localStorage.setItem("ec-voucher-auth", JSON.stringify(session));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("creates a root category without parentCategoryId", async () => {
    const fetchMock = mockFetchOnce(201, { data: { categoryId: "c1", name: "Ăn uống", parentCategoryId: null }, message: "Category created successfully" });

    await createCategory({ name: "Ăn uống" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/admin/categories");
    expect(JSON.parse(init.body as string)).toEqual({ name: "Ăn uống" });
  });

  it("sends a PUT with the renamed value", async () => {
    mockFetchOnce(200, { data: { categoryId: "c1", name: "Đồ ăn", parentCategoryId: null }, message: "Category updated successfully" });

    const result = await updateCategory("c1", { name: "Đồ ăn" });
    expect(result.name).toBe("Đồ ăn");
  });

  it("sends a DELETE for the category id", async () => {
    const fetchMock = mockFetchOnce(200, { message: "Category deleted successfully" });

    await deleteCategory("c1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/admin/categories/c1");
    expect(init.method).toBe("DELETE");
  });
});
