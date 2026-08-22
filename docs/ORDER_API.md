# Order API

## Base URL

```text
http://localhost:<PORT>/api/orders
```

Tat ca endpoint can bearer token cua `Customer`.

```http
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

## Tong quan

| Method | Endpoint | Muc dich |
| --- | --- | --- |
| `POST` | `/` | Tao order tu cart |
| `PUT` | `/:id` | Cap nhat order khi thanh toan hoac huy/thanh toan that bai |

`:id` la `orderId`.

## Trang thai order

Enum `order_status` hien tai:

| Status | Y nghia |
| --- | --- |
| `pending_payment` | Order da tao, dang cho thanh toan |
| `completed` | Thanh toan thanh cong, voucher code da duoc tao |
| `failed` | Thanh toan that bai hoac user huy order |

Do enum hien tai chua co `cancelled`, khi user huy order thi dung
`status = failed` va gui them `reason`.

## Tao order tu cart

```http
POST /api/orders
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "cartId": "00000000-0000-4000-8000-000000000001"
}
```

Response `201 Created`:

```json
{
  "data": {
    "orderId": "00000000-0000-4000-8000-000000000010",
    "cartId": "00000000-0000-4000-8000-000000000001",
    "customerProfileId": "00000000-0000-4000-8000-000000000002",
    "subtotalAmount": "200000.00",
    "discountAmount": "20000.00",
    "totalAmount": "180000.00",
    "status": "pending_payment",
    "reason": null,
    "items": [
      {
        "orderItemId": "00000000-0000-4000-8000-000000000011",
        "voucherProductId": "00000000-0000-4000-8000-000000000003",
        "voucherCodeId": null,
        "quantity": 2,
        "unitPrice": "100000.00",
        "voucherProduct": {
          "voucherProductId": "00000000-0000-4000-8000-000000000003",
          "title": "Voucher an uong",
          "imageUrl": "https://example.com/voucher.png",
          "originalPrice": "100000.00",
          "discountType": "percentage",
          "discountValue": "10.00"
        },
        "voucherCode": null
      }
    ],
    "payments": []
  }
}
```

Logic tao order:

- Customer chi tao order tu cart cua chinh minh.
- Cart khong duoc rong.
- Moi `cart_item` duoc map thanh mot `order_item`.
- `order_item.quantity` giu nguyen quantity cua `cart_item`.
- Order moi co `status = pending_payment`.
- Neu cart da co order, API tra loi conflict.
- Voucher product phai `active` va khong vuot available stock.

Tong tien:

```text
subtotalAmount = sum(cart_item.unitPrice * quantity)
discountAmount = sum(discount cua tung item * quantity)
totalAmount = subtotalAmount - discountAmount
```

Voi `discountType = direct`, discount toi da bang `unitPrice`.
Voi `discountType = percentage`, discount value toi da duoc tinh nhu `100`.

## Cap nhat order completed

```http
PUT /api/orders/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "status": "completed",
  "transactionId": "txn-123",
  "paymentMethod": "card"
}
```

`paymentMethod` hop le:

```text
bank_transfer
card
```

Response `200 OK`:

```json
{
  "data": {
    "orderId": "00000000-0000-4000-8000-000000000010",
    "status": "completed",
    "totalAmount": "180000.00",
    "items": [
      {
        "orderItemId": "00000000-0000-4000-8000-000000000011",
        "voucherProductId": "00000000-0000-4000-8000-000000000003",
        "voucherCodeId": "00000000-0000-4000-8000-000000000021",
        "quantity": 2,
        "unitPrice": "100000.00",
        "voucherCode": {
          "voucherCodeId": "00000000-0000-4000-8000-000000000021",
          "code": "Q3fNs6L6R8YWf5WnV7t0GgkP",
          "status": "available",
          "expiredAt": "2026-12-31T00:00:00.000Z"
        }
      }
    ],
    "payments": [
      {
        "paymentId": "00000000-0000-4000-8000-000000000031",
        "transactionId": "txn-123",
        "paymentMethod": "card",
        "amount": "180000.00",
        "currency": "VND",
        "status": "success"
      }
    ]
  }
}
```

Khi order chuyen sang `completed`:

- He thong tao voucher code cho cac `order_items` chua co code.
- Voi moi `order_item`, so voucher code duoc tao bang `order_item.quantity`.
- Moi voucher code la chuoi ngau nhien 24 ky tu.
- Voucher code duoc luu trong bang `voucher_codes` voi `status = available`.
- `expiredAt` lay moc som hon giua `now + validDurationDays` va
  `voucher_products.endDate`.
- `order_items.voucherCodeId` luu voucher code dau tien cua item de giu lien
  ket tu order item sang voucher code. Tat ca voucher code da sinh van nam
  trong bang `voucher_codes` va co the xem qua Voucher Instance API.
- Neu order da `completed`, API khong sinh voucher code lan nua.

Neu body co payment fields, API se tao record trong bang `payments`.
Neu khong gui `amount`, amount mac dinh bang `orders.totalAmount`.
Neu khong gui `currency`, currency mac dinh la `VND`.

Body co the gui amount/currency tuy chinh:

```json
{
  "status": "completed",
  "transactionId": "txn-124",
  "paymentMethod": "bank_transfer",
  "amount": "180000.00",
  "currency": "VND"
}
```

## Huy order hoac thanh toan that bai

```http
PUT /api/orders/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "status": "failed",
  "reason": "Customer cancelled order"
}
```

Neu can ghi nhan payment failed:

```json
{
  "status": "failed",
  "transactionId": "txn-125",
  "paymentMethod": "card",
  "reason": "Payment gateway rejected transaction"
}
```

Payment failed se duoc luu voi `payments.status = failed`.

## Rule chuyen trang thai

| Hien tai | Trang thai moi | Ket qua |
| --- | --- | --- |
| `pending_payment` | `completed` | Hop le, sinh voucher code |
| `pending_payment` | `failed` | Hop le |
| `completed` | `completed` | Hop le, khong sinh code lan nua |
| `completed` | `failed` | Khong hop le |
| `failed` | `completed` | Khong hop le |

## Loi pho bien

| HTTP status | Y nghia |
| --- | --- |
| `400` | `cartId`/`orderId` khong hop le, cart rong, status/payment invalid, voucher khong active, vuot stock |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong phai Customer |
| `404` | Khong tim thay customer profile, cart, order |
| `409` | Cart da co order |
| `500` | Khong tao duoc order hoac voucher code |
