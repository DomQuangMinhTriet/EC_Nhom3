"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUser, type GetUsersParams, type UpdateUserInput } from "@/features/users/users-api";

export const userKeys = {
  list: (params: GetUsersParams) => ["users", "list", params] as const,
};

export function useUsers(params: GetUsersParams = {}) {
  return useQuery({ queryKey: userKeys.list(params), queryFn: () => getUsers(params) });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserInput }) => updateUser(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "list"] }),
  });
}
