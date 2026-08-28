"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TopNav } from "@/components/navigation/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { State } from "@/components/common/state";
import { useToast } from "@/components/common/toast";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useCart } from "@/hooks/queries/use-cart";
import { useCancelOrder, useCreateOrder, useOrderById } from "@/hooks/queries/use-order";
import { useConfirmPaymentCallback, useInitiatePayment } from "@/hooks/queries/use-payment";
import { useMyProfile } from "@/hooks/queries/use-profile";
import type { Order, PaymentMethod } from "@/features/order/order-api";
import type { PaymentRequest } from "@/features/payment/payment-api";
import type { CustomerProfile } from "@/features/profile/profile-api";

const checkoutSchema = z.object({
  name: z.string().min(2, "Nhập họ tên người nhận"),
  email: z.string().email("Nhập email hợp lệ"),
  phone: z.string().regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ"),
  payment: z.enum(["card", "bank_transfer", "paypal", "vnpay", "stripe"]),
});
type CheckoutValues = z.infer<typeof checkoutSchema>;

const paymentLabels: Record<PaymentMethod, string> = {
  card: "Thẻ tín dụng/ghi nợ",
  bank_transfer: "Chuyển khoản ngân hàng",
  paypal: "PayPal (Sandbox)",
  vnpay: "VNPay",
  stripe: "Stripe",
};

const paymentBadges: Record<PaymentMethod, string> = {
  card: "Payment mock",
  bank_transfer: "SePay",
  paypal: "PayPal Sandbox",
  vnpay: "VNPay Sandbox",
  stripe: "Stripe Sandbox",
};

const redirectPaymentMethods = new Set<PaymentMethod>(["paypal", "vnpay", "stripe"]);

