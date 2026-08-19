"use client";
import { useParams } from "next/navigation";
import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { VoucherForm } from "@/components/partner/voucher-form";
export default function EditVoucherPage() { const params = useParams<{ id: string }>(); return <PartnerShell active="/partner/vouchers"><PageHeader title="Chỉnh sửa voucher" subtitle="Thay đổi chỉ được phép khi voucher ở trạng thái phù hợp."/><VoucherForm voucherId={params.id}/></PartnerShell>; }
