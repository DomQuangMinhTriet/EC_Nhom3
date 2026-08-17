import type { AppRole } from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors/AppError";
import { ProfileRepository } from "./profile.repository";

type Gender = "Nam" | "Nữ";

type CustomerProfileInput = {
  fullName?: string;
  phone?: string;
  birthDate?: string | null;
  gender?: Gender | null;
  avatarUrl?: string | null;
  address?: string;
};

type PartnerProfileInput = {
  partnerProfileCode?: string;
  partnerName?: string;
  taxCode?: string;
  representativeName?: string;
};

type BranchProfileInput = {
  partnerProfileId?: string;
  branchProfileCode?: string;
  branchName?: string;
  phone?: string;
  address?: string;
  email?: string | null;
};

type ProfileType = "partner" | "branch";
type PartnerProfileStatus =
  "pending" | "active" | "suspended" | "terminated" | "rejected";
type BranchProfileStatus =
  "pending" | "active" | "suspended" | "closed" | "rejected";
type ProfileStatus = PartnerProfileStatus | BranchProfileStatus;

type CreateProfileInput = {
  userId: string;
  roleCode: AppRole;
  customer?: CustomerProfileInput;
  partner?: PartnerProfileInput;
  branch?: BranchProfileInput;
};

type UpdateProfileInput = {
  userId: string;
  roleCode: AppRole;
  customer?: CustomerProfileInput;
  partner?: Omit<PartnerProfileInput, "partnerProfileCode">;
  branch?: Omit<BranchProfileInput, "partnerProfileId" | "branchProfileCode">;
};

type UpdateProfileStatusInput = {
  profileType: ProfileType;
  profileId: string;
  status: ProfileStatus;
};

const profileResponse = (profile: unknown) => ({ profile });

const requireString = (value: string | undefined, field: string) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`${field} is required`, 400);
  }

  return value.trim();
};

const optionalString = (value: string | undefined) =>
  typeof value === "string" ? value.trim() : undefined;

const optionalNullableString = (value: string | null | undefined) =>
  value === null ? null : optionalString(value);

export class ProfileService {
  constructor(private readonly profileRepository = new ProfileRepository()) {}

  async createProfile({
    userId,
    roleCode,
    customer,
    partner,
    branch,
  }: CreateProfileInput) {
    if (roleCode === "Customer") {
      return profileResponse(
        await this.createCustomerProfile(userId, customer),
      );
    }

    if (roleCode === "Partner") {
      return profileResponse(await this.createPartnerProfile(userId, partner));
    }

    if (roleCode === "Branch") {
      return profileResponse(await this.createBranchProfile(userId, branch));
    }

    throw new AppError("Role is not allowed to manage profile", 403);
  }

  async updateProfile({
    userId,
    roleCode,
    customer,
    partner,
    branch,
  }: UpdateProfileInput) {
    if (roleCode === "Customer") {
      return profileResponse(
        await this.updateCustomerProfile(userId, customer),
      );
    }

    if (roleCode === "Partner") {
      return profileResponse(await this.updatePartnerProfile(userId, partner));
    }

    if (roleCode === "Branch") {
      return profileResponse(await this.updateBranchProfile(userId, branch));
    }

    throw new AppError("Role is not allowed to manage profile", 403);
  }

  async updateProfileStatus({
    profileType,
    profileId,
    status,
  }: UpdateProfileStatusInput) {
    const profile =
      profileType === "partner"
        ? await this.profileRepository.updatePartnerProfileStatus(
            profileId,
            status as PartnerProfileStatus,
          )
        : await this.profileRepository.updateBranchProfileStatus(
            profileId,
            status as BranchProfileStatus,
          );

    if (!profile) {
      throw new AppError("Profile not found", 404);
    }

    return {
      message: "Profile status updated successfully.",
      profile,
    };
  }

