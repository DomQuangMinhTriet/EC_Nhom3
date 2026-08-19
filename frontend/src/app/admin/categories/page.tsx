"use client";
import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { useToast } from "@/components/common/toast";
import { useCategories } from "@/hooks/queries/use-voucher-products";
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/queries/use-category-tree";
import type { Category } from "@/features/vouchers/voucher-product-api";

export default function CategoriesPage() {
  const toast = useToast();
  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [name, setName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const categories = categoriesQuery.data ?? [];
  const roots = categories.filter((category) => !category.parentCategoryId);
  const childrenOf = (categoryId: string) => categories.filter((category) => category.parentCategoryId === categoryId);

  function submitCreate() {
    if (!name.trim()) return;
    createCategory.mutate(
      { name: name.trim(), parentCategoryId: parentCategoryId || undefined },
      {
        onSuccess: () => { toast("Đã tạo danh mục."); setName(""); setParentCategoryId(""); },
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể tạo danh mục.", "error"),
      },
    );
  }

  function submitRename(categoryId: string) {
    if (!editingName.trim()) return;
    updateCategory.mutate(
      { categoryId, input: { name: editingName.trim() } },
      {
        onSuccess: () => { toast("Đã đổi tên danh mục."); setEditingId(null); },
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể đổi tên.", "error"),
      },
    );
  }

  function remove(categoryId: string) {
    deleteCategory.mutate(categoryId, {
      onSuccess: () => toast("Đã xóa danh mục."),
      onError: (error) => toast(error instanceof Error ? error.message : "Không thể xóa danh mục (có thể còn danh mục con).", "error"),
    });
  }

  function renderCategory(category: Category, depth: number) {
    const isEditing = editingId === category.categoryId;
    return (
      <div key={category.categoryId}>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-brand-sm" style={{ marginLeft: depth * 20 }}>
          {isEditing ? (
            <input
              value={editingName}
              onChange={(event) => setEditingName(event.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
              autoFocus
            />
          ) : (
            <b className="text-sm">{category.name}</b>
          )}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button className="text-xs font-semibold text-primary" disabled={updateCategory.isPending} onClick={() => submitRename(category.categoryId)}>Lưu</button>
                <button className="text-xs font-semibold text-slate-500" onClick={() => setEditingId(null)}>Hủy</button>
              </>
            ) : (
              <>
                <button className="text-xs font-semibold text-primary" onClick={() => { setEditingId(category.categoryId); setEditingName(category.name); }}>Sửa</button>
                <button className="text-xs font-semibold text-danger" disabled={deleteCategory.isPending} onClick={() => remove(category.categoryId)}>Xóa</button>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 space-y-3">{childrenOf(category.categoryId).map((child) => renderCategory(child, depth + 1))}</div>
      </div>
    );
  }

  return (
    <AdminShell active="/admin/categories">
      <PageHeader title="Danh mục" subtitle="Quản lý danh mục voucher trong hệ thống."/>

      <div className="flex flex-wrap gap-2">
        <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="Tên danh mục"/>
        <select value={parentCategoryId} onChange={(event) => setParentCategoryId(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
          <option value="">Không có danh mục cha</option>
          {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.name}</option>)}
        </select>
        <Button size="sm" disabled={createCategory.isPending || !name.trim()} onClick={submitCreate}>+ Thêm</Button>
      </div>

      {categoriesQuery.isLoading && <div className="mt-5"><State icon="⏳" title="Đang tải danh mục" text="Vui lòng chờ trong giây lát."/></div>}

      {categoriesQuery.isError && (
        <div className="mt-5"><State icon="⚠️" title="Không thể tải danh mục" text={categoriesQuery.error instanceof Error ? categoriesQuery.error.message : "Đã xảy ra lỗi."}/></div>
      )}

      {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 && (
        <div className="mt-5"><State icon="🗂" title="Chưa có danh mục nào" text="Tạo danh mục đầu tiên ở form phía trên."/></div>
      )}

      {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length > 0 && (
        <div className="mt-5 space-y-3">{roots.map((category) => renderCategory(category, 0))}</div>
      )}
    </AdminShell>
  );
}
