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

## Tong quan

| Method | Endpoint | Muc dich |
| --- | --- | --- |
| `POST` | `/initiate` | Tao payment request cho order dang `pending_payment` |
| `POST` | `/callback` | Mock callback cho local/demo, giu lai cho card/testing |
| `POST` | `/sepay/webhook` | SePay webhook xac nhan giao dich bank transfer |

Payment module khong tao payment pending record trong bang `payments`. Payment
record chi duoc tao sau khi mock callback hoac SePay webhook xac nhan thanh
cong/that bai.

## Payment methods

```text
bank_transfer
card
```

## Env

```env
SEPAY_BANK_ACCOUNT=0123456789
SEPAY_BANK_NAME=MBBank
SEPAY_ACCOUNT_NAME=EC VOUCHER DEMO
SEPAY_WEBHOOK_API_KEY=replace-with-sepay-webhook-api-key
```

`SEPAY_BANK_*` la thong tin hien thi trong QR/payment screen. Co the dung gia
tri gia de demo. `SEPAY_WEBHOOK_API_KEY` la secret backend dung de xac thuc
request SePay gui den, khong dat trong `NEXT_PUBLIC_*`.

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
