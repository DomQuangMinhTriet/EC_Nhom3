"use client";
import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { useAdminDashboardSummary } from "@/hooks/queries/use-dashboard";

function formatMoney(value: string) {
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

const partnerStatusLabel: Record<string, string> = {
  pending: "Chờ duyệt",
  active: "Đang hoạt động",
  suspended: "Tạm ngưng",
  terminated: "Đã chấm dứt",
  rejected: "Bị từ chối",
};

const voucherCodeStatusLabel: Record<string, string> = {
  available: "Chưa dùng",
  used: "Đã dùng",
  expired: "Hết hạn",
  cancelled: "Đã huỷ",
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
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
      <h2 className="font-extrabold text-slate-800">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-4 text-xs text-slate-400">Chưa có dữ liệu.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-3 text-xs">
              <span className="w-32 shrink-0 text-slate-500">{labels[key] ?? key}</span>
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-bold text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const summaryQuery = useAdminDashboardSummary({ from: from || undefined, to: to || undefined });
  const summary = summaryQuery.data;

  const completedOrders = summary?.orders.byStatus.completed?.count ?? 0;
  const usedCodes = summary?.voucherCodes.byStatus.used ?? 0;
  const usageRate = summary && summary.voucherCodes.total > 0 ? (usedCodes / summary.voucherCodes.total) * 100 : 0;

  return (
    <AdminShell active="/admin/reports">
      <PageHeader title="Báo cáo hệ thống" subtitle="Tổng quan doanh thu, đơn hàng và hiệu quả sử dụng voucher." />

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
      </div>

      {summaryQuery.isLoading && (
        <State icon="⏳" title="Đang tải báo cáo" text="Vui lòng chờ trong giây lát." />
      )}

      {summaryQuery.isError && (
        <State
          icon="⚠️"
          title="Không thể tải báo cáo"
          text={summaryQuery.error instanceof Error ? summaryQuery.error.message : "Đã xảy ra lỗi."}
        />
      )}

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Doanh thu (hoàn tất)", formatMoney(summary.revenue.completed)],
              ["Đơn hoàn tất", completedOrders.toLocaleString("vi-VN")],
              ["Tỷ lệ mã đã dùng", `${usageRate.toFixed(1)}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm">
                <span className="text-xs text-slate-500">{label}</span>
                <b className="mt-2 block text-2xl font-extrabold">{value}</b>
              </div>
            ))}
          </div>

          <BreakdownList title="Đối tác theo trạng thái" data={summary.partners.byStatus} labels={partnerStatusLabel} />
          <BreakdownList title="Mã voucher theo trạng thái" data={summary.voucherCodes.byStatus} labels={voucherCodeStatusLabel} />
        </>
      )}
    </AdminShell>
  );
}
