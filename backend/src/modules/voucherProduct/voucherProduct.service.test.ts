import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../shared/errors/AppError";
import type { VoucherProductRepository } from "./voucherProduct.repository";
import { VoucherProductService } from "./voucherProduct.service";

const partnerUserId = "00000000-0000-4000-8000-000000000001";
const partnerProfileId = "00000000-0000-4000-8000-000000000002";
const categoryId = "00000000-0000-4000-8000-000000000003";
const voucherProductId = "00000000-0000-4000-8000-000000000004";

const voucher = {
  voucherProductId,
  categoryId,
  partnerProfileId,
  title: "Eco Coffee",
  description: "Discount for coffee",
  originalPrice: "100000.00",
  discountType: "percentage" as const,
  discountValue: "20.00",
  startDate: new Date("2026-08-20T00:00:00.000Z"),
  endDate: new Date("2026-09-20T00:00:00.000Z"),
  validDurationDays: 30,
  minLimit: 1,
  maxLimit: 5,
  imageUrl: "https://example.com/voucher.png",
  status: "pending" as const,
  rejectionReason: null,
  createdAt: new Date("2026-08-18T00:00:00.000Z"),
  updatedAt: new Date("2026-08-18T00:00:00.000Z"),
};

const createInput = {
  categoryId,
  title: " Eco Coffee ",
  description: " Discount for coffee ",
  originalPrice: "100000",
  discountType: "percentage" as const,
  discountValue: "20",
  startDate: "2026-08-20T00:00:00.000Z",
  endDate: "2026-09-20T00:00:00.000Z",
  validDurationDays: 30,
  minLimit: 1,
  maxLimit: 5,
  imageUrl: " https://example.com/voucher.png ",
};

const createRepository = (
  overrides: Partial<VoucherProductRepository> = {},
) =>
  ({
    findPartnerProfileIdByUserId: async () => partnerProfileId,
    findCategoryById: async () => ({ categoryId }),
    create: async () => voucher,
    findByPartnerProfileId: async () => [voucher],
    findById: async () => voucher,
    findByIdAndPartnerProfileId: async () => voucher,
    findAll: async () => ({ vouchers: [voucher], total: 1 }),
    updateByPartnerProfileId: async () => voucher,
    updateStatus: async () => voucher,
    ...overrides,
  }) as unknown as VoucherProductRepository;

test("creates voucher with pending status regardless of client intent", async () => {
  const repository = createRepository({
    create: async (data) => {
      assert.equal(data.partnerProfileId, partnerProfileId);
      assert.equal(data.status, "pending");
      assert.equal(data.title, "Eco Coffee");
      assert.equal(data.description, "Discount for coffee");
      assert.equal(data.imageUrl, "https://example.com/voucher.png");
      return { ...voucher, ...data };
    },
  });
  const service = new VoucherProductService(repository);

  const result = await service.createVoucher(partnerUserId, {
    ...createInput,
    status: "active",
  } as typeof createInput & { status: string });

  assert.equal(result.voucher?.status, "pending");
});

test("createVoucher throws 404 if partner profile is missing", async () => {
  const service = new VoucherProductService(
    createRepository({
      findPartnerProfileIdByUserId: async () => null,
    }),
  );

  await assert.rejects(
    service.createVoucher(partnerUserId, createInput),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "Partner profile not found",
  );
});

test("createVoucher throws 404 if category is missing", async () => {
  const service = new VoucherProductService(
    createRepository({
      findCategoryById: async () => null,
    }),
  );

  await assert.rejects(
    service.createVoucher(partnerUserId, createInput),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "Category not found",
  );
});

