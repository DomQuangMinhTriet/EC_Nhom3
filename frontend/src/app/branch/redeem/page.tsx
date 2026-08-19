"use client";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BranchShell } from "@/components/branch/branch-shell";
const schema = z.object({ code: z.string().min(6, "Nhập mã voucher hợp lệ") }); type Values = z.infer<typeof schema>;
export default function RedeemPage() { return <RedeemContent/>; }
function RedeemContent() { const [valid, setValid] = useState(false); const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) }); return <BranchShell active="/branch/redeem"><div className="grid place-items-center py-8"><form onSubmit={handleSubmit(() => setValid(true))} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-brand-lg"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-2xl">▣</div><h1 className="mt-5 text-2xl font-extrabold">Dùng voucher</h1><p className="mt-2 text-sm leading-6 text-slate-500">Nhập mã voucher của khách hàng để kiểm tra trước khi xác nhận sử dụng.</p><div className="mt-6"><Input label="Mã voucher" placeholder="EC-XXXX-XXXX" error={errors.code?.message} {...register("code")}/></div>{valid && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs"><b className="block text-success">Voucher hợp lệ</b><p className="mt-1 text-slate-600">Lotteria −30% · Có thể sử dụng tại chi nhánh này.</p></div>}<Button fullWidth size="lg" className="mt-5" type="submit">{valid ? "Xác nhận sử dụng" : "Kiểm tra voucher"}</Button></form></div></BranchShell>; }
