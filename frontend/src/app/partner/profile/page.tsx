"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { partnerMock } from "@/lib/mocks/partner";
import { useToast } from "@/components/common/toast";
const schema = z.object({ contact: z.string().min(2), phone: z.string().min(9), email: z.string().email() }); type Values = z.infer<typeof schema>;
export default function PartnerProfilePage() { const toast = useToast(); const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { contact: partnerMock.contact, phone: partnerMock.phone, email: partnerMock.email } }); return <PartnerShell active="/partner/profile"><PageHeader title="Hồ sơ Partner" subtitle="Thông tin doanh nghiệp và trạng thái xét duyệt."/><form onSubmit={handleSubmit(() => toast("Đã lưu hồ sơ doanh nghiệp."))} className="rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm"><div className="mb-6 flex items-center justify-between rounded-lg bg-emerald-50 p-4"><div><b className="block text-sm text-slate-800">{partnerMock.brand}</b><span className="text-xs text-slate-500">Trạng thái hồ sơ doanh nghiệp</span></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-success">✓ {partnerMock.status}</span></div><div className="grid gap-4 md:grid-cols-2"><Input label="Người đại diện" error={errors.contact?.message} {...register("contact")}/><Input label="Email doanh nghiệp" error={errors.email?.message} {...register("email")}/><Input label="Số điện thoại" error={errors.phone?.message} {...register("phone")}/><Input label="Mã số thuế" value="0312345678" disabled/></div><Button className="mt-6" type="submit">Lưu thay đổi</Button></form></PartnerShell>; }
