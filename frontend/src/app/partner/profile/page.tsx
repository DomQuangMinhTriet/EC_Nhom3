"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/common/toast";
import { State } from "@/components/common/state";
import { ProfileStatusBadge } from "@/components/profile/profile-status-badge";
import { partnerProfileSchema, type PartnerProfileValues } from "@/lib/schemas/profile";
import { useCreateProfile, useMyProfile, useUpdateProfile } from "@/hooks/queries/use-profile";
import { isProfileNotFound, type PartnerProfile } from "@/features/profile/profile-api";

export default function PartnerProfilePage() {
  const toast = useToast();
  const profileQuery = useMyProfile<PartnerProfile>();
  const createProfile = useCreateProfile<PartnerProfile>();
  const updateProfile = useUpdateProfile<PartnerProfile>();

  const notFound = isProfileNotFound(profileQuery.error);
  const profile = profileQuery.data;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PartnerProfileValues>({
    resolver: zodResolver(partnerProfileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        partnerProfileCode: profile.partnerProfileCode,
        partnerName: profile.partnerName,
        taxCode: profile.taxCode,
        representativeName: profile.representativeName,
      });
    }
  }, [profile, reset]);

  async function submit(values: PartnerProfileValues) {
    try {
      if (notFound) {
        await createProfile.mutateAsync(values);
        toast("Đã tạo hồ sơ doanh nghiệp.");
      } else {
        await updateProfile.mutateAsync({ partnerName: values.partnerName, taxCode: values.taxCode, representativeName: values.representativeName });
        toast("Đã lưu hồ sơ doanh nghiệp.");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu hồ sơ.", "error");
    }
  }

  if (profileQuery.isLoading) {
    return <PartnerShell active="/partner/profile"><PageHeader title="Hồ sơ Partner" subtitle="Thông tin doanh nghiệp và trạng thái xét duyệt."/><State icon="⏳" title="Đang tải hồ sơ" text="Vui lòng chờ trong giây lát."/></PartnerShell>;
  }

  if (profileQuery.isError && !notFound) {
    return <PartnerShell active="/partner/profile"><PageHeader title="Hồ sơ Partner" subtitle="Thông tin doanh nghiệp và trạng thái xét duyệt."/><State icon="⚠️" title="Không thể tải hồ sơ" text={profileQuery.error instanceof Error ? profileQuery.error.message : "Đã xảy ra lỗi."}/></PartnerShell>;
  }

  return (
    <PartnerShell active="/partner/profile">
      <PageHeader title="Hồ sơ Partner" subtitle={notFound ? "Hoàn tất hồ sơ doanh nghiệp để bắt đầu tạo voucher." : "Thông tin doanh nghiệp và trạng thái xét duyệt."}/>
      <form onSubmit={handleSubmit(submit)} className="rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
        {profile && (
          <div className="mb-6 flex items-center justify-between rounded-lg bg-emerald-50 p-4">
            <div>
              <b className="block text-sm text-slate-800">{profile.partnerName}</b>
              <span className="text-xs text-slate-500">Trạng thái hồ sơ doanh nghiệp</span>
              {profile.status === "rejected" && profile.rejectionReason && <p className="mt-1 text-xs text-danger">Lý do: {profile.rejectionReason}</p>}
            </div>
            <ProfileStatusBadge status={profile.status}/>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Mã đối tác" required={notFound} disabled={!notFound} error={errors.partnerProfileCode?.message} {...register("partnerProfileCode")}/>
          <Input label="Tên doanh nghiệp" required error={errors.partnerName?.message} {...register("partnerName")}/>
          <Input label="Mã số thuế" required error={errors.taxCode?.message} {...register("taxCode")}/>
          <Input label="Người đại diện" required error={errors.representativeName?.message} {...register("representativeName")}/>
        </div>
        <Button className="mt-6" type="submit" disabled={isSubmitting || createProfile.isPending || updateProfile.isPending}>
          {notFound ? "Tạo hồ sơ" : "Lưu thay đổi"}
        </Button>
      </form>
    </PartnerShell>
  );
}
