import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { order } from "../../db/schema";

export class PaymentRepository {
  async setPaymentCodeForOrder({
    orderId,
    customerProfileId,
    paymentCode,
  }: {
    orderId: string;
    customerProfileId: string;
    paymentCode: string;
  }) {
    const [record] = await db
      .update(order)
      .set({ paymentCode })
      .where(
        and(
          eq(order.orderId, orderId),
          eq(order.customerProfileId, customerProfileId),
        ),
      )
      .returning();

    return record ?? null;
  }

  async findOrderByPaymentCode(paymentCode: string) {
    const result = await db.query.order.findFirst({
      where: eq(order.paymentCode, paymentCode),
    });

    return result ?? null;
  }
}
