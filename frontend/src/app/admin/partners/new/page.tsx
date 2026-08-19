"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/common/toast";
import { createManagedAccountSchema, type CreateManagedAccountValues } from "@/lib/schemas/profile";
import { registerPartner } from "@/features/auth/auth-api";

export default function NewPartnerPage() {
  const router = useRouter();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateManagedAccountValues>({
    resolver: zodResolver(createManagedAccountSchema),
  });

  async function submit(values: CreateManagedAccountValues) {
    try {
      const result = await registerPartner({ email: values.email, password: values.password });
      toast(result.message);
      router.push("/admin/partners");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tạo tài khoản Partner.", "error");
    }
  }

  return (
    <AdminShell active="/admin/partners/new">
      <PageHeader title="Tạo tài khoản Partner" subtitle="Chỉ tạo thông tin đăng nhập — Partner sẽ tự hoàn tất hồ sơ doanh nghiệp sau khi đăng nhập."/>
      <form onSubmit={handleSubmit(submit)} className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Email" type="email" className="md:col-span-2" error={errors.email?.message} {...register("email")}/>
          <Input label="Mật khẩu tạm thời" type="password" error={errors.password?.message} {...register("password")}/>
          <Input label="Xác nhận mật khẩu" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")}/>
        </div>
        <Button className="mt-6" type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang tạo..." : "Tạo Partner"}</Button>
      </form>
    </AdminShell>
  );
}
