import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../shared/errors/AppError";
import { VoucherInstanceService } from "./voucherInstance.service";
import type { VoucherInstanceRepository } from "./voucherInstance.repository";

// Mocks
const mockUserId = "u-123";
const mockBranchUserId = "branch-user-123";
const mockCustomerProfileId = "cp-123";
const mockBranchProfileId = "bp-123";
const mockVoucherCodeId = "vc-123";
const mockVoucherProductId = "vp-123";
const futureDate = new Date("2099-01-01T00:00:00.000Z");
const pastDate = new Date("2020-01-01T00:00:00.000Z");

const mockVoucher = {
  voucherCodeId: mockVoucherCodeId,
  code: "SECRET-CODE-123",
  status: "available" as const,
  expiredAt: futureDate,
  createdAt: new Date(),
  usedAt: null,
  voucherProduct: {
    voucherProductId: mockVoucherProductId,
    title: "Test Voucher",
    imageUrl: null,
    originalPrice: "1000",
    discountType: "percentage" as const,
    discountValue: "10",
  },
};

const mockRedeemVoucher = {
  ...mockVoucher,
  voucherProductId: mockVoucherProductId,
  customerProfileId: mockCustomerProfileId,
  customer: {
    customerProfileId: mockCustomerProfileId,
    fullName: "Nguyen Van A",
    phone: "0900000000",
  },
};

function createRepository(
  overrides?: Partial<VoucherInstanceRepository>,
): VoucherInstanceRepository {
  return {
    getCustomerProfileIdByUserId: async () => mockCustomerProfileId,
    getBranchProfileIdByUserId: async () => mockBranchProfileId,
    getVouchers: async () => [mockVoucher],
    getVoucherByIdAndOwner: async () => mockVoucher,
    getVoucherByCodeForRedemption: async () => mockRedeemVoucher,
    hasBranchVoucherAllocation: async () => true,
    redeemVoucherCode: async () => ({
      ...mockRedeemVoucher,
      status: "used",
      usedAt: new Date(),
    }),
    ...overrides,
  } as unknown as VoucherInstanceRepository;
}

test("getMyVouchers successfully returns vouchers", async () => {
  const service = new VoucherInstanceService(createRepository());

  const result = await service.getMyVouchers(mockUserId);
  assert.equal(result.length, 1);
  assert.equal(result[0]!.voucherCodeId, mockVoucherCodeId);
});

test("getMyVouchers throws 404 if customer profile not found", async () => {
  const service = new VoucherInstanceService(
    createRepository({
      getCustomerProfileIdByUserId: async () => null,
    }),
  );

  await assert.rejects(
    service.getMyVouchers(mockUserId),
    (err: unknown) =>
      err instanceof AppError &&
      err.statusCode === 404 &&
      err.message === "Customer profile not found",
  );
});

test("getVoucherDetail successfully returns voucher with QR code data URI", async () => {
  const service = new VoucherInstanceService(createRepository());

  const result = await service.getVoucherDetail(mockUserId, mockVoucherCodeId);
  assert.equal(result.voucherCodeId, mockVoucherCodeId);
  assert.ok(result.qrDataUri.startsWith("data:image/png;base64,"));
});

test("getVoucherDetail throws 404 if voucher does not exist or doesn't belong to owner", async () => {
  const service = new VoucherInstanceService(
    createRepository({
      getVoucherByIdAndOwner: async () => null,
    }),
  );

  await assert.rejects(
    service.getVoucherDetail(mockUserId, mockVoucherCodeId),
    (err: unknown) =>
      err instanceof AppError &&
      err.statusCode === 404 &&
      err.message === "Voucher not found",
  );
});

test("lookupVoucherForRedemption returns redeemable voucher for an allocated branch", async () => {
  const service = new VoucherInstanceService(createRepository());

  const result = await service.lookupVoucherForRedemption(
    mockBranchUserId,
    mockVoucher.code,
  );

  assert.equal(result.voucherCodeId, mockVoucherCodeId);
  assert.equal(result.redeemable, true);
  assert.equal(result.reason, null);
});

test("lookupVoucherForRedemption returns expired reason for expired voucher", async () => {
  const service = new VoucherInstanceService(
    createRepository({
      getVoucherByCodeForRedemption: async () => ({
        ...mockRedeemVoucher,
        expiredAt: pastDate,
      }),
    }),
  );

  const result = await service.lookupVoucherForRedemption(
    mockBranchUserId,
    mockVoucher.code,
  );

  assert.equal(result.redeemable, false);
  assert.equal(result.reason, "Voucher has expired");
});

test("lookupVoucherForRedemption treats usedAt as already redeemed", async () => {
  const service = new VoucherInstanceService(
    createRepository({
      getVoucherByCodeForRedemption: async () => ({
        ...mockRedeemVoucher,
        status: "available",
        usedAt: new Date(),
      }),
    }),
  );

  const result = await service.lookupVoucherForRedemption(
    mockBranchUserId,
    mockVoucher.code,
  );

  assert.equal(result.redeemable, false);
  assert.equal(result.reason, "Voucher has already been used");
});

test("lookupVoucherForRedemption throws 403 if voucher is not allocated to branch", async () => {
  const service = new VoucherInstanceService(
    createRepository({
      hasBranchVoucherAllocation: async () => false,
    }),
  );

  await assert.rejects(
    service.lookupVoucherForRedemption(mockBranchUserId, mockVoucher.code),
    (err: unknown) =>
      err instanceof AppError &&
      err.statusCode === 403 &&
      err.message === "Voucher cannot be redeemed at this branch",
  );
});

test("redeemVoucher marks an available voucher used for the branch", async () => {
  let capturedCode: string | undefined;
  let capturedAllocationBranchProfileId: string | undefined;
  const service = new VoucherInstanceService(
    createRepository({
      hasBranchVoucherAllocation: async (branchProfileId) => {
        capturedAllocationBranchProfileId = branchProfileId;
        return true;
      },
      redeemVoucherCode: async (code) => {
        capturedCode = code;
        return {
          ...mockRedeemVoucher,
          status: "used",
          usedAt: new Date(),
        };
      },
    }),
  );

  const result = await service.redeemVoucher(
    mockBranchUserId,
    mockVoucher.code,
  );

  assert.equal(capturedCode, mockVoucher.code);
  assert.equal(capturedAllocationBranchProfileId, mockBranchProfileId);
  assert.equal(result.status, "used");
  assert.equal(result.redeemable, false);
  assert.equal(result.reason, null);
  assert.ok(result.usedAt instanceof Date);
});

test("redeemVoucher throws 400 when voucher was already used", async () => {
  const service = new VoucherInstanceService(
    createRepository({
      getVoucherByCodeForRedemption: async () => ({
        ...mockRedeemVoucher,
        status: "used",
        usedAt: new Date(),
      }),
    }),
  );

  await assert.rejects(
    service.redeemVoucher(mockBranchUserId, mockVoucher.code),
    (err: unknown) =>
      err instanceof AppError &&
      err.statusCode === 400 &&
      err.message === "Voucher has already been used",
  );
});

test("redeemVoucher throws 409 if voucher changes before update", async () => {
  const service = new VoucherInstanceService(
    createRepository({
      redeemVoucherCode: async () => null,
    }),
  );

  await assert.rejects(
    service.redeemVoucher(mockBranchUserId, mockVoucher.code),
    (err: unknown) =>
      err instanceof AppError &&
      err.statusCode === 409 &&
      err.message === "Voucher is no longer redeemable",
  );
});
