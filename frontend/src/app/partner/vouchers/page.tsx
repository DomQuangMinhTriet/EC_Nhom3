"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { RecordsTable } from "@/components/admin/records-table";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { VoucherStatusBadge } from "@/components/voucher/voucher-status-badge";
import { usePartnerVouchers } from "@/hooks/queries/use-voucher-products";

function formatPrice(voucher: { originalPrice: string; discountType: string; discountValue: string }) {
  const original = Number(voucher.originalPrice);
  const value = Number(voucher.discountValue);
  const sale = voucher.discountType === "percentage" ? original * (1 - value / 100) : Math.max(original - value, 0);
  return `${sale.toLocaleString("vi-VN")}đ`;
}

export default function PartnerVouchersPage() {
  const vouchersQuery = usePartnerVouchers();
  const [search, setSearch] = useState("");

  const vouchers = useMemo(() => {
    const list = vouchersQuery.data ?? [];
    const query = search.trim().toLowerCase();
    return query ? list.filter((voucher) => voucher.title.toLowerCase().includes(query)) : list;
  }, [vouchersQuery.data, search]);

  return (
    <PartnerShell active="/partner/vouchers">
      <PageHeader title="Voucher của tôi" subtitle="Theo dõi trạng thái từng ưu đãi."/>
      <div className="mb-5 flex gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-brand-sm outline-none focus:border-primary"
          placeholder="Tìm voucher..."
        />
        <Link href="/partner/vouchers/new"><Button size="sm">+ Tạo voucher</Button></Link>
      </div>

      {vouchersQuery.isLoading && <State icon="⏳" title="Đang tải danh sách voucher" text="Vui lòng chờ trong giây lát."/>}

      {vouchersQuery.isError && (
        <State icon="⚠️" title="Không thể tải danh sách voucher" text={vouchersQuery.error instanceof Error ? vouchersQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {!vouchersQuery.isLoading && !vouchersQuery.isError && vouchers.length === 0 && (
        <State icon="🎟" title="Chưa có voucher nào" text="Tạo voucher đầu tiên để gửi quản trị viên xét duyệt."/>
      )}

      {!vouchersQuery.isLoading && !vouchersQuery.isError && vouchers.length > 0 && (
        <RecordsTable
          headers={["Voucher", "Trạng thái", "Giá bán", "Hạn dùng", ""]}
          rows={vouchers.map((voucher) => [
            <b key="t">{voucher.title}</b>,
            <VoucherStatusBadge key="s" status={voucher.status}/>,
            formatPrice(voucher),
            new Date(voucher.endDate).toLocaleDateString("vi-VN"),
            <div key="a" className="flex gap-3">
              <Link className="font-semibold text-primary" href={`/partner/vouchers/${voucher.voucherProductId}/edit`}>Sửa</Link>
              <Link className="font-semibold text-primary" href={`/partner/vouchers/${voucher.voucherProductId}/branches`}>Phân bổ chi nhánh</Link>
              <Link className="font-semibold text-primary" href={`/partner/vouchers/${voucher.voucherProductId}/reviews`}>Đánh giá</Link>
            </div>,
          ])}
        />
      )}
    </PartnerShell>
  );
}
