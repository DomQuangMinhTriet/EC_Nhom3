"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useCapturePaypalOrder } from "@/hooks/queries/use-payment";

export default function PaypalReturnPage() {
  return (
    <ProtectedPage role="customer">
      <Suspense fallback={<main className="min-h-screen bg-slate-50"><TopNav/></main>}>
        <PaypalReturnContent/>
      </Suspense>
    </ProtectedPage>
  );
}

function PaypalReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const cancelled = searchParams.get("cancelled") === "1";
  const captureOrder = useCapturePaypalOrder();
  const [error, setError] = useState<string | null>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!orderId || cancelled || hasTriggered.current) return;
    hasTriggered.current = true;

    captureOrder.mutate(orderId, {
      onSuccess: () => router.push(`/order-confirmation/${orderId}`),
      onError: (err) => setError(err instanceof Error ? err.message : "Không thể xác nhận thanh toán PayPal."),
    });
  }, [orderId, cancelled, captureOrder, router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <TopNav/>
      <div className="mx-auto max-w-[560px] px-5 py-16">
        {!orderId ? (
          <State icon="⚠️" title="Thiếu thông tin đơn hàng" text="Không tìm thấy mã đơn hàng trong đường dẫn trả về từ PayPal."/>
        ) : cancelled ? (
          <State icon="↩️" title="Đã hủy thanh toán" text="Bạn đã hủy thanh toán trên PayPal. Đơn hàng vẫn đang chờ, bạn có thể quay lại trang thanh toán để thử lại."/>
        ) : error ? (
          <div className="space-y-4">
            <State icon="⚠️" title="Không thể xác nhận thanh toán" text={error}/>
            <Button fullWidth onClick={() => router.push("/orders")}>Xem đơn hàng của tôi</Button>
          </div>
        ) : (
          <State icon="⏳" title="Đang xác nhận thanh toán PayPal" text="Vui lòng chờ trong giây lát, không đóng trang này."/>
        )}
      </div>
    </main>
  );
}
