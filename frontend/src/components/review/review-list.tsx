import type { ReactNode } from "react";
import type { Review } from "@/features/review/review-api";

export function ReviewList({ averageRating, reviews, renderActions }: { averageRating: number; reviews: Review[]; renderActions?: (review: Review) => ReactNode }) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3 rounded-lg bg-slate-50 p-4">
        <b className="text-2xl text-primary">{averageRating.toFixed(1)}</b>
        <span className="text-xs text-slate-500">/ 5 · {reviews.length} đánh giá</span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-xs text-slate-500">Chưa có đánh giá nào.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.reviewId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-brand-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                <span className="text-[11px] text-slate-400">{new Date(review.createdAt).toLocaleDateString("vi-VN")}{review.isEdited ? " (đã sửa)" : ""}</span>
              </div>
              <p className="mt-2 text-xs text-slate-700">{review.comment}</p>
              {renderActions && <div className="mt-3">{renderActions(review)}</div>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
