"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BranchShell } from "@/components/branch/branch-shell";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/common/toast";
import { State } from "@/components/common/state";
import { ProfileStatusBadge } from "@/components/profile/profile-status-badge";
import { branchProfileSchema, type BranchProfileValues } from "@/lib/schemas/profile";
import { useCreateProfile, useMyProfile, useUpdateProfile } from "@/hooks/queries/use-profile";
import { isProfileNotFound, type BranchProfile } from "@/features/profile/profile-api";

export default function BranchProfilePage() {
  const toast = useToast();
  const profileQuery = useMyProfile<BranchProfile>();
  const createProfile = useCreateProfile<BranchProfile>();
  const updateProfile = useUpdateProfile<BranchProfile>();

  const notFound = isProfileNotFound(profileQuery.error);
  const profile = profileQuery.data;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BranchProfileValues>({
    resolver: zodResolver(branchProfileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        partnerProfileId: profile.partnerProfileId,
        branchProfileCode: profile.branchProfileCode,
        branchName: profile.branchName,
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        email: profile.email ?? "",
      });
    }
  }, [profile, reset]);

  async function submit(values: BranchProfileValues) {
    try {
      if (notFound) {
        await createProfile.mutateAsync({
          partnerProfileId: values.partnerProfileId,
          branchProfileCode: values.branchProfileCode,
          branchName: values.branchName,
          phone: values.phone || undefined,
          address: values.address || undefined,
          email: values.email || undefined,
        });
        toast("Đã tạo hồ sơ chi nhánh.");
      } else {
        await updateProfile.mutateAsync({
          branchName: values.branchName,
          phone: values.phone || undefined,
          address: values.address || undefined,
          email: values.email || undefined,
        });
        toast("Đã lưu hồ sơ chi nhánh.");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu hồ sơ.", "error");
    }
  }

  if (profileQuery.isLoading) {
    return <BranchShell active="/branch/profile"><PageHeader title="Hồ sơ chi nhánh" subtitle="Thông tin chi nhánh và trạng thái hoạt động."/><State icon="⏳" title="Đang tải hồ sơ" text="Vui lòng chờ trong giây lát."/></BranchShell>;
  }

  if (profileQuery.isError && !notFound) {
    return <BranchShell active="/branch/profile"><PageHeader title="Hồ sơ chi nhánh" subtitle="Thông tin chi nhánh và trạng thái hoạt động."/><State icon="⚠️" title="Không thể tải hồ sơ" text={profileQuery.error instanceof Error ? profileQuery.error.message : "Đã xảy ra lỗi."}/></BranchShell>;
  }

  return (
    <BranchShell active="/branch/profile">
      <PageHeader title="Hồ sơ chi nhánh" subtitle={notFound ? "Nhập mã đối tác do Partner cung cấp để hoàn tất hồ sơ." : "Thông tin chi nhánh và trạng thái hoạt động."}/>
      <form onSubmit={handleSubmit(submit)} className="rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
        {profile && (
          <div className="mb-6 flex items-center justify-between rounded-lg bg-emerald-50 p-4">
            <div>
              <b className="block text-sm text-slate-800">{profile.branchName}</b>
              <span className="text-xs text-slate-500">Trạng thái chi nhánh</span>
              {profile.status === "rejected" && profile.rejectionReason && <p className="mt-1 text-xs text-danger">Lý do: {profile.rejectionReason}</p>}
            </div>
            <ProfileStatusBadge status={profile.status}/>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Mã đối tác (Partner ID)" required={notFound} disabled={!notFound} hint={notFound ? "Nhận từ Partner tạo tài khoản" : undefined} error={errors.partnerProfileId?.message} {...register("partnerProfileId")}/>
          <Input label="Mã chi nhánh" required={notFound} disabled={!notFound} error={errors.branchProfileCode?.message} {...register("branchProfileCode")}/>
          <Input label="Tên chi nhánh" required error={errors.branchName?.message} {...register("branchName")}/>
          <Input label="Số điện thoại" error={errors.phone?.message} {...register("phone")}/>
          <Input label="Địa chỉ" error={errors.address?.message} {...register("address")}/>
          <Input label="Email chi nhánh" error={errors.email?.message} {...register("email")}/>
        </div>
        <Button className="mt-6" type="submit" disabled={isSubmitting || createProfile.isPending || updateProfile.isPending}>
          {notFound ? "Tạo hồ sơ" : "Lưu thay đổi"}
        </Button>
      </form>
    </BranchShell>
  );
}
