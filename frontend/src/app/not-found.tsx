import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><div className="text-center"><p className="text-6xl font-extrabold text-primary">404</p><h1 className="mt-3 text-xl font-extrabold">Không tìm thấy trang</h1><p className="mt-2 text-sm text-slate-500">Liên kết có thể đã thay đổi hoặc không còn tồn tại.</p><Link className="mt-6 inline-block" href="/"><Button>Về trang chủ</Button></Link></div></main>; }
