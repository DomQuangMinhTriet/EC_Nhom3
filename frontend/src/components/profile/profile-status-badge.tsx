import type { BranchProfileStatus, PartnerProfileStatus } from "@/features/profile/profile-api";

const styles: Record<PartnerProfileStatus | BranchProfileStatus, string> = {
  active: "bg-emerald-50 text-success",
  pending: "bg-amber-50 text-amber-700",
  suspended: "bg-orange-50 text-orange-700",
  terminated: "bg-red-50 text-danger",
  closed: "bg-red-50 text-danger",
  rejected: "bg-red-50 text-danger",
};

const labels: Record<PartnerProfileStatus | BranchProfileStatus, string> = {
  active: "Hoạt động",
  pending: "Chờ xử lý",
  suspended: "Tạm ngưng",
  terminated: "Đã chấm dứt",
  closed: "Đã đóng",
  rejected: "Bị từ chối",
};

export function ProfileStatusBadge({ status }: { status: PartnerProfileStatus | BranchProfileStatus }) {
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles[status]}`}>{labels[status]}</span>;
}
