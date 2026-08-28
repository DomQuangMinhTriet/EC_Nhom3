"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthSession } from "@/features/auth/auth-session-provider";
const links = [["/admin/dashboard", "Dashboard"], ["/admin/users", "Người dùng"], ["/admin/partners", "Partners"], ["/admin/partners/new", "Thêm Partner"], ["/admin/branches", "Chi nhánh"], ["/admin/vouchers/approval", "Duyệt Voucher"], ["/admin/vouchers", "Vouchers"], ["/admin/categories", "Danh mục"], ["/admin/reports", "Báo cáo"], ["/admin/settings", "Cài đặt"], ["/admin/notifications", "Thông báo"], ["/admin/audit-log", "Audit Log"]] as const;
export function AdminShell({ children, active }: { children: ReactNode; active: string }) {
  const router = useRouter();
  const { signOut } = useAuthSession();
  return <main className="min-h-screen bg-slate-50 lg:flex"><aside className="flex flex-col border-b border-white/10 bg-[#0B1120] p-4 text-slate-300 lg:min-h-screen lg:w-60"><Link href="/admin/dashboard" className="flex items-center gap-2 font-extrabold text-white"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500 text-xs">EC</span>Admin Portal</Link><nav className="mt-7 flex gap-1 overflow-x-auto lg:block">{links.map(([href, label]) => <Link href={href} key={href} className={`block shrink-0 rounded-lg px-3 py-2.5 text-xs font-semibold ${active === href ? "bg-indigo-500/20 text-indigo-200" : "hover:bg-white/5"}`}>{label}</Link>)}</nav><button type="button" onClick={() => { signOut(); router.push("/login"); }} className="mt-4 block shrink-0 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 lg:mt-auto">Đăng xuất</button></aside><section className="min-w-0 flex-1 p-5 md:p-8">{children}</section></main>;
}
