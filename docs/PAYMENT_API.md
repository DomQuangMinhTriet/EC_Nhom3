# Payment API

## Base URL

```text
http://localhost:<PORT>/api/payments
```

## Xac thuc

`POST /api/payments/initiate` can bearer token cua `Customer`:

```http
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

`POST /api/payments/callback` la endpoint mock/internal, dung API key rieng cua
he thong:

```http
ec-voucher-api-key: <EC_VOUCHER_API_KEY>
```

`POST /api/payments/sepay/webhook` la endpoint cho SePay goi vao, dung API key
cua SePay webhook:

```http
Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>
```

`POST /api/payments/paypal/capture` can bearer token cua `Customer` (giong
`/initiate`).

`GET /api/payments/vnpay/ipn` va `GET /api/payments/vnpay/return` khong dung
middleware auth o route layer — xac thuc bang chu ky `vnp_SecureHash` (HMAC-SHA512)
kiem tra inline trong service, giong cach `/sepay/webhook` lam.

## Tong quan

| Method | Endpoint | Muc dich |
| --- | --- | --- |
| `POST` | `/initiate` | Tao payment request cho order dang `pending_payment` |
| `POST` | `/callback` | Mock callback cho local/demo, giu lai cho card/testing |
| `POST` | `/sepay/webhook` | SePay webhook xac nhan giao dich bank transfer |
| `POST` | `/paypal/capture` | Capture PayPal order sau khi customer approve tren trang PayPal |
| `GET` | `/vnpay/ipn` | VNPay goi server-to-server de xac nhan giao dich (nguon su that duy nhat) |
| `GET` | `/vnpay/return` | Browser redirect ve tu VNPay — chi de hien thi UI, khong hoan tat order |

Payment module khong tao payment pending record trong bang `payments`. Payment
record chi duoc tao sau khi mock callback, SePay webhook, PayPal capture, hoac
VNPay IPN xac nhan thanh cong/that bai.

## Payment methods

```text
bank_transfer
card
paypal
vnpay
```

(`stripe` da co san trong DB enum, danh cho Duong tich hop sau — xem
[payment-integration/stripe-integration-guide.md](payment-integration/stripe-integration-guide.md).)

## Env

```env
SEPAY_BANK_ACCOUNT=0123456789
SEPAY_BANK_NAME=MBBank
SEPAY_ACCOUNT_NAME=EC VOUCHER DEMO
SEPAY_WEBHOOK_API_KEY=replace-with-sepay-webhook-api-key

PAYPAL_CLIENT_ID=replace-with-paypal-sandbox-client-id
PAYPAL_CLIENT_SECRET=replace-with-paypal-sandbox-client-secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com

VNPAY_TMN_CODE=replace-with-vnpay-sandbox-tmn-code
VNPAY_HASH_SECRET=replace-with-vnpay-sandbox-hash-secret
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

