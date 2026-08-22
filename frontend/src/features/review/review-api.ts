import { apiClient } from "@/lib/api/client";
import { authHeaders } from "@/lib/api/auth-headers";

export type ReviewStatus = "active" | "hidden" | "deleted";

export type Review = {
  reviewId: string;
  customerProfileId: string;
  voucherProductId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  isEdited: boolean;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VoucherReviews = { averageRating: number; reviews: Review[] };

export async function createReview(voucherCodeId: string, rating: number, comment: string) {
  const res = await apiClient<{ data: Review }>("/reviews", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ voucherCodeId, rating, comment }),
  });
  return res.data;
}

export async function editReview(reviewId: string, rating: number, comment: string) {
  const res = await apiClient<{ data: Review }>(`/reviews/${reviewId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ rating, comment }),
  });
  return res.data;
}

export async function getVoucherReviews(voucherProductId: string) {
  const res = await apiClient<{ data: VoucherReviews }>(`/reviews/vouchers/${voucherProductId}`, { headers: authHeaders() });
  return res.data;
}

export async function changeReviewStatus(reviewId: string, status: Extract<ReviewStatus, "hidden" | "deleted">) {
  const res = await apiClient<{ data: Review }>(`/reviews/${reviewId}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return res.data;
}
