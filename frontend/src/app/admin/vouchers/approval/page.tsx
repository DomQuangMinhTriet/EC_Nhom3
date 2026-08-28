"use client";
import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { useToast } from "@/components/common/toast";
import { useUpdateVoucherProductStatus, useVoucherProductListForAdmin } from "@/hooks/queries/use-voucher-products";

export default function ApprovalPage() {
  const toast = useToast();
  const pendingQuery = useVoucherProductListForAdmin({ status: "pending", pageSize: 100 });
  const updateStatus = useUpdateVoucherProductStatus();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const items = pendingQuery.data?.vouchers ?? [];

  function approve(id: string) {
    updateStatus.mutate(
      { id, status: "active" },
      {
        onSuccess: () => toast("Đã duyệt voucher."),
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể duyệt voucher.", "error"),
      },
    );
  }

  function reject() {
    if (!rejecting || !reason.trim()) return;
    updateStatus.mutate(
      { id: rejecting, status: "rejected", rejectionReason: reason.trim() },
      {
        onSuccess: () => { toast("Đã từ chối voucher."); setRejecting(null); setReason(""); },
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể từ chối voucher.", "error"),
      },
    );
  }

  return (
    <AdminShell active="/admin/vouchers/approval">
      <PageHeader title="Duyệt Voucher" subtitle="Xét duyệt các ưu đãi do Partner gửi lên."/>

      {pendingQuery.isLoading && <State icon="⏳" title="Đang tải danh sách chờ duyệt" text="Vui lòng chờ trong giây lát."/>}

      {pendingQuery.isError && (
        <State icon="⚠️" title="Không thể tải danh sách chờ duyệt" text={pendingQuery.error instanceof Error ? pendingQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {!pendingQuery.isLoading && !pendingQuery.isError && (
        <div className="space-y-4">
          {items.length ? (
            items.map((item) => (
              <article key={item.voucherProductId} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm">
                <div className="flex-1">
                  <span className="text-xs font-semibold text-slate-500">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                  <h2 className="mt-1 text-sm font-extrabold text-slate-900">{item.title}</h2>
                </div>
                <Button size="sm" disabled={updateStatus.isPending} onClick={() => approve(item.voucherProductId)}>Duyệt</Button>
                <Button size="sm" variant="danger" disabled={updateStatus.isPending} onClick={() => setRejecting(item.voucherProductId)}>Từ chối</Button>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">Không còn voucher chờ duyệt.</div>
          )}
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-5">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-brand-lg">
            <h2 className="font-extrabold">Lý do từ chối</h2>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-4 min-h-28 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary"
              placeholder="Nhập lý do bắt buộc..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejecting(null)}>Hủy</Button>
              <Button variant="danger" disabled={!reason.trim() || updateStatus.isPending} onClick={reject}>Xác nhận từ chối</Button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
