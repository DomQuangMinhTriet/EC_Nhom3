import { and, count, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db/client";
import {
  order,
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
}
