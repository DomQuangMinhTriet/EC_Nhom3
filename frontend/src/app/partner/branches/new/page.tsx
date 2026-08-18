"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { useToast } from "@/components/common/toast";
import { createManagedAccountSchema, type CreateManagedAccountValues } from "@/lib/schemas/profile";
import { registerBranch } from "@/features/auth/auth-api";
import { useMyProfile } from "@/hooks/queries/use-profile";
import { isProfileNotFound, type PartnerProfile } from "@/features/profile/profile-api";

export default function NewBranchAccountPage() {
  const router = useRouter();
  const toast = useToast();
  const partnerProfileQuery = useMyProfile<PartnerProfile>();
  const [created, setCreated] = useState<{ email: string } | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateManagedAccountValues>({
    resolver: zodResolver(createManagedAccountSchema),
  });

  async function submit(values: CreateManagedAccountValues) {
    try {
      const result = await registerBranch({ email: values.email, password: values.password });
      setCreated({ email: result.user.email });
      toast(result.message);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tạo tài khoản chi nhánh.", "error");
    }
  }

  const partnerProfileMissing = isProfileNotFound(partnerProfileQuery.error);

  return (
    <PartnerShell active="/partner/branches">
      <PageHeader title="Thêm tài khoản chi nhánh" subtitle="Tạo đăng nhập cho chi nhánh mới, sau đó chi nhánh tự hoàn tất hồ sơ."/>

      {partnerProfileMissing && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          Bạn cần hoàn tất <b>hồ sơ doanh nghiệp</b> trước khi tạo tài khoản chi nhánh, vì chi nhánh cần mã đối tác (Partner ID) của bạn để hoàn tất hồ sơ.
        </div>
      )}

      {created ? (
        <div className="max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <b className="block text-sm text-emerald-900">Đã tạo tài khoản {created.email}</b>
          <p className="mt-2 text-xs leading-6 text-emerald-800">
            Tài khoản đang ở trạng thái <b>chờ kích hoạt</b> — quản trị viên cần kích hoạt tài khoản trước khi chi nhánh có thể đăng nhập.
            Gửi cho chi nhánh thông tin đăng nhập cùng <b>Mã đối tác (Partner ID)</b> bên dưới để họ hoàn tất hồ sơ chi nhánh sau khi đăng nhập:
          </p>
          <div className="mt-3 rounded-lg bg-white p-3 font-mono text-xs">{partnerProfileQuery.data?.partnerProfileId ?? "Đang tải..."}</div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outlined" onClick={() => setCreated(null)}>Tạo thêm chi nhánh</Button>
            <Button size="sm" variant="ghost" onClick={() => router.push("/partner/branches")}>Về danh sách chi nhánh</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Email đăng nhập" type="email" className="md:col-span-2" error={errors.email?.message} {...register("email")}/>
            <Input label="Mật khẩu tạm thời" type="password" error={errors.password?.message} {...register("password")}/>
            <Input label="Xác nhận mật khẩu" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")}/>
          </div>
          <Button className="mt-6" type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang tạo..." : "Tạo tài khoản chi nhánh"}</Button>
        </form>
      )}

      {partnerProfileQuery.isLoading && <div className="mt-5"><State icon="⏳" title="Đang tải hồ sơ doanh nghiệp" text="Vui lòng chờ trong giây lát."/></div>}
    </PartnerShell>
  );
}
