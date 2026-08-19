"use client";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { RecordsTable } from "@/components/admin/records-table";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { ProfileStatusBadge } from "@/components/profile/profile-status-badge";
import { StatusAction } from "@/components/common/status-action";
import { useToast } from "@/components/common/toast";
import { useAdminPartners, useUpdatePartnerStatus } from "@/hooks/queries/use-profile";
import type { PartnerProfileStatus } from "@/features/profile/profile-api";

const partnerStatuses: readonly PartnerProfileStatus[] = ["pending", "active", "suspended", "terminated", "rejected"];

export default function PartnersPage() {
  const toast = useToast();
  const partnersQuery = useAdminPartners();
  const updateStatus = useUpdatePartnerStatus();
  const partners = partnersQuery.data ?? [];

  function changeStatus(partnerProfileId: string, status: PartnerProfileStatus, rejectionReason?: string) {
    updateStatus.mutate(
      { partnerProfileId, status, rejectionReason },
      {
        onSuccess: () => toast("Đã cập nhật trạng thái Partner."),
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.", "error"),
      },
    );
  }

  return (
    <AdminShell active="/admin/partners">
      <PageHeader title="Quản lý Partners" subtitle="Danh sách và trạng thái doanh nghiệp."/>
      <Link href="/admin/partners/new"><Button size="sm" className="mb-5">+ Tạo tài khoản Partner</Button></Link>

      {partnersQuery.isLoading && <State icon="⏳" title="Đang tải danh sách Partner" text="Vui lòng chờ trong giây lát."/>}

      {partnersQuery.isError && (
        <State icon="⚠️" title="Không thể tải danh sách Partner" text={partnersQuery.error instanceof Error ? partnersQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {!partnersQuery.isLoading && !partnersQuery.isError && partners.length === 0 && (
        <State icon="🤝" title="Chưa có Partner nào" text="Tạo tài khoản Partner đầu tiên để bắt đầu."/>
      )}

      {!partnersQuery.isLoading && !partnersQuery.isError && partners.length > 0 && (
        <RecordsTable
          headers={["Doanh nghiệp", "Mã số thuế", "Người đại diện", "Trạng thái", "Thao tác"]}
          rows={partners.map((partner) => [
            <b key="n">{partner.partnerName}</b>,
            partner.taxCode,
            partner.representativeName,
            <ProfileStatusBadge key="s" status={partner.status}/>,
            <StatusAction
              key="a"
              statuses={partnerStatuses}
              currentStatus={partner.status}
              pending={updateStatus.isPending}
              onSubmit={(status, reason) => changeStatus(partner.partnerProfileId, status, reason)}
            />,
          ])}
        />
      )}
    </AdminShell>
  );
}
