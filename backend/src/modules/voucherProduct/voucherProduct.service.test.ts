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
        status: "pending",
        rejectionReason: null,
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
  assert.equal(result.voucher?.status, "pending");
});

test("partner edits reset an active voucher to pending for re-approval", async () => {
  const activeVoucher = { ...voucher, status: "active" as const };
  const repository = createRepository({
    findByIdAndPartnerProfileId: async () => activeVoucher,
    updateByPartnerProfileId: async (_id, _profileId, updates) => {
      assert.equal(updates.status, "pending");
      assert.equal(updates.rejectionReason, null);
      return { ...activeVoucher, ...updates };
    },
  });
  const service = new VoucherProductService(repository);

  const result = await service.updatePartnerVoucher(
    partnerUserId,
    voucherProductId,
    { discountValue: "30" },
  );

  assert.equal(result.voucher?.status, "pending");
  assert.equal(result.voucher?.discountValue, "30");
});

test("updatePartnerVoucher validates partial dates against existing voucher", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.updatePartnerVoucher(partnerUserId, voucherProductId, {
      startDate: "2026-10-01T00:00:00.000Z",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "startDate must be before endDate",
  );
});

test("updatePartnerVoucher validates partial limits against existing voucher", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.updatePartnerVoucher(partnerUserId, voucherProductId, {
      minLimit: 10,
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "maxLimit must be greater than or equal to minLimit",
  );
});

test("createVoucher rejects a direct discount that consumes the entire original price", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.createVoucher(partnerUserId, {
      ...createInput,
      originalPrice: "100000",
      discountType: "direct",
      discountValue: "100000",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message ===
        "The discounted sale price must be greater than 0 and less than originalPrice",
  );
});

test("createVoucher rejects a percentage discount of 100 or more", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.createVoucher(partnerUserId, {
      ...createInput,
      discountType: "percentage",
      discountValue: "100",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "discountValue must be less than 100 for a percentage discount",
  );
});

test("createVoucher rejects a zero discountValue", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.createVoucher(partnerUserId, {
      ...createInput,
      discountValue: "0",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "discountValue must be greater than 0",
  );
});

test("updatePartnerVoucher rejects an update that would drop the sale price to 0", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.updatePartnerVoucher(partnerUserId, voucherProductId, {
      discountType: "direct",
      discountValue: "100000",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message ===
        "The discounted sale price must be greater than 0 and less than originalPrice",
  );
});

test("createVoucher rejects empty numeric strings before DB write", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.createVoucher(partnerUserId, {
      ...createInput,
      originalPrice: "",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "originalPrice must be a non-negative number",
  );
});

test("updatePartnerVoucher rejects invalid field types with 400", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.updatePartnerVoucher(partnerUserId, voucherProductId, {
      title: 123,
    } as unknown as { title: string }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "title must be a string",
  );
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

test("updatePartnerVoucherStatus lets a partner suspend their own active voucher", async () => {
  const activeVoucher = { ...voucher, status: "active" as const };
  const inactiveVoucher = { ...voucher, status: "inactive" as const };
  const repository = createRepository({
    findByIdAndPartnerProfileId: async () => activeVoucher,
    updateStatus: async (id, status, rejectionReason) => {
      assert.equal(id, voucherProductId);
      assert.equal(status, "inactive");
      assert.equal(rejectionReason, null);
      return inactiveVoucher;
    },
  });
  const service = new VoucherProductService(repository);

  const result = await service.updatePartnerVoucherStatus(
    partnerUserId,
    voucherProductId,
    "inactive",
  );

  assert.equal(result.voucher?.status, "inactive");
});

test("updatePartnerVoucherStatus lets a partner reactivate their own inactive voucher", async () => {
  const inactiveVoucher = { ...voucher, status: "inactive" as const };
  const repository = createRepository({
    findByIdAndPartnerProfileId: async () => inactiveVoucher,
  });
  const service = new VoucherProductService(repository);

  await assert.doesNotReject(
    service.updatePartnerVoucherStatus(partnerUserId, voucherProductId, "active"),
  );
});

test("updatePartnerVoucherStatus rejects status values other than active/inactive", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.updatePartnerVoucherStatus(partnerUserId, voucherProductId, "rejected"),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "Partners can only set status to active or inactive",
  );
});

test("updatePartnerVoucherStatus rejects self-approving a pending voucher", async () => {
  const repository = createRepository({
    findByIdAndPartnerProfileId: async () => voucher, // status: "pending"
  });
  const service = new VoucherProductService(repository);

  await assert.rejects(
    service.updatePartnerVoucherStatus(partnerUserId, voucherProductId, "active"),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "Cannot change status while voucher is pending",
  );
});

test("updatePartnerVoucherStatus throws 404 for voucher outside partner ownership", async () => {
  const repository = createRepository({
    findByIdAndPartnerProfileId: async () => null,
  });
  const service = new VoucherProductService(repository);

  await assert.rejects(
    service.updatePartnerVoucherStatus(partnerUserId, voucherProductId, "active"),
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
        partnerProfileId: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minDiscountPercent: undefined,
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

test("getVouchers passes price/discount/partner filters through to the repository", async () => {
  const partnerId = "00000000-0000-4000-8000-000000000009";
  const repository = createRepository({
    findAll: async (options) => {
      assert.equal(options.partnerProfileId, partnerId);
      assert.equal(options.minPrice, 50000);
      assert.equal(options.maxPrice, 200000);
      assert.equal(options.minDiscountPercent, 10);
      return { vouchers: [voucher], total: 1 };
    },
  });
  const service = new VoucherProductService(repository);

  await service.getVouchers({
    partnerProfileId: partnerId,
    minPrice: 50000,
    maxPrice: 200000,
    minDiscountPercent: 10,
  });
});

test("getVouchers rejects minPrice greater than maxPrice", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.getVouchers({ minPrice: 200000, maxPrice: 50000 }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "minPrice must be less than or equal to maxPrice",
  );
});

test("public voucher listing rejects non-active status filters", async () => {
  const service = new VoucherProductService(createRepository());

  await assert.rejects(
    service.getVouchers({ status: "pending" }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === "Public voucher listing only supports active status",
  );
});

test("public voucher listing defaults to active status", async () => {
  const repository = createRepository({
    findAll: async (options) => {
      assert.equal(options.status, "active");
      return { vouchers: [{ ...voucher, status: "active" }], total: 1 };
    },
  });
  const service = new VoucherProductService(repository);

  const result = await service.getVouchers();

  assert.equal(result.vouchers[0]?.status, "active");
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

test("getVoucherById hides non-active vouchers from public callers", async () => {
  const service = new VoucherProductService(createRepository());

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
