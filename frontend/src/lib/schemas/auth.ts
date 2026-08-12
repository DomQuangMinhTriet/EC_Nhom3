import { z } from "zod";
export const loginSchema = z.object({ email: z.string().email("Nhập địa chỉ email hợp lệ"), password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự"), remember: z.boolean().optional() });
export const registerSchema = z.object({ firstName: z.string().min(1, "Nhập họ"), lastName: z.string().min(1, "Nhập tên"), email: z.string().email("Nhập địa chỉ email hợp lệ"), phone: z.string().regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ"), password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự"), confirmPassword: z.string(), terms: z.boolean().refine(Boolean, "Bạn cần đồng ý điều khoản dịch vụ") }).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Mật khẩu xác nhận chưa khớp" });
export const forgotPasswordSchema = z.object({ email: z.string().email("Nhập địa chỉ email hợp lệ") });
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
