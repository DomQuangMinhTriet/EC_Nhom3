import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { user } from "../../db/schema";
import type { AppRole, UserStatus } from "../../shared/auth/jwt";

export class UsersRepository {
  async findAll(
    page: number,
    limit: number,
    roles?: AppRole[],
    status?: UserStatus,
  ) {
    const offset = (page - 1) * limit;
    const filters = and(
      roles ? inArray(user.roleCode, roles) : undefined,
      status ? eq(user.status, status) : undefined,
    );

    const [users, totals] = await Promise.all([
      db
        .select()
        .from(user)
        .where(filters)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(user).where(filters),
    ]);

    return { users, total: totals[0]?.total ?? 0 };
  }

  async updateUser(
    userId: string,
    updates: { status?: UserStatus; roleCode?: AppRole },
  ) {
    const [record] = await db
      .update(user)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(user.userId, userId))
      .returning();

    return record;
  }
}
