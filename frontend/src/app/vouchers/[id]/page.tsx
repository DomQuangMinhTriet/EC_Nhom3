"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { useCategoryNameMap, useVoucherProduct } from "@/hooks/queries/use-voucher-products";
import { State } from "@/components/common/state";

function salePrice(originalPrice: string, discountType: "direct" | "percentage", discountValue: string) {
  const original = Number(originalPrice);
  const value = Number(discountValue);
  return discountType === "percentage" ? original * (1 - value / 100) : Math.max(original - value, 0);
}

export default function VoucherDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: voucher, isLoading, isError } = useVoucherProduct(params.id);
  const categoryNames = useCategoryNameMap();

  if (isLoading) {
    return <main className="min-h-screen bg-slate-50"><TopNav/><div className="mx-auto mt-16 h-96 max-w-[1000px] animate-pulse rounded-2xl bg-slate-200"/></main>;
  }

  if (isError || !voucher) {
    return <main className="min-h-screen bg-slate-50"><TopNav/><div className="mx-auto max-w-xl p-8"><State icon="!" title="Voucher không tồn tại" text="Ưu đãi này có thể đã hết hạn hoặc không còn được bán."/></div></main>;
  }

  const price = salePrice(voucher.originalPrice, voucher.discountType, voucher.discountValue);
  const categoryName = categoryNames.get(voucher.categoryId);
  const discountLabel = voucher.discountType === "percentage" ? `−${Number(voucher.discountValue)}%` : `−${Number(voucher.discountValue).toLocaleString("vi-VN")}đ`;

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
                <h1 className="mt-5 text-6xl font-extrabold tracking-[-4px]">{discountLabel}</h1>
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
          </section>
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-brand-md">
            {categoryName && <p className="text-xs font-semibold text-slate-500">{categoryName}</p>}
            <div className="my-5 border-y border-slate-100 py-5">
              <b className="text-3xl text-primary">{price.toLocaleString("vi-VN")}đ</b>
              <s className="ml-3 text-sm text-slate-400">{Number(voucher.originalPrice).toLocaleString("vi-VN")}đ</s>
            </div>
            <AddToCartButton voucher={voucher}/>
            <p className="mt-4 text-center text-[11px] text-slate-500">🎟 Nhận mã voucher ngay sau thanh toán</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
