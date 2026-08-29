import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { category, partnerProfile, voucherProduct } from "../../db/schema";

export type CreateVoucherProductRecord = {
  categoryId: string;
  partnerProfileId: string;
  title: string;
  description: string;
  originalPrice: string;
  discountType: "direct" | "percentage";
  discountValue: string;
  startDate: Date;
  endDate: Date;
  validDurationDays: number;
  minLimit: number;
  maxLimit?: number | null;
  imageUrl?: string | null;
  status: "pending";
  rejectionReason?: string | null;
};

export type UpdateVoucherProductRecord = Partial<
  Omit<
    CreateVoucherProductRecord,
    "partnerProfileId" | "rejectionReason"
  >
> & { rejectionReason?: string | null };

export type VoucherProductStatus =
  | "pending"
  | "out_of_stock"
  | "active"
  | "inactive"
  | "rejected"
  | "expired";

type FindAllOptions = {
  page: number;
  pageSize: number;
  categoryId?: string;
  status?: VoucherProductStatus;
  search?: string;
  partnerProfileId?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscountPercent?: number;
};

// The sale price customers actually pay (originalPrice minus the discount),
// computed on the fly since it isn't a stored column — used to filter by
// "giá" against what a shopper pays, not the pre-discount face value.
const salePriceExpr = sql<number>`(CASE WHEN ${voucherProduct.discountType} = 'direct' THEN ${voucherProduct.originalPrice} - ${voucherProduct.discountValue} ELSE ${voucherProduct.originalPrice} * (1 - ${voucherProduct.discountValue} / 100) END)`;

// Discount normalized to a percentage regardless of discountType, so
// "mức giảm tối thiểu X%" is comparable across direct/percentage vouchers.
const discountPercentExpr = sql<number>`(CASE WHEN ${voucherProduct.discountType} = 'percentage' THEN ${voucherProduct.discountValue} ELSE (${voucherProduct.discountValue} / NULLIF(${voucherProduct.originalPrice}, 0) * 100) END)`;

export class VoucherProductRepository {
  async findPartnerProfileIdByUserId(userId: string) {
    const result = await db
      .select({ partnerProfileId: partnerProfile.partnerProfileId })
      .from(partnerProfile)
      .where(eq(partnerProfile.userId, userId))
      .limit(1);

    return result[0]?.partnerProfileId ?? null;
  }

  async findCategoryById(categoryId: string) {
    const result = await db
      .select({ categoryId: category.categoryId })
      .from(category)
      .where(eq(category.categoryId, categoryId))
      .limit(1);

    return result[0] ?? null;
  }

  async create(data: CreateVoucherProductRecord) {
    const result = await db.insert(voucherProduct).values(data).returning();
    return result[0] ?? null;
  }

  async findByPartnerProfileId(partnerProfileId: string) {
    return await db
      .select()
      .from(voucherProduct)
      .where(eq(voucherProduct.partnerProfileId, partnerProfileId))
      .orderBy(desc(voucherProduct.createdAt));
  }

  async findById(voucherProductId: string) {
    const result = await db
      .select()
      .from(voucherProduct)
      .where(eq(voucherProduct.voucherProductId, voucherProductId))
      .limit(1);

    return result[0] ?? null;
  }

  async findByIdAndPartnerProfileId(
    voucherProductId: string,
    partnerProfileId: string,
  ) {
    const result = await db
      .select()
      .from(voucherProduct)
      .where(
        and(
          eq(voucherProduct.voucherProductId, voucherProductId),
          eq(voucherProduct.partnerProfileId, partnerProfileId),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async findActivePartners() {
    return await db
      .selectDistinct({
        partnerProfileId: partnerProfile.partnerProfileId,
        partnerName: partnerProfile.partnerName,
      })
      .from(voucherProduct)
      .innerJoin(
        partnerProfile,
        eq(voucherProduct.partnerProfileId, partnerProfile.partnerProfileId),
      )
      .where(eq(voucherProduct.status, "active"))
      .orderBy(partnerProfile.partnerName);
  }

  async findAll({
    page,
    pageSize,
    categoryId,
    status,
    search,
    partnerProfileId,
    minPrice,
    maxPrice,
    minDiscountPercent,
  }: FindAllOptions) {
    const filters = [];

    if (categoryId) {
      filters.push(eq(voucherProduct.categoryId, categoryId));
    }

    if (status) {
      filters.push(eq(voucherProduct.status, status));
    }

    if (search) {
      const pattern = `%${search}%`;
      filters.push(
        or(
          ilike(voucherProduct.title, pattern),
          ilike(voucherProduct.description, pattern),
        ),
      );
    }

    if (partnerProfileId) {
      filters.push(eq(voucherProduct.partnerProfileId, partnerProfileId));
    }

    if (minPrice !== undefined) {
      filters.push(sql`${salePriceExpr} >= ${minPrice}`);
    }

    if (maxPrice !== undefined) {
      filters.push(sql`${salePriceExpr} <= ${maxPrice}`);
    }

    if (minDiscountPercent !== undefined) {
      filters.push(sql`${discountPercentExpr} >= ${minDiscountPercent}`);
    }

    const where = filters.length > 0 ? and(...filters) : undefined;
    const offset = (page - 1) * pageSize;

    const [vouchers, totalRows] = await Promise.all([
      db
        .select()
        .from(voucherProduct)
        .where(where)
        .orderBy(desc(voucherProduct.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(voucherProduct)
        .where(where),
    ]);

    return {
      vouchers,
      total: Number(totalRows[0]?.total ?? 0),
    };
  }

  async updateByPartnerProfileId(
    voucherProductId: string,
    partnerProfileId: string,
    updates: UpdateVoucherProductRecord,
  ) {
    const result = await db
      .update(voucherProduct)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(
          eq(voucherProduct.voucherProductId, voucherProductId),
          eq(voucherProduct.partnerProfileId, partnerProfileId),
        ),
      )
      .returning();

    return result[0] ?? null;
  }

  async updateStatus(
    voucherProductId: string,
    status: VoucherProductStatus,
    rejectionReason?: string | null,
  ) {
    const result = await db
      .update(voucherProduct)
      .set({
        status,
        rejectionReason: status === "rejected" ? rejectionReason : null,
        updatedAt: new Date(),
      })
      .where(eq(voucherProduct.voucherProductId, voucherProductId))
      .returning();

    return result[0] ?? null;
  }
}
