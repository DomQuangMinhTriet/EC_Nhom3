"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeReviewStatus, createReview, getVoucherReviews, type ReviewStatus } from "@/features/review/review-api";

export const reviewKeys = { forVoucher: (voucherProductId: string) => ["reviews", "voucher", voucherProductId] as const };

export function useVoucherReviews(voucherProductId: string) {
  return useQuery({ queryKey: reviewKeys.forVoucher(voucherProductId), queryFn: () => getVoucherReviews(voucherProductId), enabled: Boolean(voucherProductId) });
}

export function useCreateReview() {
  return useMutation({
    mutationFn: ({ voucherCodeId, rating, comment }: { voucherCodeId: string; rating: number; comment: string }) =>
      createReview(voucherCodeId, rating, comment),
  });
}

export function useChangeReviewStatus(voucherProductId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, status }: { reviewId: string; status: Extract<ReviewStatus, "hidden" | "deleted"> }) =>
      changeReviewStatus(reviewId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewKeys.forVoucher(voucherProductId) }),
  });
}