APP_BASE_URL=https://<frontend-domain>
```

`SEPAY_BANK_*` la thong tin hien thi trong QR/payment screen. Co the dung gia
tri gia de demo. `SEPAY_WEBHOOK_API_KEY` la secret backend dung de xac thuc
request SePay gui den, khong dat trong `NEXT_PUBLIC_*`.

`APP_BASE_URL` la domain frontend, dung de build `return_url`/`cancel_url`
(PayPal) va `vnp_ReturnUrl` (VNPay) — khong co `/` cuoi chuoi.

Chi tiet day du ve tung cong PayPal/VNPay (dang ky sandbox, luong OAuth2/HMAC,
cach test) xem trong thu muc [payment-integration/](payment-integration/).

## Initiate card mock

```http
POST /api/payments/initiate
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "orderId": "00000000-0000-4000-8000-000000000010",
  "paymentMethod": "card"
}
```

Response `201 Created`:

```json
{
  "data": {
    "orderId": "00000000-0000-4000-8000-000000000010",
    "transactionId": "mock_9fb932d1-9614-4a72-a8b6-f2f8705b8df5",
    "paymentMethod": "card",
    "amount": "200000.00",
    "currency": "VND",
    "paymentUrl": "https://mock-payment.local/checkout?orderId=..."
  }
}
```

## Initiate SePay bank transfer

```http
POST /api/payments/initiate
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "orderId": "00000000-0000-4000-8000-000000000010",
  "paymentMethod": "bank_transfer"
}
```

Response `201 Created`:

```json
{
  "data": {
    "orderId": "00000000-0000-4000-8000-000000000010",
    "transactionId": "ECV0000000000004000",
    "paymentMethod": "bank_transfer",
    "amount": "200000.00",
    "currency": "VND",
    "paymentCode": "ECV0000000000004000",
    "qrUrl": "https://vietqr.app/img?acc=0123456789&bank=MBBank&amount=200000&des=ECV0000000000004000",
    "paymentUrl": "https://vietqr.app/img?acc=0123456789&bank=MBBank&amount=200000&des=ECV0000000000004000",
    "bankAccount": {
      "bank": "MBBank",
      "accountNumber": "0123456789",
      "accountName": "EC VOUCHER DEMO"
    }
  }
}
```

Rule:

- Customer chi initiate payment cho order cua chinh minh.
- Order phai dang `pending_payment`.
- Backend sinh `paymentCode` dang `ECV...` va luu vao `orders.paymentCode`.
- QR dung VietQR URL voi `acc`, `bank`, `amount`, `des`.
- Frontend chi hien thi QR/thong tin chuyen khoan va poll order status. Frontend
  khong duoc tu mark payment success cho bank transfer.

## SePay webhook

Webhook URL cau hinh tren SePay dashboard:

```text
https://<public-backend-domain>/api/payments/sepay/webhook
```

Local development can dung public HTTPS tunnel, vi SePay khong goi duoc
`localhost` truc tiep.

Request header:

```http
Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>
Content-Type: application/json
```

Payload SePay gui theo dang:

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2023-03-25 14:02:37",
  "accountNumber": "0123499999",
  "code": null,
  "content": "Thanh toan ECV0000000000004000",
  "transferType": "in",
  "transferAmount": 200000,
  "accumulated": 19077000,
  "subAccount": null,
  "referenceCode": "MBVCB.3278907687",
  "description": ""
}
```

Xu ly:

- Chi xu ly `transferType = in`; giao dich `out` duoc ignore va tra `200`.
- Lay payment code tu `code`, `content`, hoac `description`.
- Tim order bang `orders.paymentCode`.
- So tien phai khop chinh xac voi `orders.totalAmount` (lam tron VND).
- Neu hop le, PaymentService goi Order workflow hien co de chuyen order sang
  `completed`, tao voucher codes, tao payment success, va tao notification.
- `transactionId` luu theo dang `sepay_<id>` de idempotent webhook retry.
- Unknown code / amount mismatch duoc ignore an toan va tra `200`, khong chuyen
  order.

Response thanh cong:

```json
{
  "success": true,
  "ignored": false,
  "order": {
    "orderId": "00000000-0000-4000-8000-000000000010",
    "status": "completed"
  }
}
```

Response ignored:

```json
{
  "success": true,
  "ignored": true,
  "reason": "amount_mismatch"
}
```

## Initiate PayPal

```http
POST /api/payments/initiate
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "orderId": "00000000-0000-4000-8000-000000000010",
  "paymentMethod": "paypal"
}
```

Response `201 Created`:

```json
{
  "data": {
    "orderId": "00000000-0000-4000-8000-000000000010",
    "transactionId": "5O190127TN364715T",
    "paymentMethod": "paypal",
    "amount": "8.00",
    "currency": "USD",
    "paymentUrl": "https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T"
  }
}
```

Rule:

- PayPal khong ho tro VND — backend quy doi sang USD bang mot ty gia co dinh
  (`VND_PER_USD = 25000`, minh hoa cho demo, khong phai ty gia thoi gian thuc).
- `transactionId` chinh la PayPal order id, duoc luu vao `orders.paymentCode`
  (tai su dung cot da co, khong them cot moi).
- Frontend redirect toan bo trang (`window.location.href`) sang `paymentUrl`,
  khong mo tab moi — PayPal se redirect nguoi dung ve dung `return_url` da khai
  bao luc tao order.
- Sau khi customer approve tren trang PayPal va duoc redirect ve
  `/checkout/paypal-return?orderId=...`, frontend goi `POST /paypal/capture`
  de thuc su tru tien (approve khong tu dong tru tien — phai capture).

## PayPal capture

```http
POST /api/payments/paypal/capture
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{ "orderId": "00000000-0000-4000-8000-000000000010" }
```

Response `200 OK` (thanh cong):

```json
{
  "data": {
    "message": "PayPal payment captured successfully.",
    "order": { "orderId": "00000000-0000-4000-8000-000000000010", "status": "completed" }
  }
}
```

