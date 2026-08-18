import { z } from "zod";

export const customerProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Nhập họ và tên"),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  birthDate: z.string().trim().optional().or(z.literal("")),
  gender: z.enum(["Nam", "Nữ"]).optional(),
});

export const partnerProfileSchema = z.object({
  partnerProfileCode: z.string().trim().min(2, "Nhập mã đối tác"),
  partnerName: z.string().trim().min(2, "Nhập tên doanh nghiệp"),
  taxCode: z.string().trim().min(8, "Mã số thuế không hợp lệ"),
  representativeName: z.string().trim().min(2, "Nhập tên người đại diện"),
});

export const partnerProfileUpdateSchema = partnerProfileSchema.omit({ partnerProfileCode: true });

export const branchProfileSchema = z.object({
  partnerProfileId: z.string().trim().uuid("Mã đối tác không hợp lệ"),
  branchProfileCode: z.string().trim().min(2, "Nhập mã chi nhánh"),
  branchName: z.string().trim().min(2, "Nhập tên chi nhánh"),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Email không hợp lệ").optional().or(z.literal("")),
});

export const branchProfileUpdateSchema = branchProfileSchema.omit({ partnerProfileId: true, branchProfileCode: true });

export const createManagedAccountSchema = z
  .object({
    email: z.string().trim().email("Nhập địa chỉ email hợp lệ"),
    password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận chưa khớp",
  });

export const profileStatusChangeSchema = z
  .object({
    status: z.string().min(1),
    rejectionReason: z.string().trim().optional(),
  })
  .refine((value) => value.status !== "rejected" || Boolean(value.rejectionReason?.trim()), {
    path: ["rejectionReason"],
    message: "Cần nhập lý do khi từ chối",
  });

export type CustomerProfileValues = z.infer<typeof customerProfileSchema>;
export type PartnerProfileValues = z.infer<typeof partnerProfileSchema>;
export type PartnerProfileUpdateValues = z.infer<typeof partnerProfileUpdateSchema>;
export type BranchProfileValues = z.infer<typeof branchProfileSchema>;
export type BranchProfileUpdateValues = z.infer<typeof branchProfileUpdateSchema>;
export type CreateManagedAccountValues = z.infer<typeof createManagedAccountSchema>;
export type ProfileStatusChangeValues = z.infer<typeof profileStatusChangeSchema>;
