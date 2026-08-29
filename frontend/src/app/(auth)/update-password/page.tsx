"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SupabaseClient } from "@supabase/supabase-js";
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
  const clientRef = useRef<SupabaseClient | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    // Supabase's reset-password email links here with the recovery session
    // encoded as URL hash params (#access_token=...&refresh_token=...&type=
    // recovery) rather than a query string — parse it ourselves and call
    // setSession explicitly instead of relying on auto-detection, which
    // didn't pick this format up reliably.
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken || type !== "recovery") {
      setStatus("invalid");
      return;
    }

    let client: SupabaseClient;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      setStatus("invalid");
      return;
    }

    clientRef.current = client;
    client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      setStatus(error ? "invalid" : "ready");
      if (!error) {
        // Drop the tokens from the visible URL now that the session is set.
        window.history.replaceState(null, "", window.location.pathname);
      }
    });
  }, []);

  async function submit(values: Values) {
    if (!clientRef.current) return;
    try {
      const { error } = await clientRef.current.auth.updateUser({ password: values.password });
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
