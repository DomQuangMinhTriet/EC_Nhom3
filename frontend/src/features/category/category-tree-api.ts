import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";
import type { Category } from "@/features/vouchers/voucher-product-api";

export type CreateCategoryInput = { name: string; parentCategoryId?: string };
export type UpdateCategoryInput = { name?: string; parentCategoryId?: string | null };

export async function createCategory(input: CreateCategoryInput) {
  const res = await apiClient<{ data: Category; message: string }>("/categories", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const res = await apiClient<{ data: Category; message: string }>(`/categories/${categoryId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteCategory(categoryId: string) {
  return apiClient<{ message: string }>(`/categories/${categoryId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
