# Review API

## Base URL

```text
http://localhost:<PORT>/api/reviews
```

Tat ca endpoint can bearer token.

```http
Authorization: Bearer <ACCESS_TOKEN>
```

## Tong quan

| Method | Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- | --- |
| `POST` | `/` | Customer tao review | Customer |
| `PUT` | `/:id` | Customer sua review cua minh | Customer |
| `GET` | `/vouchers/:id` | Xem review cua voucher | Partner, Super Admin, Operational Admin |
| `PATCH` | `/:id/status` | An/xoa mem review | Super Admin, Operational Admin |

`:id` trong `POST` body la `voucherCodeId`. `:id` tren URL co the la
`reviewId` hoac `voucherProductId` tuy endpoint.

## Tao review

Customer chi review duoc voucher code thuoc minh va da `used`.

```http
POST /api/reviews
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "voucherCodeId": "00000000-0000-4000-8000-000000000005",
  "rating": 5,
  "comment": "Rat hai long voi uu dai nay."
}
```

Response `201 Created`:

```json
{
  "data": {
    "reviewId": "00000000-0000-4000-8000-000000000006",
    "rating": 5,
    "comment": "Rat hai long voi uu dai nay.",
    "status": "active"
  }
}
```

## Sua review

```http
PUT /api/reviews/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "rating": 4,
  "comment": "Cap nhat lai danh gia."
}
```

Chi sua duoc review cua Customer dang dang nhap.

## Xem review cua voucher

```http
GET /api/reviews/vouchers/:id
Authorization: Bearer <ACCESS_TOKEN>
```

`:id` la `voucherProductId`.

Partner chi xem duoc review cua voucher thuoc partner profile cua minh.
Super Admin va Operational Admin xem duoc moi voucher.

Response:

```json
{
  "data": {
    "averageRating": 4.5,
    "reviews": []
  }
}
```

## An/xoa mem review

```http
PATCH /api/reviews/:id/status
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "status": "hidden"
}
```

`status` hop le:

```text
hidden
deleted
```

Response:

```json
{
  "data": {
    "reviewId": "00000000-0000-4000-8000-000000000006",
    "status": "hidden"
  }
}
```

## Loi pho bien

| HTTP status | Y nghia |
| --- | --- |
| `400` | Thieu field, rating ngoai 1-5, status khong hop le, UUID sai |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong du quyen hoac resource khong thuoc nguoi goi |
| `404` | Khong tim thay profile, voucher code, voucher product, review |
