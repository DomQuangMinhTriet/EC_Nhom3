"use client";
import { Suspense, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useOrderById } from "@/hooks/queries/use-order";

export default function VnpayReturnPage() {
  return (
    <ProtectedPage role="customer">
      <Suspense fallback={<main className="min-h-screen bg-slate-50"><TopNav/></main>}>
        <VnpayReturnContent/>
      </Suspense>
    </ProtectedPage>
  );
}

function VnpayReturnContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  // vnp_ResponseCode from the URL is only used for immediate UI feedback — it
  // is never trusted to complete the order. The VNPay IPN (server-to-server,
  // signature-verified) is the sole source of truth; this page just polls
  // until that IPN has landed, exactly like the bank_transfer/SePay flow.
  const respondedWithFailure = searchParams.get("vnp_ResponseCode") !== null
    && searchParams.get("vnp_ResponseCode") !== "00";

  const orderQuery = useOrderById(orderId ?? undefined, {
    enabled: Boolean(orderId) && !respondedWithFailure,
    refetchInterval: 3000,
  });

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
          <State icon="⚠️" title="Thiếu thông tin đơn hàng" text="Không tìm thấy mã đơn hàng trong đường dẫn trả về từ VNPay."/>
        ) : respondedWithFailure || orderQuery.data?.status === "failed" ? (
          <div className="space-y-4">
            <State icon="⚠️" title="Thanh toán không thành công" text="Giao dịch VNPay không hoàn tất hoặc đã bị hủy. Đơn hàng vẫn đang chờ, bạn có thể quay lại trang thanh toán để thử lại."/>
            <Button fullWidth onClick={() => router.push("/orders")}>Xem đơn hàng của tôi</Button>
          </div>
        ) : (
          <State icon="⏳" title="Đang xác nhận thanh toán VNPay" text="Vui lòng chờ trong giây lát, hệ thống đang đối soát giao dịch với VNPay."/>
        )}
      </div>
    </main>
  );
}
