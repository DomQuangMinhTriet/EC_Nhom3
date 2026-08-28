"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthSession } from "@/features/auth/auth-session-provider";
const links = [["/branch/redeem", "Dùng voucher"], ["/branch/profile", "Hồ sơ chi nhánh"]] as const;
export function BranchShell({ children, active }: { children: ReactNode; active: string }) {
  const router = useRouter();
  const { signOut } = useAuthSession();
  return <main className="min-h-screen bg-slate-50 lg:flex"><aside className="flex flex-col border-b border-white/10 bg-[#0f2027] p-4 text-slate-300 lg:min-h-screen lg:w-60"><Link href="/branch/redeem" className="flex items-center gap-2 font-extrabold text-white"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-xs">EC</span>Branch Portal</Link><nav className="mt-7 flex gap-1 overflow-x-auto lg:block">{links.map(([href, label]) => <Link href={href} key={href} className={`block shrink-0 rounded-lg px-3 py-2.5 text-xs font-semibold ${active === href ? "bg-emerald-500/20 text-emerald-200" : "hover:bg-white/5"}`}>{label}</Link>)}</nav><button type="button" onClick={() => { signOut(); router.push("/login"); }} className="mt-4 block shrink-0 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 lg:mt-auto">Đăng xuất</button></aside><section className="min-w-0 flex-1 p-5 md:p-8">{children}</section></main>;
}
