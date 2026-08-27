# Order API

## Base URL

```text
http://localhost:<PORT>/api/orders
```

`POST /api/orders` can bearer token cua `Customer`:

```http
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

`PUT /api/orders/:id` la endpoint internal/legacy de cap nhat order, dung API key.
Payment callback moi nen dung [PAYMENT_API.md](PAYMENT_API.md):

```http
ec-voucher-api-key: <EC_VOUCHER_API_KEY>
```

`PATCH /api/orders/:id/cancel` can bearer token cua `Customer`:

```http
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

`GET /api/orders`, `GET /api/orders/:id` can bearer token cua `Customer`.
`GET /api/orders/admin`, `GET /api/orders/admin/:id` can bearer token cua `Super_Admin` hoac
`Operational_Admin`.

## Tong quan

| Method | Endpoint | Muc dich |
| --- | --- | --- |
| `GET` | `/` | Customer xem danh sach order cua chinh minh (phan trang) |
| `GET` | `/admin` | Admin xem tat ca order (phan trang, loc), phuc vu dashboard |
| `GET` | `/admin/:id` | Admin xem chi tiet bat ky order nao |
| `GET` | `/:id` | Customer xem chi tiet 1 order cua chinh minh |
| `POST` | `/` | Tao order tu cart |
| `PUT` | `/:id` | Internal/legacy cap nhat order |
| `PATCH` | `/:id/cancel` | Customer huy order dang cho thanh toan |

`:id` la `orderId`. Cac route `/admin` va `/admin/:id` duoc dang ky truoc
route `/:id` trong Express de tranh bi hieu nham la mot `orderId`.

## Trang thai order

Enum `order_status` hien tai:

| Status | Y nghia |
| --- | --- |
| `pending_payment` | Order da tao, dang cho thanh toan |
| `completed` | Thanh toan thanh cong, voucher code da duoc tao |
| `failed` | Thanh toan that bai hoac user huy order |

Do enum hien tai chua co `cancelled`, khi user huy order thi dung
`status = failed` va gui them `reason`.

## Xem danh sach order cua chinh minh

