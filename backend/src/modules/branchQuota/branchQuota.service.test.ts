import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../shared/errors/AppError";
import type { BranchQuotaRepository } from "./branchQuota.repository";
import { BranchQuotaService } from "./branchQuota.service";

const mockUserId = "user-123";
const mockPartnerProfileId = "partner-456";
const mockVoucherProductId = "voucher-789";
const validBranchId1 = "branch-1";
const validBranchId2 = "branch-2";

const defaultAllocation = {
    branchProfileId: validBranchId1,
    voucherProductId: mockVoucherProductId,
    totalQuantity: 100,
    soldQuantity: 10,
    branchName: "Test Branch 1",
    address: "123 Test St",
    phone: "1234567890"
};

const createRepository = (overrides: Partial<BranchQuotaRepository> = {}) =>
    ({
        getPartnerProfileIdByUserId: async (userId: string) => userId === mockUserId ? mockPartnerProfileId : null,
        getVoucherOwnershipAndStatus: async (voucherId: string, partnerId: string) => {
            if (voucherId === mockVoucherProductId && partnerId === mockPartnerProfileId) {
                return { voucherProductId: mockVoucherProductId, status: "active" };
            }
            if (voucherId === "inactive-voucher" && partnerId === mockPartnerProfileId) {
                return { voucherProductId: "inactive-voucher", status: "inactive" };
            }
            return null;
        },
        getOwnedBranches: async (branchIds: string[], partnerId: string) => {
            if (partnerId === mockPartnerProfileId) {
                return branchIds.filter(id => id === validBranchId1 || id === validBranchId2);
            }
            return [];
        },
        findAllocations: async (voucherId: string) => {
            if (voucherId === mockVoucherProductId) return [defaultAllocation];
            return [];
        },
        findAllocation: async (voucherId: string, branchId: string) => {
            if (voucherId === mockVoucherProductId && branchId === validBranchId1) return defaultAllocation;
            return null;
        },
        bulkAllocate: async (allocations: Record<string, unknown>[]) => {
            return allocations.map(a => ({ ...a, soldQuantity: 0 }));
        },
        updateAllocation: async (voucherId: string, branchId: string, totalQuantity: number) => {
            if (voucherId === mockVoucherProductId && branchId === validBranchId1) {
                return { ...defaultAllocation, totalQuantity };
            }
            return null;
        },
        revokeAllocation: async (voucherId: string, branchId: string) => {
            if (voucherId === mockVoucherProductId && branchId === validBranchId1) {
                return { ...defaultAllocation, totalQuantity: defaultAllocation.soldQuantity };
            }
            return null;
        },
        deleteAllocation: async (voucherId: string, branchId: string) => {
            if (voucherId === mockVoucherProductId && branchId === validBranchId1) {
                return defaultAllocation;
            }
            return null;
        },
        ...overrides,
    }) as unknown as BranchQuotaRepository;

// 1. verifyOwnership (Implicitly tested)
test("methods throw 404 if partner profile is not found", async () => {
    const service = new BranchQuotaService(createRepository());
    
    await assert.rejects(
        service.getAllocations("wrong-user", mockVoucherProductId),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Partner profile not found"
    );
});

test("methods throw 403 if voucher is not owned by partner", async () => {
    const service = new BranchQuotaService(createRepository());
    
    await assert.rejects(
        service.getAllocations(mockUserId, "wrong-voucher"),
        (err: unknown) => err instanceof AppError && err.statusCode === 403 && err.message === "Voucher does not exist or does not belong to this partner"
    );
});

// 2. allocateVouchers
test("allocateVouchers successfully allocates and calculates remainingQuantity", async () => {
    const service = new BranchQuotaService(createRepository());
    const result = await service.allocateVouchers(mockUserId, mockVoucherProductId, [
        { branchProfileId: validBranchId1, totalQuantity: 50 },
        { branchProfileId: validBranchId2, totalQuantity: 30 }
    ]);
    
    assert.equal(result.hasConflicts, false);
    assert.equal(result.inserted.length, 2);
    assert.equal(result.inserted[0]!.remainingQuantity, 50); // 50 - 0 = 50
    assert.equal(result.inserted[1]!.remainingQuantity, 30);
});

