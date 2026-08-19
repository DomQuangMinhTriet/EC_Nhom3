"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { VoucherCard } from "@/components/voucher/voucher-card";
import { useCategories, useCategoryNameMap, useVoucherProductList } from "@/hooks/queries/use-voucher-products";
import { State } from "@/components/common/state";
import { Button } from "@/components/ui/button";

export default function VoucherListingPage() { return <Suspense fallback={<main className="min-h-screen bg-slate-50"><TopNav/><div className="mx-auto mt-12 h-72 max-w-[1280px] animate-pulse rounded-xl bg-slate-200"/></main>}><VoucherListingContent/></Suspense>; }

function VoucherListingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const categoryId = params.get("categoryId") ?? "";
  const [page, setPage] = useState(1);

  const categoriesQuery = useCategories();
  const categoryNames = useCategoryNameMap();
  const listQuery = useVoucherProductList({ page, pageSize: 12, categoryId: categoryId || undefined });

  const vouchers = listQuery.data?.vouchers ?? [];
  const pagination = listQuery.data?.pagination;

  function selectCategory(nextCategoryId: string) {
    setPage(1);
    router.push(nextCategoryId ? `/vouchers?categoryId=${nextCategoryId}` : "/vouchers");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <TopNav/>
      <div className="mx-auto max-w-[1280px] px-5 py-9 md:px-10">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold tracking-[-.5px] text-slate-900">Khám phá voucher</h1>
          <p className="mt-1 text-sm text-slate-500">Ưu đãi chính hãng từ các thương hiệu bạn yêu thích.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm">
            <h2 className="font-extrabold text-slate-900">Danh mục</h2>
            <div className="mt-3">
              <button onClick={() => selectCategory("")} className={`block w-full py-1.5 text-left text-xs ${!categoryId ? "font-bold text-primary" : "text-slate-600 hover:text-primary"}`}>Tất cả</button>
              {categoriesQuery.data?.map((category) => (
                <button key={category.categoryId} onClick={() => selectCategory(category.categoryId)} className={`block w-full py-1.5 text-left text-xs ${categoryId === category.categoryId ? "font-bold text-primary" : "text-slate-600 hover:text-primary"}`}>
                  {category.name}
                </button>
              ))}
            </div>
          </aside>
          <section>
            <p className="mb-5 text-xs text-slate-500">{listQuery.isLoading ? "Đang tải ưu đãi..." : `Hiển thị ${vouchers.length}/${pagination?.total ?? 0} kết quả`}</p>

            {listQuery.isError ? (
              <State icon="!" title="Không thể tải voucher" text="Hãy thử lại sau ít phút."/>
            ) : listQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="h-72 animate-pulse rounded-xl bg-slate-200" key={index}/>)}</div>
            ) : vouchers.length ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {vouchers.map((voucher) => <VoucherCard key={voucher.voucherProductId} voucher={voucher} categoryName={categoryNames.get(voucher.categoryId)}/>)}
                </div>
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                    <span>Trang {pagination.page} / {pagination.totalPages}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>← Trước</Button>
                      <Button size="sm" variant="ghost" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Sau →</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <State icon="🎟" title="Chưa tìm thấy voucher" text="Hãy thử một danh mục khác."/>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
