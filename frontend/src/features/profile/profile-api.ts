import { ApiError, apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";

export type Gender = "Nam" | "Nữ";

export type CustomerProfile = {
  customerProfileId: string;
  userId: string;
  fullName: string;
  phone: string | null;
  birthDate: string | null;
  gender: Gender | null;
  avatarUrl: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerProfileStatus = "pending" | "active" | "suspended" | "terminated" | "rejected";

export type PartnerProfile = {
  partnerProfileId: string;
  userId: string;
  partnerProfileCode: string;
  partnerName: string;
  taxCode: string;
  representativeName: string;
  status: PartnerProfileStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BranchProfileStatus = "pending" | "active" | "suspended" | "closed" | "rejected";

export type BranchProfile = {
  branchProfileId: string;
  userId: string;
  partnerProfileId: string;
  branchProfileCode: string;
  branchName: string;
  phone: string | null;
  address: string | null;
  email: string | null;
  status: BranchProfileStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerProfileInput = {
  fullName: string;
  phone?: string;
  birthDate?: string | null;
  gender?: Gender | null;
  avatarUrl?: string | null;
  address?: string;
};

export type CreatePartnerProfileInput = {
  partnerProfileCode: string;
  partnerName: string;
  taxCode: string;
  representativeName: string;
};

export type CreateBranchProfileInput = {
  partnerProfileId: string;
  branchProfileCode: string;
  branchName: string;
  phone?: string;
  address?: string;
  email?: string | null;
};

export type UpdateCustomerProfileInput = Partial<CreateCustomerProfileInput>;
export type UpdatePartnerProfileInput = Partial<Omit<CreatePartnerProfileInput, "partnerProfileCode">>;
export type UpdateBranchProfileInput = Partial<Omit<CreateBranchProfileInput, "partnerProfileId" | "branchProfileCode">>;

export async function getMyProfile<T extends CustomerProfile | PartnerProfile | BranchProfile>() {
  const res = await apiClient<{ profile: T }>("/profile", { headers: authHeaders() });
  return res.profile;
}

export async function createMyProfile<T extends CustomerProfile | PartnerProfile | BranchProfile>(
  body: CreateCustomerProfileInput | CreatePartnerProfileInput | CreateBranchProfileInput,
) {
  const res = await apiClient<{ profile: T }>("/profile", { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  return res.profile;
}

export async function updateMyProfile<T extends CustomerProfile | PartnerProfile | BranchProfile>(
  body: UpdateCustomerProfileInput | UpdatePartnerProfileInput | UpdateBranchProfileInput,
) {
  const res = await apiClient<{ profile: T }>("/profile", { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) });
  return res.profile;
}

export async function uploadAvatar(avatarBase64: string) {
  const res = await apiClient<{ profile: CustomerProfile }>("/profile/avatar", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ avatarBase64 }),
  });
  return res.profile;
}

export async function getMyBranches() {
  const res = await apiClient<{ data: BranchProfile[] }>("/profile/branches", { headers: authHeaders() });
  return res.data;
}

export async function getAllPartners() {
  const res = await apiClient<{ data: PartnerProfile[] }>("/profile/admin/partners", { headers: authHeaders() });
  return res.data;
}

export async function getAllBranches() {
  const res = await apiClient<{ data: BranchProfile[] }>("/profile/admin/branches", { headers: authHeaders() });
  return res.data;
}

export async function updatePartnerStatus(partnerProfileId: string, status: PartnerProfileStatus, rejectionReason?: string) {
  const res = await apiClient<{ profile: PartnerProfile }>(`/profile/partner/${partnerProfileId}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, rejectionReason }),
  });
  return res.profile;
}

export async function updateBranchStatus(branchProfileId: string, status: BranchProfileStatus, rejectionReason?: string) {
  const res = await apiClient<{ profile: BranchProfile }>(`/profile/branch/${branchProfileId}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, rejectionReason }),
  });
  return res.profile;
}

export const isProfileNotFound = (error: unknown) => error instanceof ApiError && error.status === 404;
export const isProfileConflict = (error: unknown) => error instanceof ApiError && error.status === 409;
