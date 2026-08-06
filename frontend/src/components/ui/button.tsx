import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "ghost" | "outlined" | "link" | "danger";
type Size = "sm" | "md" | "lg" | "xl";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-brand-sm hover:bg-primary-hover hover:shadow-[0_8px_24px_rgba(79,70,229,.25)]",
  accent: "bg-accent text-white shadow-brand-sm hover:bg-accent-hover",
  ghost: "border border-slate-200 bg-white text-slate-700 shadow-brand-sm hover:bg-slate-50",
  outlined: "border border-primary bg-white text-primary hover:bg-primary-light",
  link: "text-primary hover:text-primary-hover",
  danger: "bg-danger text-white hover:bg-red-700",
};
const sizes: Record<Size, string> = { sm: "px-3.5 py-2 text-xs rounded-lg", md: "px-[18px] py-2.5 text-sm rounded-[10px]", lg: "px-6 py-3 text-[15px] rounded-[10px]", xl: "px-8 py-3.5 text-base rounded-xl" };
export function Button({ variant = "primary", size = "md", fullWidth, icon, className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; fullWidth?: boolean; icon?: ReactNode }) {
  return <button className={`inline-flex items-center justify-center gap-2 font-semibold tracking-[-.02em] transition-all duration-150 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`} {...props}>{icon}{children}</button>;
}
