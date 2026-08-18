"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMyProfile,
  getAllBranches,
  getAllPartners,
  getMyBranches,
  getMyProfile,
  isProfileNotFound,
  updateBranchStatus,
  updateMyProfile,
  updatePartnerStatus,
  uploadAvatar,
  type BranchProfile,
  type BranchProfileStatus,
  type CreateBranchProfileInput,
  type CreateCustomerProfileInput,
  type CreatePartnerProfileInput,
  type CustomerProfile,
  type PartnerProfile,
  type PartnerProfileStatus,
  type UpdateBranchProfileInput,
  type UpdateCustomerProfileInput,
  type UpdatePartnerProfileInput,
} from "@/features/profile/profile-api";

export const profileKeys = {
  mine: ["profile", "mine"] as const,
  branches: ["profile", "branches"] as const,
  adminPartners: ["profile", "admin", "partners"] as const,
  adminBranches: ["profile", "admin", "branches"] as const,
};

export function useMyProfile<T extends CustomerProfile | PartnerProfile | BranchProfile>(enabled = true) {
  return useQuery({
    queryKey: profileKeys.mine,
    queryFn: () => getMyProfile<T>(),
    enabled,
    retry: (failureCount, error) => !isProfileNotFound(error) && failureCount < 2,
  });
}

export function useCreateProfile<T extends CustomerProfile | PartnerProfile | BranchProfile>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCustomerProfileInput | CreatePartnerProfileInput | CreateBranchProfileInput) => createMyProfile<T>(body),
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.mine, profile),
  });
}

export function useUpdateProfile<T extends CustomerProfile | PartnerProfile | BranchProfile>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateCustomerProfileInput | UpdatePartnerProfileInput | UpdateBranchProfileInput) => updateMyProfile<T>(body),
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.mine, profile),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.mine, profile),
  });
}

export function useMyBranches() {
  return useQuery({ queryKey: profileKeys.branches, queryFn: getMyBranches });
}

export function useAdminPartners() {
  return useQuery({ queryKey: profileKeys.adminPartners, queryFn: getAllPartners });
}

export function useAdminBranches() {
  return useQuery({ queryKey: profileKeys.adminBranches, queryFn: getAllBranches });
}

export function useUpdatePartnerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partnerProfileId, status, rejectionReason }: { partnerProfileId: string; status: PartnerProfileStatus; rejectionReason?: string }) =>
      updatePartnerStatus(partnerProfileId, status, rejectionReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.adminPartners }),
  });
}

export function useUpdateBranchStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchProfileId, status, rejectionReason }: { branchProfileId: string; status: BranchProfileStatus; rejectionReason?: string }) =>
      updateBranchStatus(branchProfileId, status, rejectionReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.adminBranches }),
  });
}