test("createVoucher validates date and limit rules", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.createVoucher(partnerUserId, {
      ...createInput,
      startDate: "2026-09-20T00:00:00.000Z",
      endDate: "2026-08-20T00:00:00.000Z",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "startDate must be before endDate",
  );

  await assert.rejects(
    service.createVoucher(partnerUserId, {
      ...createInput,
      minLimit: 5,
      maxLimit: 1,
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "maxLimit must be greater than or equal to minLimit",
  );
});

test("gets all vouchers for current partner", async () => {
  const repository = createRepository({
    findByPartnerProfileId: async (profileId) => {
      assert.equal(profileId, partnerProfileId);
      return [voucher];
    },
  });
  const service = new VoucherProductService(repository);

  const result = await service.getPartnerVouchers(partnerUserId);

  assert.equal(result.vouchers.length, 1);
  assert.equal(result.vouchers[0]?.partnerProfileId, partnerProfileId);
});

test("updates only partner-owned voucher fields", async () => {
  const repository = createRepository({
    updateByPartnerProfileId: async (id, profileId, updates) => {
      assert.equal(id, voucherProductId);
      assert.equal(profileId, partnerProfileId);
      assert.deepEqual(updates, {
        title: "Updated Voucher",
        maxLimit: null,
      });
      return { ...voucher, ...updates };
    },
  });
  const service = new VoucherProductService(repository);

  const result = await service.updatePartnerVoucher(
    partnerUserId,
    voucherProductId,
    {
      title: " Updated Voucher ",
      maxLimit: null,
    },
  );

  assert.equal(result.voucher?.title, "Updated Voucher");
});

test("updatePartnerVoucher throws 404 for voucher outside partner ownership", async () => {
  const service = new VoucherProductService(
    createRepository({
      findByIdAndPartnerProfileId: async () => null,
    }),
  );

  await assert.rejects(
    service.updatePartnerVoucher(partnerUserId, voucherProductId, {
      title: "Updated Voucher",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "Voucher not found",
  );
});

test("getVouchers returns paginated system vouchers", async () => {
  const repository = createRepository({
    findAll: async (options) => {
      assert.deepEqual(options, {
        page: 2,
        pageSize: 10,
        categoryId,
        status: "active",
        search: "coffee",
      });
      return { vouchers: [voucher], total: 21 };
    },
  });
  const service = new VoucherProductService(repository);

  const result = await service.getVouchers({
    page: 2,
    pageSize: 10,
    categoryId,
    status: "active",
    search: " coffee ",
  });

  assert.equal(result.pagination.total, 21);
  assert.equal(result.pagination.totalPages, 3);
});

test("getVoucherById throws 404 if voucher is missing", async () => {
  const service = new VoucherProductService(
    createRepository({
      findById: async () => null,
    }),
  );

  await assert.rejects(
    service.getVoucherById(voucherProductId),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.message === "Voucher not found",
  );
});

test("admin updates voucher status to active", async () => {
  const repository = createRepository({
    updateStatus: async (id, status, rejectionReason) => {
      assert.equal(id, voucherProductId);
      assert.equal(status, "active");
      assert.equal(rejectionReason, null);
      return { ...voucher, status, rejectionReason };
    },
  });
  const service = new VoucherProductService(repository);

  const result = await service.updateVoucherStatus(voucherProductId, {
    status: "active",
  });

  assert.equal(result.message, "Voucher status updated successfully.");
  assert.equal(result.voucher?.status, "active");
});

test("admin rejection requires reason", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.updateVoucherStatus(voucherProductId, { status: "rejected" }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "Rejection reason is required when rejecting a voucher",
  );
});

test("admin updates voucher status to rejected with reason", async () => {
  const repository = createRepository({
    updateStatus: async (id, status, rejectionReason) => {
      assert.equal(id, voucherProductId);
      assert.equal(status, "rejected");
      assert.equal(rejectionReason, "Missing policy");
      return { ...voucher, status, rejectionReason };
    },
  });
  const service = new VoucherProductService(repository);

  const result = await service.updateVoucherStatus(voucherProductId, {
    status: "rejected",
    rejectionReason: " Missing policy ",
  });

  assert.equal(result.voucher?.status, "rejected");
  assert.equal(result.voucher?.rejectionReason, "Missing policy");
});
