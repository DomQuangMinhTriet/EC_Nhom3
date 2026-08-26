import Link from "next/link";
import type { VoucherProduct } from "@/features/vouchers/voucher-product-api";

export function VoucherCard({ voucher, categoryName }: { voucher: VoucherProduct; categoryName?: string }) {
  const price = Number(voucher.originalPrice);

  return (
    <Link href={`/vouchers/${voucher.voucherProductId}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-brand-sm transition hover:-translate-y-0.5 hover:shadow-brand-lg">
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 to-indigo-700 p-5 text-center text-white">
        {voucher.imageUrl && <img src={voucher.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80"/>}
        {categoryName && <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold backdrop-blur">{categoryName}</span>}
        <strong className="relative text-3xl">🎟</strong>
      </div>
      <div className="p-4">
        <h3 className="min-h-10 text-sm font-extrabold leading-5 text-slate-900">{voucher.title}</h3>
        <div className="mt-3 flex items-center justify-between">
          <b className="text-lg text-primary">{price.toLocaleString("vi-VN")}đ</b>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-lg font-bold text-white group-hover:bg-primary-hover">+</span>
        </div>
      </div>
    </Link>
  );
}
