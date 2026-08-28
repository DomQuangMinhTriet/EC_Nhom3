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
