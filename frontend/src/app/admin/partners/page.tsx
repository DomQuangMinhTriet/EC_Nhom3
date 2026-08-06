import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { RecordsTable } from "@/components/admin/records-table";
import { Button } from "@/components/ui/button";
import { adminPartners } from "@/lib/mocks/admin";
export default function PartnersPage() { return <AdminShell active="/admin/partners"><PageHeader title="Quản lý Partners" subtitle="Danh sách và trạng thái xác thực doanh nghiệp."/><Link href="/admin/partners/new"><Button size="sm" className="mb-5">+ Thêm Partner</Button></Link><RecordsTable headers={["Doanh nghiệp", "Danh mục", "Chi nhánh", "Trạng thái", "Thao tác"]} rows={adminPartners.map((partner) => [<b key="n">{partner.name}</b>, partner.category, partner.branches, <span key="s" className={`rounded-full px-2 py-1 text-[10px] font-bold ${partner.status === "Đã duyệt" ? "bg-emerald-50 text-success" : "bg-indigo-50 text-primary"}`}>{partner.status}</span>, <button key="a" className="font-semibold text-primary">Xem</button>])}/></AdminShell>; }
