import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { customerProfile, notification, user } from "../../db/schema";

type CreateNotificationInput = typeof notification.$inferInsert;

export class NotificationRepository {
  async findCustomerProfileIdByUserId(userId: string) {
    const [record] = await db
      .select({ customerProfileId: customerProfile.customerProfileId })
      .from(customerProfile)
      .where(eq(customerProfile.userId, userId));

    return record?.customerProfileId ?? null;
  }

  async findCustomerProfileIdByEmail(email: string) {
    const [record] = await db
      .select({ customerProfileId: customerProfile.customerProfileId })
      .from(customerProfile)
      .innerJoin(user, eq(customerProfile.userId, user.userId))
      .where(eq(user.email, email));

    return record?.customerProfileId ?? null;
  }

  async create(input: CreateNotificationInput) {
    const [record] = await db.insert(notification).values(input).returning();

    return record;
  }

  async findAllByCustomerProfileId(customerProfileId: string) {
    return await db
      .select()
      .from(notification)
      .where(eq(notification.customerProfileId, customerProfileId))
      .orderBy(desc(notification.createdAt));
  }

  async markAsRead(notificationId: string, customerProfileId: string) {
    const [record] = await db
      .update(notification)
      .set({ isRead: true })
      .where(
        and(
          eq(notification.notificationId, notificationId),
          eq(notification.customerProfileId, customerProfileId),
        ),
      )
      .returning();

    return record ?? null;
  }
}
