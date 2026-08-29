import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../shared/errors/AppError";
import type { DashboardRepository } from "./dashboard.repository";
import { DashboardService } from "./dashboard.service";

const createRepository = (
  overrides: Partial<DashboardRepository> = {},
) =>
  ({
    getUserCountsByRole: async () => [
      { roleCode: "Customer", total: 10 },
      { roleCode: "Partner", total: 3 },
    ],
    getPartnerCountsByStatus: async () => [
      { status: "active", total: 2 },
      { status: "pending", total: 1 },
    ],
    getVoucherProductCountsByStatus: async () => [
      { status: "active", total: 5 },
      { status: "pending", total: 2 },
    ],
    getVoucherCodeCountsByStatus: async () => [
      { status: "available", total: 8 },
      { status: "used", total: 4 },
    ],
    getOrderSummaryByStatus: async () => [
      { status: "completed", total: 6, revenue: "1200000.00" },
      { status: "failed", total: 2, revenue: "0.00" },
    ],
    getPartnerProfileIdByUserId: async (userId: string) =>
      userId === "partner-user-1" ? "partner-profile-1" : null,
    getPartnerVoucherCountsByStatus: async () => [
      { status: "active", total: 3 },
      { status: "pending", total: 1 },
    ],
    getPartnerVoucherCodeCountsByStatus: async () => [
      { status: "used", total: 40 },
      { status: "available", total: 60 },
    ],
    getPartnerOrderCount: async () => 25,
    getPartnerVoucherSoldTotal: async () => 100,
    getPartnerRevenueByMonth: async () => [],
    getPartnerTopVouchers: async () => [
      { voucherProductId: "v-1", title: "Voucher A", status: "active", sold: "80" },
      { voucherProductId: "v-2", title: "Voucher B", status: "pending", sold: "20" },
    ],
    ...overrides,
  }) as unknown as DashboardRepository;

test("getSummary aggregates counts and completed revenue", async () => {
  const service = new DashboardService(createRepository());

  const summary = await service.getSummary();

  assert.deepEqual(summary.users.byRole, { Customer: 10, Partner: 3 });
  assert.equal(summary.users.total, 13);
  assert.deepEqual(summary.partners.byStatus, { active: 2, pending: 1 });
  assert.equal(summary.vouchers.total, 7);
  assert.equal(summary.voucherCodes.total, 12);
  assert.equal(summary.orders.total, 8);
  assert.deepEqual(summary.orders.byStatus.completed, { count: 6, revenue: "1200000.00" });
  assert.equal(summary.revenue.completed, "1200000.00");
  assert.equal(summary.revenue.currency, "VND");
  assert.equal(summary.range.from, null);
  assert.equal(summary.range.to, null);
});

test("getSummary only counts completed orders toward revenue", async () => {
  const service = new DashboardService(
    createRepository({
      getOrderSummaryByStatus: async () => [
        { status: "completed", total: 1, revenue: "500.00" },
        { status: "pending_payment", total: 4, revenue: "9999.00" },
      ],
    }),
  );

  const summary = await service.getSummary();

  assert.equal(summary.revenue.completed, "500.00");
  assert.equal(summary.orders.total, 5);
});

test("getSummary passes the date range through to the repository", async () => {
  const from = new Date("2026-08-01T00:00:00.000Z");
  const to = new Date("2026-08-31T23:59:59.999Z");
  let received: { from?: Date; to?: Date } = {};

  const service = new DashboardService(
    createRepository({
      getOrderSummaryByStatus: async (f, t) => {
        received = { from: f, to: t };
        return [];
      },
    }),
  );

  const summary = await service.getSummary({ from, to });

  assert.equal(received.from, from);
  assert.equal(received.to, to);
  assert.equal(summary.range.from, from.toISOString());
  assert.equal(summary.range.to, to.toISOString());
});

test("getSummary rejects an inverted date range", async () => {
  const service = new DashboardService(createRepository());

  await assert.rejects(
    service.getSummary({
      from: new Date("2026-08-31T00:00:00.000Z"),
      to: new Date("2026-08-01T00:00:00.000Z"),
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "from must be before to",
  );
});

test("getSummary returns zeroed totals when there is no data yet", async () => {
  const service = new DashboardService(
    createRepository({
      getUserCountsByRole: async () => [],
      getPartnerCountsByStatus: async () => [],
      getVoucherProductCountsByStatus: async () => [],
      getVoucherCodeCountsByStatus: async () => [],
      getOrderSummaryByStatus: async () => [],
    }),
  );

  const summary = await service.getSummary();

  assert.equal(summary.users.total, 0);
  assert.equal(summary.orders.total, 0);
  assert.equal(summary.revenue.completed, "0.00");
});

test("getPartnerSummary throws 404 when the user has no partner profile", async () => {
  const service = new DashboardService(createRepository());

  await assert.rejects(
    service.getPartnerSummary("stranger-user"),
    (error: unknown) => error instanceof AppError && error.statusCode === 404 && error.message === "Partner profile not found",
  );
});

test("getPartnerSummary aggregates vouchers, orders, and usage rate for the partner", async () => {
  const service = new DashboardService(createRepository());

  const summary = await service.getPartnerSummary("partner-user-1");

  assert.equal(summary.orders.completedTotal, 25);
  assert.equal(summary.vouchers.soldTotal, 100);
  assert.equal(summary.vouchers.usedTotal, 40);
  assert.equal(summary.vouchers.usageRatePercent, 40);
  assert.equal(summary.vouchers.activeCount, 3);
  assert.deepEqual(summary.vouchers.byStatus, { active: 3, pending: 1 });
  assert.equal(summary.revenue.monthly.length, 6);
  assert.equal(summary.topVouchers.length, 2);
  assert.equal(summary.topVouchers[0]!.sold, 80);
});

test("getPartnerSummary computes month-over-month revenue growth from the monthly series", async () => {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;

  const service = new DashboardService(
    createRepository({
      getPartnerRevenueByMonth: async () => [
        { month: previousKey, revenue: "1000000" },
        { month: currentKey, revenue: "1500000" },
      ],
    }),
  );

  const summary = await service.getPartnerSummary("partner-user-1");

  assert.equal(summary.revenue.currentMonth, "1500000.00");
  assert.equal(summary.revenue.growthPercent, 50);
});

test("getPartnerSummary reports zero usage rate and null growth when there is no data yet", async () => {
  const service = new DashboardService(
    createRepository({
      getPartnerVoucherCountsByStatus: async () => [],
      getPartnerVoucherCodeCountsByStatus: async () => [],
      getPartnerOrderCount: async () => 0,
      getPartnerVoucherSoldTotal: async () => 0,
      getPartnerRevenueByMonth: async () => [],
      getPartnerTopVouchers: async () => [],
    }),
  );

  const summary = await service.getPartnerSummary("partner-user-1");

  assert.equal(summary.vouchers.usageRatePercent, 0);
  assert.equal(summary.revenue.growthPercent, null);
  assert.deepEqual(summary.topVouchers, []);
});
