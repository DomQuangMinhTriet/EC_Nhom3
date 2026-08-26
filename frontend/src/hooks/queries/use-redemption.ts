"use client";
import { useMutation } from "@tanstack/react-query";
import { checkVoucherCode, confirmVoucherCode } from "@/features/redemption/redemption-api";

export function useCheckVoucherCode() {
  return useMutation({ mutationFn: (code: string) => checkVoucherCode(code) });
}

export function useConfirmVoucherCode() {
  return useMutation({ mutationFn: (code: string) => confirmVoucherCode(code) });
}
