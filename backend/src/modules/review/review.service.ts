import { AppError } from "../../shared/errors/AppError";
import { ReviewRepository } from "./review.repository";

export class ReviewService {
    constructor(private readonly reviewRepository = new ReviewRepository()) {}

    private async getCustomerProfileId(userId: string): Promise<string> {
        const customerProfileId = await this.reviewRepository.getCustomerProfileIdByUserId(userId);
        if (!customerProfileId) {
            throw new AppError("Customer profile not found", 404);
        }
        return customerProfileId;
    }

    async createReview(userId: string, voucherCodeId: string, rating: number, comment: string) {
        const customerProfileId = await this.getCustomerProfileId(userId);

        const voucherInstance = await this.reviewRepository.findVoucherCodeById(voucherCodeId);
        if (!voucherInstance) {
            throw new AppError("Voucher instance not found", 404);
        }

        if (voucherInstance.customerProfileId !== customerProfileId) {
            throw new AppError("Forbidden: This voucher does not belong to you", 403);
        }

        if (voucherInstance.status !== "used") {
            throw new AppError("You can only review a voucher after it has been used", 400);
        }

        return await this.reviewRepository.createReview(
            customerProfileId,
            voucherInstance.voucherProductId,
            rating,
            comment
        );
    }

    async getVoucherReviews(userId: string, voucherProductId: string, roleCode: string) {
        // If the user is a Partner, we must enforce ownership check
        if (roleCode === "Partner") {
            const partnerProfileId = await this.reviewRepository.getPartnerProfileIdByUserId(userId);
            if (!partnerProfileId) {
                throw new AppError("Partner profile not found", 404);
            }

            const voucherProduct = await this.reviewRepository.findVoucherProductById(voucherProductId);
            if (!voucherProduct) {
                throw new AppError("Voucher product not found", 404);
            }

            if (voucherProduct.partnerProfileId !== partnerProfileId) {
                throw new AppError("Forbidden: This voucher product does not belong to you", 403);
            }
        }
        
        // Admins can bypass the ownership check
        return await this.reviewRepository.getReviewsWithAverage(voucherProductId);
    }

    async editReview(userId: string, reviewId: string, rating: number, comment: string) {
        const customerProfileId = await this.getCustomerProfileId(userId);

        const updatedReview = await this.reviewRepository.updateReview(reviewId, customerProfileId, rating, comment);
        if (!updatedReview) {
            throw new AppError("Review not found or does not belong to you", 404);
        }

        return updatedReview;
    }

    async changeReviewStatus(reviewId: string, status: "hidden" | "deleted") {
        const review = await this.reviewRepository.findReviewById(reviewId);
        if (!review) {
            throw new AppError("Review not found", 404);
        }

        return await this.reviewRepository.updateReviewStatus(reviewId, status);
    }
}
