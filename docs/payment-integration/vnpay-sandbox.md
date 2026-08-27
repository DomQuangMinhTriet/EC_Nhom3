# Tích hợp VNPay Sandbox — tài liệu tham khảo cho báo cáo

Tài liệu này là nguyên liệu kỹ thuật để viết báo cáo "Yêu cầu 3 — Tích hợp
thanh toán điện tử" (mục VNPay, thay cho Momo trong danh sách gợi ý). Không
phải bản báo cáo nộp — cần tự viết lại theo văn phong của mình, đặt tên file
theo quy định `MSSV-VNPay.docx`, đặt trong thư mục `MaNhom-Payment Technique`.

## 1. Overview về API

**VNPay** là cổng thanh toán nội địa phổ biến nhất tại Việt Nam, hỗ trợ thanh
toán qua thẻ ATM/thẻ quốc tế/QR ngân hàng, đứng trung gian giữa website bán
hàng và các ngân hàng.

Khác với PayPal (dùng REST API + OAuth2), VNPay dùng cơ chế đơn giản hơn:
**redirect kèm tham số ký chữ ký số**. Không cần gọi API "tạo đơn" trước —
merchant tự build một URL có đầy đủ tham số giao dịch, ký bằng
**HMAC-SHA512** với một khóa bí mật (`Hash Secret`) do VNPay cấp, rồi redirect
thẳng khách hàng sang URL đó.

Luồng gồm 3 phần:

