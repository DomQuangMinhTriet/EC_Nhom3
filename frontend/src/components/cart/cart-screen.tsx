"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/navigation/top-nav";
import { State } from "@/components/common/state";
import { useToast } from "@/components/common/toast";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/queries/use-cart";

export function CartScreen() {
  const toast = useToast();
  const cartQuery = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const items = cartQuery.data?.items ?? [];
  const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

  function changeQuantity(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem.mutate(cartItemId, { onError: (error) => toast(error instanceof Error ? error.message : "Không thể xóa.", "error") });
      return;
    }
    updateItem.mutate({ cartItemId, quantity }, { onError: (error) => toast(error instanceof Error ? error.message : "Không thể cập nhật số lượng.", "error") });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <TopNav/>
      <div className="mx-auto max-w-[1100px] px-5 py-9">
        <h1 className="text-2xl font-extrabold tracking-[-.5px] text-slate-900">Giỏ hàng</h1>
        <p className="mt-1 text-sm text-slate-500">Kiểm tra voucher trước khi thanh toán.</p>

        {cartQuery.isLoading && <div className="mt-7"><State icon="⏳" title="Đang tải giỏ hàng" text="Vui lòng chờ trong giây lát."/></div>}

        {cartQuery.isError && <div className="mt-7"><State icon="⚠️" title="Không thể tải giỏ hàng" text={cartQuery.error instanceof Error ? cartQuery.error.message : "Đã xảy ra lỗi."}/></div>}

        {!cartQuery.isLoading && !cartQuery.isError && items.length === 0 && (
          <div className="mt-7">
            <State icon="🛒" title="Giỏ hàng đang trống" text="Khám phá ưu đãi chính hãng phù hợp với bạn."/>
            <Link className="mx-auto mt-4 block w-fit" href="/vouchers"><Button>Khám phá voucher</Button></Link>
          </div>
        )}

        {!cartQuery.isLoading && !cartQuery.isError && items.length > 0 && (
          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_330px]">
            <section className="space-y-3">
              {items.map((item) => (
                <article className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-brand-sm" key={item.cartItemId}>
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-xl font-extrabold text-white">
                    {item.voucherProduct.imageUrl ? <img src={item.voucherProduct.imageUrl} alt="" className="h-full w-full object-cover"/> : "EC"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-extrabold text-slate-900">{item.voucherProduct.title}</h2>
                    <b className="mt-2 block text-base text-primary">{Number(item.unitPrice).toLocaleString("vi-VN")}đ</b>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeItem.mutate(item.cartItemId)} className="text-xs font-semibold text-danger">Xóa</button>
                    <div className="flex items-center rounded-lg border border-slate-200">
                      <button className="px-2 py-1 text-slate-600" onClick={() => changeQuantity(item.cartItemId, item.quantity - 1)}>−</button>
                      <span className="min-w-7 text-center text-xs font-bold">{item.quantity}</span>
                      <button className="px-2 py-1 text-slate-600" onClick={() => changeQuantity(item.cartItemId, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-brand-md">
              <h2 className="font-extrabold text-slate-900">Tóm tắt đơn hàng</h2>
              <div className="my-5 flex justify-between border-y border-slate-100 py-4 text-sm">
                <span className="text-slate-500">Tạm tính</span>
                <b>{total.toLocaleString("vi-VN")}đ</b>
              </div>
              <div className="flex justify-between text-base">
                <b>Tổng cộng</b>
                <b className="text-primary">{total.toLocaleString("vi-VN")}đ</b>
              </div>
              <Link className="mt-5 block" href="/checkout"><Button fullWidth size="lg">Tiến hành thanh toán</Button></Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
