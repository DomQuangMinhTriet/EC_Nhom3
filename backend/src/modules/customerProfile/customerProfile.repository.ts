import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { customerProfile } from "../../db/schema";

export class CustomerProfileRepository {
    async findByUserId(userId: string) {
        const result = await db
            .select()
            .from(customerProfile)
            .where(eq(customerProfile.userId, userId))
            .limit(1);
        return result[0] || null;
    }

    async updateByUserId(userId: string, data: Partial<typeof customerProfile.$inferInsert>) {
        const result = await db
            .update(customerProfile)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(customerProfile.userId, userId))
            .returning();
        return result[0] || null;
    }
}

export const customerProfileRepository = new CustomerProfileRepository();
