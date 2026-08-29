"use client";
import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { RecordsTable } from "@/components/admin/records-table";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { VoucherStatusBadge } from "@/components/voucher/voucher-status-badge";
import { StatusAction } from "@/components/common/status-action";
import { useToast } from "@/components/common/toast";
import { useUpdateVoucherProductStatus, useVoucherProductList } from "@/hooks/queries/use-voucher-products";
import type { AdminVoucherStatus, VoucherProductStatus } from "@/features/vouchers/voucher-product-api";

const allStatuses: readonly VoucherProductStatus[] = ["pending", "active", "inactive", "out_of_stock", "rejected", "expired"];
// Backend's PATCH /:id/status only accepts these three — offering the other
// enum values in the action dropdown produced a live 400 "Invalid voucher
// status" when picked, since pending/out_of_stock/expired aren't valid
// admin-set targets (out_of_stock and expired currently have no writer at
// all; pending is entered automatically, never chosen).
const settableStatuses: readonly VoucherProductStatus[] = ["active", "inactive", "rejected"];

export default function AdminVouchersPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<VoucherProductStatus | "">("");
  const vouchersQuery = useVoucherProductList({ page, pageSize: 20, status: status || undefined });
  const updateStatus = useUpdateVoucherProductStatus();

  const vouchers = vouchersQuery.data?.vouchers ?? [];
  const pagination = vouchersQuery.data?.pagination;

  function changeStatus(id: string, next: VoucherProductStatus) {
    updateStatus.mutate(
      { id, status: next as AdminVoucherStatus },
      {
        onSuccess: () => toast("Đã cập nhật trạng thái voucher."),
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.", "error"),
      },
    );
  }

  return (
    <AdminShell active="/admin/vouchers">
      <PageHeader title="Quản lý Vouchers" subtitle="Tìm kiếm, lọc và thay đổi trạng thái voucher theo quyền."/>

      <select
        value={status}
        onChange={(event) => { setPage(1); setStatus(event.target.value as VoucherProductStatus | ""); }}
        className="mb-5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-brand-sm"
      >
        <option value="">Tất cả trạng thái</option>
        {allStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>

      {vouchersQuery.isLoading && <State icon="⏳" title="Đang tải danh sách voucher" text="Vui lòng chờ trong giây lát."/>}

      {vouchersQuery.isError && (
        <State icon="⚠️" title="Không thể tải danh sách voucher" text={vouchersQuery.error instanceof Error ? vouchersQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {!vouchersQuery.isLoading && !vouchersQuery.isError && vouchers.length === 0 && (
        <State icon="🎟" title="Không có voucher phù hợp" text="Thử đổi bộ lọc trạng thái."/>
      )}

      {!vouchersQuery.isLoading && !vouchersQuery.isError && vouchers.length > 0 && (
        <>
          <RecordsTable
            headers={["Voucher", "Trạng thái", "Thao tác", ""]}
            rows={vouchers.map((voucher) => [
              <b key="n">{voucher.title}</b>,
              <VoucherStatusBadge key="s" status={voucher.status}/>,
              <StatusAction
                key="a"
                statuses={settableStatuses}
                currentStatus={voucher.status}
                pending={updateStatus.isPending}
                onSubmit={(next) => changeStatus(voucher.voucherProductId, next)}
              />,
              <Link key="r" className="font-semibold text-primary" href={`/admin/vouchers/${voucher.voucherProductId}/reviews`}>Đánh giá</Link>,
            ])}
          />

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Trang {pagination.page} / {pagination.totalPages} · {pagination.total} voucher</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>← Trước</Button>
                <Button size="sm" variant="ghost" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Sau →</Button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
