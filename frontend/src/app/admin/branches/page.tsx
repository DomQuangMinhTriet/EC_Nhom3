"use client";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { RecordsTable } from "@/components/admin/records-table";
import { State } from "@/components/common/state";
import { ProfileStatusBadge } from "@/components/profile/profile-status-badge";
import { ProfileStatusAction } from "@/components/profile/profile-status-action";
import { useToast } from "@/components/common/toast";
import { useAdminBranches, useUpdateBranchStatus } from "@/hooks/queries/use-profile";
import type { BranchProfileStatus } from "@/features/profile/profile-api";

const branchStatuses: readonly BranchProfileStatus[] = ["pending", "active", "suspended", "closed", "rejected"];

export default function BranchesAdminPage() {
  const toast = useToast();
  const branchesQuery = useAdminBranches();
  const updateStatus = useUpdateBranchStatus();
  const branches = branchesQuery.data ?? [];

  function changeStatus(branchProfileId: string, status: BranchProfileStatus, rejectionReason?: string) {
    updateStatus.mutate(
      { branchProfileId, status, rejectionReason },
      {
        onSuccess: () => toast("Đã cập nhật trạng thái chi nhánh."),
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.", "error"),
      },
    );
  }

  return (
    <AdminShell active="/admin/branches">
      <PageHeader title="Quản lý Chi nhánh" subtitle="Danh sách và trạng thái chi nhánh của các Partner."/>

      {branchesQuery.isLoading && <State icon="⏳" title="Đang tải danh sách chi nhánh" text="Vui lòng chờ trong giây lát."/>}

      {branchesQuery.isError && (
        <State icon="⚠️" title="Không thể tải danh sách chi nhánh" text={branchesQuery.error instanceof Error ? branchesQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {!branchesQuery.isLoading && !branchesQuery.isError && branches.length === 0 && (
        <State icon="🏬" title="Chưa có chi nhánh nào" text="Chi nhánh do Partner tạo sẽ xuất hiện tại đây."/>
      )}

      {!branchesQuery.isLoading && !branchesQuery.isError && branches.length > 0 && (
        <RecordsTable
          headers={["Chi nhánh", "Mã đối tác", "Địa chỉ", "Trạng thái", "Thao tác"]}
          rows={branches.map((branch) => [
            <b key="n">{branch.branchName}</b>,
            <span key="p" className="font-mono text-[11px] text-slate-500">{branch.partnerProfileId}</span>,
            branch.address || "—",
            <ProfileStatusBadge key="s" status={branch.status}/>,
            <ProfileStatusAction
              key="a"
              statuses={branchStatuses}
              currentStatus={branch.status}
              pending={updateStatus.isPending}
              onSubmit={(status, reason) => changeStatus(branch.branchProfileId, status, reason)}
            />,
          ])}
        />
      )}
    </AdminShell>
  );
}
