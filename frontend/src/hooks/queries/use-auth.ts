"use client";
import { useMutation } from "@tanstack/react-query";
import { changePassword, forgotPassword, signIn, signUp } from "@/features/auth/auth-api";
export const useSignIn = () => useMutation({ mutationFn: signIn });
export const useSignUp = () => useMutation({ mutationFn: signUp });
export const useForgotPassword = () => useMutation({ mutationFn: forgotPassword });
export const useChangePassword = () => useMutation({ mutationFn: changePassword });
