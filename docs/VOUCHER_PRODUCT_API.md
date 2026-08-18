# Voucher Product API

Tai lieu nay mo ta API quan ly voucher product theo Phase 3 Product System APIs.
Partner tao va quan ly voucher cua minh; Admin duyet voucher; public chi xem
duoc voucher da `active`.

## Base URL

```text
http://localhost:<PORT>/api
```

Thay `<PORT>` bang port backend trong file `.env`. Cac API Partner/Admin can
access token trong header:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

Request body su dung JSON.

## Tong quan

| Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- |
| `POST /partner/vouchers` | Partner tao voucher moi, status luon la `pending` | Partner |
| `GET /partner/vouchers` | Lay tat ca voucher cua partner dang dang nhap | Partner |
| `PATCH /partner/vouchers/:id` | Cap nhat voucher cua partner dang dang nhap, dua ve `pending` de duyet lai | Partner |
| `GET /vouchers` | Lay voucher `active` trong he thong, co phan trang | Public |
| `GET /vouchers/:id` | Lay chi tiet voucher `active` | Public |
| `PATCH /admin/vouchers/:id/status` | Admin duyet/tu choi/an voucher | Super Admin, Operational Admin |

## Gia tri hop le

### Discount type

```text
direct
percentage
```

### Voucher status

```text
pending
active
rejected
inactive
out_of_stock
expired
```

Admin API hien cho phep cap nhat sang:

```text
active
inactive
rejected
```

## 1. Partner tao voucher

### Muc dich

Partner tao voucher moi. Backend tu lay `partnerProfileId` tu user dang dang
nhap va luon tao voucher voi `status = pending`. Client khong duoc quyet dinh
status; neu gui `status` trong body thi backend cung bo qua.

### Request

```http
POST /api/partner/vouchers
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

Field bat buoc:

```text
categoryId
title
originalPrice
discountType
discountValue
startDate
endDate
validDurationDays
```

Validation chinh:

```text
categoryId phai ton tai
title khong duoc rong
originalPrice >= 0
discountValue >= 0
startDate < endDate
validDurationDays >= 1
minLimit >= 1
maxLimit >= minLimit neu co gui
```

### Response thanh cong

HTTP `201 Created`:

```json
{
  "voucher": {
    "voucherProductId": "00000000-0000-4000-8000-000000000004",
    "categoryId": "00000000-0000-4000-8000-000000000003",
    "partnerProfileId": "00000000-0000-4000-8000-000000000002",
    "title": "Eco Coffee Voucher",
    "description": "Giam gia cho don hang coffee",
    "originalPrice": "100000.00",
    "discountType": "percentage",
    "discountValue": "20.00",
    "startDate": "2026-08-20T00:00:00.000Z",
    "endDate": "2026-09-20T00:00:00.000Z",
    "validDurationDays": 30,
    "minLimit": 1,
    "maxLimit": 5,
    "imageUrl": "https://example.com/voucher.png",
    "status": "pending",
    "rejectionReason": null,
    "createdAt": "2026-08-18T10:00:00.000Z",
    "updatedAt": "2026-08-18T10:00:00.000Z"
  }
}
```

## 2. Partner lay voucher cua minh

### Request

```http
GET /api/partner/vouchers
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
```

API tra tat ca voucher thuoc partner dang dang nhap, gom moi status.

### Response thanh cong

HTTP `200 OK`:

```json
{
  "vouchers": []
}
```

Neu user chua co partner profile, API tra HTTP `404 Not Found`:

```json
{
  "error": "Partner profile not found"
}
```

## 3. Partner cap nhat voucher

### Request

```http
PATCH /api/partner/vouchers/:id
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "title": "Eco Coffee Voucher Updated",
  "description": "Mo ta moi",
  "maxLimit": 10,
  "imageUrl": "https://example.com/new-image.png"
}
```

Partner chi cap nhat duoc voucher thuoc partner profile cua minh. API nay khong
cho partner cap nhat `status`, `partnerProfileId`, `rejectionReason`,
`createdAt`, `updatedAt`.

Sau moi lan Partner cap nhat voucher, backend tu dua `status` ve `pending` va
xoa `rejectionReason` de Admin duyet lai noi dung moi. Noi dung vua sua se
khong xuat hien o API public cho den khi Admin approve lai.

Field co the cap nhat:

```text
categoryId
title
description
originalPrice
discountType
discountValue
startDate
endDate
validDurationDays
minLimit
maxLimit
imageUrl
```

### Response thanh cong

HTTP `200 OK`:

```json
{
  "voucher": {
    "voucherProductId": "00000000-0000-4000-8000-000000000004",
    "title": "Eco Coffee Voucher Updated",
    "status": "pending"
  }
}
```

Neu voucher khong ton tai hoac khong thuoc partner dang dang nhap:

```json
{
  "error": "Voucher not found"
}
```

## 4. Lay tat ca voucher trong he thong

### Request

```http
GET /api/vouchers?page=1&pageSize=20
```

Query ho tro:

| Query | Y nghia | Mac dinh |
| --- | --- | --- |
| `page` | Trang hien tai, bat dau tu 1 | `1` |
| `pageSize` | So item moi trang, toi da 100 | `20` |
| `categoryId` | Loc theo category | Khong loc |
| `status` | Chi chap nhan `active` tren public API | `active` |
| `search` | Tim theo title/description | Khong tim |

Public API luon loc `status = active`. Neu client gui `status=pending`,
`status=rejected` hoac status khac `active`, API tra `400 Bad Request`.

### Response thanh cong

HTTP `200 OK`:

```json
{
  "vouchers": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 5. Lay chi tiet voucher

### Request

```http
GET /api/vouchers/:id
```

### Response thanh cong

HTTP `200 OK`:

```json
{
  "voucher": {
    "voucherProductId": "00000000-0000-4000-8000-000000000004",
    "title": "Eco Coffee Voucher",
    "status": "active"
  }
}
```

Neu voucher khong ton tai hoac voucher chua `active`:

```json
{
  "error": "Voucher not found"
}
```

## 6. Admin cap nhat status voucher

### Muc dich

Chi `Super_Admin` va `Operational_Admin` duoc duyet hoac tu choi voucher. Partner
khong co quyen tu cap nhat status.

### Request approve

```http
PATCH /api/admin/vouchers/:id/status
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "status": "active"
}
```

### Request reject

```json
{
  "status": "rejected",
  "rejectionReason": "Thieu thong tin dieu kien su dung"
}
```

Neu `status = rejected`, `rejectionReason` la bat buoc.

### Response thanh cong

HTTP `200 OK`:

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

## Luong su dung de xuat

1. Partner tao voucher qua `POST /api/partner/vouchers`.
2. Voucher moi luon co status `pending`.
3. Partner xem voucher cua minh qua `GET /api/partner/vouchers`.
4. Partner co the sua thong tin voucher qua `PATCH /api/partner/vouchers/:id`;
   voucher se quay ve `pending`.
5. Admin duyet lai voucher qua `PATCH /api/admin/vouchers/:id/status`.
6. Client/public lay danh sach qua `GET /api/vouchers` va chi tiet qua
   `GET /api/vouchers/:id`.

## Loi pho bien

Response loi co format:

```json
{
  "error": "Error message"
}
```

| HTTP status | Y nghia |
| --- | --- |
| `400` | Thieu field bat buoc, sai kieu field, ngay/gia/limit/status khong hop le |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong co quyen truy cap API |
| `404` | Khong tim thay partner profile, category hoac voucher |
