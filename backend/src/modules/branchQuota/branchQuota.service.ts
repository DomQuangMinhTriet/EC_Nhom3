import { BranchQuotaRepository } from "./branchQuota.repository";
import { AppError } from "../../shared/errors/AppError";

export type BranchAllocationInput = {
    branchProfileId: string;
    totalQuantity: number;
};

export type BranchAllocationListInput = {
    page?: number;
    pageSize?: number;
};

export class BranchQuotaService {
    constructor(private readonly branchQuotaRepository = new BranchQuotaRepository()) {}

    private async verifyOwnership(userId: string, voucherProductId: string) {
        const partnerProfileId = await this.branchQuotaRepository.getPartnerProfileIdByUserId(userId);
        if (!partnerProfileId) {
            throw new AppError("Partner profile not found", 404);
        }

        const voucher = await this.branchQuotaRepository.getVoucherOwnershipAndStatus(voucherProductId, partnerProfileId);
        if (!voucher) {
            throw new AppError("Voucher does not exist or does not belong to this partner", 403);
        }
        return { partnerProfileId, voucherStatus: voucher.status };
    }

    async getPublicAllocations(voucherProductId: string) {
        const isActive = await this.branchQuotaRepository.isVoucherActive(voucherProductId);
        if (!isActive) {
            throw new AppError("Voucher not found", 404);
        }

        const allocations = await this.branchQuotaRepository.findAllocationsPublic(voucherProductId);

        return allocations.map((allocation) => ({
            branchProfileId: allocation.branchProfileId,
            branchName: allocation.branchName,
            address: allocation.address,
            remainingQuantity: Math.max(0, allocation.totalQuantity - allocation.soldQuantity),
        }));
    }

    async allocateVouchers(userId: string, voucherProductId: string, allocations: BranchAllocationInput[]) {
        const { partnerProfileId, voucherStatus } = await this.verifyOwnership(userId, voucherProductId);

        if (voucherStatus !== 'active') {
            throw new AppError("Only active vouchers can be allocated to branches", 400);
        }

        const branchIds = allocations.map(a => a.branchProfileId);
        const ownedBranchIds = await this.branchQuotaRepository.getOwnedBranches(branchIds, partnerProfileId);
        const ownedBranchIdSet = new Set(ownedBranchIds);

        // Filter out branches that don't belong to the partner (Fail one, not all)
        const validAllocations = allocations.filter(a => ownedBranchIdSet.has(a.branchProfileId));
        
        if (validAllocations.length === 0) {
            throw new AppError("None of the provided branches belong to this partner", 403);
        }

        const dataToInsert = validAllocations.map(a => ({
            voucherProductId,
            branchProfileId: a.branchProfileId,
            totalQuantity: a.totalQuantity
        }));

        const inserted = await this.branchQuotaRepository.bulkAllocate(dataToInsert);

        const insertedWithRemaining = inserted.map(i => ({
            ...i,
            remainingQuantity: i.totalQuantity - i.soldQuantity
        }));

        return {
            inserted: insertedWithRemaining,
            hasConflicts: inserted.length < validAllocations.length
        };
    }

    async getAllocations(userId: string, voucherProductId: string, input: BranchAllocationListInput = {}) {
        await this.verifyOwnership(userId, voucherProductId);

        const page = Math.max(1, input.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
        const { data, total } = await this.branchQuotaRepository.findAllocations(voucherProductId, page, pageSize);
        
        const allocations = data.map(a => ({
            ...a,
            remainingQuantity: a.totalQuantity - a.soldQuantity
        }));

        return {
            data: allocations,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }

    async updateAllocation(userId: string, voucherProductId: string, branchProfileId: string, totalQuantity: number) {
        await this.verifyOwnership(userId, voucherProductId);

        const existing = await this.branchQuotaRepository.findAllocation(voucherProductId, branchProfileId);
        if (!existing) {
            throw new AppError("Allocation not found", 404);
        }

        if (totalQuantity < existing.soldQuantity) {
            throw new AppError(`Total quantity cannot be less than sold quantity (${existing.soldQuantity})`, 400);
        }

        const updated = await this.branchQuotaRepository.updateAllocation(voucherProductId, branchProfileId, totalQuantity);
        if (!updated) {
            throw new AppError(`Failed to update allocation. It may have been deleted, or the requested quantity is less than the current sold quantity due to concurrent sales.`, 409);
        }

        return {
            ...updated,
            remainingQuantity: updated.totalQuantity - updated.soldQuantity
        };
    }

    async deleteAllocation(userId: string, voucherProductId: string, branchProfileId: string) {
        await this.verifyOwnership(userId, voucherProductId);

        const existing = await this.branchQuotaRepository.findAllocation(voucherProductId, branchProfileId);
        if (!existing) {
            throw new AppError("Allocation not found", 404);
        }

        if (existing.soldQuantity > 0) {
            if (existing.totalQuantity === existing.soldQuantity) {
                // Already revoked or fully sold, no need to update
                return { action: "updated" };
            }
            // Smart Revoke: atomic DB-side update totalQuantity = soldQuantity
            await this.branchQuotaRepository.revokeAllocation(voucherProductId, branchProfileId);
            return { action: "updated" };
        } else {
            // Can safely hard delete
            await this.branchQuotaRepository.deleteAllocation(voucherProductId, branchProfileId);
            return { action: "deleted" };
        }
    }
}
