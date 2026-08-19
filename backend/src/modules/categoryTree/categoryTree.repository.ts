import { db } from "../../db/client";
import { category } from "../../db/schema";
import { eq } from "drizzle-orm";

export class CategoryTreeRepository {
    async findAll() {
        return await db.select().from(category);
    }

    async findById(categoryId: string) {
        const result = await db
            .select()
            .from(category)
            .where(eq(category.categoryId, categoryId))
            .limit(1);
        return result[0] || null;
    }

    async hasChildren(categoryId: string) {
        const result = await db
            .select()
            .from(category)
            .where(eq(category.parentCategoryId, categoryId))
            .limit(1);
        return result.length > 0;
    }

    async create(data: { name: string; parentCategoryId?: string }) {
        const result = await db
            .insert(category)
            .values({
                name: data.name,
                parentCategoryId: data.parentCategoryId || null,
            })
            .returning();
        return result[0];
    }

    async update(categoryId: string, data: { name?: string; parentCategoryId?: string | null }) {
        // Build the update object
        const updateData: Partial<typeof category.$inferInsert> = {};
        if (data.name !== undefined) {
            updateData.name = data.name;
        }
        if (data.parentCategoryId !== undefined) {
            updateData.parentCategoryId = data.parentCategoryId;
        }

        const result = await db
            .update(category)
            .set(updateData)
            .where(eq(category.categoryId, categoryId))
            .returning();
        return result[0] || null;
    }

    async delete(categoryId: string) {
        const result = await db
            .delete(category)
            .where(eq(category.categoryId, categoryId))
            .returning();
        return result[0] || null;
    }
}