```http
GET /api/orders?page=1&limit=20&status=completed
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Query param (deu optional): `page` (default 1), `limit` (default 20, toi da
100), `status` (`pending_payment` | `completed` | `failed`). Sap xep theo
`createdAt` giam dan (moi nhat truoc).

Response `200 OK`:

```json
{
  "data": [
    {
      "orderId": "00000000-0000-4000-8000-000000000010",
      "customerProfileId": "00000000-0000-4000-8000-000000000002",
      "totalAmount": "200000.00",
      "status": "completed",
      "reason": null,
      "createdAt": "2026-08-20T14:52:27.732Z",
      "updatedAt": "2026-08-20T14:55:10.000Z",
      "items": [
        {
          "orderItemId": "00000000-0000-4000-8000-000000000011",
          "orderId": "00000000-0000-4000-8000-000000000010",
          "voucherProductId": "00000000-0000-4000-8000-000000000003",
          "voucherCodeId": "00000000-0000-4000-8000-000000000021",
          "quantity": 2,
          "unitPrice": "100000.00",
          "voucherProduct": { "...": "giong shape trong POST /api/orders" },
          "voucherCode": { "...": "giong shape trong PUT /api/orders/:id" }
        }
      ],
      "payments": [{ "...": "giong shape trong PUT /api/orders/:id" }]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

## Xem chi tiet 1 order cua chinh minh

```http
GET /api/orders/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Response `200 OK`: `{"data": {...}}` — cung shape voi 1 phan tu trong
`GET /api/orders`. Neu order khong ton tai hoac khong thuoc customer dang
dang nhap, tra ve `404` (khong tra `403`, de khong lo order do co ton tai hay
khong).

## Admin xem tat ca order (dashboard)

```http
GET /api/orders/admin?page=1&limit=20&status=completed&from=2026-08-01&to=2026-08-31&customerProfileId=00000000-0000-4000-8000-000000000002
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

Role: `Super_Admin`, `Operational_Admin`. Query param (deu optional): `page`,
`limit` (giong tren), `status`, `from`/`to` (loc theo `createdAt`, ISO date
string), `customerProfileId` (loc theo 1 khach cu the).

Response `200 OK`: cung shape phan trang nhu `GET /api/orders`, nhung khong
gioi han theo customer va moi phan tu co them field `customer`:

```json
{
  "data": [
    {
      "orderId": "00000000-0000-4000-8000-000000000010",
      "customerProfileId": "00000000-0000-4000-8000-000000000002",
      "customer": { "fullName": "Nguyen Van A", "email": "customer@example.com" },
      "totalAmount": "200000.00",
      "status": "completed",
      "items": [ "..." ],
      "payments": [ "..." ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

## Admin xem chi tiet 1 order bat ky

```http
GET /api/orders/admin/:id
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

Role: `Super_Admin`, `Operational_Admin`. Admin co the xem order theo
`orderId` cua bat ky customer nao, khong bi gioi han theo customer dang dang
nhap.

Response `200 OK`: `{"data": {...}}` - cung shape voi 1 phan tu trong
`GET /api/orders/admin`, bao gom field `customer`, `items`, va `payments`.
Neu `orderId` khong hop le tra `400`. Neu order khong ton tai tra `404`.

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
    "customerProfileId": "00000000-0000-4000-8000-000000000002",
    "totalAmount": "200000.00",
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
- `cartId` chi dung de lay `cart_items` luc checkout, khong duoc luu vao bang
  `orders`.
- Bang `orders` chi luu owner qua `customerProfileId` va tong tien qua
  `totalAmount`.
- Cart khong duoc rong.
- Moi `cart_item` duoc map thanh mot `order_item`.
- `order_item.quantity` giu nguyen quantity cua `cart_item`.
- Order moi co `status = pending_payment`.
- Voucher product phai `active` va khong vuot available stock.
- Backend lock allocation rows va reserve stock bang cach cong
  `branch_voucher_products.soldQuantity` ngay khi tao order.
- Sau khi tao order thanh cong, backend xoa cac `cart_items`; cart rong va co
  the dung tiep cho lan mua sau.

Tong tien:

```text
totalAmount = sum(cart_item.unitPrice * quantity)
```

## Cap nhat order completed (internal/legacy)

Payment callback nen dung `POST /api/payments/callback`. Endpoint nay van duoc
giu cho internal tooling can cap nhat order truc tiep.

```http
PUT /api/orders/:id
ec-voucher-api-key: <EC_VOUCHER_API_KEY>
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
    "totalAmount": "200000.00",
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
        "amount": "200000.00",
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
- Neu random code bi trung, backend retry bang `ON CONFLICT DO NOTHING`, khong
  lam hong transaction dang chay.
- Voucher code duoc luu trong bang `voucher_codes` voi `status = available`.
- `expiredAt` lay moc som hon giua `now + validDurationDays` va
  `voucher_products.endDate`.
- `order_items.voucherCodeId` luu voucher code dau tien cua item de giu lien
  ket tu order item sang voucher code. Tat ca voucher code da sinh van nam
  trong bang `voucher_codes` va co the xem qua Voucher Instance API.
- Neu order da `completed`, API khong sinh voucher code lan nua.
- Neu payment webhook retry cung `transactionId` cho cung order, API tra ve ket
  qua hien tai va khong tao duplicate payment.

Neu body co payment fields, API se tao record trong bang `payments`.
Neu khong gui `amount`, amount mac dinh bang `orders.totalAmount`.
Neu khong gui `currency`, currency mac dinh la `VND`.

Body co the gui amount/currency tuy chinh:

```json
{
  "status": "completed",
  "transactionId": "txn-124",
  "paymentMethod": "bank_transfer",
  "amount": "200000.00",
  "currency": "VND"
}
```

## Customer huy order

```http
PATCH /api/orders/:id/cancel
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "reason": "Customer cancelled order"
}
```

Response `200 OK`: order chuyen sang `failed`.

Neu order dang `pending_payment`, backend release stock da reserve bang cach
tru `branch_voucher_products.soldQuantity` theo so luong order item. Neu order
da `completed`, API tra loi loi vi completed order khong duoc chuyen sang
failed.

## Thanh toan that bai tu internal/legacy update

Payment callback nen dung `POST /api/payments/callback`.

```http
PUT /api/orders/:id
ec-voucher-api-key: <EC_VOUCHER_API_KEY>
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
| `400` | `cartId`/`orderId` khong hop le, cart rong, status/payment invalid, voucher khong active, vuot stock, query param (`page`/`limit`/`status`/`from`/`to`/`customerProfileId`) khong hop le |
| `401` | Thieu/sai bearer token, hoac thieu/sai `ec-voucher-api-key` o endpoint update order |
| `403` | Role khong phu hop (Customer o endpoint tao order/xem order cua minh; Super_Admin/Operational_Admin o `GET /admin` va `GET /admin/:id`) |
| `404` | Khong tim thay customer profile, cart, order |
| `409` | `transactionId` da thuoc order khac |
| `500` | Khong tao duoc order hoac voucher code |
