import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";

export type Notification = {
  notificationId: string;
  customerProfileId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export async function getMyNotifications() {
  const res = await apiClient<{ notifications: Notification[] }>("/notifications", { headers: authHeaders() });
  return res.notifications;
}
