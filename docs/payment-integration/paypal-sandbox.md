# Tích hợp PayPal Sandbox — tài liệu tham khảo cho báo cáo

Tài liệu này là nguyên liệu kỹ thuật để viết báo cáo "Yêu cầu 3 — Tích hợp thanh
toán điện tử" (mục bắt buộc PayPal Sandbox). Không phải bản báo cáo nộp — bạn
cần tự viết lại theo văn phong của mình, đặt tên file theo quy định
`MSSV-Paypal Sandbox.docx`, đặt trong thư mục `MaNhom-Payment Technique`.

## 1. Overview về API

**PayPal** là cổng thanh toán quốc tế phổ biến nhất thế giới, hỗ trợ nhận thanh
toán bằng thẻ và ví PayPal qua giao diện thanh toán do chính PayPal host (khách
hàng không nhập thông tin thẻ trên website của mình).

Dự án dùng **REST API — Orders API v2** (`/v2/checkout/orders`), là API được
PayPal khuyến nghị chính thức thay cho SDK Checkout cũ (Classic API/NVP đã bị
deprecated). Cơ chế xác thực là **OAuth 2.0 Client Credentials Grant**: đổi
`Client ID` + `Client Secret` lấy access token, dùng token đó gọi các API còn
lại.

Luồng thanh toán gồm 3 bước:

1. **Create Order** (`POST /v2/checkout/orders`, `intent: CAPTURE`) — backend
   tạo một "order" phía PayPal, PayPal trả về một URL để redirect khách hàng
   sang trang thanh toán do PayPal host (gọi là *approve link*).
2. **Approve** — khách hàng đăng nhập tài khoản PayPal (hoặc tài khoản sandbox
   test) trên trang PayPal, xác nhận thanh toán. PayPal redirect trình duyệt về
   `return_url` mà ứng dụng đã khai báo lúc tạo order.
3. **Capture** (`POST /v2/checkout/orders/{id}/capture`) — đây là bước **thực
   sự trừ tiền**. Approve chỉ là khách hàng đồng ý, chưa trừ tiền — nếu không
   gọi capture, giao dịch sẽ không hoàn tất dù khách đã "approve".

Vì bước capture xảy ra đồng bộ ngay khi trình duyệt quay lại ứng dụng, tích hợp
này **không cần webhook riêng** để xác nhận thanh toán (khác với SePay/VNPay —
2 cổng đó thanh toán qua chuyển khoản ngân hàng, không có bước "capture" đồng
bộ nên bắt buộc phải có webhook/IPN xác nhận không đồng bộ).

### Giới hạn quan trọng: PayPal không hỗ trợ VND

PayPal **không có** VND trong danh sách tiền tệ được hỗ trợ. Toàn bộ đơn hàng
trong hệ thống được lưu bằng VND, nên trước khi gửi lên PayPal, backend phải
quy đổi sang USD. Vì đây là đồ án demo, dự án dùng **một tỷ giá cố định**
(`1 USD = 25.000 VND`) thay vì gọi API tỷ giá thời gian thực — nên ghi rõ điều
này trong báo cáo như một giới hạn đã biết (known limitation), không phải lỗi.

## 2. Cách đăng ký Sandbox

1. Truy cập <https://developer.paypal.com>, đăng nhập bằng tài khoản PayPal cá
   nhân bất kỳ (hoặc tạo mới).
2. Vào mục **Apps & Credentials**, đảm bảo đang ở chế độ **Sandbox** (không
   phải Live).
3. PayPal tự động tạo sẵn 1 app REST API mặc định — bấm vào app đó để xem:
   - **Client ID**
   - **Secret** (bấm "Show" để hiện)
4. Ở mục **Sandbox Accounts**, PayPal tự tạo sẵn 2 tài khoản test:
   - Một tài khoản **Business** (đóng vai người bán — nhận tiền)
   - Một tài khoản **Personal** (đóng vai người mua — dùng để đăng nhập và
     "trả tiền" khi test luồng approve)
   Có thể xem/đổi mật khẩu của các tài khoản test này trong mục đó.

Không cần đăng ký doanh nghiệp thật, không cần chờ duyệt — toàn bộ có ngay sau
khi đăng nhập.

## 3. Luồng đã cài đặt trong dự án

File chính: `backend/src/modules/payment/payment.service.ts` (phần có comment
`// PayPal (Sandbox)`).

