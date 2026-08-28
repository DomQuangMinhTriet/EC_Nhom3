# Voucher Product API

## Base URL

```text
http://localhost:<PORT>/api/vouchers
```

Public co the xem voucher active. Partner/Admin endpoints can bearer token.

```http
Authorization: Bearer <ACCESS_TOKEN>
```

## Tong quan

| Method | Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- | --- |
| `GET` | `/` | Lay public listing voucher active | Public |
| `GET` | `/:id` | Lay chi tiet voucher active | Public |
| `POST` | `/` | Partner tao voucher moi | Partner |
| `GET` | `/mine` | Partner lay voucher cua minh | Partner |
| `PATCH` | `/:id` | Partner cap nhat voucher cua minh | Partner |
| `GET` | `/admin` | Admin liet ke voucher theo bat ky status nao (vd. `pending` de duyet) | Super Admin, Operational Admin |
| `PATCH` | `/:id/status` | Admin cap nhat status voucher | Super Admin, Operational Admin |

Luu y route `/:id` public duoc khai bao truoc `/:id/status` nhung khong anh
huong vi method khac nhau (`GET` va `PATCH`).

## Gia tri hop le

Discount type:

```text
direct
percentage
```

Voucher status:

```text
pending
active
rejected
inactive
out_of_stock
expired
```

Admin chi duoc cap nhat sang:

```text
active
inactive
rejected
```

## Public listing

```http
GET /api/vouchers?page=1&pageSize=20&search=coffee
```

Query:

| Query | Mac dinh | Mo ta |
| --- | --- | --- |
| `page` | `1` | Trang hien tai |
| `pageSize` | `20` | So item moi trang, toi da 100 |
| `categoryId` | none | Loc theo category |
| `status` | `active` | Public chi chap nhan `active` |
| `search` | none | Tim title/description |

Response `200 OK`:

```json
{
  "vouchers": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Public detail

```http
GET /api/vouchers/:id
```

Neu voucher khong ton tai hoac khong active:

```json
{
  "error": "Voucher not found"
}
```

## Partner tao voucher

```http
POST /api/vouchers
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "categoryId": "00000000-0000-4000-8000-000000000003",
  "title": "Eco Coffee Voucher",
  "description": "Giam gia cho don hang coffee",
  "originalPrice": "100000",
  "discountType": "percentage",
  "discountValue": "20",
  "startDate": "2026-08-20T00:00:00.000Z",
  "endDate": "2026-09-20T00:00:00.000Z",
  "validDurationDays": 30,
  "minLimit": 1,
  "maxLimit": 5,
  "imageUrl": "https://example.com/voucher.png"
}
```

Voucher moi luon co `status = pending`.

Response `201 Created`:

```json
{
  "voucher": {
    "voucherProductId": "00000000-0000-4000-8000-000000000004",
    "title": "Eco Coffee Voucher",
    "status": "pending"
  }
}
```

## Partner lay voucher cua minh

```http
GET /api/vouchers/mine
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
```

Response:

```json
{
  "vouchers": []
}
```

## Partner cap nhat voucher

```http
PATCH /api/vouchers/:id
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "title": "Eco Coffee Voucher Updated",
  "maxLimit": 10
}
```

Sau khi partner sua, backend dua voucher ve `pending` va xoa
`rejectionReason`.

## Admin liet ke voucher theo status

```http
GET /api/vouchers/admin?status=pending&page=1&pageSize=100
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

Khong bi gioi han `status = active` nhu public listing — dung endpoint nay
de lay danh sach voucher `pending` cho man hinh duyet.

Response giong format cua public listing.

## Admin cap nhat status

```http
PATCH /api/vouchers/:id/status
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

Approve:

```json
{
  "status": "active"
}
```

Reject:

```json
{
  "status": "rejected",
  "rejectionReason": "Thieu dieu kien su dung"
}
```

Response:

```json
{
  "message": "Voucher status updated successfully.",
  "voucher": {
    "voucherProductId": "00000000-0000-4000-8000-000000000004",
    "status": "active",
    "rejectionReason": null
  }
}
```

## Validation chinh

```text
categoryId phai ton tai
title khong rong
originalPrice >= 0
discountValue >= 0
startDate < endDate
validDurationDays >= 1
minLimit >= 1
maxLimit >= minLimit neu co gui
```

## Loi pho bien

| HTTP status | Y nghia |
| --- | --- |
| `400` | Thieu field, sai kieu, UUID/status/date/limit khong hop le |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong du quyen |
| `404` | Khong tim thay partner profile, category hoac voucher |
