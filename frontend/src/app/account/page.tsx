"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerShell } from "@/components/customer/customer-shell";
import { customerMock } from "@/lib/mocks/customer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/common/toast";
import { PageHeader } from "@/components/common/page-header";
const schema = z.object({ name: z.string().min(2, "Nhập họ và tên"), phone: z.string().min(9, "Số điện thoại không hợp lệ"), city: z.string().min(2, "Nhập tỉnh/thành phố") }); type Values = z.infer<typeof schema>;
export default function AccountPage() { return <AccountContent/>; }
function AccountContent() { const toast = useToast(); const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: customerMock.name, phone: customerMock.phone, city: customerMock.city } }); return <CustomerShell active="/account"><PageHeader title="Hồ sơ của tôi" subtitle="Quản lý thông tin tài khoản và nhận voucher."/><form onSubmit={handleSubmit(async () => { await new Promise((r) => setTimeout(r, 300)); toast("Đã cập nhật hồ sơ."); })} className="rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm"><div className="mb-7 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-indigo-400 text-lg font-bold text-white">NA</div><div><b className="block text-sm">Ảnh đại diện</b><Button className="mt-2" type="button" variant="outlined" size="sm">Tải ảnh lên</Button></div></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Họ và tên" error={errors.name?.message} {...register("name")}/><Input label="Email" disabled value={customerMock.email}/><Input label="Số điện thoại" error={errors.phone?.message} {...register("phone")}/><Input label="Tỉnh / Thành phố" error={errors.city?.message} {...register("city")}/></div><Button type="submit" className="mt-6" disabled={isSubmitting}>{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</Button></form></CustomerShell>; }
