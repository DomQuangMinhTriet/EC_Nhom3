"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { VoucherCard } from "@/components/voucher/voucher-card";
import { useVouchers } from "@/hooks/queries/use-vouchers";
import { State } from "@/components/common/state";

const categories = ["Tất cả", "Ăn uống", "Mua sắm", "Du lịch", "Làm đẹp", "Giải trí", "Sức khoẻ"];

export default function VoucherListingPage() { return <Suspense fallback={<main className="min-h-screen bg-slate-50"><TopNav/><div className="mx-auto mt-12 h-72 max-w-[1280px] animate-pulse rounded-xl bg-slate-200"/></main>}><VoucherListingContent/></Suspense>; }
function VoucherListingContent() {
  const params = useSearchParams();
  const category = params.get("category") ?? "Tất cả";
  const { data, isLoading, isError } = useVouchers({ category });

  return <main className="min-h-screen bg-slate-50"><TopNav/><div className="mx-auto max-w-[1280px] px-5 py-9 md:px-10">
    <div className="mb-7"><h1 className="text-2xl font-extrabold tracking-[-.5px] text-slate-900">Khám phá voucher</h1><p className="mt-1 text-sm text-slate-500">Ưu đãi chính hãng từ các thương hiệu bạn yêu thích.</p></div>
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]"><aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm"><h2 className="font-extrabold text-slate-900">Bộ lọc</h2>
      <Filter title="Danh mục">{categories.map((item) => {
        const href = item === "Tất cả" ? "/vouchers" : "/vouchers?category=" + encodeURIComponent(item);
        return <a key={item} href={href} className={`block py-1.5 text-xs ${item === category ? "font-bold text-primary" : "text-slate-600 hover:text-primary"}`}>{item}</a>;
      })}</Filter>
      <Filter title="Mức giảm giá"><p className="text-xs text-slate-600">Trên 50%</p><p className="mt-2 text-xs text-slate-600">30% – 50%</p><p className="mt-2 text-xs text-slate-600">10% – 30%</p></Filter>
    </aside><section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{isLoading ? "Đang tải ưu đãi..." : `Hiển thị ${data?.length ?? 0} kết quả`}</p><select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-brand-sm"><option>Phổ biến nhất</option><option>Giảm giá cao nhất</option><option>Giá thấp đến cao</option></select></div>
      {isError ? <State icon="!" title="Không thể tải voucher" text="Hãy thử lại sau ít phút."/> : isLoading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="h-72 animate-pulse rounded-xl bg-slate-200" key={index}/>)}</div> : data?.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.map((voucher) => <VoucherCard key={voucher.id} voucher={voucher}/>)}</div> : <State icon="🎟" title="Chưa tìm thấy voucher" text="Hãy thử một danh mục hoặc bộ lọc khác."/>}
    </section></div>
  </div></main>;
}
function Filter({ title, children }: { title: string; children: ReactNode }) { return <div className="mt-5 border-t border-slate-100 pt-5"><h3 className="mb-3 text-xs font-bold text-slate-700">{title}</h3>{children}</div>; }
