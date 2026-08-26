"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TopNav } from "@/components/navigation/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { State } from "@/components/common/state";
import { useToast } from "@/components/common/toast";
import { useCart } from "@/hooks/queries/use-cart";
import { useCancelOrder, useConfirmOrderPayment, useCreateOrder } from "@/hooks/queries/use-order";
import type { Order, PaymentMethod } from "@/features/order/order-api";

const checkoutSchema = z.object({
  name: z.string().min(2, "Nhập họ tên người nhận"),
  email: z.string().email("Nhập email hợp lệ"),
  phone: z.string().regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ"),
  payment: z.enum(["card", "bank_transfer"]),
});
type CheckoutValues = z.infer<typeof checkoutSchema>;

const paymentLabels: Record<PaymentMethod, string> = { card: "Thẻ tín dụng/ghi nợ", bank_transfer: "Chuyển khoản ngân hàng" };

export function CheckoutScreen() {
  const router = useRouter();
  const toast = useToast();
  const cartQuery = useCart();
  const createOrder = useCreateOrder();
  const confirmPayment = useConfirmOrderPayment();
  const cancelOrder = useCancelOrder();
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CheckoutValues>({ resolver: zodResolver(checkoutSchema), defaultValues: { payment: "card" } });

  const items = cartQuery.data?.items ?? [];
  const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

  async function submit(values: CheckoutValues) {
    const cart = cartQuery.data;
    if (!cart) return;
    try {
      const order = await createOrder.mutateAsync(cart.cartId);
      setPendingOrder({ ...order, payments: order.payments.length ? order.payments : [{ paymentId: "", transactionId: "", paymentMethod: values.payment, amount: order.totalAmount, currency: "VND", status: "pending" }] });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tạo đơn hàng.", "error");
    }
  }

  async function confirmSuccess() {
    if (!pendingOrder) return;
    const paymentMethod = pendingOrder.payments[0]?.paymentMethod ?? "card";
    try {
      await confirmPayment.mutateAsync({ orderId: pendingOrder.orderId, transactionId: `SIM-${Date.now()}`, paymentMethod });
      router.push(`/order-confirmation/${pendingOrder.orderId}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể xác nhận thanh toán.", "error");
    }
  }

  async function cancelPending() {
    if (!pendingOrder) return;
    try {
      await cancelOrder.mutateAsync(pendingOrder.orderId);
      toast("Đã hủy đơn hàng.");
      setPendingOrder(null);
      setConfirmingCancel(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể hủy đơn hàng.", "error");
    }
  }

  if (cartQuery.isLoading) {
    return <main className="min-h-screen bg-slate-50"><TopNav/><div className="mx-auto mt-16 h-72 max-w-[1000px] animate-pulse rounded-2xl bg-slate-200"/></main>;
  }

  if (pendingOrder) {
    const paymentMethod = pendingOrder.payments[0]?.paymentMethod ?? "card";
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
            <p className="text-[11px] text-slate-400">Bước thanh toán được mô phỏng cho môi trường demo.</p>

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
                <Button type="button" fullWidth disabled={confirmPayment.isPending} onClick={confirmSuccess}>
                  {confirmPayment.isPending ? "Đang xử lý..." : "Xác nhận đã thanh toán"}
                </Button>
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
                      <span className="ml-auto text-xs text-slate-400">Payment mock</span>
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
              <Button type="submit" size="lg" fullWidth disabled={isSubmitting || createOrder.isPending}>{isSubmitting || createOrder.isPending ? "Đang tạo đơn..." : "Xác nhận thanh toán"}</Button>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