  private async createCustomerProfile(
    userId: string,
    input: CustomerProfileInput | undefined,
  ) {
    if (await this.profileRepository.findCustomerProfileByUserId(userId)) {
      throw new AppError("Profile already exists", 409);
    }

    return this.profileRepository.createCustomerProfile({
      userId,
      fullName: requireString(input?.fullName, "fullName"),
      phone: optionalString(input?.phone),
      birthDate: input?.birthDate,
      gender: input?.gender,
      avatarUrl: optionalNullableString(input?.avatarUrl),
      address: optionalString(input?.address),
    });
  }

  private async createPartnerProfile(
    userId: string,
    input: PartnerProfileInput | undefined,
  ) {
    if (await this.profileRepository.findPartnerProfileByUserId(userId)) {
      throw new AppError("Profile already exists", 409);
    }

    return this.profileRepository.createPartnerProfile({
      userId,
      partnerProfileCode: requireString(
        input?.partnerProfileCode,
        "partnerProfileCode",
      ),
      partnerName: requireString(input?.partnerName, "partnerName"),
      taxCode: requireString(input?.taxCode, "taxCode"),
      representativeName: requireString(
        input?.representativeName,
        "representativeName",
      ),
      status: "active",
    });
  }

  private async createBranchProfile(
    userId: string,
    input: BranchProfileInput | undefined,
  ) {
    if (await this.profileRepository.findBranchProfileByUserId(userId)) {
      throw new AppError("Profile already exists", 409);
    }

    const partnerProfileId = requireString(
      input?.partnerProfileId,
      "partnerProfileId",
    );

    if (
      !(await this.profileRepository.findPartnerProfileById(partnerProfileId))
    ) {
      throw new AppError("Partner profile not found", 404);
    }

    return this.profileRepository.createBranchProfile({
      userId,
      partnerProfileId,
      branchProfileCode: requireString(
        input?.branchProfileCode,
        "branchProfileCode",
      ),
      branchName: requireString(input?.branchName, "branchName"),
      phone: optionalString(input?.phone),
      address: optionalString(input?.address),
      email: optionalNullableString(input?.email),
      status: "active",
    });
  }

  private async updateCustomerProfile(
    userId: string,
    input: CustomerProfileInput | undefined,
  ) {
    const updates = {
      fullName: optionalString(input?.fullName),
      phone: optionalString(input?.phone),
      birthDate: input?.birthDate,
      gender: input?.gender,
      avatarUrl: optionalNullableString(input?.avatarUrl),
      address: optionalString(input?.address),
    };

    if (Object.values(updates).every((value) => value === undefined)) {
      throw new AppError("At least one profile field is required", 400);
    }

    const profile = await this.profileRepository.updateCustomerProfile(
      userId,
      updates,
    );

    if (!profile) {
      throw new AppError("Profile not found", 404);
    }

    return profile;
  }

  private async updatePartnerProfile(
    userId: string,
    input: Omit<PartnerProfileInput, "partnerProfileCode"> | undefined,
  ) {
    const updates = {
      partnerName: optionalString(input?.partnerName),
      taxCode: optionalString(input?.taxCode),
      representativeName: optionalString(input?.representativeName),
    };

    if (Object.values(updates).every((value) => value === undefined)) {
      throw new AppError("At least one profile field is required", 400);
    }

    const profile = await this.profileRepository.updatePartnerProfile(
      userId,
      updates,
    );

    if (!profile) {
      throw new AppError("Profile not found", 404);
    }

    return profile;
  }

  private async updateBranchProfile(
    userId: string,
    input:
      | Omit<BranchProfileInput, "partnerProfileId" | "branchProfileCode">
      | undefined,
  ) {
    const updates = {
      branchName: optionalString(input?.branchName),
      phone: optionalString(input?.phone),
      address: optionalString(input?.address),
      email: optionalNullableString(input?.email),
    };

    if (Object.values(updates).every((value) => value === undefined)) {
      throw new AppError("At least one profile field is required", 400);
    }

    const profile = await this.profileRepository.updateBranchProfile(
      userId,
      updates,
    );

    if (!profile) {
      throw new AppError("Profile not found", 404);
    }

    return profile;
  }
}
