"use client";
import { useMutation } from "@tanstack/react-query";
import { signIn, signUp } from "@/features/auth/auth-api";
export const useSignIn = () => useMutation({ mutationFn: signIn });
export const useSignUp = () => useMutation({ mutationFn: signUp });
