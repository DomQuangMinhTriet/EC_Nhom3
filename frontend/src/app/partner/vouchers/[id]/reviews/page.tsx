"use client";
import { useParams } from "next/navigation";
import { PartnerShell } from "@/components/partner/partner-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { ReviewList } from "@/components/review/review-list";
import { usePartnerVoucherById } from "@/hooks/queries/use-voucher-products";
import { useVoucherReviews } from "@/hooks/queries/use-reviews";

export default function PartnerVoucherReviewsPage() {
  const params = useParams<{ id: string }>();
  const voucherId = params.id;

  const voucherQuery = usePartnerVoucherById(voucherId);
  const reviewsQuery = useVoucherReviews(voucherId);

  return (
    <PartnerShell active="/partner/vouchers">
      <PageHeader title={`Đánh giá — ${voucherQuery.data?.title ?? ""}`} subtitle="Khách hàng đánh giá voucher này."/>

      {reviewsQuery.isLoading && <State icon="⏳" title="Đang tải đánh giá" text="Vui lòng chờ trong giây lát."/>}

      {reviewsQuery.isError && (
        <State icon="⚠️" title="Không thể tải đánh giá" text={reviewsQuery.error instanceof Error ? reviewsQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {reviewsQuery.data && <ReviewList averageRating={reviewsQuery.data.averageRating} reviews={reviewsQuery.data.reviews}/>}
    </PartnerShell>
  );
}
