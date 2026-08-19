"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategory, deleteCategory, updateCategory, type CreateCategoryInput, type UpdateCategoryInput } from "@/features/category/category-tree-api";
import { voucherProductKeys } from "@/hooks/queries/use-voucher-products";

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: voucherProductKeys.categories }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, input }: { categoryId: string; input: UpdateCategoryInput }) => updateCategory(categoryId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: voucherProductKeys.categories }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: voucherProductKeys.categories }),
  });
}
