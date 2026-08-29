"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TopNav } from "@/components/navigation/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { useToast } from "@/components/common/toast";
import { useForgotPassword } from "@/hooks/queries/use-auth";

type Values = { email: string };

export default function ForgotPasswordPage() {
  const toast = useToast();
  const forgotPassword = useForgotPassword();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(forgotPasswordSchema) });

  async function submit(values: Values) {
    try {
      await forgotPassword.mutateAsync(values.email);
      setSent(true);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể gửi yêu cầu.", "error");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white">
      <TopNav />
      <section className="mx-auto flex max-w-xl justify-center px-5 pt-20">
        <div className="w-full rounded-xl border border-slate-200 bg-white p-7 shadow-brand-lg sm:p-9">
          <form onSubmit={handleSubmit(submit)}>
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-2xl">🔒</div>
              <h1 className="mt-4 text-xl font-extrabold text-slate-900">Khôi phục mật khẩu</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {sent
                  ? "Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư (và cả mục Spam)."
                  : "Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu."}
              </p>
            </div>
            {!sent && (
              <>
                <div className="mt-7">
                  <Input label="Địa chỉ email" type="email" placeholder="ten@email.com" error={errors.email?.message} {...register("email")} />
                </div>
                <Button className="mt-5" type="submit" size="lg" fullWidth disabled={forgotPassword.isPending}>
                  {forgotPassword.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
                </Button>
              </>
            )}
            <Link className="mt-5 block text-center text-xs font-semibold text-primary" href="/login">← Quay lại đăng nhập</Link>
          </form>
        </div>
      </section>
    </main>
  );
}