Neu order da `completed` tu truoc (goi lai capture do double-click/reload),
endpoint tra ve ngay `{ "message": "Order already completed.", "order": ... }`
ma khong goi lai PayPal — idempotent, khong tao payment record trung.

## Initiate VNPay

```http
POST /api/payments/initiate
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "orderId": "00000000-0000-4000-8000-000000000010",
  "paymentMethod": "vnpay"
}
```

Response `201 Created`:

```json
{
  "data": {
    "orderId": "00000000-0000-4000-8000-000000000010",
    "transactionId": "VNP00000000000004000",
    "paymentMethod": "vnpay",
    "amount": "200000.00",
    "currency": "VND",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=20000000&...&vnp_SecureHash=..."
  }
}
```

Rule:

- Khong can goi API tao order truoc nhu PayPal — backend tu build URL da ky
  (HMAC-SHA512 voi `VNPAY_HASH_SECRET`) roi redirect thang.
- `vnp_TxnRef` dang `VNP<orderId rut gon>` duoc luu vao `orders.paymentCode`,
  cung co che voi `paymentCode` cua SePay (`ECV...`).
- `vnp_Amount` la VND nhan 100 theo dung quy uoc cua VNPay.

## VNPay IPN (nguon su that de hoan tat order)

VNPay goi URL nay server-to-server (GET, query string) sau khi giao dich xu ly
xong tren he thong VNPay — day la co che tuong duong SePay webhook, ap dung lai
nguyen ven `processPaymentResult` va idempotency guard da co:

```text
GET https://<public-backend-domain>/api/payments/vnpay/ipn?vnp_TxnRef=...&vnp_ResponseCode=00&vnp_SecureHash=...
```

Xu ly:

- Xac thuc `vnp_SecureHash` (HMAC-SHA512) truoc tien — sai chu ky tra
  `{ "RspCode": "97", "Message": "Invalid signature" }`.
- Tim order theo `vnp_TxnRef` (khong tim thay tra `RspCode: "01"`).
- So sanh `vnp_Amount` voi `orders.totalAmount * 100` (khong khop tra
  `RspCode: "04"`).
- Order da `completed`/`failed` tu truoc: tra `RspCode: "02"`, khong xu ly lai
  (chan duplicate payment khi VNPay goi lai IPN).
- `vnp_ResponseCode = "00"`: hoan tat order (`completed`), tao voucher +
  notification. Cac ma khac: chuyen order sang `failed` voi ly do tuong ung.
- Luon tra `RspCode: "00"` khi da xu ly xong (ke ca truong hop failed), de
  VNPay biet IPN da duoc nhan, tranh goi lai nhieu lan.

Frontend **khong** duoc tu hoan tat order dua vao redirect browser — chi IPN
o day moi duoc phep goi `processPaymentResult`.

## VNPay return (chi de hien thi UI)

```text
GET /api/payments/vnpay/return?vnp_TxnRef=...&vnp_ResponseCode=00&vnp_SecureHash=...
```

Response chi mang tinh thong bao, **khong lam thay doi trang thai order**:

```json
{ "valid": true, "success": true }
```

Trang `/checkout/vnpay-return` cua frontend doc `orderId` tu chinh query param
minh tu khai bao trong `vnp_ReturnUrl` (khong phai tu VNPay), roi poll
`GET /api/orders/:id` moi 3 giay cho toi khi IPN (o tren) cap nhat xong.

## Mock callback

Mock callback van duoc giu cho card/demo:

```http
POST /api/payments/callback
ec-voucher-api-key: <EC_VOUCHER_API_KEY>
Content-Type: application/json
```

```json
{
  "orderId": "00000000-0000-4000-8000-000000000010",
  "status": "success",
  "transactionId": "mock_txn_123",
  "paymentMethod": "card"
}
```

`status = success` se chuyen order sang `completed`. `status = failed` se chuyen
order sang `failed` va release inventory neu order con `pending_payment`.

## Frontend polling

Sau khi initiate `bank_transfer`, frontend co the poll endpoint co san:

```http
GET /api/orders/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Khi `order.status = completed`, frontend redirect sang trang confirmation.

## Loi pho bien

| HTTP status | Y nghia |
| --- | --- |
| `400` | Payload/request invalid |
| `401` | Sai bearer token, sai `ec-voucher-api-key`, hoac sai `Authorization: Apikey ...` |
| `404` | Khong tim thay order/customer profile |
| `409` | Transaction/order conflict |
| `500` | Thieu cau hinh bank/webhook secret tren backend |
