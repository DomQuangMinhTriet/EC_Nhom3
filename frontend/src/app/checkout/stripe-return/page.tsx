"use client";
import { Suspense, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useOrderById } from "@/hooks/queries/use-order";

export default function StripeReturnPage() {
  return (
    <ProtectedPage role="customer">
      <Suspense fallback={<main className="min-h-screen bg-slate-50"><TopNav/></main>}>
        <StripeReturnContent/>
      </Suspense>
    </ProtectedPage>
  );
}

function StripeReturnContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const cancelled = searchParams.get("cancelled") === "1";
  const [isTimeout, setIsTimeout] = useState(false);

  const orderQuery = useOrderById(orderId ?? undefined, {
    enabled: Boolean(orderId) && !cancelled,
    refetchInterval: cancelled || isTimeout ? false : 3000,
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (orderQuery.data?.status === "pending_payment" && !cancelled) {
      timeout = setTimeout(() => setIsTimeout(true), 15000);
    }
    return () => clearTimeout(timeout);
  }, [orderQuery.data?.status, cancelled]);

  useEffect(() => {
    if (orderQuery.data?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["voucherInstances"] });
      router.push(`/order-confirmation/${orderQuery.data.orderId}`);
    }
  }, [orderQuery.data, queryClient, router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <TopNav/>
      <div className="mx-auto max-w-[560px] px-5 py-16">
        {!orderId ? (
          <State icon="⚠️" title="Thiếu thông tin đơn hàng" text="Không tìm thấy mã đơn hàng trong đường dẫn trả về từ Stripe."/>
        ) : cancelled || orderQuery.data?.status === "failed" ? (
          <div className="space-y-4">
            <State icon="⚠️" title="Thanh toán không thành công" text="Giao dịch Stripe không hoàn tất hoặc đã bị hủy. Đơn hàng vẫn đang chờ, bạn có thể quay lại trang thanh toán để thử lại."/>
            <Button fullWidth onClick={() => router.push("/orders")}>Xem đơn hàng của tôi</Button>
          </div>
        ) : isTimeout && orderQuery.data?.status === "pending_payment" ? (
          <div className="space-y-4">
            <State icon="⚠️" title="Chưa nhận được phản hồi" text="Hệ thống chưa nhận được xác nhận thanh toán từ Stripe. Vui lòng kiểm tra lại trạng thái đơn hàng sau ít phút."/>
            <Button fullWidth onClick={() => router.push("/orders")}>Xem đơn hàng của tôi</Button>
          </div>
        ) : (
          <State icon="⏳" title="Đang xác nhận thanh toán Stripe" text="Vui lòng chờ trong giây lát, hệ thống đang đối soát giao dịch với Stripe."/>
        )}
      </div>
    </main>
  );
}
