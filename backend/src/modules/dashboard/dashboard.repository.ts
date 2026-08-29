import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db/client";
import {
  order,
  orderItem,
  partnerProfile,
  user,
  voucherCode,
  voucherProduct,
} from "../../db/schema";

export class DashboardRepository {
  async getUserCountsByRole() {
    return db
      .select({ roleCode: user.roleCode, total: count() })
      .from(user)
      .groupBy(user.roleCode);
  }

  async getPartnerCountsByStatus() {
    return db
      .select({ status: partnerProfile.status, total: count() })
      .from(partnerProfile)
      .groupBy(partnerProfile.status);
  }

  async getVoucherProductCountsByStatus() {
    return db
      .select({ status: voucherProduct.status, total: count() })
      .from(voucherProduct)
      .groupBy(voucherProduct.status);
  }

  async getVoucherCodeCountsByStatus() {
    return db
      .select({ status: voucherCode.status, total: count() })
      .from(voucherCode)
      .groupBy(voucherCode.status);
  }

  async getOrderSummaryByStatus(from?: Date, to?: Date) {
    const filters = and(
      from ? gte(order.createdAt, from) : undefined,
      to ? lte(order.createdAt, to) : undefined,
    );

    return db
      .select({
        status: order.status,
        total: count(),
        revenue: sql<string>`coalesce(sum(${order.totalAmount}), 0)`,
      })
      .from(order)
      .where(filters)
      .groupBy(order.status);
  }

  async getPartnerProfileIdByUserId(userId: string) {
    const result = await db
      .select({ partnerProfileId: partnerProfile.partnerProfileId })
      .from(partnerProfile)
      .where(eq(partnerProfile.userId, userId))
      .limit(1);
    return result[0]?.partnerProfileId ?? null;
  }

  async getPartnerVoucherCountsByStatus(partnerProfileId: string) {
    return db
      .select({ status: voucherProduct.status, total: count() })
      .from(voucherProduct)
      .where(eq(voucherProduct.partnerProfileId, partnerProfileId))
      .groupBy(voucherProduct.status);
  }

  async getPartnerVoucherCodeCountsByStatus(partnerProfileId: string) {
    return db
      .select({ status: voucherCode.status, total: count() })
      .from(voucherCode)
      .innerJoin(voucherProduct, eq(voucherCode.voucherProductId, voucherProduct.voucherProductId))
      .where(eq(voucherProduct.partnerProfileId, partnerProfileId))
      .groupBy(voucherCode.status);
  }

  async getPartnerOrderCount(partnerProfileId: string) {
    const result = await db
      .select({ total: sql<string>`count(distinct ${orderItem.orderId})` })
      .from(orderItem)
      .innerJoin(order, eq(orderItem.orderId, order.orderId))
      .innerJoin(voucherProduct, eq(orderItem.voucherProductId, voucherProduct.voucherProductId))
      .where(
        and(
          eq(voucherProduct.partnerProfileId, partnerProfileId),
          eq(order.status, "completed"),
        ),
      );
    return Number(result[0]?.total ?? 0);
  }

  async getPartnerVoucherSoldTotal(partnerProfileId: string) {
    const result = await db
      .select({ total: sql<string>`coalesce(sum(${orderItem.quantity}), 0)` })
      .from(orderItem)
      .innerJoin(order, eq(orderItem.orderId, order.orderId))
      .innerJoin(voucherProduct, eq(orderItem.voucherProductId, voucherProduct.voucherProductId))
      .where(
        and(
          eq(voucherProduct.partnerProfileId, partnerProfileId),
          eq(order.status, "completed"),
        ),
      );
    return Number(result[0]?.total ?? 0);
  }

  async getPartnerRevenueByMonth(partnerProfileId: string, since: Date) {
    return db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${order.createdAt}), 'YYYY-MM')`,
        revenue: sql<string>`coalesce(sum(${orderItem.unitPrice} * ${orderItem.quantity}), 0)`,
      })
      .from(orderItem)
      .innerJoin(order, eq(orderItem.orderId, order.orderId))
      .innerJoin(voucherProduct, eq(orderItem.voucherProductId, voucherProduct.voucherProductId))
      .where(
        and(
          eq(voucherProduct.partnerProfileId, partnerProfileId),
          eq(order.status, "completed"),
          gte(order.createdAt, since),
        ),
      )
      .groupBy(sql`date_trunc('month', ${order.createdAt})`)
      .orderBy(sql`date_trunc('month', ${order.createdAt})`);
  }

  async getPartnerTopVouchers(partnerProfileId: string, limit: number) {
    return db
      .select({
        voucherProductId: voucherProduct.voucherProductId,
        title: voucherProduct.title,
        status: voucherProduct.status,
        sold: sql<string>`coalesce(sum(case when ${order.status} = 'completed' then ${orderItem.quantity} else 0 end), 0)`,
      })
      .from(voucherProduct)
      .leftJoin(orderItem, eq(orderItem.voucherProductId, voucherProduct.voucherProductId))
      .leftJoin(order, eq(orderItem.orderId, order.orderId))
      .where(eq(voucherProduct.partnerProfileId, partnerProfileId))
      .groupBy(voucherProduct.voucherProductId, voucherProduct.title, voucherProduct.status)
      .orderBy(sql`4 desc`)
      .limit(limit);
  }
}