| Hàm | Vai trò |
| --- | --- |
| `getPaypalAccessToken()` | `POST /v1/oauth2/token`, Basic Auth bằng Client ID/Secret, đổi lấy access token |
| `createPaypalOrder()` | `POST /v2/checkout/orders`, tạo order với `amount` (USD), trả về `paypalOrderId` + approve link |
| `capturePaypalOrderRequest()` | `POST /v2/checkout/orders/{id}/capture`, thực sự trừ tiền |
| `PaymentService.initiatePayment()` | Nhánh `paymentMethod === "paypal"`: quy đổi VND→USD, gọi `createPaypalOrder`, lưu `paypalOrderId` vào `orders.paymentCode` |
| `PaymentService.capturePaypalPayment()` | Kiểm tra quyền sở hữu đơn hàng, gọi capture, gọi `processPaymentResult` để hoàn tất đơn (giống hệt cơ chế đã dùng cho SePay) |

Endpoint HTTP:

- `POST /api/payments/initiate` với `paymentMethod: "paypal"` — trả về
  `paymentUrl` (approve link).
- `POST /api/payments/paypal/capture` với `{ orderId }` — gọi sau khi khách
  quay lại từ PayPal, để thực sự hoàn tất thanh toán.

Chi tiết request/response mẫu: xem [`docs/PAYMENT_API.md`](../PAYMENT_API.md),
mục "Initiate PayPal" và "PayPal capture".

Frontend: `frontend/src/components/cart/checkout-screen.tsx` (nút "Đi tới cổng
thanh toán PayPal", điều hướng cả trang bằng `window.location.href`, không mở
tab mới) và `frontend/src/app/checkout/paypal-return/page.tsx` (trang PayPal
redirect về, tự động gọi capture rồi chuyển tới trang xác nhận đơn hàng).

## 4. Biến môi trường cần cấu hình

```env
PAYPAL_CLIENT_ID=<Client ID lấy ở bước 2>
PAYPAL_CLIENT_SECRET=<Secret lấy ở bước 2>
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
APP_BASE_URL=https://<domain-frontend-thật>
```

`APP_BASE_URL` phải là domain **có thể truy cập công khai** (không phải
`localhost`) nếu muốn test luồng redirect thật — PayPal cần redirect trình
duyệt về đúng domain này.

## 5. Hướng dẫn test luồng đầy đủ

1. Đăng nhập ứng dụng bằng tài khoản Customer thật của hệ thống.
2. Thêm voucher vào giỏ hàng, vào trang thanh toán, chọn phương thức
   **PayPal (Sandbox)**.
3. Bấm "Đi tới cổng thanh toán PayPal" — trình duyệt chuyển sang trang PayPal
   sandbox.
4. Đăng nhập bằng **tài khoản Personal (buyer)** đã tạo ở bước đăng ký (không
   phải tài khoản PayPal thật của bạn).
5. Xác nhận thanh toán trên trang PayPal.
6. PayPal tự động redirect về `/checkout/paypal-return?orderId=...` — trang này
   tự gọi API capture, hiển thị "Đang xác nhận thanh toán", rồi chuyển tới
   trang xác nhận đơn hàng khi thành công.
7. Kiểm tra: đơn hàng chuyển trạng thái `completed`, voucher đã được cấp trong
   mục "Voucher của tôi".

Trường hợp hủy: bấm "Cancel" trên trang PayPal thay vì xác nhận — sẽ redirect
về cùng trang return với tham số `cancelled=1`, hiển thị thông báo đã hủy, đơn
hàng vẫn ở trạng thái chờ để thử lại.

## 6. Checklist nội dung báo cáo (theo tiêu chí chấm điểm)

- **Thẩm mỹ, trình bày (15%)**: chụp màn hình từng bước (trang checkout chọn
  PayPal → trang PayPal sandbox → trang xác nhận thành công), trình bày rõ
  ràng, có mục lục.
- **Nội dung tìm hiểu (35%)**: giải thích OAuth2 Client Credentials là gì, vì
  sao cần bước capture riêng (khác approve), vì sao PayPal không nhận VND.
- **Triển khai cài đặt lên host (50%)**: quay video demo luồng thật (đã deploy,
  không phải chạy `localhost`) từ lúc chọn PayPal đến khi voucher xuất hiện,
  upload YouTube ở chế độ Public Unlisted.
