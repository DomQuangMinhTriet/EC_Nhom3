"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { dashboardForRole } from "@/features/auth/auth-api";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useCart } from "@/hooks/queries/use-cart";

export function TopNav() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { session, signOut } = useAuthSession();
  const isCustomer = session?.user.roleCode === "Customer";
  const { data: cart } = useCart({ enabled: isCustomer });
  const cartItemCount = cart?.items.length ?? 0;

  function search(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center gap-6 px-5">
        <Logo />
        <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-500 md:flex">
          <Link href="/vouchers" className="hover:text-primary">Khám phá voucher</Link>
        </nav>
        <form onSubmit={search} className="ml-auto hidden max-w-[300px] flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-primary md:flex">
          <span className="mr-2 text-slate-400">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm voucher..." className="w-full bg-transparent py-2 text-xs outline-none placeholder:text-slate-400" />
        </form>
        <div className="flex items-center gap-2">
          {isCustomer && (
            <Link href="/cart" className="relative mr-1 text-lg text-slate-500 hover:text-primary" aria-label="Giỏ hàng">
              🛒
              {cartItemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}
          {session ? (
            <>
              <Link href={dashboardForRole(session.user.roleCode)}><Button variant="link" size="sm">Tài khoản</Button></Link>
              <Button variant="outlined" size="sm" onClick={() => { signOut(); router.push("/"); }}>Đăng xuất</Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="link" size="sm">Đăng nhập</Button></Link>
              <Link href="/register"><Button size="sm">Đăng ký</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
