import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import {
  parseNullableString,
  parseOptionalString,
} from "../../shared/http/requestParsers";
import { ProfileService } from "./profile.service";

const genders = ["Nam", "Nữ"] as const;
type Gender = (typeof genders)[number];

const isGender = (value: string): value is Gender =>
  genders.includes(value as Gender);

const profileTypes = ["partner", "branch"] as const;
type ProfileType = (typeof profileTypes)[number];

const partnerProfileStatuses = [
  "pending",
  "active",
  "suspended",
  "terminated",
  "rejected",
] as const;
const branchProfileStatuses = [
  "pending",
  "active",
  "suspended",
  "closed",
  "rejected",
] as const;
type ProfileStatus =
  | (typeof partnerProfileStatuses)[number]
  | (typeof branchProfileStatuses)[number];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isProfileType = (value: string): value is ProfileType =>
  profileTypes.includes(value as ProfileType);

const isProfileStatus = (
  profileType: ProfileType,
  value: string,
): value is ProfileStatus =>
  profileType === "partner"
    ? partnerProfileStatuses.includes(
        value as (typeof partnerProfileStatuses)[number],
      )
    : branchProfileStatuses.includes(
        value as (typeof branchProfileStatuses)[number],
      );

const parseGender = (gender: unknown) => {
  if (gender === undefined || gender === null) {
    return gender;
  }

  if (typeof gender !== "string" || !isGender(gender)) {
    throw new AppError("Invalid gender", 400);
  }

  return gender;
};

export class ProfileController {
  constructor(private readonly profileService = new ProfileService()) {}

  createProfile = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const {
      fullName,
      phone,
      birthDate,
      gender,
      avatarUrl,
      address,
      partnerProfileCode,
      partnerName,
      taxCode,
      representativeName,
      partnerProfileId,
      branchProfileCode,
      branchName,
      email,
    } = req.body as Record<string, unknown>;

    const result = await this.profileService.createProfile({
      userId: req.user.userId,
      roleCode: req.user.roleCode,
      customer: {
        fullName: parseOptionalString(fullName, "fullName"),
        phone: parseOptionalString(phone, "phone"),
        birthDate: parseNullableString(birthDate, "birthDate"),
        gender: parseGender(gender),
        avatarUrl: parseNullableString(avatarUrl, "avatarUrl"),
        address: parseOptionalString(address, "address"),
      },
      partner: {
        partnerProfileCode: parseOptionalString(
          partnerProfileCode,
          "partnerProfileCode",
        ),
        partnerName: parseOptionalString(partnerName, "partnerName"),
        taxCode: parseOptionalString(taxCode, "taxCode"),
        representativeName: parseOptionalString(
          representativeName,
          "representativeName",
        ),
      },
      branch: {
        partnerProfileId: parseOptionalString(
          partnerProfileId,
          "partnerProfileId",
        ),
        branchProfileCode: parseOptionalString(
          branchProfileCode,
          "branchProfileCode",
        ),
        branchName: parseOptionalString(branchName, "branchName"),
        phone: parseOptionalString(phone, "phone"),
        address: parseOptionalString(address, "address"),
        email: parseNullableString(email, "email"),
      },
    });

    res.status(201).json(result);
  };

  updateProfile = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const {
      fullName,
      phone,
      birthDate,
      gender,
      avatarUrl,
      address,
      partnerName,
      taxCode,
      representativeName,
      branchName,
      email,
    } = req.body as Record<string, unknown>;

    res.json(
      await this.profileService.updateProfile({
        userId: req.user.userId,
        roleCode: req.user.roleCode,
        customer: {
          fullName: parseOptionalString(fullName, "fullName"),
          phone: parseOptionalString(phone, "phone"),
          birthDate: parseNullableString(birthDate, "birthDate"),
          gender: parseGender(gender),
          avatarUrl: parseNullableString(avatarUrl, "avatarUrl"),
          address: parseOptionalString(address, "address"),
        },
        partner: {
          partnerName: parseOptionalString(partnerName, "partnerName"),
          taxCode: parseOptionalString(taxCode, "taxCode"),
          representativeName: parseOptionalString(
            representativeName,
            "representativeName",
          ),
        },
        branch: {
          branchName: parseOptionalString(branchName, "branchName"),
          phone: parseOptionalString(phone, "phone"),
          address: parseOptionalString(address, "address"),
          email: parseNullableString(email, "email"),
        },
      }),
    );
  };

  updateProfileStatus = async (req: Request, res: Response) => {
    const { profileType, profileId } = req.params;
    const { status } = req.body as { status?: string };

    if (typeof profileType !== "string" || !isProfileType(profileType)) {
      throw new AppError("Invalid profileType", 400);
    }

    if (typeof profileId !== "string" || !uuidPattern.test(profileId)) {
      throw new AppError("Invalid profileId", 400);
    }

    if (typeof status !== "string" || !isProfileStatus(profileType, status)) {
      throw new AppError("Invalid status", 400);
    }

    res.json(
      await this.profileService.updateProfileStatus({
        profileType,
        profileId,
        status,
      }),
    );
  };
}
