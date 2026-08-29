"use client";
import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/common/page-header";
import { RecordsTable } from "@/components/admin/records-table";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { useToast } from "@/components/common/toast";
import {
  useCancelOrderForAdmin,
  useMarkOrderRefunded,
  useOrderByIdForAdmin,
  useOrdersForAdmin,
} from "@/hooks/queries/use-order";
import type { OrderPayment, OrderStatus } from "@/features/order/order-api";

// payment.amount is denominated in payment.currency, not always VND — PayPal
// (and Stripe) record the USD amount actually charged at the gateway, since
// PayPal doesn't settle in VND. Formatting it as if it were VND would show a
// USD cents-scale number with a "đ" suffix, which reads as a data error.
function formatPaymentAmount(payment: OrderPayment) {
  const amount = Number(payment.amount);
  if (payment.currency === "USD") {
    return `$${amount.toFixed(2)}`;
  }
  return `${amount.toLocaleString("vi-VN")}đ`;
}

const statusLabel: Record<OrderStatus, string> = {
  pending_payment: "Chờ thanh toán",
  completed: "Hoàn tất",
  failed: "Đã hủy",
};
const statusStyle: Record<OrderStatus, string> = {
  pending_payment: "bg-indigo-50 text-primary",
  completed: "bg-emerald-50 text-success",
  failed: "bg-red-50 text-danger",
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const ordersQuery = useOrdersForAdmin({
    page,
    limit: 20,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const orders = ordersQuery.data?.data ?? [];
  const pagination = ordersQuery.data?.pagination;

  return (
    <AdminShell active="/admin/orders">
      <PageHeader title="Đơn hàng" subtitle="Tra cứu đơn hàng, xử lý thanh toán, hủy đơn và ghi nhận hoàn tiền mô phỏng."/>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-500">
          Trạng thái
          <select
            value={status}
            onChange={(event) => { setPage(1); setStatus(event.target.value as OrderStatus | ""); }}
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-brand-sm"
          >
            <option value="">Tất cả</option>
            <option value="pending_payment">Chờ thanh toán</option>
            <option value="completed">Hoàn tất</option>
            <option value="failed">Đã hủy</option>
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Từ ngày
          <input type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value); }} className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-brand-sm"/>
        </label>
        <label className="text-xs text-slate-500">
          Đến ngày
          <input type="date" value={to} onChange={(event) => { setPage(1); setTo(event.target.value); }} className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-brand-sm"/>
        </label>
      </div>

      {ordersQuery.isLoading && <State icon="⏳" title="Đang tải danh sách đơn hàng" text="Vui lòng chờ trong giây lát."/>}

      {ordersQuery.isError && (
        <State icon="⚠️" title="Không thể tải danh sách đơn hàng" text={ordersQuery.error instanceof Error ? ordersQuery.error.message : "Đã xảy ra lỗi."}/>
      )}

      {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 && (
        <State icon="🧾" title="Không có đơn hàng phù hợp" text="Thử đổi bộ lọc trạng thái hoặc khoảng ngày."/>
      )}

      {!ordersQuery.isLoading && !ordersQuery.isError && orders.length > 0 && (
        <>
          <RecordsTable
            headers={["Mã đơn", "Khách hàng", "Ngày tạo", "Tổng tiền", "Trạng thái", ""]}
            rows={orders.map((order) => [
              <span key="id" className="font-mono font-bold text-primary">{order.orderId.slice(0, 8)}</span>,
              <div key="c">
                <b className="block text-slate-800">{order.customer.fullName}</b>
                <span className="text-slate-500">{order.customer.email}</span>
              </div>,
              <span key="d" className="text-slate-600">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>,
              <span key="t" className="font-semibold">{Number(order.totalAmount).toLocaleString("vi-VN")}đ</span>,
              <span key="s" className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[order.status]}`}>{statusLabel[order.status]}</span>,
              <Button key="a" size="sm" variant="ghost" onClick={() => setSelectedOrderId(order.orderId)}>Xem chi tiết</Button>,
            ])}
          />

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Trang {pagination.page} / {pagination.totalPages} · {pagination.total} đơn hàng</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>← Trước</Button>
                <Button size="sm" variant="ghost" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Sau →</Button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)}/>}
    </AdminShell>
  );
}

function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const toast = useToast();
  const orderQuery = useOrderByIdForAdmin(orderId);
  const cancelOrder = useCancelOrderForAdmin();
  const markRefunded = useMarkOrderRefunded();
  const [action, setAction] = useState<"cancel" | "refund" | null>(null);
  const [reason, setReason] = useState("");

  const order = orderQuery.data;
  const successfulPayment = order?.payments.find((payment) => payment.status === "success");
  const canCancel = order?.status === "pending_payment";
  const canRefund = order?.status === "completed" && successfulPayment && !successfulPayment.refundedAt;

  function submitAction() {
    if (!action) return;
    const mutation = action === "cancel" ? cancelOrder : markRefunded;
    mutation.mutate(
      { orderId, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast(action === "cancel" ? "Đã hủy đơn hàng." : "Đã ghi nhận hoàn tiền.");
          setAction(null);
          setReason("");
        },
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể thực hiện thao tác.", "error"),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-5">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-brand-lg">
        <div className="flex items-start justify-between">
          <h2 className="font-extrabold text-slate-900">Chi tiết đơn hàng #{orderId.slice(0, 8)}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        {orderQuery.isLoading && <p className="mt-4 text-xs text-slate-400">Đang tải...</p>}

        {order && (
          <div className="mt-4 space-y-5 text-xs">
            <div>
              <b className="block text-slate-800">{order.customer.fullName}</b>
              <span className="text-slate-500">{order.customer.email}</span>
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[order.status]}`}>{statusLabel[order.status]}</span>
                <span className="text-slate-500">Tổng tiền: <b className="text-slate-800">{Number(order.totalAmount).toLocaleString("vi-VN")}đ</b></span>
              </div>
              {order.reason && <p className="mt-2 text-slate-500">Ghi chú: {order.reason}</p>}
            </div>

            <div>
              <h3 className="font-bold text-slate-800">Voucher trong đơn</h3>
              <div className="mt-2 space-y-2">
                {order.items.map((item) => (
                  <div key={item.orderItemId} className="flex justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <span>{item.quantity} × {item.voucherProduct.title}</span>
                    <span className="font-semibold">{Number(item.unitPrice).toLocaleString("vi-VN")}đ</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800">Thanh toán</h3>
              <div className="mt-2 space-y-2">
                {order.payments.length === 0 && <p className="text-slate-400">Chưa ghi nhận giao dịch nào.</p>}
                {order.payments.map((payment) => (
                  <div key={payment.paymentId} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <span>{payment.paymentMethod} · {formatPaymentAmount(payment)}</span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${payment.status === "success" ? "bg-emerald-50 text-success" : "bg-red-50 text-danger"}`}>
                      {payment.status === "success" ? "Thành công" : "Thất bại"}
                    </span>
                    {payment.refundedAt && <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-warning">Đã hoàn tiền</span>}
                  </div>
                ))}
              </div>
            </div>

            {(canCancel || canRefund) && action === null && (
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                {canCancel && <Button size="sm" variant="danger" onClick={() => setAction("cancel")}>Hủy đơn</Button>}
                {canRefund && <Button size="sm" variant="ghost" onClick={() => setAction("refund")}>Ghi nhận hoàn tiền</Button>}
              </div>
            )}

            {action !== null && (
              <div className="border-t border-slate-100 pt-4">
                <h3 className="font-bold text-slate-800">{action === "cancel" ? "Lý do hủy đơn" : "Ghi chú hoàn tiền"} (không bắt buộc)</h3>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-2 min-h-20 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-primary"
                  placeholder="Nhập lý do..."
                />
                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setAction(null); setReason(""); }}>Đóng</Button>
                  <Button
                    size="sm"
                    variant={action === "cancel" ? "danger" : "primary"}
                    disabled={cancelOrder.isPending || markRefunded.isPending}
                    onClick={submitAction}
                  >
                    {action === "cancel" ? "Xác nhận hủy đơn" : "Xác nhận hoàn tiền"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
