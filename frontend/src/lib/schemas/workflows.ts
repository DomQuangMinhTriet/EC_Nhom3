import { z } from "zod";

export const partnerVoucherSchema = z
  .object({
    categoryId: z.string().trim().uuid("Chọn danh mục hợp lệ"),
    title: z.string().trim().min(5, "Nhập tên voucher tối thiểu 5 ký tự"),
    description: z.string().trim().optional().or(z.literal("")),
    originalPrice: z.coerce.number().min(0, "Giá gốc không hợp lệ"),
    discountType: z.enum(["direct", "percentage"], { errorMap: () => ({ message: "Chọn loại giảm giá" }) }),
    discountValue: z.coerce.number().min(0, "Giá trị giảm không hợp lệ"),
    startDate: z.string().min(1, "Chọn ngày bắt đầu"),
    endDate: z.string().min(1, "Chọn ngày kết thúc"),
    validDurationDays: z.coerce.number().int().min(1, "Số ngày hiệu lực phải từ 1 trở lên"),
    minLimit: z.coerce.number().int().min(1).optional(),
    maxLimit: z.coerce.number().int().min(1).optional(),
    imageUrl: z.string().trim().url("URL ảnh không hợp lệ").optional().or(z.literal("")),
  })
  .refine((value) => new Date(value.startDate) < new Date(value.endDate), {
    path: ["endDate"],
    message: "Ngày kết thúc phải sau ngày bắt đầu",
  })
  .refine((value) => value.maxLimit === undefined || value.minLimit === undefined || value.maxLimit >= value.minLimit, {
    path: ["maxLimit"],
    message: "Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu",
  });

export const redeemSchema = z.object({ code: z.string().min(6) });
export const rejectionReasonSchema = z.object({ reason: z.string().trim().min(1) });

export type PartnerVoucherValues = z.infer<typeof partnerVoucherSchema>;
