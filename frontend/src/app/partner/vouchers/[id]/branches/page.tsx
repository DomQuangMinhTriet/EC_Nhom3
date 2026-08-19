"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { VoucherStatusBadge } from "@/components/voucher/voucher-status-badge";
import { useToast } from "@/components/common/toast";
import { usePartnerVoucherById } from "@/hooks/queries/use-voucher-products";
import { useMyBranches } from "@/hooks/queries/use-profile";
import { useAllocateBranches, useAllocations, useDeleteAllocation, useUpdateAllocation } from "@/hooks/queries/use-branch-quota";
import type { BranchAllocation } from "@/features/branchQuota/branch-quota-api";

export default function VoucherBranchesPage() {
  const params = useParams<{ id: string }>();
  const voucherId = params.id;
  const toast = useToast();

  const voucherQuery = usePartnerVoucherById(voucherId);
  const branchesQuery = useMyBranches();
  const allocationsQuery = useAllocations(voucherId);
  const allocate = useAllocateBranches(voucherId);
  const updateAllocation = useUpdateAllocation(voucherId);
  const revoke = useDeleteAllocation(voucherId);

  const voucher = voucherQuery.data;
  const allocationByBranch = useMemo(() => {
    const map = new Map<string, BranchAllocation>();
    for (const allocation of allocationsQuery.data?.data ?? []) map.set(allocation.branchProfileId, allocation);
    return map;
  }, [allocationsQuery.data]);

  const isLoading = voucherQuery.isLoading || branchesQuery.isLoading || allocationsQuery.isLoading;
  const isError = voucherQuery.isError || branchesQuery.isError || allocationsQuery.isError;
  const canAllocate = voucher?.status === "active";

  if (isLoading) {
    return <PartnerShell active="/partner/vouchers"><PageHeader title="Phân bổ chi nhánh" subtitle="Cấp số lượng voucher cho từng chi nhánh."/><State icon="⏳" title="Đang tải dữ liệu" text="Vui lòng chờ trong giây lát."/></PartnerShell>;
  }

  if (isError || !voucher) {
    return <PartnerShell active="/partner/vouchers"><PageHeader title="Phân bổ chi nhánh" subtitle="Cấp số lượng voucher cho từng chi nhánh."/><State icon="⚠️" title="Không thể tải dữ liệu" text="Voucher không tồn tại hoặc đã xảy ra lỗi."/></PartnerShell>;
  }

  return (
    <PartnerShell active="/partner/vouchers">
      <PageHeader title={`Phân bổ chi nhánh — ${voucher.title}`} subtitle="Voucher chỉ mua được sau khi có ít nhất một chi nhánh được cấp số lượng."/>

      <div className="mb-5 flex items-center justify-between rounded-lg bg-slate-50 p-4">
        <span className="text-sm font-semibold text-slate-700">Trạng thái voucher</span>
        <VoucherStatusBadge status={voucher.status}/>
      </div>

      {!canAllocate && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          Chỉ voucher đang <b>Đang bán (active)</b> mới phân bổ được cho chi nhánh. Voucher này cần được admin duyệt trước.
        </div>
      )}

      {(branchesQuery.data?.length ?? 0) === 0 ? (
        <State icon="🏬" title="Chưa có chi nhánh nào" text="Tạo tài khoản chi nhánh trước ở mục Nhân viên & Chi nhánh."/>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branchesQuery.data?.map((branch) => (
            <BranchAllocationCard
              key={branch.branchProfileId}
              branchName={branch.branchName}
              allocation={allocationByBranch.get(branch.branchProfileId)}
              disabled={!canAllocate}
              pending={allocate.isPending || updateAllocation.isPending || revoke.isPending}
              onAllocate={(totalQuantity) =>
                allocate.mutate([{ branchProfileId: branch.branchProfileId, totalQuantity }], {
                  onSuccess: () => toast("Đã phân bổ voucher cho chi nhánh."),
                  onError: (error) => toast(error instanceof Error ? error.message : "Không thể phân bổ.", "error"),
                })
              }
              onUpdate={(totalQuantity) =>
                updateAllocation.mutate(
                  { branchProfileId: branch.branchProfileId, totalQuantity },
                  {
                    onSuccess: () => toast("Đã cập nhật số lượng."),
                    onError: (error) => toast(error instanceof Error ? error.message : "Không thể cập nhật.", "error"),
                  },
                )
              }
              onRevoke={() =>
                revoke.mutate(branch.branchProfileId, {
                  onSuccess: () => toast("Đã thu hồi phân bổ."),
                  onError: (error) => toast(error instanceof Error ? error.message : "Không thể thu hồi.", "error"),
                })
              }
            />
          ))}
        </div>
      )}
    </PartnerShell>
  );
}

function BranchAllocationCard({
  branchName,
  allocation,
  disabled,
  pending,
  onAllocate,
  onUpdate,
  onRevoke,
}: {
  branchName: string;
  allocation?: BranchAllocation;
  disabled: boolean;
  pending: boolean;
  onAllocate: (totalQuantity: number) => void;
  onUpdate: (totalQuantity: number) => void;
  onRevoke: () => void;
}) {
  const [quantity, setQuantity] = useState(String(allocation?.totalQuantity ?? ""));

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm">
      <h2 className="text-sm font-extrabold text-slate-800">{branchName}</h2>

      {allocation ? (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 p-2">
            <b className="block text-sm text-primary">{allocation.totalQuantity}</b>
            <span className="text-[10px] text-slate-500">Tổng</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <b className="block text-sm text-primary">{allocation.soldQuantity}</b>
            <span className="text-[10px] text-slate-500">Đã bán</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <b className="block text-sm text-primary">{allocation.remainingQuantity}</b>
            <span className="text-[10px] text-slate-500">Còn lại</span>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Chưa được phân bổ.</p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={allocation?.soldQuantity ?? 0}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={disabled}
          placeholder="Số lượng"
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs disabled:bg-slate-50"
        />
        <Button
          size="sm"
          disabled={disabled || pending || quantity === ""}
          onClick={() => {
            const value = Number(quantity);
            if (!Number.isInteger(value) || value < 0) return;
            allocation ? onUpdate(value) : onAllocate(value);
          }}
        >
          {allocation ? "Cập nhật" : "Phân bổ"}
        </Button>
      </div>

      {allocation && (
        <button className="mt-2 text-xs font-semibold text-danger disabled:opacity-50" disabled={pending} onClick={onRevoke}>
          Thu hồi phân bổ
        </button>
      )}
    </article>
  );
}
