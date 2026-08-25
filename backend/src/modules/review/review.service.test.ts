import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../shared/errors/AppError";
import { ReviewService } from "./review.service";
import type { ReviewRepository } from "./review.repository";

// Mocks
const mockUserId = "u-123";
const mockCustomerProfileId = "cp-123";
const mockPartnerProfileId = "pp-123";
const mockVoucherProductId = "vp-123";
const mockVoucherCodeId = "vc-123";
const mockReviewId = "rev-123";

const mockVoucherInstance = {
    voucherCodeId: mockVoucherCodeId,
    customerProfileId: mockCustomerProfileId,
    voucherProductId: mockVoucherProductId,
    code: "CODE",
    status: "used" as const,
    expiredAt: new Date(),
    createdAt: new Date(),
    usedAt: new Date(),
};

const mockVoucherProduct = {
    voucherProductId: mockVoucherProductId,
    partnerProfileId: mockPartnerProfileId,
    categoryId: "cat-123",
    title: "Voucher",
    description: "",
    originalPrice: "100",
    discountType: "percentage" as const,
    discountValue: "10",
    startDate: new Date(),
    endDate: new Date(),
    validDurationDays: 1,
    minLimit: 1,
    maxLimit: 1,
    imageUrl: null,
    status: "active" as const,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockReview = {
    reviewId: mockReviewId,
    customerProfileId: mockCustomerProfileId,
    voucherProductId: mockVoucherProductId,
    rating: 5,
    comment: "Great!",
    status: "active" as const,
    isEdited: false,
    editedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

function createRepository(overrides?: Partial<ReviewRepository>): ReviewRepository {
    return {
        getCustomerProfileIdByUserId: async () => mockCustomerProfileId,
        getPartnerProfileIdByUserId: async () => mockPartnerProfileId,
        findVoucherCodeById: async () => mockVoucherInstance,
        findVoucherProductById: async () => mockVoucherProduct,
        createReview: async () => mockReview,
        getReviewsWithAverage: async () => ({ averageRating: 5, reviews: [mockReview] }),
        findReviewById: async () => mockReview,
        updateReview: async () => ({ ...mockReview, isEdited: true, editedAt: new Date() }),
        updateReviewStatus: async (rId: string, status: "hidden" | "deleted") => ({ ...mockReview, status }),
        ...overrides,
    } as unknown as ReviewRepository;
}

test("createReview successfully creates review if voucher is used and owned by customer", async () => {
    const service = new ReviewService(createRepository());
    const result = await service.createReview(mockUserId, mockVoucherCodeId, 5, "Great!");
    assert.equal(result.reviewId, mockReviewId);
});

test("createReview throws 404 if customer profile not found", async () => {
    const service = new ReviewService(createRepository({
        getCustomerProfileIdByUserId: async () => null
    }));
    await assert.rejects(
        service.createReview(mockUserId, mockVoucherCodeId, 5, "Great!"),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Customer profile not found"
    );
});

test("createReview throws 404 if voucher instance not found", async () => {
    const service = new ReviewService(createRepository({
        findVoucherCodeById: async () => null
    }));
    await assert.rejects(
        service.createReview(mockUserId, mockVoucherCodeId, 5, "Great!"),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Voucher instance not found"
    );
});

test("createReview throws 403 if voucher instance belongs to different customer", async () => {
    const service = new ReviewService(createRepository({
        findVoucherCodeById: async () => ({ ...mockVoucherInstance, customerProfileId: "other-customer" })
    }));
    await assert.rejects(
        service.createReview(mockUserId, mockVoucherCodeId, 5, "Great!"),
        (err: unknown) => err instanceof AppError && err.statusCode === 403 && err.message === "Forbidden: This voucher does not belong to you"
    );
});

test("createReview throws 400 if voucher instance is not used", async () => {
    const service = new ReviewService(createRepository({
        findVoucherCodeById: async () => ({ ...mockVoucherInstance, status: "available" })
    }));
    await assert.rejects(
        service.createReview(mockUserId, mockVoucherCodeId, 5, "Great!"),
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message === "You can only review a voucher after it has been used"
    );
});

test("getVoucherReviews returns reviews and average for Partner if owned", async () => {
    const service = new ReviewService(createRepository());
    const result = await service.getVoucherReviews(mockUserId, mockVoucherProductId, "Partner");
    assert.equal(result.averageRating, 5);
    assert.equal(result.reviews.length, 1);
});

test("getVoucherReviews returns reviews and average for Admin (bypass ownership)", async () => {
    const service = new ReviewService(createRepository());
    // It should completely skip ownership checks and not care if findVoucherProductById fails
    const result = await service.getVoucherReviews(mockUserId, mockVoucherProductId, "Super_Admin");
    assert.equal(result.averageRating, 5);
});

test("getVoucherReviews throws 404 if Partner profile not found", async () => {
    const service = new ReviewService(createRepository({
        getPartnerProfileIdByUserId: async () => null
    }));
    await assert.rejects(
        service.getVoucherReviews(mockUserId, mockVoucherProductId, "Partner"),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Partner profile not found"
    );
});

test("getVoucherReviews throws 404 if Voucher Product not found", async () => {
    const service = new ReviewService(createRepository({
        findVoucherProductById: async () => null
    }));
    await assert.rejects(
        service.getVoucherReviews(mockUserId, mockVoucherProductId, "Partner"),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Voucher product not found"
    );
});

test("getVoucherReviews throws 403 if Voucher Product does not belong to Partner", async () => {
    const service = new ReviewService(createRepository({
        findVoucherProductById: async () => ({ ...mockVoucherProduct, partnerProfileId: "other-partner" })
    }));
    await assert.rejects(
        service.getVoucherReviews(mockUserId, mockVoucherProductId, "Partner"),
        (err: unknown) => err instanceof AppError && err.statusCode === 403 && err.message === "Forbidden: This voucher product does not belong to you"
    );
});

test("editReview successfully edits a review", async () => {
    const service = new ReviewService(createRepository());
    const result = await service.editReview(mockUserId, mockReviewId, 4, "Updated");
    assert.equal(result!.isEdited, true);
});

test("editReview throws 404 if review not found or doesn't belong to customer", async () => {
    const service = new ReviewService(createRepository({
        updateReview: async () => null
    }));
    await assert.rejects(
        service.editReview(mockUserId, mockReviewId, 4, "Updated"),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Review not found or does not belong to you"
    );
});

test("changeReviewStatus successfully changes status", async () => {
    const service = new ReviewService(createRepository());
    const result = await service.changeReviewStatus(mockReviewId, "hidden");
    assert.equal(result!.status, "hidden");
});

test("changeReviewStatus throws 404 if review not found", async () => {
    const service = new ReviewService(createRepository({
        findReviewById: async () => null
    }));
    await assert.rejects(
        service.changeReviewStatus(mockReviewId, "deleted"),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Review not found"
    );
});
