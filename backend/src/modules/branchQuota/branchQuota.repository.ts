import { db } from "../../db/client";
import { branchVoucherProduct, partnerProfile, voucherProduct, branchProfile } from "../../db/schema";
import { and, eq, inArray, lte } from "drizzle-orm";

export class BranchQuotaRepository {
    async getPartnerProfileIdByUserId(userId: string) {
        const result = await db
            .select({ partnerProfileId: partnerProfile.partnerProfileId })
            .from(partnerProfile)
            .where(eq(partnerProfile.userId, userId))
            .limit(1);
        return result[0]?.partnerProfileId || null;
    }

    async getVoucherOwnershipAndStatus(voucherProductId: string, partnerProfileId: string) {
        const result = await db
            .select({ 
                voucherProductId: voucherProduct.voucherProductId,
                status: voucherProduct.status 
            })
            .from(voucherProduct)
            .where(
                and(
                    eq(voucherProduct.voucherProductId, voucherProductId),
                    eq(voucherProduct.partnerProfileId, partnerProfileId)
                )
            )
            .limit(1);
        return result[0] || null;
    }

    async getOwnedBranches(branchProfileIds: string[], partnerProfileId: string) {
        if (branchProfileIds.length === 0) return [];

        const uniqueBranchIds = Array.from(new Set(branchProfileIds));

        const result = await db
            .select({ branchProfileId: branchProfile.branchProfileId })
            .from(branchProfile)
            .where(
                and(
                    inArray(branchProfile.branchProfileId, uniqueBranchIds),
                    eq(branchProfile.partnerProfileId, partnerProfileId)
                )
            );
        return result.map(r => r.branchProfileId);
    }

    async findAllocations(voucherProductId: string) {
        // "Trả về danh sách các branch đang sở hữu voucher này." -> Must JOIN branchProfile to return branch info
        return await db
            .select({
                branchProfileId: branchVoucherProduct.branchProfileId,
                voucherProductId: branchVoucherProduct.voucherProductId,
                totalQuantity: branchVoucherProduct.totalQuantity,
                soldQuantity: branchVoucherProduct.soldQuantity,
                branchName: branchProfile.branchName,
                address: branchProfile.address,
                phone: branchProfile.phone
            })
            .from(branchVoucherProduct)
            .innerJoin(branchProfile, eq(branchVoucherProduct.branchProfileId, branchProfile.branchProfileId))
            .where(eq(branchVoucherProduct.voucherProductId, voucherProductId));
    }

    async findAllocation(voucherProductId: string, branchProfileId: string) {
        const result = await db
            .select()
            .from(branchVoucherProduct)
            .where(
                and(
                    eq(branchVoucherProduct.voucherProductId, voucherProductId),
                    eq(branchVoucherProduct.branchProfileId, branchProfileId)
                )
            )
            .limit(1);
        return result[0] || null;
    }

    async bulkAllocate(allocations: { voucherProductId: string; branchProfileId: string; totalQuantity: number }[]) {
        if (allocations.length === 0) return [];

        // ON CONFLICT DO NOTHING to skip duplicates and avoid failing all insertions
        const result = await db
            .insert(branchVoucherProduct)
            .values(allocations)
            .onConflictDoNothing({ target: [branchVoucherProduct.branchProfileId, branchVoucherProduct.voucherProductId] })
            .returning();
            
        return result;
    }

    async updateAllocation(voucherProductId: string, branchProfileId: string, totalQuantity: number) {
        const result = await db
            .update(branchVoucherProduct)
            .set({ totalQuantity })
            .where(
                and(
                    eq(branchVoucherProduct.voucherProductId, voucherProductId),
                    eq(branchVoucherProduct.branchProfileId, branchProfileId),
                    // Safety lock: Ensure we don't update totalQuantity below the current soldQuantity
                    lte(branchVoucherProduct.soldQuantity, totalQuantity)
                )
            )
            .returning();
        return result[0] || null;
    }

    async revokeAllocation(voucherProductId: string, branchProfileId: string) {
        const result = await db
            .update(branchVoucherProduct)
            // Atomic DB-side assignment: totalQuantity = soldQuantity
            .set({ totalQuantity: branchVoucherProduct.soldQuantity })
            .where(
                and(
                    eq(branchVoucherProduct.voucherProductId, voucherProductId),
                    eq(branchVoucherProduct.branchProfileId, branchProfileId)
                )
            )
            .returning();
        return result[0] || null;
    }

    async deleteAllocation(voucherProductId: string, branchProfileId: string) {
        const result = await db
            .delete(branchVoucherProduct)
            .where(
                and(
                    eq(branchVoucherProduct.voucherProductId, voucherProductId),
                    eq(branchVoucherProduct.branchProfileId, branchProfileId)
                )
            )
            .returning();
        return result[0] || null;
    }
}
