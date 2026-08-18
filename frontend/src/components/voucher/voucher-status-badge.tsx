import type { VoucherProductStatus } from "@/features/vouchers/voucher-product-api";

const styles: Record<VoucherProductStatus, string> = {
  active: "bg-emerald-50 text-success",
  pending: "bg-amber-50 text-amber-700",
  out_of_stock: "bg-orange-50 text-orange-700",
  inactive: "bg-slate-100 text-slate-600",
  rejected: "bg-red-50 text-danger",
  expired: "bg-slate-100 text-slate-500",
};

const labels: Record<VoucherProductStatus, string> = {
  active: "Đang bán",
  pending: "Chờ duyệt",
  out_of_stock: "Hết hàng",
  inactive: "Tạm dừng",
  rejected: "Bị từ chối",
  expired: "Hết hạn",
};

export function VoucherStatusBadge({ status }: { status: VoucherProductStatus }) {
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles[status]}`}>{labels[status]}</span>;
}
