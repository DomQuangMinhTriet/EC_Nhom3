"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/common/toast";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { customerProfileSchema, type CustomerProfileValues } from "@/lib/schemas/profile";
import { useCreateProfile, useMyProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/queries/use-profile";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { takePendingCustomerProfileDraft } from "@/features/auth/auth-api";
import { isProfileNotFound, type CustomerProfile } from "@/features/profile/profile-api";

export default function AccountPage() { return <AccountContent/>; }

function AccountContent() {
  const toast = useToast();
  const { session } = useAuthSession();
  const profileQuery = useMyProfile<CustomerProfile>();
  const createProfile = useCreateProfile<CustomerProfile>();
  const updateProfile = useUpdateProfile<CustomerProfile>();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoCreating, setAutoCreating] = useState(false);

  const notFound = isProfileNotFound(profileQuery.error);
  const profile = profileQuery.data;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CustomerProfileValues>({
    resolver: zodResolver(customerProfileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        birthDate: profile.birthDate ?? "",
        gender: profile.gender ?? undefined,
      });
    }
  }, [profile, reset]);

  useEffect(() => {
    if (!notFound || !session?.user.email || autoCreating) return;
    const draft = takePendingCustomerProfileDraft(session.user.email);
    if (!draft) return;

    setAutoCreating(true);
    createProfile
      .mutateAsync({ fullName: draft.fullName, phone: draft.phone })
      .then(() => toast("Đã tạo hồ sơ từ thông tin đăng ký."))
      .catch(() => setAutoCreating(false));
  }, [notFound, session?.user.email, autoCreating, createProfile, toast]);

  async function submit(values: CustomerProfileValues) {
    const body = {
      fullName: values.fullName,
      phone: values.phone || undefined,
      address: values.address || undefined,
      birthDate: values.birthDate || undefined,
      gender: values.gender,
    };

    try {
      if (notFound) {
        await createProfile.mutateAsync(body);
        toast("Đã tạo hồ sơ.");
      } else {
        await updateProfile.mutateAsync(body);
        toast("Đã cập nhật hồ sơ.");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu hồ sơ.", "error");
    }
  }

  async function onAvatarSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await uploadAvatar.mutateAsync(String(reader.result));
        toast("Đã cập nhật ảnh đại diện.");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Không thể tải ảnh lên.", "error");
      }
    };
    reader.readAsDataURL(file);
  }

  if (profileQuery.isLoading || autoCreating) {
    return <CustomerShell active="/account"><PageHeader title="Hồ sơ của tôi" subtitle="Quản lý thông tin tài khoản và nhận voucher."/><State icon="⏳" title="Đang tải hồ sơ" text="Vui lòng chờ trong giây lát."/></CustomerShell>;
  }

  if (profileQuery.isError && !notFound) {
    return <CustomerShell active="/account"><PageHeader title="Hồ sơ của tôi" subtitle="Quản lý thông tin tài khoản và nhận voucher."/><State icon="⚠️" title="Không thể tải hồ sơ" text={profileQuery.error instanceof Error ? profileQuery.error.message : "Đã xảy ra lỗi."}/></CustomerShell>;
  }

  return (
    <CustomerShell active="/account">
      <PageHeader title="Hồ sơ của tôi" subtitle={notFound ? "Hoàn tất hồ sơ để bắt đầu sử dụng ECVoucher." : "Quản lý thông tin tài khoản và nhận voucher."}/>
      <form onSubmit={handleSubmit(submit)} className="rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
        <div className="mb-7 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-indigo-400 text-lg font-bold text-white">
            {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover"/> : (profile?.fullName?.[0] ?? "?")}
          </div>
          <div>
            <b className="block text-sm">Ảnh đại diện</b>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarSelected}/>
            <Button className="mt-2" type="button" variant="outlined" size="sm" disabled={notFound || uploadAvatar.isPending} onClick={() => fileInputRef.current?.click()}>
              {uploadAvatar.isPending ? "Đang tải lên..." : "Tải ảnh lên"}
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Họ và tên" required error={errors.fullName?.message} {...register("fullName")}/>
          <Input label="Email" disabled value={session?.user.email ?? ""}/>
          <Input label="Số điện thoại" error={errors.phone?.message} {...register("phone")}/>
          <Input label="Địa chỉ" error={errors.address?.message} {...register("address")}/>
          <Input label="Ngày sinh" type="date" error={errors.birthDate?.message} {...register("birthDate")}/>
          <label className="flex w-full flex-col gap-1.5 text-xs font-semibold text-slate-700">
            <span>Giới tính</span>
            <select className="w-full rounded-lg border-[1.5px] border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-900 shadow-brand-sm outline-none focus:border-primary" {...register("gender")}>
              <option value="">Không chọn</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </label>
        </div>
        <Button type="submit" className="mt-6" disabled={isSubmitting || createProfile.isPending || updateProfile.isPending}>
          {isSubmitting || createProfile.isPending || updateProfile.isPending ? "Đang lưu..." : notFound ? "Tạo hồ sơ" : "Lưu thay đổi"}
        </Button>
      </form>
    </CustomerShell>
  );
}
