"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { VoucherCard } from "@/components/voucher/voucher-card";
import { useActivePartners, useCategories, useCategoryNameMap, useVoucherProductList } from "@/hooks/queries/use-voucher-products";
import { State } from "@/components/common/state";
import { Button } from "@/components/ui/button";

export default function VoucherListingPage() { return <Suspense fallback={<main className="min-h-screen bg-slate-50"><TopNav/><div className="mx-auto mt-12 h-72 max-w-[1280px] animate-pulse rounded-xl bg-slate-200"/></main>}><VoucherListingContent/></Suspense>; }

function VoucherListingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const categoryId = params.get("categoryId") ?? "";
  const partnerProfileId = params.get("partnerProfileId") ?? "";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const minDiscountPercent = params.get("minDiscountPercent") ?? "";
  const [page, setPage] = useState(1);

  // Local draft state for the price/discount number inputs, so typing
  // doesn't trigger a URL change (and a refetch) on every keystroke.
  const [minPriceDraft, setMinPriceDraft] = useState(minPrice);
  const [maxPriceDraft, setMaxPriceDraft] = useState(maxPrice);
  const [minDiscountDraft, setMinDiscountDraft] = useState(minDiscountPercent);
  useEffect(() => {
    setMinPriceDraft(minPrice);
    setMaxPriceDraft(maxPrice);
    setMinDiscountDraft(minDiscountPercent);
  }, [minPrice, maxPrice, minDiscountPercent]);

  const categoriesQuery = useCategories();
  const categoryNames = useCategoryNameMap();
  const partnersQuery = useActivePartners();
  const listQuery = useVoucherProductList({
    page,
    pageSize: 12,
    categoryId: categoryId || undefined,
    partnerProfileId: partnerProfileId || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minDiscountPercent: minDiscountPercent ? Number(minDiscountPercent) : undefined,
  });

  const vouchers = listQuery.data?.vouchers ?? [];
  const pagination = listQuery.data?.pagination;

  function updateFilters(next: Record<string, string>) {
    setPage(1);
    const merged = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value);
      else merged.delete(key);
    }
    const query = merged.toString();
    router.push(query ? `/vouchers?${query}` : "/vouchers");
  }

  function clearFilters() {
    setPage(1);
    router.push("/vouchers");
  }

  const hasActiveFilters = Boolean(categoryId || partnerProfileId || minPrice || maxPrice || minDiscountPercent);

  return (
    <main className="min-h-screen bg-slate-50">
      <TopNav/>
      <div className="mx-auto max-w-[1280px] px-5 py-9 md:px-10">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold tracking-[-.5px] text-slate-900">Khám phá voucher</h1>
          <p className="mt-1 text-sm text-slate-500">Ưu đãi chính hãng từ các thương hiệu bạn yêu thích.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm">
            <div>
              <h2 className="font-extrabold text-slate-900">Danh mục</h2>
              <div className="mt-3">
                <button onClick={() => updateFilters({ categoryId: "" })} className={`block w-full py-1.5 text-left text-xs ${!categoryId ? "font-bold text-primary" : "text-slate-600 hover:text-primary"}`}>Tất cả</button>
                {categoriesQuery.data?.map((category) => (
                  <button key={category.categoryId} onClick={() => updateFilters({ categoryId: category.categoryId })} className={`block w-full py-1.5 text-left text-xs ${categoryId === category.categoryId ? "font-bold text-primary" : "text-slate-600 hover:text-primary"}`}>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="font-extrabold text-slate-900">Đối tác</h2>
              <select
                value={partnerProfileId}
                onChange={(event) => updateFilters({ partnerProfileId: event.target.value })}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
              >
                <option value="">Tất cả đối tác</option>
                {partnersQuery.data?.map((partner) => (
                  <option key={partner.partnerProfileId} value={partner.partnerProfileId}>{partner.partnerName}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="font-extrabold text-slate-900">Khoảng giá (đ)</h2>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Từ"
                  value={minPriceDraft}
                  onChange={(event) => setMinPriceDraft(event.target.value)}
                  onBlur={() => updateFilters({ minPrice: minPriceDraft })}
                  className="w-1/2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                />
                <span className="text-slate-400">–</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Đến"
                  value={maxPriceDraft}
                  onChange={(event) => setMaxPriceDraft(event.target.value)}
                  onBlur={() => updateFilters({ maxPrice: maxPriceDraft })}
                  className="w-1/2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="font-extrabold text-slate-900">Mức giảm tối thiểu</h2>
              <select
                value={minDiscountDraft}
                onChange={(event) => { setMinDiscountDraft(event.target.value); updateFilters({ minDiscountPercent: event.target.value }); }}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
              >
                <option value="">Tất cả mức giảm</option>
                <option value="10">Từ 10%</option>
                <option value="20">Từ 20%</option>
                <option value="30">Từ 30%</option>
                <option value="50">Từ 50%</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                Xoá tất cả bộ lọc
              </button>
            )}
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
              <State icon="🎟" title="Chưa tìm thấy voucher" text="Hãy thử điều chỉnh lại bộ lọc."/>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
