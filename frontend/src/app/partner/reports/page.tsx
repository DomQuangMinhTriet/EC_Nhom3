"use client";
import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { usePartnerDashboardSummary } from "@/hooks/queries/use-dashboard";

function formatMoney(value: string) {
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm">
      <span className="text-xs text-slate-500">{label}</span>
      <b className="mt-2 block text-2xl font-extrabold">{value}</b>
    </div>
  );
}

export default function PartnerReportsPage() {
  const summaryQuery = usePartnerDashboardSummary();
  const summary = summaryQuery.data;

  return (
    <PartnerShell active="/partner/reports">
      <PageHeader title="Báo cáo & Thống kê" subtitle="Theo dõi doanh thu, lượng bán và tỷ lệ sử dụng voucher." />

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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card label="Doanh thu tháng này" value={formatMoney(summary.revenue.currentMonth)} />
            <Card label="Đơn hàng hoàn tất" value={summary.orders.completedTotal.toLocaleString("vi-VN")} />
            <Card label="Voucher đã bán" value={summary.vouchers.soldTotal.toLocaleString("vi-VN")} />
            <Card label="Voucher đã dùng" value={summary.vouchers.usedTotal.toLocaleString("vi-VN")} />
          </div>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
            <div className="flex justify-between">
              <h2 className="font-extrabold">Xu hướng doanh thu</h2>
              <span className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500">6 tháng gần đây</span>
            </div>
            {(() => {
              const max = Math.max(1, ...summary.revenue.monthly.map((m) => Number(m.revenue)));
              return (
                <div className="mt-8 flex h-56 items-end gap-4">
                  {summary.revenue.monthly.map((m) => (
                    <div className="flex flex-1 flex-col items-center gap-2" key={m.month}>
                      <div
                        className="w-full rounded-t bg-primary"
                        style={{ height: `${Math.max(2, (Number(m.revenue) / max) * 100)}%` }}
                      />
                      <span className="text-[10px] text-slate-400">{m.month.slice(5)}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        </>
      )}
    </PartnerShell>
  );
}
