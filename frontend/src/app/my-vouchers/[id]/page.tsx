"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CustomerShell } from "@/components/customer/customer-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { VoucherInstanceQr } from "@/components/voucher/voucher-instance-qr";
import { useVoucherInstanceDetail } from "@/hooks/queries/use-voucher-instances";
import type { VoucherInstanceStatus } from "@/features/voucherInstance/voucher-instance-api";

const statusLabel: Record<VoucherInstanceStatus, string> = {
  available: "Đang dùng",
  used: "Đã dùng",
  expired: "Hết hạn",
  cancelled: "Đã hủy",
};

const statusStyle: Record<VoucherInstanceStatus, string> = {
  available: "bg-emerald-50 text-success",
  used: "bg-slate-100 text-slate-500",
  expired: "bg-red-50 text-danger",
  cancelled: "bg-red-50 text-danger",
};

function formatMoney(value: string) {
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

export default function VoucherInstanceDetailPage() {
  const params = useParams<{ id: string }>();
  const voucherId = Array.isArray(params.id) ? params.id[0] : params.id;
  const voucherQuery = useVoucherInstanceDetail(voucherId);
  const voucher = voucherQuery.data;

  return (
    <CustomerShell active="/my-vouchers">
      <PageHeader title="Chi tiết voucher" subtitle="Xuất trình mã hoặc QR này khi sử dụng ưu đãi." />

      {voucherQuery.isLoading && <State icon="..." title="Đang tải voucher" text="Vui lòng chờ trong giây lát." />}

      {voucherQuery.isError && (
        <State
          icon="!"
          title="Không thể tải voucher"
          text={voucherQuery.error instanceof Error ? voucherQuery.error.message : "Đã xảy ra lỗi."}
        />
      )}

      {!voucherQuery.isLoading && !voucherQuery.isError && !voucher && (
        <State icon="?" title="Không tìm thấy voucher" text="Voucher này không tồn tại hoặc bạn không có quyền xem." />
      )}

      {voucher && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-xl border border-slate-200 bg-white shadow-brand-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">{voucher.voucherProduct.title}</h2>
                <p className="mt-1 font-mono text-sm font-bold text-primary">{voucher.code}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[voucher.status]}`}>
                {statusLabel[voucher.status]}
              </span>
            </div>

            <dl className="grid gap-4 p-5 sm:grid-cols-2">
              <Info label="Giá gốc" value={formatMoney(voucher.voucherProduct.originalPrice)} />
              <Info label="Giảm giá" value={`${voucher.voucherProduct.discountValue}${voucher.voucherProduct.discountType === "percentage" ? "%" : "đ"}`} />
              <Info label="Ngày nhận" value={formatDate(voucher.createdAt)} />
              <Info label="Hết hạn" value={formatDate(voucher.expiredAt)} />
              <Info label="Đã sử dụng" value={formatDate(voucher.usedAt)} />
              <Info label="Mã voucher" value={voucher.code} mono />
            </dl>

            <div className="border-t border-slate-100 p-5">
              <Link
                href="/my-vouchers"
                className="inline-flex rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-brand-sm hover:bg-slate-50"
              >
                Quay lại voucher của tôi
              </Link>
            </div>
          </section>

          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 text-center shadow-brand-sm">
            <div className="mx-auto grid justify-items-center">
              <VoucherInstanceQr value={voucher.code} />
              <p className="mt-3 text-xs font-semibold text-slate-700">QR sử dụng voucher</p>
              <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{voucher.code}</p>
            </div>
          </aside>
        </div>
      )}
    </CustomerShell>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase text-slate-400">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold text-slate-800 ${mono ? "break-all font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
