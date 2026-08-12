"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerShell } from "@/components/customer/customer-shell";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/common/toast";
const schema = z.object({ password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự"), confirm: z.string() }).refine((values) => values.password === values.confirm, { path: ["confirm"], message: "Mật khẩu xác nhận chưa khớp" }); type Values = z.infer<typeof schema>;
export default function SettingsPage() { return <SettingsContent/>; }
function SettingsContent() { const toast = useToast(); const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) }); return <CustomerShell active="/settings"><PageHeader title="Cài đặt" subtitle="Tùy chỉnh bảo mật và thông báo tài khoản."/><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm"><h2 className="font-extrabold text-slate-900">Thông báo</h2><div className="mt-4 space-y-4 text-xs"><Toggle label="Nhận thông báo ưu đãi mới"/><Toggle label="Nhắc voucher sắp hết hạn"/><Toggle label="Email xác nhận đơn hàng"/></div></section><form onSubmit={handleSubmit(() => toast("Mật khẩu đã được cập nhật."))} className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm"><h2 className="font-extrabold text-slate-900">Đổi mật khẩu</h2><div className="mt-4 max-w-md space-y-4"><Input label="Mật khẩu mới" type="password" error={errors.password?.message} {...register("password")}/><Input label="Xác nhận mật khẩu mới" type="password" error={errors.confirm?.message} {...register("confirm")}/><Button type="submit">Cập nhật mật khẩu</Button></div></form></CustomerShell>; }
function Toggle({ label }: { label: string }) { return <label className="flex items-center justify-between text-slate-700"><span>{label}</span><input defaultChecked type="checkbox" className="h-4 w-4 accent-[#4F46E5]"/></label>; }
