import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { customerProfile, voucherCode, voucherProduct } from "../../db/schema";

export class VoucherInstanceRepository {
    async getCustomerProfileIdByUserId(userId: string): Promise<string | null> {
        const result = await db.query.customerProfile.findFirst({
            where: eq(customerProfile.userId, userId),
            columns: { customerProfileId: true },
        });
        return result?.customerProfileId ?? null;
    }

    async getVouchers(customerProfileId: string, statusFilter?: string) {
        let whereCondition = eq(voucherCode.customerProfileId, customerProfileId);

        if (statusFilter) {
            whereCondition = and(
                whereCondition,
                eq(voucherCode.status, statusFilter as "used" | "expired" | "cancelled" | "available")
            )!;
        }

        const vouchers = await db
            .select({
                voucherCodeId: voucherCode.voucherCodeId,
                code: voucherCode.code,
                status: voucherCode.status,
                expiredAt: voucherCode.expiredAt,
                createdAt: voucherCode.createdAt,
                usedAt: voucherCode.usedAt,
                voucherProduct: {
                    voucherProductId: voucherProduct.voucherProductId,
                    title: voucherProduct.title,
                    imageUrl: voucherProduct.imageUrl,
                    originalPrice: voucherProduct.originalPrice,
                    discountType: voucherProduct.discountType,
                    discountValue: voucherProduct.discountValue,
                },
            })
            .from(voucherCode)
            .innerJoin(voucherProduct, eq(voucherCode.voucherProductId, voucherProduct.voucherProductId))
            .where(whereCondition);

        return vouchers;
    }

    async getVoucherByIdAndOwner(voucherCodeId: string, customerProfileId: string) {
        const vouchers = await db
            .select({
                voucherCodeId: voucherCode.voucherCodeId,
                code: voucherCode.code,
                status: voucherCode.status,
                expiredAt: voucherCode.expiredAt,
                createdAt: voucherCode.createdAt,
                usedAt: voucherCode.usedAt,
                voucherProduct: {
                    voucherProductId: voucherProduct.voucherProductId,
                    title: voucherProduct.title,
                    imageUrl: voucherProduct.imageUrl,
                    originalPrice: voucherProduct.originalPrice,
                    discountType: voucherProduct.discountType,
                    discountValue: voucherProduct.discountValue,
                },
            })
            .from(voucherCode)
            .innerJoin(voucherProduct, eq(voucherCode.voucherProductId, voucherProduct.voucherProductId))
            .where(
                and(
                    eq(voucherCode.voucherCodeId, voucherCodeId),
                    eq(voucherCode.customerProfileId, customerProfileId)
                )
            );

        return vouchers.length > 0 ? vouchers[0] : null;
    }
}
