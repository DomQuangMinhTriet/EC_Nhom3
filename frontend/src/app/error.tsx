"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
export default function Error({ reset }: { error: Error; reset: () => void }) { useEffect(() => undefined, []); return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><div className="max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-brand-lg"><div className="text-3xl">!</div><h1 className="mt-4 text-xl font-extrabold">Không thể tải trang</h1><p className="mt-2 text-sm leading-6 text-slate-500">Đã xảy ra lỗi tạm thời. Vui lòng thử lại.</p><Button className="mt-6" onClick={reset}>Thử lại</Button></div></main>; }
