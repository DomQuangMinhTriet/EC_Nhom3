"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TopNav } from "@/components/navigation/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { useToast } from "@/components/common/toast";
type Values = { email: string };
export default function ForgotPasswordPage() { const toast = useToast(); const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(forgotPasswordSchema) }); function submit() { toast("Khôi phục mật khẩu chưa được backend hỗ trợ.", "info"); } return <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white"><TopNav/><section className="mx-auto flex max-w-xl justify-center px-5 pt-20"><div className="w-full rounded-xl border border-slate-200 bg-white p-7 shadow-brand-lg sm:p-9"><form onSubmit={handleSubmit(submit)}><div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-2xl">🔒</div><h1 className="mt-4 text-xl font-extrabold text-slate-900">Khôi phục mật khẩu</h1><p className="mt-2 text-sm leading-6 text-slate-500">Tính năng này sẽ khả dụng khi backend bổ sung endpoint đặt lại mật khẩu.</p></div><div className="mt-7"><Input label="Địa chỉ email" type="email" placeholder="ten@email.com" error={errors.email?.message} {...register("email")}/></div><Button className="mt-5" type="submit" size="lg" fullWidth>Gửi yêu cầu</Button><Link className="mt-5 block text-center text-xs font-semibold text-primary" href="/login">← Quay lại đăng nhập</Link></form></div></section></main>; }
