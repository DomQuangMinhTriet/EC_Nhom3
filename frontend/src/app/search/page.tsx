"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { VoucherCard } from "@/components/voucher/voucher-card";
import { State } from "@/components/common/state";
import { useCategoryNameMap, useVoucherProductList } from "@/hooks/queries/use-voucher-products";

export default function SearchPage() { return <Suspense fallback={<main className="min-h-screen bg-slate-50"><TopNav/></main>}><SearchContent/></Suspense>; }

function SearchContent() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const { data, isLoading, isError } = useVoucherProductList({ search: query || undefined });
  const categoryNames = useCategoryNameMap();
  const vouchers = data?.vouchers ?? [];

  return (
    <main className="min-h-screen bg-slate-50">
      <TopNav/>
      <div className="mx-auto max-w-[1280px] px-5 py-9 md:px-10">
        <h1 className="text-2xl font-extrabold tracking-[-.5px] text-slate-900">Kết quả tìm kiếm</h1>
        <p className="mt-2 text-sm text-slate-500">{query ? <>Kết quả cho <b className="text-primary">“{query}”</b></> : "Nhập từ khóa để tìm voucher"}</p>
        {isLoading ? (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div className="h-72 animate-pulse rounded-xl bg-slate-200" key={index}/>)}</div>
        ) : isError ? (
          <div className="mt-7"><State icon="!" title="Không thể tìm kiếm" text="Vui lòng thử lại."/></div>
        ) : vouchers.length ? (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{vouchers.map((voucher) => <VoucherCard key={voucher.voucherProductId} voucher={voucher} categoryName={categoryNames.get(voucher.categoryId)}/>)}</div>
        ) : (
          <div className="mt-7"><State icon="⌕" title="Không tìm thấy kết quả" text="Thử tìm thương hiệu, danh mục hoặc ưu đãi khác."/></div>
        )}
      </div>
    </main>
  );
}
