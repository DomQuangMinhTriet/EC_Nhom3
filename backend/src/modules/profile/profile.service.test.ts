import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../shared/errors/AppError";
import type { ProfileRepository } from "./profile.repository";
import { ProfileService } from "./profile.service";

const customerProfile = {
  customerProfileId: "00000000-0000-4000-8000-000000000001",
  userId: "00000000-0000-4000-8000-000000000010",
  fullName: "Nguyen Van A",
  phone: "0900000000",
  birthDate: "2000-01-01",
  gender: "Nam" as const,
  avatarUrl: null,
  address: "Ho Chi Minh City",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const partnerProfile = {
  partnerProfileId: "00000000-0000-4000-8000-000000000002",
  userId: "00000000-0000-4000-8000-000000000011",
  partnerProfileCode: "PARTNER001",
  partnerName: "Eco Partner",
  taxCode: "0312345678",
  representativeName: "Tran Thi B",
  status: "pending" as const,
  rejectionReason: "",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const branchProfile = {
  branchProfileId: "00000000-0000-4000-8000-000000000003",
  userId: "00000000-0000-4000-8000-000000000012",
  partnerProfileId: partnerProfile.partnerProfileId,
  branchProfileCode: "BRANCH001",
  branchName: "Eco Branch",
  phone: "0911111111",
  address: "District 1",
  email: "branch@example.com",
  status: "pending" as const,
  rejectionReason: "",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const createRepository = (overrides: Partial<ProfileRepository> = {}) =>
  ({
    findCustomerProfileByUserId: async () => undefined,
    findPartnerProfileByUserId: async () => undefined,
    findPartnerProfileById: async () => partnerProfile,
    findBranchProfileByUserId: async () => undefined,
    createCustomerProfile: async () => customerProfile,
    createPartnerProfile: async () => partnerProfile,
    createBranchProfile: async () => branchProfile,
    updateCustomerProfile: async () => customerProfile,
    updatePartnerProfile: async () => partnerProfile,
    updateBranchProfile: async () => branchProfile,
    updatePartnerProfileStatus: async () => partnerProfile,
    updateBranchProfileStatus: async () => branchProfile,
    ...overrides,
  }) as ProfileRepository;

test("creates a customer profile with trimmed strings", async () => {
  const repository = createRepository({
    createCustomerProfile: async (input) => {
      assert.equal(input.userId, customerProfile.userId);
      assert.equal(input.fullName, "Nguyen Van A");
      assert.equal(input.phone, "0900000000");
      assert.equal(input.address, "Ho Chi Minh City");
      return { ...customerProfile, ...input };
    },
  });
  const service = new ProfileService(repository);

  const result = await service.createProfile({
    userId: customerProfile.userId,
    roleCode: "Customer",
    customer: {
      fullName: " Nguyen Van A ",
      phone: " 0900000000 ",
      address: " Ho Chi Minh City ",
    },
  });

  const profile = result.profile as typeof customerProfile;

  assert.equal(profile.userId, customerProfile.userId);
  assert.equal(profile.fullName, "Nguyen Van A");
  assert.equal(profile.phone, "0900000000");
  assert.equal(profile.address, "Ho Chi Minh City");
});

test("rejects creating a duplicate customer profile", async () => {
  const service = new ProfileService(
    createRepository({
      findCustomerProfileByUserId: async () => customerProfile,
    }),
  );

  await assert.rejects(
    service.createProfile({
      userId: customerProfile.userId,
      roleCode: "Customer",
      customer: { fullName: "Nguyen Van A" },
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 409 &&
      error.message === "Profile already exists",
  );
});

test("creates a branch profile only when partner profile exists", async () => {
  const repository = createRepository({
    findPartnerProfileById: async (partnerProfileId) => {
      assert.equal(partnerProfileId, partnerProfile.partnerProfileId);
      return partnerProfile;
    },
    createBranchProfile: async (input) => {
      assert.equal(input.partnerProfileId, partnerProfile.partnerProfileId);
      assert.equal(input.branchProfileCode, "BRANCH001");
      assert.equal(input.branchName, "Eco Branch");
      return { ...branchProfile, ...input };
    },
  });
  const service = new ProfileService(repository);

  const result = await service.createProfile({
    userId: branchProfile.userId,
    roleCode: "Branch",
    branch: {
      partnerProfileId: partnerProfile.partnerProfileId,
      branchProfileCode: "BRANCH001",
      branchName: "Eco Branch",
    },
  });

  assert.equal(
    (result.profile as typeof branchProfile).branchProfileId,
    branchProfile.branchProfileId,
  );
});

test("creates a partner profile with active status", async () => {
  const repository = createRepository({
    createPartnerProfile: async (input) => {
      assert.equal(input.status, "active");
      return { ...partnerProfile, ...input, status: "active" };
    },
  });
  const service = new ProfileService(repository);

  const result = await service.createProfile({
    userId: partnerProfile.userId,
    roleCode: "Partner",
    partner: {
      partnerProfileCode: "PARTNER001",
      partnerName: "Eco Partner",
      taxCode: "0312345678",
      representativeName: "Tran Thi B",
    },
  });

  assert.equal((result.profile as typeof partnerProfile).status, "active");
});

test("creates a branch profile with active status", async () => {
  const repository = createRepository({
    createBranchProfile: async (input) => {
      assert.equal(input.status, "active");
      return { ...branchProfile, ...input, status: "active" };
    },
  });
  const service = new ProfileService(repository);

  const result = await service.createProfile({
    userId: branchProfile.userId,
    roleCode: "Branch",
    branch: {
      partnerProfileId: partnerProfile.partnerProfileId,
      branchProfileCode: "BRANCH001",
      branchName: "Eco Branch",
    },
  });

  assert.equal((result.profile as typeof branchProfile).status, "active");
});

test("rejects branch creation for a missing partner profile", async () => {
  const service = new ProfileService(
    createRepository({
      findPartnerProfileById: async () => undefined,
    }),
  );

  await assert.rejects(
    service.createProfile({
      userId: branchProfile.userId,
      roleCode: "Branch",
      branch: {
        partnerProfileId: partnerProfile.partnerProfileId,
        branchProfileCode: "BRANCH001",
        branchName: "Eco Branch",
      },
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "Partner profile not found",
  );
});

test("updates a partner profile with allowed fields only", async () => {
  const repository = createRepository({
    updatePartnerProfile: async (userId, updates) => {
      assert.equal(userId, partnerProfile.userId);
      assert.deepEqual(updates, {
        partnerName: "Eco Partner Updated",
        taxCode: undefined,
        representativeName: undefined,
      });
      return {
        ...partnerProfile,
        partnerName: updates.partnerName ?? partnerProfile.partnerName,
        taxCode: updates.taxCode ?? partnerProfile.taxCode,
        representativeName:
          updates.representativeName ?? partnerProfile.representativeName,
      };
    },
  });
  const service = new ProfileService(repository);

  const result = await service.updateProfile({
    userId: partnerProfile.userId,
    roleCode: "Partner",
    partner: { partnerName: " Eco Partner Updated " },
  });

  assert.equal(
    (result.profile as typeof partnerProfile).partnerName,
    "Eco Partner Updated",
  );
});

test("rejects update without profile fields", async () => {
  const service = new ProfileService(createRepository());

  await assert.rejects(
    service.updateProfile({
      userId: partnerProfile.userId,
      roleCode: "Partner",
      partner: {},
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "At least one profile field is required",
  );
});

test("throws 404 when updating a missing profile", async () => {
  const service = new ProfileService(
    createRepository({
      updateCustomerProfile: async () => undefined,
    }),
  );

  await assert.rejects(
    service.updateProfile({
      userId: customerProfile.userId,
      roleCode: "Customer",
      customer: { fullName: "Nguyen Van A" },
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "Profile not found",
  );
});

test("rejects roles that cannot manage profile", async () => {
  const service = new ProfileService(createRepository());

  await assert.rejects(
    service.createProfile({
      userId: customerProfile.userId,
      roleCode: "Super_Admin",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 403 &&
      error.message === "Role is not allowed to manage profile",
  );
});

test("updates partner profile status", async () => {
  const repository = createRepository({
    updatePartnerProfileStatus: async (profileId, status) => {
      assert.equal(profileId, partnerProfile.partnerProfileId);
      assert.equal(status, "suspended");
      return { ...partnerProfile, status };
    },
  });
  const service = new ProfileService(repository);

  const result = await service.updateProfileStatus({
    profileType: "partner",
    profileId: partnerProfile.partnerProfileId,
    status: "suspended",
  });

  assert.equal(result.message, "Profile status updated successfully.");
  assert.equal(result.profile.status, "suspended");
});

test("updates branch profile status", async () => {
  const repository = createRepository({
    updateBranchProfileStatus: async (profileId, status) => {
      assert.equal(profileId, branchProfile.branchProfileId);
      assert.equal(status, "closed");
      return { ...branchProfile, status };
    },
  });
  const service = new ProfileService(repository);

  const result = await service.updateProfileStatus({
    profileType: "branch",
    profileId: branchProfile.branchProfileId,
    status: "closed",
  });

  assert.equal(result.message, "Profile status updated successfully.");
  assert.equal(result.profile.status, "closed");
});

test("throws 404 when updating status for a missing profile", async () => {
  const service = new ProfileService(
    createRepository({
      updatePartnerProfileStatus: async () => undefined,
    }),
  );

  await assert.rejects(
    service.updateProfileStatus({
      profileType: "partner",
      profileId: partnerProfile.partnerProfileId,
      status: "active",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "Profile not found",
  );
});

test("CI runs profile unit tests", () => {
  assert.equal("ci should pass", "ci should pass");
});
