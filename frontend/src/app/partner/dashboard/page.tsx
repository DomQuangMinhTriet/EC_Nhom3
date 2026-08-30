"use client";
import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { usePartnerDashboardSummary } from "@/hooks/queries/use-dashboard";

function formatMoney(value: string) {
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

const voucherStatusLabel: Record<string, string> = {
  pending: "Chờ duyệt",
  active: "Đang bán",
  out_of_stock: "Hết hàng",
  inactive: "Tạm ngưng",
  rejected: "Bị từ chối",
  expired: "Hết hạn",
};

const voucherStatusStyle: Record<string, string> = {
  active: "bg-emerald-50 text-success",
  pending: "bg-indigo-50 text-primary",
};

function Kpi({ label, value, change }: { label: string; value: string; change?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm">
      <span className="text-xs text-slate-500">{label}</span>
      <b className="mt-2 block text-2xl font-extrabold tracking-[-.5px] text-slate-900">{value}</b>
      {change && (
        <span
          className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold ${
            change.startsWith("-") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-success"
          }`}
        >
          {change}
        </span>
      )}
    </div>
  );
}

export default function PartnerDashboardPage() {
  const summaryQuery = usePartnerDashboardSummary();
  const summary = summaryQuery.data;

  return (
    <PartnerShell active="/partner/dashboard">
      <PageHeader title="Dashboard" subtitle="Tổng quan hoạt động voucher của doanh nghiệp." />

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
            <Kpi
              label="Doanh thu 30 ngày qua"
              value={formatMoney(summary.revenue.last30Days)}
              change={summary.revenue.growthPercent === null ? undefined : `${summary.revenue.growthPercent > 0 ? "+" : ""}${summary.revenue.growthPercent}%`}
            />
            <Kpi label="Voucher đã bán" value={summary.vouchers.soldTotal.toLocaleString("vi-VN")} />
            <Kpi label="Đang bán" value={summary.vouchers.activeCount.toLocaleString("vi-VN")} />
            <Kpi label="Tỷ lệ sử dụng" value={`${summary.vouchers.usageRatePercent}%`} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm">
              <h2 className="font-extrabold text-slate-900">Doanh thu 30 ngày qua</h2>
              {(() => {
                const max = Math.max(1, ...summary.revenue.daily.map((d) => Number(d.revenue)));
                return (
                  <div className="mt-6 flex h-48 items-end gap-1 border-b border-slate-100 pb-2">
                    {summary.revenue.daily.map((d, index) => (
                      <div className="flex flex-1 flex-col items-center gap-2" key={d.date}>
                        <span
                          className="w-full rounded-t bg-gradient-to-t from-primary to-indigo-300"
                          style={{ height: `${Math.max(2, (Number(d.revenue) / max) * 100)}%` }}
                        />
                        <small className="text-[9px] text-slate-400">
                          {index % 5 === 0 ? d.date.slice(8) : ""}
                        </small>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm">
              <h2 className="font-extrabold text-slate-900">Voucher cần chú ý</h2>
              <div className="mt-4 space-y-4">
                {summary.topVouchers.length === 0 && (
                  <p className="text-xs text-slate-400">Chưa có voucher nào.</p>
                )}
                {summary.topVouchers.map((voucher) => (
                  <div className="flex justify-between gap-4 text-xs" key={voucher.voucherProductId}>
                    <div>
                      <b className="block text-slate-800">{voucher.title}</b>
                      <span className="mt-1 block text-slate-500">Đã bán {voucher.sold.toLocaleString("vi-VN")}</span>
                    </div>
                    <span
                      className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold ${
                        voucherStatusStyle[voucher.status] ?? "bg-orange-50 text-warning"
                      }`}
                    >
                      {voucherStatusLabel[voucher.status] ?? voucher.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </PartnerShell>
  );
}
