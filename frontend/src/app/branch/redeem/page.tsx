"use client";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BranchShell } from "@/components/branch/branch-shell";
import { useToast } from "@/components/common/toast";
import { useCheckVoucherCode, useConfirmVoucherCode } from "@/hooks/queries/use-redemption";
import type { RedemptionDetail, RedemptionVoucherStatus } from "@/features/redemption/redemption-api";

const schema = z.object({ code: z.string().min(6, "Nhập mã voucher hợp lệ") });
type Values = z.infer<typeof schema>;

const statusLabel: Record<RedemptionVoucherStatus, string> = { available: "Còn hiệu lực", used: "Đã sử dụng", expired: "Hết hạn", cancelled: "Đã hủy" };
const statusStyle: Record<RedemptionVoucherStatus, string> = {
  available: "bg-emerald-50 text-success",
  used: "bg-slate-100 text-slate-500",
  expired: "bg-red-50 text-danger",
  cancelled: "bg-red-50 text-danger",
};
const reasonLabel: Record<string, string> = {
  "Voucher has already been used": "Voucher này đã được sử dụng.",
  "Voucher has expired": "Voucher này đã hết hạn.",
};

export default function RedeemPage() { return <RedeemContent/>; }

function RedeemContent() {
  const toast = useToast();
  const [mode, setMode] = useState<"manual" | "scan">("manual");
  const [detail, setDetail] = useState<RedemptionDetail | null>(null);
  const checkCode = useCheckVoucherCode();
  const confirmCode = useConfirmVoucherCode();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Values>({ resolver: zodResolver(schema) });

  function runCheck(code: string) {
    checkCode.mutate(code, {
      onSuccess: (data) => setDetail(data),
      onError: (error) => toast(error instanceof Error ? error.message : "Không kiểm tra được mã.", "error"),
    });
  }

  function handleScan(codes: { rawValue: string }[]) {
    const value = codes[0]?.rawValue;
    if (!value || checkCode.isPending || detail) return;
    runCheck(value);
  }

  function confirmUse() {
    if (!detail) return;
    confirmCode.mutate(detail.code, {
      onSuccess: (data) => {
        setDetail(data);
        toast("Đã xác nhận sử dụng voucher.");
      },
      onError: (error) => toast(error instanceof Error ? error.message : "Không thể xác nhận sử dụng.", "error"),
    });
  }

  function checkAnother() {
    setDetail(null);
    reset();
  }

  return (
    <BranchShell active="/branch/redeem">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold text-slate-900">Dùng voucher</h1>
        <p className="mt-2 text-sm text-slate-500">Quét mã QR hoặc nhập mã voucher của khách để kiểm tra trước khi xác nhận sử dụng.</p>

        {!detail && (
          <div className="mt-6 flex gap-2 rounded-lg bg-slate-100 p-1">
            <button type="button" onClick={() => setMode("manual")} className={`flex-1 rounded-md py-2 text-xs font-bold transition ${mode === "manual" ? "bg-white shadow-brand-sm" : "text-slate-500"}`}>Nhập mã</button>
            <button type="button" onClick={() => setMode("scan")} className={`flex-1 rounded-md py-2 text-xs font-bold transition ${mode === "scan" ? "bg-white shadow-brand-sm" : "text-slate-500"}`}>Quét QR</button>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-brand-lg">
          {!detail && mode === "manual" && (
            <form onSubmit={handleSubmit((values) => runCheck(values.code))} className="space-y-4">
              <Input label="Mã voucher" placeholder="FbEEYvgUTxkRvbSDKGWxhdW3" error={errors.code?.message} {...register("code")}/>
              <Button fullWidth size="lg" type="submit" disabled={checkCode.isPending}>{checkCode.isPending ? "Đang kiểm tra..." : "Kiểm tra"}</Button>
            </form>
          )}

          {!detail && mode === "scan" && (
            <div className="overflow-hidden rounded-xl">
              <Scanner onScan={handleScan} formats={["qr_code"]} paused={checkCode.isPending}/>
              <p className="mt-3 text-center text-[11px] text-slate-400">Đưa mã QR trên điện thoại khách vào khung hình.</p>
            </div>
          )}

          {detail && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <b className="text-sm text-slate-900">{detail.voucherProduct.title}</b>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[detail.status]}`}>{statusLabel[detail.status]}</span>
              </div>
              <p className="text-xs text-slate-500">Khách hàng: <b className="text-slate-700">{detail.customer.fullName}</b></p>
              <p className="font-mono text-xs text-slate-500">{detail.code}</p>
              <p className="text-xs text-slate-500">Hết hạn: {new Date(detail.expiredAt).toLocaleDateString("vi-VN")}</p>
              {detail.usedAt && <p className="text-xs text-slate-500">Đã dùng lúc: {new Date(detail.usedAt).toLocaleString("vi-VN")}</p>}
              {detail.reason && <p className="text-xs font-semibold text-danger">{reasonLabel[detail.reason] ?? detail.reason}</p>}

              {detail.redeemable ? (
                <>
                  <Button type="button" fullWidth size="lg" onClick={confirmUse} disabled={confirmCode.isPending}>
                    {confirmCode.isPending ? "Đang xác nhận..." : "Xác nhận sử dụng"}
                  </Button>
                  <button type="button" onClick={checkAnother} className="w-full text-center text-[11px] font-semibold text-primary">Kiểm tra mã khác</button>
                </>
              ) : (
                <Button type="button" fullWidth size="lg" variant="ghost" onClick={checkAnother}>Kiểm tra mã khác</Button>
              )}
            </div>
          )}
        </div>
      </div>
    </BranchShell>
  );
}
