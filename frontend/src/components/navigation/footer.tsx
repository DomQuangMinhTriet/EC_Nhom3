export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-10">
        <div className="grid gap-6 text-xs text-slate-500 sm:grid-cols-3">
          <div>
            <b className="mb-2 block text-sm text-slate-900">ECVoucher</b>
            <p className="leading-6">Sàn thương mại điện tử voucher giảm giá, kết nối Đối tác và Khách hàng.</p>
          </div>
          <div>
            <b className="mb-2 block text-sm text-slate-900">Chính sách hoàn trả</b>
            <p className="leading-6">
              Voucher đã đổi tại quầy (đã chuyển trạng thái &quot;Đã dùng&quot;) không được hoàn trả. Với voucher chưa sử dụng và còn trong thời hạn, liên hệ đội ngũ hỗ trợ trong vòng 7 ngày kể từ ngày mua để được xem xét hoàn tiền; thời gian xử lý hoàn tiền tối đa 5-10 ngày làm việc tuỳ phương thức thanh toán.
            </p>
          </div>
          <div>
            <b className="mb-2 block text-sm text-slate-900">Hỗ trợ</b>
            <p className="leading-6">Email: support@ecnhom3.cloud</p>
          </div>
        </div>
        <p className="mt-6 border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} ECVoucher — Đồ án môn Thương mại điện tử, Nhóm 3.
        </p>
      </div>
    </footer>
  );
}