test("allocateVouchers skips unowned branches without triggering hasConflicts", async () => {
    const service = new BranchQuotaService(createRepository());
    const result = await service.allocateVouchers(mockUserId, mockVoucherProductId, [
        { branchProfileId: validBranchId1, totalQuantity: 50 },
        { branchProfileId: "invalid-branch", totalQuantity: 30 }
    ]);
    
    assert.equal(result.hasConflicts, false); // No DB conflict among the valid ones
    assert.equal(result.inserted.length, 1);
    assert.equal(result.inserted[0]!.branchProfileId, validBranchId1);
});

test("allocateVouchers throws 400 if voucher is not active", async () => {
    const service = new BranchQuotaService(createRepository());
    
    await assert.rejects(
        service.allocateVouchers(mockUserId, "inactive-voucher", [{ branchProfileId: validBranchId1, totalQuantity: 50 }]),
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message === "Only active vouchers can be allocated to branches"
    );
});

test("allocateVouchers throws 403 if no branches belong to partner", async () => {
    const service = new BranchQuotaService(createRepository());
    
    await assert.rejects(
        service.allocateVouchers(mockUserId, mockVoucherProductId, [{ branchProfileId: "invalid-branch", totalQuantity: 50 }]),
        (err: unknown) => err instanceof AppError && err.statusCode === 403 && err.message === "None of the provided branches belong to this partner"
    );
});

// 3. getAllocations
test("getAllocations correctly retrieves and maps remainingQuantity", async () => {
    const service = new BranchQuotaService(createRepository());
    const result = await service.getAllocations(mockUserId, mockVoucherProductId);
    
    assert.equal(result.length, 1);
    assert.equal(result[0]!.branchProfileId, validBranchId1);
    assert.equal(result[0]!.remainingQuantity, 90); // 100 - 10 = 90
});

// 4. updateAllocation
test("updateAllocation successfully updates and returns remainingQuantity", async () => {
    const service = new BranchQuotaService(createRepository());
    const result = await service.updateAllocation(mockUserId, mockVoucherProductId, validBranchId1, 200);
    
    assert.equal(result.totalQuantity, 200);
    assert.equal(result.soldQuantity, 10);
    assert.equal(result.remainingQuantity, 190);
});

test("updateAllocation throws 404 if existing allocation not found", async () => {
    const service = new BranchQuotaService(createRepository());
    
    await assert.rejects(
        service.updateAllocation(mockUserId, mockVoucherProductId, "non-existent-branch", 200),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Allocation not found"
    );
});

test("updateAllocation throws 400 if totalQuantity < soldQuantity", async () => {
    const service = new BranchQuotaService(createRepository());
    
    await assert.rejects(
        service.updateAllocation(mockUserId, mockVoucherProductId, validBranchId1, 5), // existing sold is 10
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message.includes("Total quantity cannot be less than sold quantity")
    );
});

test("updateAllocation throws 409 if update fails due to race condition", async () => {
    const repository = createRepository({
        updateAllocation: async () => null // Simulating DB safety lock trigger
    });
    const service = new BranchQuotaService(repository);
    
    await assert.rejects(
        service.updateAllocation(mockUserId, mockVoucherProductId, validBranchId1, 200),
        (err: unknown) => err instanceof AppError && err.statusCode === 409 && err.message.includes("Failed to update allocation")
    );
});

// 5. deleteAllocation
test("deleteAllocation performs smart revoke if soldQuantity > 0 and total > sold", async () => {
    const service = new BranchQuotaService(createRepository());
    
    const result = await service.deleteAllocation(mockUserId, mockVoucherProductId, validBranchId1); // total 100, sold 10
    assert.equal(result.action, "updated");
});

test("deleteAllocation returns updated immediately if totalQuantity === soldQuantity", async () => {
    const repository = createRepository({
        findAllocation: async () => ({ ...defaultAllocation, totalQuantity: 10, soldQuantity: 10 })
    });
    const service = new BranchQuotaService(repository);
    
    const result = await service.deleteAllocation(mockUserId, mockVoucherProductId, validBranchId1);
    assert.equal(result.action, "updated");
});

test("deleteAllocation hard deletes if soldQuantity === 0", async () => {
    const repository = createRepository({
        findAllocation: async () => ({ ...defaultAllocation, soldQuantity: 0 })
    });
    const service = new BranchQuotaService(repository);
    
    const result = await service.deleteAllocation(mockUserId, mockVoucherProductId, validBranchId1);
    assert.equal(result.action, "deleted");
});

test("deleteAllocation throws 404 if allocation not found", async () => {
    const service = new BranchQuotaService(createRepository());
    
    await assert.rejects(
        service.deleteAllocation(mockUserId, mockVoucherProductId, "non-existent-branch"),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Allocation not found"
    );
});
