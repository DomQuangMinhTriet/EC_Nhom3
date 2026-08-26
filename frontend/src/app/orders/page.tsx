"use client";
import { ProtectedPage } from "@/components/auth/protected-page";
import { CustomerShell } from "@/components/customer/customer-shell";
import { PageHeader } from "@/components/common/page-header";
import { State } from "@/components/common/state";
import { useMyOrders } from "@/hooks/queries/use-order";
import type { Order, OrderStatus } from "@/features/order/order-api";

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

function itemsSummary(order: Order) {
  return order.items.map((item) => `${item.quantity} × ${item.voucherProduct.title}`).join(", ");
}

export default function OrdersPage() {
  return (
    <ProtectedPage role="customer">
      <CustomerShell active="/orders">
        <PageHeader title="Lịch sử đơn hàng" subtitle="Theo dõi các đơn hàng và voucher đã mua."/>
        <OrdersTable/>
      </CustomerShell>
    </ProtectedPage>
  );
}

function OrdersTable() {
  const ordersQuery = useMyOrders();
  const orders = ordersQuery.data?.data ?? [];

  if (ordersQuery.isLoading) {
    return <State icon="⏳" title="Đang tải đơn hàng" text="Vui lòng chờ trong giây lát."/>;
  }

  if (ordersQuery.isError) {
    return <State icon="⚠️" title="Không thể tải đơn hàng" text={ordersQuery.error instanceof Error ? ordersQuery.error.message : "Đã xảy ra lỗi."}/>;
  }

  if (orders.length === 0) {
    return <State icon="🧾" title="Chưa có đơn hàng nào" text="Mua voucher để bắt đầu tạo đơn hàng đầu tiên."/>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-brand-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Mã đơn</th>
              <th className="px-5 py-3">Ngày mua</th>
              <th className="px-5 py-3">Voucher</th>
              <th className="px-5 py-3">Tổng tiền</th>
              <th className="px-5 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr className="border-t border-slate-100" key={order.orderId}>
                <td className="px-5 py-4 font-mono font-bold text-primary">{order.orderId.slice(0, 8)}</td>
                <td className="px-5 py-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-5 py-4 text-slate-600">{itemsSummary(order)}</td>
                <td className="px-5 py-4 font-semibold">{Number(order.totalAmount).toLocaleString("vi-VN")}đ</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[order.status]}`}>{statusLabel[order.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
