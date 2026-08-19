import { and, avg, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { customerProfile, partnerProfile, review, voucherCode, voucherProduct } from "../../db/schema";

export class ReviewRepository {
    async getCustomerProfileIdByUserId(userId: string): Promise<string | null> {
        const result = await db.query.customerProfile.findFirst({
            where: eq(customerProfile.userId, userId),
            columns: { customerProfileId: true },
        });
        return result?.customerProfileId ?? null;
    }

    async getPartnerProfileIdByUserId(userId: string): Promise<string | null> {
        const result = await db.query.partnerProfile.findFirst({
            where: eq(partnerProfile.userId, userId),
            columns: { partnerProfileId: true },
        });
        return result?.partnerProfileId ?? null;
    }

    async findVoucherCodeById(voucherCodeId: string) {
        const result = await db.query.voucherCode.findFirst({
            where: eq(voucherCode.voucherCodeId, voucherCodeId),
        });
        return result ?? null;
    }

    async findVoucherProductById(voucherProductId: string) {
        const result = await db.query.voucherProduct.findFirst({
            where: eq(voucherProduct.voucherProductId, voucherProductId),
        });
        return result ?? null;
    }

    async createReview(customerProfileId: string, voucherProductId: string, rating: number, comment: string) {
        const [newReview] = await db.insert(review).values({
            customerProfileId,
            voucherProductId,
            rating,
            comment,
            status: "active",
        }).returning();
        return newReview!;
    }

    async getReviewsWithAverage(voucherProductId: string) {
        const activeReviewsForVoucher = and(
            eq(review.voucherProductId, voucherProductId),
            eq(review.status, "active")
        );

        const [reviews, avgResult] = await Promise.all([
            db.query.review.findMany({ where: activeReviewsForVoucher }),
            db
                .select({ averageRating: avg(review.rating) })
                .from(review)
                .where(activeReviewsForVoucher),
        ]);

        const averageRating = parseFloat(avgResult[0]?.averageRating as string ?? "0");

        return {
            averageRating: Number(averageRating.toFixed(2)),
            reviews
        };
    }

    async findReviewById(reviewId: string) {
        const result = await db.query.review.findFirst({
            where: eq(review.reviewId, reviewId),
        });
        return result ?? null;
    }

    async updateReview(reviewId: string, customerProfileId: string, rating: number, comment: string) {
        const [updated] = await db
            .update(review)
            .set({
                rating,
                comment,
                isEdited: true,
                editedAt: sql`now()`,
                updatedAt: sql`now()`
            })
            .where(
                and(
                    eq(review.reviewId, reviewId),
                    eq(review.customerProfileId, customerProfileId)
                )
            )
            .returning();
        return updated ?? null;
    }

    async updateReviewStatus(reviewId: string, status: "hidden" | "deleted") {
        const [updated] = await db
            .update(review)
            .set({
                status,
                updatedAt: sql`now()`
            })
            .where(eq(review.reviewId, reviewId))
            .returning();
        return updated ?? null;
    }
}
