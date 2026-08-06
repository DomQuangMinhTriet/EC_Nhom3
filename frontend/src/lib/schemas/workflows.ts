import { z } from "zod";

export const partnerVoucherSchema = z.object({ title: z.string().min(5), category: z.string().min(1), originalPrice: z.coerce.number().positive(), salePrice: z.coerce.number().min(0), stock: z.coerce.number().int().positive(), expiry: z.string().min(1) });
export const redeemSchema = z.object({ code: z.string().min(6) });
export const rejectionReasonSchema = z.object({ reason: z.string().trim().min(1) });
