import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { VoucherForm } from "@/components/partner/voucher-form";
export default function NewVoucherPage() { return <PartnerShell active="/partner/vouchers/new"><PageHeader title="Tạo voucher mới" subtitle="Hoàn thiện thông tin để gửi voucher đến quản trị viên xét duyệt."/><VoucherForm/></PartnerShell>; }
