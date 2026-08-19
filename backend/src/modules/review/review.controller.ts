import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { isUuid } from "../../shared/http/requestParsers";
import { ReviewService } from "./review.service";

export class ReviewController {
    constructor(private readonly reviewService = new ReviewService()) {}

    createReview = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { voucherCodeId, rating, comment } = req.body;

        if (!voucherCodeId || typeof rating !== "number" || !comment) {
            throw new AppError("voucherCodeId, rating, and comment are required", 400);
        }

        if (rating < 1 || rating > 5) {
            throw new AppError("Rating must be between 1 and 5", 400);
        }

        const review = await this.reviewService.createReview(userId, voucherCodeId, rating, comment);
        res.status(201).json({ data: review });
    };

    getVoucherReviews = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const roleCode = req.user!.roleCode;
        const voucherProductId = req.params.id as string;

        if (!isUuid(voucherProductId)) {
            throw new AppError("Invalid voucher product ID", 400);
        }

        const data = await this.reviewService.getVoucherReviews(userId, voucherProductId, roleCode);
        res.json({ data });
    };

    editReview = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const reviewId = req.params.id as string;
        const { rating, comment } = req.body;

        if (!isUuid(reviewId)) {
            throw new AppError("Invalid review ID", 400);
        }

        if (typeof rating !== "number" || !comment) {
            throw new AppError("rating and comment are required", 400);
        }

        if (rating < 1 || rating > 5) {
            throw new AppError("Rating must be between 1 and 5", 400);
        }

        const review = await this.reviewService.editReview(userId, reviewId, rating, comment);
        res.json({ data: review });
    };

    changeReviewStatus = async (req: Request, res: Response) => {
        const reviewId = req.params.id as string;
        const { status } = req.body;

        if (!isUuid(reviewId)) {
            throw new AppError("Invalid review ID", 400);
        }

        if (status !== "hidden" && status !== "deleted") {
            throw new AppError("Status must be 'hidden' or 'deleted'", 400);
        }

        const review = await this.reviewService.changeReviewStatus(reviewId, status);
        res.json({ data: review });
    };
}
