"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/common/toast";

const schema = z.object({
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự"),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Mật khẩu xác nhận chưa khớp",
});

type Values = z.infer<typeof schema>;

export default function UpdatePasswordPage() {
  const toast = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  return (
    <main className="grid min-h-screen place-items-center bg-indigo-50 p-5">
      <form onSubmit={handleSubmit(() => toast("Đổi mật khẩu chưa được backend hỗ trợ.", "info"))} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-brand-lg">
        <h1 className="text-xl font-extrabold text-slate-900">Đặt mật khẩu mới</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">Tính năng này sẽ khả dụng khi backend bổ sung endpoint đổi mật khẩu.</p>
        <div className="mt-6 space-y-4">
          <Input label="Mật khẩu mới" type="password" error={errors.password?.message} {...register("password")} />
          <Input label="Xác nhận mật khẩu" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          <Button type="submit" fullWidth size="lg">Gửi yêu cầu</Button>
        </div>
      </form>
    </main>
  );
}
