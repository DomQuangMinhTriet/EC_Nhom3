"use client";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { RecordsTable } from "@/components/admin/records-table";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { StatusAction } from "@/components/common/status-action";
import { useToast } from "@/components/common/toast";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useUpdateUser, useUsers } from "@/hooks/queries/use-users";
import type { AppRole, UserStatus } from "@/features/users/users-api";

const userStatuses: readonly UserStatus[] = ["pending", "active", "deactivated", "banned"];
const allRoles: readonly AppRole[] = ["Super_Admin", "Operational_Admin", "Customer", "Partner", "Branch"];
const operationalAdminRoles: readonly AppRole[] = ["Partner", "Branch"];

const statusLabel: Record<UserStatus, string> = { active: "Hoạt động", pending: "Chờ kích hoạt", deactivated: "Đã vô hiệu hoá", banned: "Bị cấm" };
const statusStyle: Record<UserStatus, string> = {
  active: "bg-emerald-50 text-success",
  pending: "bg-amber-50 text-amber-700",
  deactivated: "bg-slate-100 text-slate-600",
  banned: "bg-red-50 text-danger",
};

export default function UsersPage() {
  const toast = useToast();
  const { session } = useAuthSession();
  const actorRole = session?.user.roleCode;
  const isSuperAdmin = actorRole === "Super_Admin";
  const selectableRoles = isSuperAdmin ? allRoles : operationalAdminRoles;

  const [page, setPage] = useState(1);
  const [role, setRole] = useState<AppRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [search, setSearch] = useState("");

  const usersQuery = useUsers({ page, limit: 20, role: role || undefined, status: status || undefined });
  const updateUser = useUpdateUser();

  const users = useMemo(() => {
    const list = usersQuery.data?.users ?? [];
    const query = search.trim().toLowerCase();
    return query ? list.filter((item) => item.email.toLowerCase().includes(query)) : list;
  }, [usersQuery.data, search]);

  const pagination = usersQuery.data?.pagination;

  function changeStatus(userId: string, next: UserStatus) {
    updateUser.mutate(
      { userId, input: { status: next } },
      {
        onSuccess: () => toast("Đã cập nhật trạng thái tài khoản."),
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.", "error"),
      },
    );
  }

  function changeRole(userId: string, next: AppRole) {
    updateUser.mutate(
      { userId, input: { roleCode: next } },
      {
        onSuccess: () => toast("Đã cập nhật vai trò tài khoản."),
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể cập nhật vai trò.", "error"),
      },
    );
  }

  return (
    <AdminShell active="/admin/users">
      <PageHeader title="Quản lý người dùng" subtitle="Tìm kiếm, lọc và kiểm soát tài khoản hệ thống."/>

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-brand-sm"
          placeholder="Tìm theo email (trong trang hiện tại)..."
        />
        <select
          value={role}
          onChange={(event) => { setPage(1); setRole(event.target.value as AppRole | ""); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-brand-sm"
        >
          <option value="">Tất cả vai trò</option>
          {selectableRoles.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select
          value={status}
          onChange={(event) => { setPage(1); setStatus(event.target.value as UserStatus | ""); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-brand-sm"
        >
          <option value="">Tất cả trạng thái</option>
          {userStatuses.map((value) => <option key={value} value={value}>{statusLabel[value]}</option>)}
        </select>
      </div>

      {usersQuery.isLoading && <State icon="⏳" title="Đang tải danh sách người dùng" text="Vui lòng chờ trong giây lát."/>}

      {usersQuery.isError && (
        <State icon="⚠️" title="Không thể tải danh sách người dùng" text={usersQuery.error instanceof Error ? usersQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
        <State icon="👤" title="Không có người dùng phù hợp" text="Thử đổi bộ lọc hoặc từ khoá tìm kiếm."/>
      )}

      {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 && (
        <>
          <RecordsTable
            headers={["Email", "Vai trò", "Trạng thái", "Thao tác"]}
            rows={users.map((user) => [
              <b key="e">{user.email}</b>,
              isSuperAdmin ? (
                <StatusAction
                  key="r"
                  statuses={allRoles}
                  currentStatus={user.roleCode}
                  pending={updateUser.isPending}
                  onSubmit={(next) => changeRole(user.userId, next)}
                />
              ) : (
                user.roleCode
              ),
              <span key="s" className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusStyle[user.status]}`}>{statusLabel[user.status]}</span>,
              <StatusAction
                key="a"
                statuses={userStatuses}
                currentStatus={user.status}
                pending={updateUser.isPending}
                onSubmit={(next) => changeStatus(user.userId, next)}
              />,
            ])}
          />

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Trang {pagination.page} / {pagination.totalPages} · {pagination.total} người dùng</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>← Trước</Button>
                <Button size="sm" variant="ghost" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Sau →</Button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
