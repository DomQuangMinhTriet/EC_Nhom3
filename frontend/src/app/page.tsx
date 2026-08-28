"use client";

import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";
import { Button } from "@/components/ui/button";
import { VoucherCard } from "@/components/voucher/voucher-card";
import { useCategories, useCategoryNameMap, useVoucherProductList } from "@/hooks/queries/use-voucher-products";

export default function HomePage() {
  const categoriesQuery = useCategories();
  const categoryNames = useCategoryNameMap();
  const featuredQuery = useVoucherProductList({ page: 1, pageSize: 4 });

  const categories = categoriesQuery.data ?? [];
  const featured = featuredQuery.data?.vouchers ?? [];
  const totalVouchers = featuredQuery.data?.pagination?.total ?? 0;

  return (
    <main>
      <TopNav />
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-white to-orange-50">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 py-14 md:grid-cols-2 md:px-10 md:py-16">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-4 text-xs font-medium text-slate-600 shadow-brand-sm">
              <b className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] text-accent">MỚI</b>
              Ưu đãi chính hãng từ các đối tác trên ECVoucher
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-2px] text-slate-900 sm:text-5xl">
              Ưu đãi chính hãng
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">cho mọi trải nghiệm</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
              Mua voucher trong 30 giây, nhận mã điện tử ngay lập tức, dùng tại quầy bằng QR hoặc mã code.
            </p>
            <div className="mt-6 flex max-w-[480px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-brand-lg">
              <div className="flex flex-1 items-center px-3 text-slate-400">
                ⌕<span className="ml-2 text-xs">Tìm voucher, thương hiệu...</span>
              </div>
              <Link href="/vouchers">
                <Button>Tìm kiếm</Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/vouchers">
                <Button size="xl">🎟 Khám phá ngay</Button>
              </Link>
              <Link href="/vouchers">
                <Button size="xl" variant="ghost">
                  Xem cách hoạt động
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex gap-8 border-t border-slate-200 pt-7">
              <Stat value={totalVouchers.toLocaleString("vi-VN")} label="Voucher đang hoạt động" />
              <Stat value={categories.length.toString()} label="Danh mục ưu đãi" />
            </div>
          </div>
          <div className="relative hidden h-[420px] min-w-0 md:block">
            <div className="absolute inset-x-8 bottom-0 top-8 rounded-[20px] bg-primary-dark/25" />
            <div className="absolute inset-4 rounded-[20px] bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-8 shadow-[0_24px_48px_rgba(79,70,229,.2)]">
              <div className="flex justify-center gap-2 text-[11px] font-semibold">
                {categories.slice(0, 3).map((category) => (
                  <Pill key={category.categoryId} text={category.name} />
                ))}
              </div>
              <div className="mt-20 text-center">
                <strong className="text-6xl tracking-[-3px] text-white">ECVoucher</strong>
                <p className="mt-2 text-xs uppercase tracking-[.1em] text-white/40">voucher chính hãng, giao dịch minh bạch</p>
              </div>
              <div className="mx-auto mt-7 flex max-w-xs justify-around rounded-xl border border-white/10 bg-white/10 p-4 text-center text-white">
                <Stat value={totalVouchers.toString()} label="Voucher" dark />
                <Stat value="QR" label="Xác thực" dark />
                <Stat value="5p" label="Cấp mã" dark />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1280px] gap-2 overflow-x-auto px-5 py-4 md:px-10">
          <Link href="/vouchers" className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white">
            Tất cả
          </Link>
          {categories.map((category) => (
            <Link
              key={category.categoryId}
              href={`/vouchers?categoryId=${category.categoryId}`}
              className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1280px] px-5 py-12 md:px-10">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-.5px] text-slate-900">Deals nổi bật hôm nay</h2>
            <p className="mt-1 text-xs text-slate-500">Ưu đãi đang hoạt động, chỉ có tại ECVoucher</p>
          </div>
          <Link className="text-xs font-semibold text-primary" href="/vouchers">
            Xem tất cả →
          </Link>
        </div>
        {featuredQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Chưa có voucher nào đang hoạt động.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            {featured.map((voucher) => (
              <VoucherCard key={voucher.voucherProductId} voucher={voucher} categoryName={categoryNames.get(voucher.categoryId)} />
            ))}
          </div>
        )}
      </section>
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1280px] gap-4 px-5 py-8 text-xs font-medium text-slate-600 sm:grid-cols-2 md:grid-cols-4 md:px-10">
          <div>🔒 Thanh toán bảo mật SSL</div>
          <div>✓ Voucher chính hãng 100%</div>
          <div>↗ Giao ngay trong 5 phút</div>
          <div>◉ Hỗ trợ 24/7 mọi lúc</div>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label, dark = false }: { value: string; label: string; dark?: boolean }) {
  return (
    <div>
      <strong className={`block text-xl font-extrabold tracking-[-.5px] ${dark ? "text-white" : "text-primary"}`}>{value}</strong>
      <span className={`text-[11px] ${dark ? "text-white/40" : "text-slate-500"}`}>{label}</span>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return <span className="rounded-full bg-indigo-800 px-3 py-1 text-indigo-200">{text}</span>;
}
