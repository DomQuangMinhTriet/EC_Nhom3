import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { RecordsTable } from "@/components/admin/records-table";
import { partnerVoucherMocks } from "@/lib/mocks/partner";
export default function AdminVouchersPage() { return <AdminShell active="/admin/vouchers"><PageHeader title="Quản lý Vouchers" subtitle="Tìm kiếm, lọc và thay đổi trạng thái voucher theo quyền."/><RecordsTable headers={["Voucher", "Partner", "Đã bán", "Trạng thái", "Thao tác"]} rows={partnerVoucherMocks.map((voucher) => [<b key="n">{voucher.title}</b>, "Lotteria Việt Nam", voucher.sold, <span key="s" className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-success">{voucher.status}</span>, <button key="a" className="font-semibold text-primary">Chi tiết</button>])}/></AdminShell>; }
