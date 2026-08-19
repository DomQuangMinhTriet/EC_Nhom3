"use client";
import { useState } from "react";
import { CustomerShell } from "@/components/customer/customer-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { useMyVoucherInstances } from "@/hooks/queries/use-voucher-instances";
import type { VoucherInstanceStatus } from "@/features/voucherInstance/voucher-instance-api";

const tabs: readonly [VoucherInstanceStatus | "all", string][] = [["all", "Tất cả"], ["available", "Đang dùng"], ["used", "Đã dùng"], ["expired", "Hết hạn"]];

const statusLabel: Record<VoucherInstanceStatus, string> = { available: "Đang dùng", used: "Đã dùng", expired: "Hết hạn", cancelled: "Đã hủy" };
const statusStyle: Record<VoucherInstanceStatus, string> = {
  available: "bg-emerald-50 text-success",
  used: "bg-slate-100 text-slate-500",
  expired: "bg-red-50 text-danger",
  cancelled: "bg-red-50 text-danger",
};

function salePrice(voucher: { originalPrice: string; discountType: "direct" | "percentage"; discountValue: string }) {
  const original = Number(voucher.originalPrice);
  const value = Number(voucher.discountValue);
  return voucher.discountType === "percentage" ? original * (1 - value / 100) : Math.max(original - value, 0);
}

export default function MyVouchersPage() { return <MyVouchersContent/>; }

function MyVouchersContent() {
  const [tab, setTab] = useState<VoucherInstanceStatus | "all">("all");
  const vouchersQuery = useMyVoucherInstances(tab === "all" ? undefined : tab);
  const items = vouchersQuery.data ?? [];

  return (
    <CustomerShell active="/my-vouchers">
      <PageHeader title="Voucher của tôi" subtitle="Quản lý mã ưu đãi đã mua."/>
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {tabs.map(([value, label]) => (
          <button key={value} onClick={() => setTab(value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${tab === value ? "bg-primary text-white" : "bg-white text-slate-600 shadow-brand-sm"}`}>{label}</button>
        ))}
      </div>

      {vouchersQuery.isLoading && <State icon="⏳" title="Đang tải voucher của bạn" text="Vui lòng chờ trong giây lát."/>}

      {vouchersQuery.isError && (
        <State icon="⚠️" title="Không thể tải voucher của bạn" text={vouchersQuery.error instanceof Error ? vouchersQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {!vouchersQuery.isLoading && !vouchersQuery.isError && items.length === 0 && (
        <State icon="🎟" title="Chưa có voucher nào" text="Mua voucher để bắt đầu sử dụng ưu đãi."/>
      )}

      {!vouchersQuery.isLoading && !vouchersQuery.isError && items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((voucher) => (
            <article key={voucher.voucherCodeId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-brand-sm">
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-950 to-primary p-5 text-white">
                <h2 className="text-sm font-extrabold">{voucher.voucherProduct.title}</h2>
                <b className="text-lg">{salePrice(voucher.voucherProduct).toLocaleString("vi-VN")}đ</b>
              </div>
              <div className="flex items-end justify-between p-4">
                <div>
                  <p className="font-mono text-xs font-bold text-primary">{voucher.code}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {voucher.status === "available" ? `Hết hạn: ${new Date(voucher.expiredAt).toLocaleDateString("vi-VN")}` : voucher.usedAt ? `Đã dùng: ${new Date(voucher.usedAt).toLocaleDateString("vi-VN")}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[voucher.status]}`}>{statusLabel[voucher.status]}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </CustomerShell>
  );
}
