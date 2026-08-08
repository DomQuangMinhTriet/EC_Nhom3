import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { user } from "../../db/schema";
import type { AppRole, UserStatus } from "../../shared/auth/jwt";

type UpsertUserInput = {
  userId: string;
  email: string;
  roleCode?: AppRole;
  status?: UserStatus;
};

export class AuthRepository {
  async findUserById(userId: string) {
    const [record] = await db.select().from(user).where(eq(user.userId, userId));

    return record;
  }

  async findUserByEmail(email: string) {
    const [record] = await db.select().from(user).where(eq(user.email, email));

    return record;
  }

  async upsertUser({
    userId,
    email,
    roleCode = "Customer",
    status = "pending",
  }: UpsertUserInput) {
    const [record] = await db
      .insert(user)
      .values({ userId, email, roleCode, status })
      .onConflictDoUpdate({
        target: user.userId,
        set: { email, updatedAt: new Date() },
      })
      .returning();

    return record;
  }
}
