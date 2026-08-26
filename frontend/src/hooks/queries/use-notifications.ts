"use client";
import { useQuery } from "@tanstack/react-query";
import { getMyNotifications } from "@/features/notification/notification-api";

export const notificationKeys = { mine: ["notifications", "mine"] as const };

export function useMyNotifications() {
  return useQuery({ queryKey: notificationKeys.mine, queryFn: getMyNotifications });
}
