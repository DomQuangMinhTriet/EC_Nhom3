"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function StatusAction<TStatus extends string>({
  statuses,
  currentStatus,
  pending,
  onSubmit,
}: {
  statuses: readonly TStatus[];
  currentStatus: TStatus;
  pending: boolean;
  onSubmit: (status: TStatus, rejectionReason?: string) => void;
}) {
  const [status, setStatus] = useState<TStatus>(currentStatus);
  const [reason, setReason] = useState("");
  const needsReason = status === "rejected";

  function submit() {
    if (status === currentStatus) return;
    if (needsReason && !reason.trim()) return;
    onSubmit(status, needsReason ? reason.trim() : undefined);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as TStatus)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700"
      >
        {statuses.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      {needsReason && (
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Lý do từ chối..."
          className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
        />
      )}
      <Button size="sm" disabled={pending || status === currentStatus || (needsReason && !reason.trim())} onClick={submit}>
        Cập nhật
      </Button>
    </div>
  );
}
