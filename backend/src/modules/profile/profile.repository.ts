import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { branchProfile, customerProfile, partnerProfile } from "../../db/schema";

type CreateCustomerProfileInput = typeof customerProfile.$inferInsert;
type UpdateCustomerProfileInput = Partial<
  Pick<
    typeof customerProfile.$inferInsert,
    "fullName" | "phone" | "birthDate" | "gender" | "avatarUrl" | "address"
  >
>;

type CreatePartnerProfileInput = typeof partnerProfile.$inferInsert;
type UpdatePartnerProfileInput = Partial<
  Pick<
    typeof partnerProfile.$inferInsert,
    "partnerName" | "taxCode" | "representativeName"
  >
>;
type PartnerProfileStatus = NonNullable<
  typeof partnerProfile.$inferInsert.status
>;

type CreateBranchProfileInput = typeof branchProfile.$inferInsert;
type UpdateBranchProfileInput = Partial<
  Pick<
    typeof branchProfile.$inferInsert,
    "branchName" | "phone" | "address" | "email"
  >
>;
type BranchProfileStatus = NonNullable<typeof branchProfile.$inferInsert.status>;

export class ProfileRepository {
  async findCustomerProfileByUserId(userId: string) {
    const [record] = await db
      .select()
      .from(customerProfile)
      .where(eq(customerProfile.userId, userId));

    return record;
  }

  async findPartnerProfileByUserId(userId: string) {
    const [record] = await db
      .select()
      .from(partnerProfile)
      .where(eq(partnerProfile.userId, userId));

    return record;
  }

  async findPartnerProfileById(partnerProfileId: string) {
    const [record] = await db
      .select()
      .from(partnerProfile)
      .where(eq(partnerProfile.partnerProfileId, partnerProfileId));

    return record;
  }

  async findBranchProfileByUserId(userId: string) {
    const [record] = await db
      .select()
      .from(branchProfile)
      .where(eq(branchProfile.userId, userId));

    return record;
  }

  async createCustomerProfile(input: CreateCustomerProfileInput) {
    const [record] = await db.insert(customerProfile).values(input).returning();

    return record;
  }

  async createPartnerProfile(input: CreatePartnerProfileInput) {
    const [record] = await db.insert(partnerProfile).values(input).returning();

    return record;
  }

  async createBranchProfile(input: CreateBranchProfileInput) {
    const [record] = await db.insert(branchProfile).values(input).returning();

    return record;
  }

  async updateCustomerProfile(
    userId: string,
    updates: UpdateCustomerProfileInput,
  ) {
    const [record] = await db
      .update(customerProfile)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerProfile.userId, userId))
      .returning();

    return record;
  }

  async updatePartnerProfile(
    userId: string,
    updates: UpdatePartnerProfileInput,
  ) {
    const [record] = await db
      .update(partnerProfile)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(partnerProfile.userId, userId))
      .returning();

    return record;
  }

  async updateBranchProfile(userId: string, updates: UpdateBranchProfileInput) {
    const [record] = await db
      .update(branchProfile)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(branchProfile.userId, userId))
      .returning();

    return record;
  }

  async findBranchesByPartnerProfileId(partnerProfileId: string) {
    return await db
      .select()
      .from(branchProfile)
      .where(eq(branchProfile.partnerProfileId, partnerProfileId));
  }

  async findAllPartners() {
    return await db.select().from(partnerProfile);
  }

  async findAllBranches() {
    return await db.select().from(branchProfile);
  }

  async updatePartnerProfileStatus(
    partnerProfileId: string,
    status: PartnerProfileStatus,
    rejectionReason: string = "",
  ) {
    const [record] = await db
      .update(partnerProfile)
      .set({ status, rejectionReason, updatedAt: new Date() })
      .where(eq(partnerProfile.partnerProfileId, partnerProfileId))
      .returning();

    return record;
  }

  async updateBranchProfileStatus(
    branchProfileId: string,
    status: BranchProfileStatus,
    rejectionReason: string = "",
  ) {
    const [record] = await db
      .update(branchProfile)
      .set({ status, rejectionReason, updatedAt: new Date() })
      .where(eq(branchProfile.branchProfileId, branchProfileId))
      .returning();

    return record;
  }
}
