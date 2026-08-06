import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Role = "customer" | "partner" | "branch" | "admin";
const destinations: Record<Role, string> = { customer: "/account", partner: "/partner/dashboard", branch: "/branch/redeem", admin: "/admin/dashboard" };
function configured() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; return Boolean(url && key && !url.includes("your-project-ref") && key !== "your-anon-key"); }
/** Server-side route guard. It intentionally bypasses only local visual development without Supabase credentials. */
export async function ProtectedPage({ role, children }: { role: Role; children: ReactNode }) { if (!configured()) return <>{children}</>; const supabase = createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login"); const actualRole = (user.user_metadata.role ?? "customer") as Role; if (actualRole !== role) redirect(destinations[actualRole] ?? "/"); return <>{children}</>; }
