"use client";
import Link from "next/link";
import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { ProfileStatusBadge } from "@/components/profile/profile-status-badge";
import { useMyBranches } from "@/hooks/queries/use-profile";

export default function BranchesPage() {
  const branchesQuery = useMyBranches();
  const branches = branchesQuery.data ?? [];

  return (
    <PartnerShell active="/partner/branches">
      <PageHeader title="Nhân viên & Chi nhánh" subtitle="Quản lý chi nhánh, nhân viên và quota voucher."/>
      <Link href="/partner/branches/new"><Button size="sm">+ Thêm chi nhánh</Button></Link>

      {branchesQuery.isLoading && <div className="mt-5"><State icon="⏳" title="Đang tải danh sách chi nhánh" text="Vui lòng chờ trong giây lát."/></div>}

      {branchesQuery.isError && (
        <div className="mt-5">
          <State icon="⚠️" title="Không thể tải danh sách chi nhánh" text={branchesQuery.error instanceof Error ? branchesQuery.error.message : "Đã xảy ra lỗi."}/>
        </div>
      )}

      {!branchesQuery.isLoading && !branchesQuery.isError && branches.length === 0 && (
        <div className="mt-5"><State icon="🏬" title="Chưa có chi nhánh" text="Tạo tài khoản chi nhánh đầu tiên để bắt đầu."/></div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => (
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm" key={branch.branchProfileId}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-extrabold text-slate-800">{branch.branchName}</h2>
              <ProfileStatusBadge status={branch.status}/>
            </div>
            <p className="mt-2 text-xs text-slate-500">{branch.address || "Chưa có địa chỉ"}</p>
            <p className="mt-1 text-xs text-slate-500">{branch.phone || "Chưa có số điện thoại"}</p>
          </article>
        ))}
      </div>
    </PartnerShell>
  );
}
