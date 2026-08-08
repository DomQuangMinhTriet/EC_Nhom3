"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TopNav } from "@/components/navigation/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { usePasswordReset } from "@/hooks/queries/use-auth";
import { useToast } from "@/components/common/toast";
type Values = { email: string };
export default function ForgotPasswordPage() { const [sent, setSent] = useState(false); const toast = useToast(); const reset = usePasswordReset(); const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(forgotPasswordSchema) }); async function submit({ email }: Values) { try { await reset.mutateAsync(email); setSent(true); } catch (error) { toast(error instanceof Error ? error.message : "Không thể gửi email", "error"); } } return <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white"><TopNav/><section className="mx-auto flex max-w-xl justify-center px-5 pt-20"><div className="w-full rounded-xl border border-slate-200 bg-white p-7 shadow-brand-lg sm:p-9">{sent ? <div className="py-4 text-center"><div className="mx-auto grid h-[72px] w-[72px] place-items-center rounded-full bg-emerald-100 text-3xl text-success">✓</div><h1 className="mt-5 text-xl font-extrabold text-slate-900">Đã gửi email!</h1><p className="mt-3 text-sm leading-6 text-slate-500">Kiểm tra hộp thư của bạn và nhấn vào đường link để đặt lại mật khẩu.</p><Link href="/login"><Button className="mt-7" fullWidth size="lg">Về đăng nhập</Button></Link></div> : <form onSubmit={handleSubmit(submit)}><div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-2xl">🔒</div><h1 className="mt-4 text-xl font-extrabold text-slate-900">Khôi phục mật khẩu</h1><p className="mt-2 text-sm leading-6 text-slate-500">Nhập email đăng ký và chúng tôi sẽ gửi đường link đặt lại mật khẩu.</p></div><div className="mt-7"><Input label="Địa chỉ email" type="email" placeholder="ten@email.com" error={errors.email?.message} {...register("email")}/></div><Button className="mt-5" type="submit" size="lg" fullWidth disabled={reset.isPending}>{reset.isPending ? "Đang gửi..." : "Gửi link khôi phục"}</Button><Link className="mt-5 block text-center text-xs font-semibold text-primary" href="/login">← Quay lại đăng nhập</Link></form>}</div></section></main>; }