export function CheckoutScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const profileQuery = useMyProfile<CustomerProfile>();
  const cartQuery = useCart();
  const createOrder = useCreateOrder();
  const initiatePayment = useInitiatePayment();
  const confirmPayment = useConfirmPaymentCallback();
  const cancelOrder = useCancelOrder();
  const [pendingPayment, setPendingPayment] = useState<{ order: Order; payment: PaymentRequest } | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const isWaitingForSepay = pendingPayment?.payment.paymentMethod === "bank_transfer";
  const pendingOrderQuery = useOrderById(pendingPayment?.order.orderId, {
    enabled: Boolean(pendingPayment),
    refetchInterval: isWaitingForSepay ? 4000 : false,
  });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CheckoutValues>({ resolver: zodResolver(checkoutSchema), defaultValues: { payment: "card" } });

  const autofilledRef = useRef(false);
  useEffect(() => {
    if (autofilledRef.current || !session || profileQuery.isLoading) return;
    autofilledRef.current = true;
    reset({
      payment: "card",
      name: profileQuery.data?.fullName ?? "",
      email: session.user.email ?? "",
      phone: profileQuery.data?.phone ?? "",
    });
  }, [session, profileQuery.data, profileQuery.isLoading, reset]);

  const items = cartQuery.data?.items ?? [];
  const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

  useEffect(() => {
    if (pendingOrderQuery.data?.status === "completed") {
      // The mock/card path invalidates these caches itself on confirm, but a
      // real bank_transfer completes via the SePay webhook + this poll
      // detecting it — nothing else invalidates the cache for that path, so
      // /orders and /my-vouchers would otherwise show stale data.
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["voucherInstances"] });
      router.push(`/order-confirmation/${pendingOrderQuery.data.orderId}`);
    }
  }, [pendingOrderQuery.data, queryClient, router]);

  async function submit(values: CheckoutValues) {
    const cart = cartQuery.data;
    if (!cart) return;
    let createdOrder: Order | null = null;
    try {
      createdOrder = await createOrder.mutateAsync(cart.cartId);
      const payment = await initiatePayment.mutateAsync({
        orderId: createdOrder.orderId,
        paymentMethod: values.payment,
      });
      setPendingPayment({ order: createdOrder, payment });
    } catch (error) {
      if (createdOrder) {
        // The order was created but starting payment failed — cancel it so
        // it doesn't linger as an orphaned pending order (holding reserved
        // stock) with no way to interact with it from this screen.
        await cancelOrder.mutateAsync(createdOrder.orderId).catch(() => {});
      }
      toast(error instanceof Error ? error.message : "Không thể tạo đơn hàng.", "error");
    }
  }

  async function confirmSuccess() {
    if (!pendingPayment) return;
    try {
      await confirmPayment.mutateAsync({
        orderId: pendingPayment.order.orderId,
        status: "success",
        transactionId: pendingPayment.payment.transactionId,
        paymentMethod: pendingPayment.payment.paymentMethod,
      });
      router.push(`/order-confirmation/${pendingPayment.order.orderId}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể xác nhận thanh toán.", "error");
    }
  }

  async function cancelPending() {
    if (!pendingPayment) return;
    try {
      await cancelOrder.mutateAsync(pendingPayment.order.orderId);
      toast("Đã hủy đơn hàng.");
      setPendingPayment(null);
      setConfirmingCancel(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể hủy đơn hàng.", "error");
    }
  }

  if (cartQuery.isLoading) {
    return <main className="min-h-screen bg-slate-50"><TopNav/><div className="mx-auto mt-16 h-72 max-w-[1000px] animate-pulse rounded-2xl bg-slate-200"/></main>;
  }

  if (pendingPayment) {
    const { order: pendingOrder, payment } = pendingPayment;
    const paymentMethod = payment.paymentMethod;
    return (
      <main className="min-h-screen bg-slate-50">
        <TopNav/>
        <div className="mx-auto max-w-[560px] px-5 py-9">
          <h1 className="text-2xl font-extrabold tracking-[-.5px] text-slate-900">Xác nhận thanh toán</h1>
          <p className="mt-1 text-sm text-slate-500">Đơn hàng đã được tạo, đang chờ thanh toán.</p>
          <section className="mt-7 space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
            <div className="space-y-2">
              {pendingOrder.items.map((item) => (
                <div className="flex justify-between gap-4 text-xs" key={item.orderItemId}>
                  <span className="text-slate-600">{item.quantity} × {item.voucherProduct.title}</span>
                  <b>{(Number(item.unitPrice) * item.quantity).toLocaleString("vi-VN")}đ</b>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-y border-slate-100 py-4">
              <b>Tổng cộng</b>
              <b className="text-primary">{Number(pendingOrder.totalAmount).toLocaleString("vi-VN")}đ</b>
            </div>
            <p className="text-xs text-slate-500">Phương thức: <b>{paymentLabels[paymentMethod]}</b></p>

            {paymentMethod === "bank_transfer" ? (
              <div className="space-y-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                {payment.qrUrl && <Image src={payment.qrUrl} alt="SePay QR" width={256} height={256} unoptimized className="mx-auto h-64 w-64 rounded-lg border border-slate-200 bg-white object-contain p-2"/>}
                <div className="grid gap-2 text-xs text-slate-700">
                  <div className="flex justify-between gap-4"><span>Ngân hàng</span><b>{payment.bankAccount?.bank}</b></div>
                  <div className="flex justify-between gap-4"><span>Số tài khoản</span><b>{payment.bankAccount?.accountNumber}</b></div>
                  <div className="flex justify-between gap-4"><span>Chủ tài khoản</span><b>{payment.bankAccount?.accountName}</b></div>
                  <div className="flex justify-between gap-4"><span>Nội dung</span><b className="font-mono text-primary">{payment.paymentCode}</b></div>
                </div>
                <p className="text-[11px] font-semibold text-primary">Đang chờ SePay xác nhận giao dịch. Trang này tự kiểm tra trạng thái mỗi 4 giây.</p>
              </div>
            ) : redirectPaymentMethods.has(paymentMethod) ? (
              <div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="text-xs text-slate-600">Bạn sẽ được chuyển tới trang thanh toán của {paymentLabels[paymentMethod]} để hoàn tất giao dịch.</p>
                <Button type="button" fullWidth onClick={() => { window.location.href = payment.paymentUrl; }}>
                  Đi tới cổng thanh toán {paymentLabels[paymentMethod]}
                </Button>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-slate-400">Transaction: <b>{payment.transactionId}</b></p>
                <a className="break-all text-[11px] font-semibold text-primary" href={payment.paymentUrl} target="_blank" rel="noreferrer">{payment.paymentUrl}</a>
                <p className="text-[11px] text-slate-400">Bước thanh toán được mô phỏng cho môi trường demo.</p>
              </>
            )}

            {confirmingCancel ? (
              <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-semibold text-red-800">Hủy đơn sẽ xóa các voucher đã chọn khỏi giỏ hàng và không thể khôi phục. Bạn cần thêm lại từ đầu nếu muốn mua tiếp.</p>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" fullWidth disabled={cancelOrder.isPending} onClick={() => setConfirmingCancel(false)}>Quay lại</Button>
                  <Button type="button" variant="danger" fullWidth disabled={cancelOrder.isPending} onClick={cancelPending}>
                    {cancelOrder.isPending ? "Đang hủy..." : "Xác nhận hủy đơn"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" fullWidth disabled={confirmPayment.isPending} onClick={() => setConfirmingCancel(true)}>Hủy đơn</Button>
                {paymentMethod === "card" && (
                  <Button type="button" fullWidth disabled={confirmPayment.isPending} onClick={confirmSuccess}>
                    {confirmPayment.isPending ? "Đang xử lý..." : "Xác nhận thanh toán demo"}
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <TopNav/>
      <div className="mx-auto max-w-[1000px] px-5 py-9">
        <h1 className="text-2xl font-extrabold tracking-[-.5px] text-slate-900">Thanh toán</h1>
        <p className="mt-1 text-sm text-slate-500">Hoàn tất thông tin để nhận voucher ngay.</p>

        {!items.length ? (
          <div className="mt-7"><State icon="🛒" title="Chưa có voucher để thanh toán" text="Hãy thêm voucher vào giỏ hàng trước."/></div>
        ) : (
          <form onSubmit={handleSubmit(submit)} className="mt-7 grid gap-6 lg:grid-cols-[1fr_330px]">
            <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
              <h2 className="font-extrabold text-slate-900">Thông tin nhận voucher</h2>
              <Input label="Họ và tên" placeholder="Nguyễn Văn An" error={errors.name?.message} {...register("name")}/>
              <Input label="Email nhận mã voucher" type="email" placeholder="ten@email.com" error={errors.email?.message} {...register("email")}/>
              <Input label="Số điện thoại" placeholder="09x xxxx xxxx" error={errors.phone?.message} {...register("phone")}/>
              <div>
                <h2 className="mt-7 font-extrabold text-slate-900">Phương thức thanh toán</h2>
                <div className="mt-3 space-y-2">
                  {(Object.entries(paymentLabels) as [PaymentMethod, string][]).map(([value, label]) => (
                    <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                      <input type="radio" value={value} className="accent-[#4F46E5]" {...register("payment")}/>
                      <span className="font-semibold">{label}</span>
                      <span className="ml-auto text-xs text-slate-400">{paymentBadges[value]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
            <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-brand-md">
              <h2 className="font-extrabold text-slate-900">Đơn hàng của bạn</h2>
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div className="flex justify-between gap-4 text-xs" key={item.cartItemId}>
                    <span className="text-slate-600">{item.quantity} × {item.voucherProduct.title}</span>
                    <b>{(Number(item.unitPrice) * item.quantity).toLocaleString("vi-VN")}đ</b>
                  </div>
                ))}
              </div>
              <div className="my-5 flex justify-between border-y border-slate-100 py-4">
                <b>Tổng cộng</b>
                <b className="text-primary">{total.toLocaleString("vi-VN")}đ</b>
              </div>
              <Button type="submit" size="lg" fullWidth disabled={isSubmitting || createOrder.isPending || initiatePayment.isPending}>{isSubmitting || createOrder.isPending || initiatePayment.isPending ? "Đang tạo đơn..." : "Xác nhận thanh toán"}</Button>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
