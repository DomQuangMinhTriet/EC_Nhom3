import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { partnerProfile, branchProfile } from "../../db/schema";

export class PartnerProfileRepository {
    async findByUserId(userId: string) {
        const result = await db
            .select()
            .from(partnerProfile)
            .where(eq(partnerProfile.userId, userId))
            .limit(1);
        return result[0] || null;
    }

    async updateByUserId(userId: string, data: Partial<typeof partnerProfile.$inferInsert>) {
        const result = await db
            .update(partnerProfile)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(partnerProfile.userId, userId))
            .returning();
        return result[0] || null;
    }

    async findBranchesByPartnerProfileId(partnerProfileId: string) {
        const result = await db
            .select()
            .from(branchProfile)
            .where(eq(branchProfile.partnerProfileId, partnerProfileId));
        return result;
    }

    async findAll() {
        const result = await db.select().from(partnerProfile);
        return result;
    }

    async updateStatusById(id: string, status: "pending" | "approved" | "rejected", rejectionReason: string = "") {
        const result = await db
            .update(partnerProfile)
            .set({ status, rejectionReason, updatedAt: new Date() })
            .where(eq(partnerProfile.partnerProfileId, id))
            .returning();
        return result[0] || null;
    }
}

export const partnerProfileRepository = new PartnerProfileRepository();
