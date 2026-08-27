# Hướng dẫn cắm Stripe vào — dành cho Dương

Đây **không phải báo cáo**, mà là hướng dẫn kỹ thuật để cắm Stripe vào nhanh,
theo đúng khuôn mẫu PayPal/VNPay đã có sẵn trong nhánh này — không cần tự nghĩ
lại kiến trúc, không cần migration DB mới.

## Đã chuẩn bị sẵn cho bạn

- **`"stripe"` đã có sẵn trong enum `payment_method` trên DB thật** (thêm cùng
  lúc với `paypal`/`vnpay`, xem `backend/src/db/schema/enums.ts`, dòng
  `// Reserved for Dương's Stripe integration`) — **không cần chạy migration
  DB nào nữa**, chỉ cần pull `main` về là dùng được cột này ngay.
- Toàn bộ pattern service/route/frontend cho payment method mới đã có 2 ví dụ
  thật để copy: PayPal (flow gọi API tạo order trước rồi redirect — giống
  cách Stripe Checkout Session hoạt động) và VNPay (flow build URL ký sẵn rồi
  redirect thẳng, có webhook riêng xác nhận — giống SePay).

## Bước 1 — Chọn API Stripe phù hợp

Stripe có 2 cách tích hợp phổ biến, chọn 1 trong 2 tuỳ mức độ muốn kiểm soát
giao diện:

- **Stripe Checkout (Checkout Session)** — Stripe host sẵn 1 trang thanh toán
  đẹp, giống hệt cách PayPal host trang approve. Nếu chọn cách này, **copy
  gần như nguyên khuôn mẫu PayPal** (`createPaypalOrder`/`capturePaypalOrder`
  trong `payment.service.ts`): tạo Checkout Session (`stripe.checkout.sessions.create`),
  trả về URL để redirect, sau khi khách thanh toán xong Stripe redirect về
  `success_url` đã khai báo.
- **Payment Intents API** — kiểm soát chi tiết hơn (tự vẽ form nhập thẻ bằng
  Stripe Elements), phức tạp hơn, không cần thiết cho một demo đồ án. Khuyến
  nghị **không chọn** cách này trừ khi có lý do cụ thể.

→ Khuyến nghị: dùng **Stripe Checkout Session**, theo khuôn PayPal.

## Bước 2 — Đăng ký Stripe Sandbox (Test mode)

1. Truy cập <https://dashboard.stripe.com/register>, tạo tài khoản.
2. Stripe mặc định mở ở **Test mode** (góc trên bên phải dashboard có toggle
   Test/Live) — không cần kích hoạt tài khoản thật để lấy key test.
3. Vào **Developers → API keys**, lấy `Publishable key` và `Secret key` (bản
   test, bắt đầu bằng `pk_test_...` và `sk_test_...`).
4. Cài SDK: `npm install stripe` trong `backend/`.

## Bước 3 — Các file cần sửa (theo đúng khuôn PayPal)

| File | Việc cần làm |
| --- | --- |
| `backend/src/modules/payment/payment.service.ts` | Thêm section mới `// Stripe`, viết `createStripeCheckoutSession()` (dùng SDK `stripe.checkout.sessions.create`) và `getStripeSession()`/xác thực webhook. Thêm nhánh `paymentMethod === "stripe"` trong `initiatePayment` — lưu `session.id` vào `orders.paymentCode` như PayPal lưu `paypalOrderId`. |
| `backend/src/modules/payment/payment.controller.ts` + `payment.routes.ts` | Thêm `POST /api/payments/stripe/webhook` (Stripe xác thực webhook bằng chữ ký header `Stripe-Signature` + `STRIPE_WEBHOOK_SECRET`, dùng `stripe.webhooks.constructEvent` — không dùng lại `verifyVnpaySignature`, đây là cơ chế riêng của Stripe SDK). Không cần endpoint `capture` riêng như PayPal — Checkout Session tự trừ tiền khi khách thanh toán xong, webhook `checkout.session.completed` là nguồn xác nhận (giống IPN của VNPay). |
| `backend/src/modules/order/order.repository.ts`, `order.service.ts` | Thêm `"stripe"` vào 2 mảng `paymentMethods` (đang bị lặp thủ công ở 2 nơi — xem cách PayPal/VNPay đã thêm). |
| `frontend/src/features/order/order-api.ts` | Thêm `"stripe"` vào union `PaymentMethod`. |
| `frontend/src/components/cart/checkout-screen.tsx` | Thêm `stripe` vào `paymentLabels`, `paymentBadges`, và **thêm vào `redirectPaymentMethods`** (Set đã có sẵn cho paypal/vnpay — Stripe Checkout cũng là flow redirect nên chỉ cần thêm 1 dòng vào Set này, không cần viết lại nhánh JSX). |
| `frontend/src/app/checkout/stripe-return/page.tsx` (file mới) | Copy y hệt cấu trúc `vnpay-return/page.tsx` (poll trạng thái đơn hàng), vì Stripe cũng xác nhận qua webhook không đồng bộ, không qua bước capture riêng như PayPal. |

## Bước 4 — Biến môi trường

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

(`APP_BASE_URL` đã có sẵn từ PayPal/VNPay, dùng chung được.)

## Bước 5 — Test webhook Stripe cục bộ

Stripe không gọi được `localhost` trực tiếp (giống SePay/VNPay). Dùng
**Stripe CLI** (`stripe listen --forward-to localhost:<PORT>/api/payments/stripe/webhook`)
để forward webhook về máy local khi code, trước khi deploy thật lên host.

## Lưu ý quan trọng

- **Không cần động vào** kiến trúc `PaymentService`, `processPaymentResult`,
  hay logic race-condition/idempotency đã có — toàn bộ đã dùng chung được cho
  Stripe nếu bạn theo đúng khuôn `updateOrderBySystem` + `wasNewlyCompleted`
  như PayPal/VNPay đang làm.
- Bài yêu cầu deploy thật lên host (50% điểm) — nhớ cấu hình webhook URL trên
  Stripe dashboard trỏ về domain backend thật (Railway), không chỉ test bằng
  Stripe CLI cục bộ.
