"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const schema = z.object({ brand: z.string().min(2, "Nhập tên doanh nghiệp"), email: z.string().email("Email không hợp lệ"), phone: z.string().min(9, "Số điện thoại không hợp lệ"), tax: z.string().min(8, "Mã số thuế không hợp lệ") }); type Values = z.infer<typeof schema>;
export default function NewPartnerPage() { const router = useRouter(); const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) }); return <AdminShell active="/admin/partners/new"><PageHeader title="Thêm Partner mới" subtitle="Tạo hồ sơ doanh nghiệp và gửi thông tin đăng nhập."/><form onSubmit={handleSubmit(() => router.push("/admin/partners"))} className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm"><div className="grid gap-4 md:grid-cols-2"><Input label="Tên doanh nghiệp" error={errors.brand?.message} className="md:col-span-2" {...register("brand")}/><Input label="Email" error={errors.email?.message} {...register("email")}/><Input label="Số điện thoại" error={errors.phone?.message} {...register("phone")}/><Input label="Mã số thuế" error={errors.tax?.message} {...register("tax")}/></div><Button className="mt-6" type="submit">Tạo Partner</Button></form></AdminShell>; }
