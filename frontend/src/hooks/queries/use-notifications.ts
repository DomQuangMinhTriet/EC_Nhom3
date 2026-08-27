"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyNotifications, markNotificationAsRead } from "@/features/notification/notification-api";

export const notificationKeys = { mine: ["notifications", "mine"] as const };

export function useMyNotifications() {
  return useQuery({ queryKey: notificationKeys.mine, queryFn: getMyNotifications });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.mine }),
  });
}
