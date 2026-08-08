"use client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { LoginValues, RegisterValues } from "@/lib/schemas/auth";
export type UserRole = "customer" | "partner" | "branch" | "admin";
export function dashboardForRole(role?: string) { return role === "admin" ? "/admin/dashboard" : role === "partner" ? "/partner/dashboard" : role === "branch" ? "/branch/redeem" : "/account"; }
export async function signIn(values: LoginValues) { const supabase = createSupabaseBrowserClient(); const { data, error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password }); if (error) throw error; return data; }
export async function signUp(values: RegisterValues) { const supabase = createSupabaseBrowserClient(); const { data, error } = await supabase.auth.signUp({ email: values.email, password: values.password, options: { data: { first_name: values.firstName, last_name: values.lastName, phone: values.phone, role: "customer" } } }); if (error) throw error; return data; }
export async function sendPasswordReset(email: string) { const supabase = createSupabaseBrowserClient(); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` }); if (error) throw error; }
