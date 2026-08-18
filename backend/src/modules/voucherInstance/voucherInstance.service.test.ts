import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../shared/errors/AppError";
import { VoucherInstanceService } from "./voucherInstance.service";
import type { VoucherInstanceRepository } from "./voucherInstance.repository";

// Mocks
const mockUserId = "u-123";
const mockCustomerProfileId = "cp-123";
const mockVoucherCodeId = "vc-123";

const mockVoucher = {
    voucherCodeId: mockVoucherCodeId,
    code: "SECRET-CODE-123",
    qr: "some-qr-payload",
    status: "available" as const,
    expiredAt: new Date(),
    createdAt: new Date(),
    usedAt: null,
    voucherProduct: {
        voucherProductId: "vp-123",
        title: "Test Voucher",
        imageUrl: null,
        originalPrice: "1000",
        discountType: "percentage" as const,
        discountValue: "10"
    }
};

function createRepository(overrides?: Partial<VoucherInstanceRepository>): VoucherInstanceRepository {
    return {
        getCustomerProfileIdByUserId: async () => mockCustomerProfileId,
        getVouchers: async () => [mockVoucher],
        getVoucherByIdAndOwner: async () => mockVoucher,
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
    const service = new VoucherInstanceService(createRepository({
        getCustomerProfileIdByUserId: async () => null
    }));

    await assert.rejects(
        service.getMyVouchers(mockUserId),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Customer profile not found"
    );
});

test("getVoucherDetail successfully returns voucher with QR code data URI", async () => {
    const service = new VoucherInstanceService(createRepository());

    const result = await service.getVoucherDetail(mockUserId, mockVoucherCodeId);
    assert.equal(result.voucherCodeId, mockVoucherCodeId);
    assert.ok(result.qrDataUri.startsWith("data:image/png;base64,"));
});

test("getVoucherDetail throws 404 if voucher does not exist or doesn't belong to owner", async () => {
    const service = new VoucherInstanceService(createRepository({
        getVoucherByIdAndOwner: async () => null
    }));

    await assert.rejects(
        service.getVoucherDetail(mockUserId, mockVoucherCodeId),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Voucher not found"
    );
});
