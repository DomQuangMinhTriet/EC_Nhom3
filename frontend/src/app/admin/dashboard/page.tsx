"use client";
import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { useAdminDashboardSummary } from "@/hooks/queries/use-dashboard";

function formatMoney(value: string) {
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

const orderStatusLabel: Record<string, string> = {
  pending_payment: "Chờ thanh toán",
  completed: "Hoàn tất",
  failed: "Thất bại",
};

const voucherStatusLabel: Record<string, string> = {
  pending: "Chờ duyệt",
  active: "Đang bán",
  out_of_stock: "Hết hàng",
  inactive: "Ngừng bán",
  rejected: "Bị từ chối",
  expired: "Hết hạn",
};

function BreakdownList({
  title,
  data,
  labels,
}: {
  title: string;
  data: Record<string, number>;
  labels: Record<string, string>;
}) {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, value]) => value));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
      <h2 className="font-extrabold text-slate-800">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-4 text-xs text-slate-400">Chưa có dữ liệu.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-3 text-xs">
              <span className="w-28 shrink-0 text-slate-500">{labels[key] ?? key}</span>
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-300"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-bold text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminDashboardPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const summaryQuery = useAdminDashboardSummary({ from: from || undefined, to: to || undefined });
  const summary = summaryQuery.data;

  return (
    <AdminShell active="/admin/dashboard">
      <PageHeader title="Dashboard" subtitle="Tổng quan hoạt động hệ thống ECVoucher." />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-500">
          Từ ngày
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-brand-sm"
          />
        </label>
        <label className="text-xs text-slate-500">
          Đến ngày
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-brand-sm"
          />
        </label>
        <span className="pb-2 text-[11px] text-slate-400">Bộ lọc áp dụng cho đơn hàng &amp; doanh thu.</span>
      </div>

      {summaryQuery.isLoading && (
        <State icon="⏳" title="Đang tải dashboard" text="Vui lòng chờ trong giây lát." />
      )}

      {summaryQuery.isError && (
        <State
          icon="⚠️"
          title="Không thể tải dashboard"
          text={summaryQuery.error instanceof Error ? summaryQuery.error.message : "Đã xảy ra lỗi."}
        />
      )}

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Người dùng", summary.users.total.toLocaleString("vi-VN")],
              ["Đối tác", summary.partners.total.toLocaleString("vi-VN")],
              ["Voucher", summary.vouchers.total.toLocaleString("vi-VN")],
              ["Doanh thu (hoàn tất)", formatMoney(summary.revenue.completed)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm">
                <span className="text-xs text-slate-500">{label}</span>
                <b className="mt-2 block text-2xl font-extrabold">{value}</b>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <BreakdownList title="Đơn hàng theo trạng thái" data={Object.fromEntries(Object.entries(summary.orders.byStatus).map(([status, value]) => [status, value.count]))} labels={orderStatusLabel} />
            <BreakdownList title="Voucher theo trạng thái" data={summary.vouchers.byStatus} labels={voucherStatusLabel} />
          </div>
        </>
      )}
    </AdminShell>
  );
}
