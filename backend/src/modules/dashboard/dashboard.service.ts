import { AppError } from "../../shared/errors/AppError";
import { DashboardRepository } from "./dashboard.repository";

export type DashboardSummaryInput = {
  from?: Date;
  to?: Date;
};

const sumTotals = (rows: { total: number }[]) =>
  rows.reduce((sum, row) => sum + row.total, 0);

const byKey = <K extends string>(rows: { status: K; total: number }[]) =>
  Object.fromEntries(rows.map((row) => [row.status, row.total])) as Record<K, number>;

export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository = new DashboardRepository(),
  ) {}

  async getSummary(input: DashboardSummaryInput = {}) {
    if (input.from && input.to && input.from > input.to) {
      throw new AppError("from must be before to", 400);
    }

    const [users, partners, voucherProducts, voucherCodes, orders] =
      await Promise.all([
        this.dashboardRepository.getUserCountsByRole(),
        this.dashboardRepository.getPartnerCountsByStatus(),
        this.dashboardRepository.getVoucherProductCountsByStatus(),
        this.dashboardRepository.getVoucherCodeCountsByStatus(),
        this.dashboardRepository.getOrderSummaryByStatus(input.from, input.to),
      ]);

    let totalOrders = 0;
    let completedRevenue = 0;
    const ordersByStatus: Record<string, { count: number; revenue: string }> = {};

    for (const row of orders) {
      ordersByStatus[row.status] = { count: row.total, revenue: row.revenue };
      totalOrders += row.total;
      if (row.status === "completed") {
        completedRevenue += Number(row.revenue);
      }
    }

    return {
      range: {
        from: input.from?.toISOString() ?? null,
        to: input.to?.toISOString() ?? null,
      },
      users: {
        byRole: byKey(users.map((r) => ({ status: r.roleCode, total: r.total }))),
        total: sumTotals(users),
      },
      partners: {
        byStatus: byKey(partners),
        total: sumTotals(partners),
      },
      vouchers: {
        byStatus: byKey(voucherProducts),
        total: sumTotals(voucherProducts),
      },
      voucherCodes: {
        byStatus: byKey(voucherCodes),
        total: sumTotals(voucherCodes),
      },
      orders: {
        byStatus: ordersByStatus,
        total: totalOrders,
      },
      revenue: {
        completed: completedRevenue.toFixed(2),
        currency: "VND",
      },
    };
  }

  async getPartnerSummary(userId: string) {
    const partnerProfileId = await this.dashboardRepository.getPartnerProfileIdByUserId(userId);
    if (!partnerProfileId) {
      throw new AppError("Partner profile not found", 404);
    }

    const monthsBack = 6;
    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    since.setMonth(since.getMonth() - (monthsBack - 1));

    const [vouchersByStatus, voucherCodesByStatus, orderCount, vouchersSoldTotal, revenueRows, topVouchers] =
      await Promise.all([
        this.dashboardRepository.getPartnerVoucherCountsByStatus(partnerProfileId),
        this.dashboardRepository.getPartnerVoucherCodeCountsByStatus(partnerProfileId),
        this.dashboardRepository.getPartnerOrderCount(partnerProfileId),
        this.dashboardRepository.getPartnerVoucherSoldTotal(partnerProfileId),
        this.dashboardRepository.getPartnerRevenueByMonth(partnerProfileId, since),
        this.dashboardRepository.getPartnerTopVouchers(partnerProfileId, 5),
      ]);

    const revenueByMonth = new Map(revenueRows.map((row) => [row.month, row.revenue]));
    const monthly: { month: string; revenue: string }[] = [];
    for (let i = monthsBack - 1; i >= 0; i -= 1) {
      const d = new Date(since);
      d.setMonth(d.getMonth() + (monthsBack - 1 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthly.push({ month: key, revenue: revenueByMonth.get(key) ?? "0" });
    }

    const currentMonthRevenue = Number(monthly[monthly.length - 1]?.revenue ?? 0);
    const previousMonthRevenue = Number(monthly[monthly.length - 2]?.revenue ?? 0);
    const revenueGrowthPercent =
      previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : null;

    const voucherCodeCounts = byKey(voucherCodesByStatus);
    const vouchersUsedTotal = voucherCodeCounts.used ?? 0;
    const usageRatePercent = vouchersSoldTotal > 0 ? (vouchersUsedTotal / vouchersSoldTotal) * 100 : 0;

    return {
      revenue: {
        currentMonth: currentMonthRevenue.toFixed(2),
        growthPercent: revenueGrowthPercent === null ? null : Number(revenueGrowthPercent.toFixed(1)),
        monthly,
        currency: "VND",
      },
      orders: { completedTotal: orderCount },
      vouchers: {
        byStatus: byKey(vouchersByStatus),
        activeCount: byKey(vouchersByStatus).active ?? 0,
        soldTotal: vouchersSoldTotal,
        usedTotal: vouchersUsedTotal,
        usageRatePercent: Number(usageRatePercent.toFixed(1)),
      },
      topVouchers: topVouchers.map((v) => ({
        voucherProductId: v.voucherProductId,
        title: v.title,
        status: v.status,
        sold: Number(v.sold),
      })),
    };
  }
}
