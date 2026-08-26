"use client";
import { useState } from "react";
import { CustomerShell } from "@/components/customer/customer-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { useMyNotifications } from "@/hooks/queries/use-notifications";

export default function NotificationsPage() { return <NotificationsContent/>; }

function NotificationsContent() {
  const [read, setRead] = useState<string[]>([]);
  const notificationsQuery = useMyNotifications();
  const notifications = notificationsQuery.data ?? [];

  return (
    <CustomerShell active="/notifications">
      <PageHeader title="Thông báo" subtitle="Cập nhật về voucher, đơn hàng và ưu đãi mới."/>

      {notificationsQuery.isLoading && <State icon="⏳" title="Đang tải thông báo" text="Vui lòng chờ trong giây lát."/>}

      {notificationsQuery.isError && (
        <State icon="⚠️" title="Không thể tải thông báo" text={notificationsQuery.error instanceof Error ? notificationsQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.length === 0 && (
        <State icon="🔔" title="Chưa có thông báo nào" text="Thông báo về voucher và đơn hàng của bạn sẽ hiện ở đây."/>
      )}

      {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const unread = !notification.isRead && !read.includes(notification.notificationId);
            return (
              <button
                onClick={() => setRead((items) => [...items, notification.notificationId])}
                className={`flex w-full gap-4 rounded-xl border p-4 text-left shadow-brand-sm ${unread ? "border-indigo-100 bg-indigo-50/50" : "border-slate-200 bg-white"}`}
                key={notification.notificationId}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-100 text-primary">🔔</span>
                <span className="flex-1">
                  <b className="block text-sm text-slate-900">{notification.title}</b>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{notification.body}</span>
                  <span className="mt-2 block text-[11px] text-slate-400">{new Date(notification.createdAt).toLocaleString("vi-VN")}</span>
                </span>
                {unread && <span className="mt-1 h-2 w-2 rounded-full bg-primary"/>}
              </button>
            );
          })}
        </div>
      )}
    </CustomerShell>
  );
}
