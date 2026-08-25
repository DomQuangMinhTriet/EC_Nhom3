"use client";
import { useState } from "react";
import { CustomerShell } from "@/components/customer/customer-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/common/toast";
import { useMyVoucherInstances } from "@/hooks/queries/use-voucher-instances";
import { useCreateReview } from "@/hooks/queries/use-reviews";
import type { VoucherInstanceStatus } from "@/features/voucherInstance/voucher-instance-api";

const tabs: readonly [VoucherInstanceStatus | "all", string][] = [["all", "Tất cả"], ["available", "Đang dùng"], ["used", "Đã dùng"], ["expired", "Hết hạn"]];

const statusLabel: Record<VoucherInstanceStatus, string> = { available: "Đang dùng", used: "Đã dùng", expired: "Hết hạn", cancelled: "Đã hủy" };
const statusStyle: Record<VoucherInstanceStatus, string> = {
  available: "bg-emerald-50 text-success",
  used: "bg-slate-100 text-slate-500",
  expired: "bg-red-50 text-danger",
  cancelled: "bg-red-50 text-danger",
};

export default function MyVouchersPage() { return <MyVouchersContent/>; }

function MyVouchersContent() {
  const toast = useToast();
  const [tab, setTab] = useState<VoucherInstanceStatus | "all">("all");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const vouchersQuery = useMyVoucherInstances(tab === "all" ? undefined : tab);
  const createReview = useCreateReview();
  const items = vouchersQuery.data ?? [];

  return (
    <CustomerShell active="/my-vouchers">
      <PageHeader title="Voucher của tôi" subtitle="Quản lý mã ưu đãi đã mua."/>
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {tabs.map(([value, label]) => (
          <button key={value} onClick={() => setTab(value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${tab === value ? "bg-primary text-white" : "bg-white text-slate-600 shadow-brand-sm"}`}>{label}</button>
        ))}
      </div>

      {vouchersQuery.isLoading && <State icon="⏳" title="Đang tải voucher của bạn" text="Vui lòng chờ trong giây lát."/>}

      {vouchersQuery.isError && (
        <State icon="⚠️" title="Không thể tải voucher của bạn" text={vouchersQuery.error instanceof Error ? vouchersQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {!vouchersQuery.isLoading && !vouchersQuery.isError && items.length === 0 && (
        <State icon="🎟" title="Chưa có voucher nào" text="Mua voucher để bắt đầu sử dụng ưu đãi."/>
      )}

      {!vouchersQuery.isLoading && !vouchersQuery.isError && items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((voucher) => (
            <article key={voucher.voucherCodeId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-brand-sm">
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-950 to-primary p-5 text-white">
                <h2 className="text-sm font-extrabold">{voucher.voucherProduct.title}</h2>
                <b className="text-lg">{Number(voucher.voucherProduct.originalPrice).toLocaleString("vi-VN")}đ</b>
              </div>
              <div className="flex items-end justify-between p-4">
                <div>
                  <p className="font-mono text-xs font-bold text-primary">{voucher.code}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {voucher.status === "available" ? `Hết hạn: ${new Date(voucher.expiredAt).toLocaleDateString("vi-VN")}` : voucher.usedAt ? `Đã dùng: ${new Date(voucher.usedAt).toLocaleDateString("vi-VN")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {voucher.status === "used" && !reviewed.has(voucher.voucherCodeId) && (
                    <button className="text-[11px] font-semibold text-primary" onClick={() => setReviewing(voucher.voucherCodeId)}>Đánh giá</button>
                  )}
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[voucher.status]}`}>{statusLabel[voucher.status]}</span>
                </div>
              </div>
              {reviewing === voucher.voucherCodeId && (
                <ReviewForm
                  pending={createReview.isPending}
                  onCancel={() => setReviewing(null)}
                  onSubmit={(rating, comment) =>
                    createReview.mutate(
                      { voucherCodeId: voucher.voucherCodeId, rating, comment },
                      {
                        onSuccess: () => {
                          toast("Đã gửi đánh giá.");
                          setReviewed((current) => new Set(current).add(voucher.voucherCodeId));
                          setReviewing(null);
                        },
                        onError: (error) => toast(error instanceof Error ? error.message : "Không thể gửi đánh giá.", "error"),
                      },
                    )
                  }
                />
              )}
            </article>
          ))}
        </div>
      )}
    </CustomerShell>
  );
}

function ReviewForm({ pending, onSubmit, onCancel }: { pending: boolean; onSubmit: (rating: number, comment: string) => void; onCancel: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  return (
    <div className="border-t border-slate-100 p-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)} className={`text-lg ${value <= rating ? "text-amber-400" : "text-slate-300"}`}>★</button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Chia sẻ trải nghiệm của bạn..."
        className="mt-2 min-h-16 w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-primary"
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button size="sm" disabled={pending || !comment.trim()} onClick={() => onSubmit(rating, comment.trim())}>Gửi</Button>
      </div>
    </div>
  );
}
