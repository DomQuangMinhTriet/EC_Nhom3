"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/common/toast";
const schema = z.object({ password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự"), confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Mật khẩu xác nhận chưa khớp" }); type Values = z.infer<typeof schema>;
export default function UpdatePasswordPage() { const router = useRouter(); const toast = useToast(); const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) }); async function submit(values: Values) { try { const { error } = await createSupabaseBrowserClient().auth.updateUser({ password: values.password }); if (error) throw error; toast("Mật khẩu đã được cập nhật."); router.push("/login"); } catch (error) { toast(error instanceof Error ? error.message : "Không thể cập nhật mật khẩu", "error"); } } return <main className="grid min-h-screen place-items-center bg-indigo-50 p-5"><form onSubmit={handleSubmit(submit)} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-brand-lg"><h1 className="text-xl font-extrabold text-slate-900">Đặt mật khẩu mới</h1><p className="mt-2 text-xs leading-5 text-slate-500">Chọn mật khẩu mới có ít nhất 8 ký tự để bảo vệ tài khoản.</p><div className="mt-6 space-y-4"><Input label="Mật khẩu mới" type="password" error={errors.password?.message} {...register("password")}/><Input label="Xác nhận mật khẩu" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")}/><Button type="submit" fullWidth size="lg" disabled={isSubmitting}>{isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</Button></div></form></main>; }
