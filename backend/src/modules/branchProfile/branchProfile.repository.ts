import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { branchProfile } from "../../db/schema";

export class BranchProfileRepository {
    async findByUserId(userId: string) {
        const result = await db
            .select()
            .from(branchProfile)
            .where(eq(branchProfile.userId, userId))
            .limit(1);
        return result[0] || null;
    }

    async updateByUserId(userId: string, data: Partial<typeof branchProfile.$inferInsert>) {
        const result = await db
            .update(branchProfile)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(branchProfile.userId, userId))
            .returning();
        return result[0] || null;
    }

    async findAll() {
        const result = await db.select().from(branchProfile);
        return result;
    }

    async updateStatusById(id: string, status: "pending" | "active" | "suspended" | "closed" | "rejected", rejectionReason: string = "") {
        const result = await db
            .update(branchProfile)
            .set({ status, rejectionReason, updatedAt: new Date() })
            .where(eq(branchProfile.branchProfileId, id))
            .returning();
        return result[0] || null;
    }
}

export const branchProfileRepository = new BranchProfileRepository();
