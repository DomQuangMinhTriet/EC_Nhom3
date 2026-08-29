"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { Footer } from "@/components/navigation/footer";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { useCategoryNameMap, useVoucherProduct } from "@/hooks/queries/use-voucher-products";
import { usePublicBranchStock } from "@/hooks/queries/use-branch-quota";
import { State } from "@/components/common/state";
import { getCategoryIcon } from "@/lib/category-icon";

export default function VoucherDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: voucher, isLoading, isError } = useVoucherProduct(params.id);
  const categoryNames = useCategoryNameMap();
  const branchStockQuery = usePublicBranchStock(params.id);

  if (isLoading) {
    return <main className="min-h-screen bg-slate-50"><TopNav/><div className="mx-auto mt-16 h-96 max-w-[1000px] animate-pulse rounded-2xl bg-slate-200"/></main>;
  }

  if (isError || !voucher) {
    return <main className="min-h-screen bg-slate-50"><TopNav/><div className="mx-auto max-w-xl p-8"><State icon="!" title="Voucher không tồn tại" text="Ưu đãi này có thể đã hết hạn hoặc không còn được bán."/></div></main>;
  }

  const price = Number(voucher.originalPrice);
  const categoryName = categoryNames.get(voucher.categoryId);
  const branchStock = branchStockQuery.data ?? [];

  return (
    <main className="min-h-screen bg-slate-50">
      <TopNav/>
      <div className="mx-auto max-w-[1100px] px-5 py-8 md:px-10">
        <p className="mb-5 text-xs text-slate-500"><Link href="/vouchers" className="font-semibold text-primary">Voucher</Link>{categoryName ? ` / ${categoryName}` : ""}</p>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_.85fr]">
          <section>
            <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 to-indigo-600 text-white shadow-brand-lg">
              {voucher.imageUrl && <img src={voucher.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80"/>}
              <div className="relative text-center">
                {categoryName && <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{categoryName}</span>}
                <p className="mt-5 text-5xl">{getCategoryIcon(categoryName)}</p>
              </div>
            </div>
            <article className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
              <h1 className="text-2xl font-extrabold tracking-[-.5px] text-slate-900">{voucher.title}</h1>
              {voucher.description && <p className="mt-3 text-sm leading-7 text-slate-600">{voucher.description}</p>}
              <h2 className="mt-7 text-base font-extrabold text-slate-900">Thông tin sử dụng</h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li>✓ Hiệu lực {voucher.validDurationDays} ngày kể từ khi mua</li>
                <li>✓ Áp dụng đến {new Date(voucher.endDate).toLocaleDateString("vi-VN")}</li>
                {voucher.maxLimit && <li>✓ Giới hạn {voucher.maxLimit} lượt mua</li>}
              </ul>
            </article>
            {branchStock.length > 0 && (
              <article className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
                <h2 className="text-base font-extrabold text-slate-900">Chi nhánh còn hàng</h2>
                <div className="mt-3 space-y-2">
                  {branchStock.map((branch) => (
                    <div key={branch.branchProfileId} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{branch.branchName}</p>
                        <p className="text-slate-500">{branch.address}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${branch.remainingQuantity > 0 ? "bg-emerald-50 text-success" : "bg-slate-100 text-slate-400"}`}>
                        {branch.remainingQuantity > 0 ? `Còn ${branch.remainingQuantity}` : "Hết hàng"}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </section>
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-brand-md">
            {categoryName && <p className="text-xs font-semibold text-slate-500">{categoryName}</p>}
            <div className="my-5 border-y border-slate-100 py-5">
              <b className="text-3xl text-primary">{price.toLocaleString("vi-VN")}đ</b>
            </div>
            <AddToCartButton voucher={voucher}/>
            <p className="mt-4 text-center text-[11px] text-slate-500">🎟 Nhận mã voucher ngay sau thanh toán</p>
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  );
}
