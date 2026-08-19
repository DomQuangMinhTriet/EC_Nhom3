"use client";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { Button } from "@/components/ui/button";
import { ReviewList } from "@/components/review/review-list";
import { useToast } from "@/components/common/toast";
import { useVoucherProduct } from "@/hooks/queries/use-voucher-products";
import { useChangeReviewStatus, useVoucherReviews } from "@/hooks/queries/use-reviews";

export default function AdminVoucherReviewsPage() {
  const params = useParams<{ id: string }>();
  const voucherId = params.id;
  const toast = useToast();

  const voucherQuery = useVoucherProduct(voucherId);
  const reviewsQuery = useVoucherReviews(voucherId);
  const changeStatus = useChangeReviewStatus(voucherId);

  return (
    <AdminShell active="/admin/vouchers">
      <PageHeader title={`Đánh giá — ${voucherQuery.data?.title ?? ""}`} subtitle="Ẩn hoặc xóa đánh giá vi phạm."/>

      {reviewsQuery.isLoading && <State icon="⏳" title="Đang tải đánh giá" text="Vui lòng chờ trong giây lát."/>}

      {reviewsQuery.isError && (
        <State icon="⚠️" title="Không thể tải đánh giá" text={reviewsQuery.error instanceof Error ? reviewsQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {reviewsQuery.data && (
        <ReviewList
          averageRating={reviewsQuery.data.averageRating}
          reviews={reviewsQuery.data.reviews}
          renderActions={(review) => (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outlined"
                disabled={changeStatus.isPending}
                onClick={() =>
                  changeStatus.mutate(
                    { reviewId: review.reviewId, status: "hidden" },
                    { onSuccess: () => toast("Đã ẩn đánh giá."), onError: (error) => toast(error instanceof Error ? error.message : "Không thể ẩn.", "error") },
                  )
                }
              >
                Ẩn
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={changeStatus.isPending}
                onClick={() =>
                  changeStatus.mutate(
                    { reviewId: review.reviewId, status: "deleted" },
                    { onSuccess: () => toast("Đã xóa đánh giá."), onError: (error) => toast(error instanceof Error ? error.message : "Không thể xóa.", "error") },
                  )
                }
              >
                Xóa
              </Button>
            </div>
          )}
        />
      )}
    </AdminShell>
  );
}
