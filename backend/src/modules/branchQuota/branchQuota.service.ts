import { branchQuotaRepository } from "./branchQuota.repository";
import { AppError } from "../../shared/errors/AppError";

type BranchAllocationInput = {
    branchProfileId: string;
    totalQuantity: number;
};

export class BranchQuotaService {
    private async verifyOwnership(userId: string, voucherProductId: string) {
        const partnerProfileId = await branchQuotaRepository.getPartnerProfileIdByUserId(userId);
        if (!partnerProfileId) {
            throw new AppError("Partner profile not found", 404);
        }

        const voucher = await branchQuotaRepository.getVoucherOwnershipAndStatus(voucherProductId, partnerProfileId);
        if (!voucher) {
            throw new AppError("Voucher does not exist or does not belong to this partner", 403);
        }
        return { partnerProfileId, voucherStatus: voucher.status };
    }

    async allocateVouchers(userId: string, voucherProductId: string, allocations: BranchAllocationInput[]) {
        const { partnerProfileId, voucherStatus } = await this.verifyOwnership(userId, voucherProductId);

        if (voucherStatus !== 'active') {
            throw new AppError("Only active vouchers can be allocated to branches", 400);
        }

        const branchIds = allocations.map(a => a.branchProfileId);
        const ownedBranchIds = await branchQuotaRepository.getOwnedBranches(branchIds, partnerProfileId);
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

        const inserted = await branchQuotaRepository.bulkAllocate(dataToInsert);

        const insertedWithRemaining = inserted.map(i => ({
            ...i,
            remainingQuantity: i.totalQuantity - i.soldQuantity
        }));

        return {
            inserted: insertedWithRemaining,
            hasConflicts: inserted.length < validAllocations.length
        };
    }

    async getAllocations(userId: string, voucherProductId: string) {
        await this.verifyOwnership(userId, voucherProductId);

        const allocations = await branchQuotaRepository.findAllocations(voucherProductId);
        
        return allocations.map(a => ({
            ...a,
            remainingQuantity: a.totalQuantity - a.soldQuantity
        }));
    }

    async updateAllocation(userId: string, voucherProductId: string, branchProfileId: string, totalQuantity: number) {
        await this.verifyOwnership(userId, voucherProductId);

        const existing = await branchQuotaRepository.findAllocation(voucherProductId, branchProfileId);
        if (!existing) {
            throw new AppError("Allocation not found", 404);
        }

        if (totalQuantity < existing.soldQuantity) {
            throw new AppError(`Total quantity cannot be less than sold quantity (${existing.soldQuantity})`, 400);
        }

        const updated = await branchQuotaRepository.updateAllocation(voucherProductId, branchProfileId, totalQuantity);
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

        const existing = await branchQuotaRepository.findAllocation(voucherProductId, branchProfileId);
        if (!existing) {
            throw new AppError("Allocation not found", 404);
        }

        if (existing.soldQuantity > 0) {
            if (existing.totalQuantity === existing.soldQuantity) {
                // Already revoked or fully sold, no need to update
                return { action: "updated" };
            }
            // Smart Revoke: atomic DB-side update totalQuantity = soldQuantity
            await branchQuotaRepository.revokeAllocation(voucherProductId, branchProfileId);
            return { action: "updated" };
        } else {
            // Can safely hard delete
            await branchQuotaRepository.deleteAllocation(voucherProductId, branchProfileId);
            return { action: "deleted" };
        }
    }
}

export const branchQuotaService = new BranchQuotaService();