1. **Build & redirect** — backend build URL thanh toán (VNPay gọi là "cổng
   thanh toán"), có tham số `vnp_TmnCode` (mã merchant), `vnp_Amount`,
   `vnp_TxnRef` (mã giao dịch duy nhất), `vnp_SecureHash` (chữ ký), v.v.
2. **Return URL** — sau khi khách thanh toán xong trên trang VNPay, VNPay
   redirect **trình duyệt** của khách về `vnp_ReturnUrl` đã khai báo, kèm kết
   quả giao dịch trong query string.
3. **IPN (Instant Payment Notification)** — VNPay **đồng thời** gọi một URL
   riêng (`vnp_IpnUrl`, cấu hình sẵn trên merchant portal, không truyền trong
   query) theo kiểu **server-to-server**, không qua trình duyệt khách hàng.

### Vì sao cần cả Return URL lẫn IPN?

Đây là điểm quan trọng nhất cần hiểu rõ khi viết báo cáo: **Return URL không
đáng tin cậy để xác nhận thanh toán**, vì nó đi qua trình duyệt của khách —
khách có thể đóng tab trước khi redirect hoàn tất, mất mạng giữa chừng, hoặc
(về lý thuyết) tự sửa tham số trên URL. **IPN mới là nguồn xác nhận đáng tin
cậy duy nhất**, vì nó là do chính hệ thống VNPay gọi trực tiếp vào server,
không đi qua trình duyệt khách.

→ Dự án thiết kế đúng theo nguyên tắc này: **chỉ IPN được phép hoàn tất đơn
hàng**, Return URL chỉ dùng để hiển thị giao diện "đang xử lý" cho khách nhìn
thấy trong lúc chờ IPN tới. Đây cũng chính xác là cơ chế đã áp dụng cho SePay
(chuyển khoản ngân hàng) trong dự án — VNPay tái sử dụng lại toàn bộ logic
idempotency đã có sẵn (`processPaymentResult`), không viết lại từ đầu.

## 2. Cách đăng ký Sandbox

1. Truy cập <https://sandbox.vnpayment.vn/devreg/>.
2. Điền đầy đủ thông tin đăng ký (tên, email, thông tin website demo).
3. Bấm "Đăng ký", sau đó kiểm tra email để kích hoạt tài khoản.
4. Sau khi kích hoạt, VNPay gửi:
   - **`vnp_TmnCode`** (mã terminal/merchant)
   - **`vnp_HashSecret`** (khóa bí mật dùng để ký/xác thực chữ ký)
5. Merchant portal của sandbox cũng cho khai báo sẵn URL IPN
   (`https://<domain-backend>/api/payments/vnpay/ipn`) để VNPay gọi vào khi có
   giao dịch.

Không cần hồ sơ doanh nghiệp thật cho môi trường sandbox, thời gian kích hoạt
thường trong ngày.

## 3. Luồng đã cài đặt trong dự án

File chính: `backend/src/modules/payment/payment.service.ts` (phần có comment
`// VNPay (Sandbox)`).

| Hàm | Vai trò |
| --- | --- |
| `buildVnpayPaymentUrl()` | Build tham số, sắp xếp theo alphabet, ký HMAC-SHA512, trả về URL redirect |
| `signVnpayParams()` / `verifyVnpaySignature()` | Ký và xác thực chữ ký, dùng chung cho cả build URL, IPN, và return |
| `PaymentService.initiatePayment()` | Nhánh `paymentMethod === "vnpay"`: build URL, lưu `vnp_TxnRef` vào `orders.paymentCode` |
| `PaymentService.handleVnpayIpn()` | Xác thực chữ ký, đối chiếu số tiền, hoàn tất/đánh trượt đơn hàng — **nguồn sự thật duy nhất** |
| `PaymentService.handleVnpayReturn()` | Chỉ xác thực chữ ký để hiển thị UI, **không** gọi `processPaymentResult` |

Endpoint HTTP:

- `POST /api/payments/initiate` với `paymentMethod: "vnpay"` — trả về
  `paymentUrl`.
- `GET /api/payments/vnpay/ipn` — VNPay gọi server-to-server (không cần đăng
  nhập, tự xác thực bằng chữ ký).
- `GET /api/payments/vnpay/return` — trình duyệt khách redirect về đây.

Chi tiết request/response mẫu, mã lỗi `RspCode`: xem
[`docs/PAYMENT_API.md`](../PAYMENT_API.md), mục "Initiate VNPay", "VNPay IPN",
"VNPay return".

Frontend: `frontend/src/components/cart/checkout-screen.tsx` (nút "Đi tới cổng
thanh toán VNPay") và `frontend/src/app/checkout/vnpay-return/page.tsx` (trang
VNPay redirect về, tự động poll trạng thái đơn hàng mỗi 3 giây cho tới khi IPN
xử lý xong).

## 4. Biến môi trường cần cấu hình

```env
VNPAY_TMN_CODE=<mã terminal lấy ở bước đăng ký>
VNPAY_HASH_SECRET=<hash secret lấy ở bước đăng ký>
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
APP_BASE_URL=https://<domain-frontend-thật>
```

`APP_BASE_URL` phải là domain công khai để VNPay redirect trình duyệt khách về
được, và để VNPay gọi được IPN vào backend (backend cũng phải public, không
phải `localhost`).

## 5. Hướng dẫn test luồng đầy đủ

1. Đăng nhập ứng dụng bằng tài khoản Customer thật.
2. Thêm voucher vào giỏ hàng, vào trang thanh toán, chọn phương thức **VNPay**.
3. Bấm "Đi tới cổng thanh toán VNPay" — trình duyệt chuyển sang trang thanh
   toán sandbox của VNPay.
4. Chọn ngân hàng test (VNPay sandbox cung cấp danh sách ngân hàng giả lập +
   số thẻ test riêng, xem trong tài liệu sandbox merchant portal).
5. Nhập thông tin thẻ test + OTP test theo hướng dẫn VNPay cung cấp.
6. VNPay redirect trình duyệt về `/checkout/vnpay-return?orderId=...` — trang
   hiển thị "đang xác nhận", tự poll cho tới khi IPN xử lý xong.
7. Kiểm tra: đơn hàng chuyển `completed`, voucher đã được cấp.

Có thể kiểm tra riêng log IPN trên merchant portal sandbox của VNPay để xác
nhận backend đã trả đúng `RspCode: "00"`.

## 6. Checklist nội dung báo cáo (theo tiêu chí chấm điểm)

- **Thẩm mỹ, trình bày (15%)**: chụp màn hình từng bước, có sơ đồ luồng
  redirect + IPN (khuyến khích vẽ sequence diagram: Browser ↔ Backend ↔ VNPay).
- **Nội dung tìm hiểu (35%)**: giải thích rõ vì sao cần phân biệt Return URL
  (không đáng tin) và IPN (nguồn sự thật), cách chữ ký HMAC-SHA512 bảo vệ khỏi
  giả mạo tham số.
- **Triển khai cài đặt lên host (50%)**: quay video demo luồng thật đã deploy
  (không phải `localhost`) từ lúc chọn VNPay đến khi voucher xuất hiện, upload
  YouTube ở chế độ Public Unlisted.
