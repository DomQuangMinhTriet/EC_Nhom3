"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { State } from "@/components/common/state";
import { useToast } from "@/components/common/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự"),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Mật khẩu xác nhận chưa khớp",
});

type Values = z.infer<typeof schema>;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    // Supabase's password-reset email links to this page with the recovery
    // session encoded in the URL hash; the browser client picks it up
    // automatically on load and fires PASSWORD_RECOVERY once ready.
    let client: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      setStatus("invalid");
      return;
    }

    const { data: subscription } = client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setStatus("ready");
      }
    });

    client.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("ready");
    });

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "invalid" : current));
    }, 3000);

    return () => {
      subscription.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function submit(values: Values) {
    try {
      const client = createSupabaseBrowserClient();
      const { error } = await client.auth.updateUser({ password: values.password });
      if (error) throw error;
      setStatus("done");
      toast("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể đổi mật khẩu.", "error");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-indigo-50 p-5">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-brand-lg">
        {status === "checking" && (
          <p className="text-center text-sm text-slate-500">Đang xác thực liên kết...</p>
        )}
        {status === "invalid" && (
          <State
            icon="!"
            title="Liên kết không hợp lệ hoặc đã hết hạn"
            text="Vui lòng yêu cầu một liên kết đặt lại mật khẩu mới."
          />
        )}
        {status === "done" && (
          <State icon="✓" title="Đổi mật khẩu thành công" text="Đang chuyển tới trang đăng nhập..." />
        )}
        {status === "ready" && (
          <form onSubmit={handleSubmit(submit)}>
            <h1 className="text-xl font-extrabold text-slate-900">Đặt mật khẩu mới</h1>
            <p className="mt-2 text-xs leading-5 text-slate-500">Nhập mật khẩu mới cho tài khoản của bạn.</p>
            <div className="mt-6 space-y-4">
              <Input label="Mật khẩu mới" type="password" error={errors.password?.message} {...register("password")} />
              <Input label="Xác nhận mật khẩu" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
              <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Đang cập nhật..." : "Đặt mật khẩu mới"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
