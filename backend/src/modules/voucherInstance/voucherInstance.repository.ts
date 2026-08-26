import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../../db/client";
import {
  branchProfile,
  branchVoucherProduct,
  customerProfile,
  voucherCode,
  voucherProduct,
} from "../../db/schema";

export class VoucherInstanceRepository {
  async getCustomerProfileIdByUserId(userId: string): Promise<string | null> {
    const result = await db.query.customerProfile.findFirst({
      where: eq(customerProfile.userId, userId),
      columns: { customerProfileId: true },
    });
    return result?.customerProfileId ?? null;
  }

  async getBranchProfileIdByUserId(userId: string): Promise<string | null> {
    const result = await db.query.branchProfile.findFirst({
      where: eq(branchProfile.userId, userId),
      columns: { branchProfileId: true },
    });
    return result?.branchProfileId ?? null;
  }

  async getVouchers(customerProfileId: string, statusFilter?: string) {
    let whereCondition = eq(voucherCode.customerProfileId, customerProfileId);

    if (statusFilter) {
      whereCondition = and(
        whereCondition,
        eq(
          voucherCode.status,
          statusFilter as "used" | "expired" | "cancelled" | "available",
        ),
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
      .innerJoin(
        voucherProduct,
        eq(voucherCode.voucherProductId, voucherProduct.voucherProductId),
      )
      .where(whereCondition);

    return vouchers;
  }

  async getVoucherByIdAndOwner(
    voucherCodeId: string,
    customerProfileId: string,
  ) {
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
      .innerJoin(
        voucherProduct,
        eq(voucherCode.voucherProductId, voucherProduct.voucherProductId),
      )
      .where(
        and(
          eq(voucherCode.voucherCodeId, voucherCodeId),
          eq(voucherCode.customerProfileId, customerProfileId),
        ),
      );

    return vouchers.length > 0 ? vouchers[0] : null;
  }

  async getVoucherByCodeForRedemption(code: string) {
    const vouchers = await db
      .select({
        voucherCodeId: voucherCode.voucherCodeId,
        voucherProductId: voucherCode.voucherProductId,
        customerProfileId: voucherCode.customerProfileId,
        code: voucherCode.code,
        status: voucherCode.status,
        expiredAt: voucherCode.expiredAt,
        createdAt: voucherCode.createdAt,
        usedAt: voucherCode.usedAt,
        customer: {
          customerProfileId: customerProfile.customerProfileId,
          fullName: customerProfile.fullName,
          phone: customerProfile.phone,
        },
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
      .innerJoin(
        voucherProduct,
        eq(voucherCode.voucherProductId, voucherProduct.voucherProductId),
      )
      .innerJoin(
        customerProfile,
        eq(voucherCode.customerProfileId, customerProfile.customerProfileId),
      )
      .where(eq(voucherCode.code, code))
      .limit(1);

    return vouchers.length > 0 ? vouchers[0] : null;
  }

  async hasBranchVoucherAllocation(
    branchProfileId: string,
    voucherProductId: string,
  ) {
    const allocation = await db.query.branchVoucherProduct.findFirst({
      where: and(
        eq(branchVoucherProduct.branchProfileId, branchProfileId),
        eq(branchVoucherProduct.voucherProductId, voucherProductId),
      ),
      columns: { branchProfileId: true },
    });

    return Boolean(allocation);
  }

  async redeemVoucherCode(code: string) {
    const [updatedVoucher] = await db
      .update(voucherCode)
      .set({
        status: "used",
        usedAt: sql`now()`,
      })
      .where(
        and(
          eq(voucherCode.code, code),
          eq(voucherCode.status, "available"),
          isNull(voucherCode.usedAt),
          gt(voucherCode.expiredAt, new Date()),
        ),
      )
      .returning({ voucherCodeId: voucherCode.voucherCodeId });

    if (!updatedVoucher) {
      return null;
    }

    return await this.getVoucherByCodeForRedemption(code);
  }
}
