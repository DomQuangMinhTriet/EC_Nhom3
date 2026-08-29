import Link from "next/link";
import type { VoucherProduct } from "@/features/vouchers/voucher-product-api";
import { getCategoryIcon } from "@/lib/category-icon";
import { computeDiscountPercent, computeSalePrice } from "@/lib/voucher-price";

export function VoucherCard({ voucher, categoryName }: { voucher: VoucherProduct; categoryName?: string }) {
  const originalPrice = Number(voucher.originalPrice);
  const salePrice = computeSalePrice(voucher.originalPrice, voucher.discountType, voucher.discountValue);
  const discountPercent = Math.round(computeDiscountPercent(voucher.originalPrice, voucher.discountType, voucher.discountValue));

  return (
    <Link href={`/vouchers/${voucher.voucherProductId}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-brand-sm transition hover:-translate-y-0.5 hover:shadow-brand-lg">
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 to-indigo-700 p-5 text-center text-white">
        {voucher.imageUrl && <img src={voucher.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80"/>}
        {categoryName && <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold backdrop-blur">{categoryName}</span>}
        {discountPercent > 0 && <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-bold text-white">-{discountPercent}%</span>}
        <strong className="relative text-3xl">{getCategoryIcon(categoryName)}</strong>
      </div>
      <div className="p-4">
        <h3 className="min-h-10 text-sm font-extrabold leading-5 text-slate-900">{voucher.title}</h3>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <b className="text-lg text-primary">{salePrice.toLocaleString("vi-VN")}đ</b>
            {salePrice < originalPrice && <span className="ml-2 text-xs text-slate-400 line-through">{originalPrice.toLocaleString("vi-VN")}đ</span>}
          </div>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-lg font-bold text-white group-hover:bg-primary-hover">+</span>
        </div>
      </div>
    </Link>
  );
}
