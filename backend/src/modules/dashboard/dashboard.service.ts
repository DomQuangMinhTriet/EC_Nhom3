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
}
