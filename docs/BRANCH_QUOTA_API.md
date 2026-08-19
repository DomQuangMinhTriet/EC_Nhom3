# Branch Quota API

Tai lieu nay mo ta API phan bo voucher cho Branch theo Phase 3 Product System
APIs, muc Branch Quota Management.

**Quan trong**: mot voucher da duoc admin duyet (`status = active`) van chua
mua duoc — `POST /customers/me/cart/items` tinh so luong con lai (`available
stock`) tu tong `totalQuantity`/`soldQuantity` cua cac allocation trong module
nay. Neu Partner chua goi `POST /partner/vouchers/:id/branches` de phan bo it
nhat mot branch, voucher se luon co 0 stock va bi tu choi khi khach hang them
vao gio hang, du da active. Xem [CART_API.md](CART_API.md) muc "Loi pho bien".

## Base URL

```text
http://localhost:<PORT>/api
```

Thay `<PORT>` bang port backend trong file `.env`. Moi request deu can access
token cua Partner trong header:

```http
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
```

Request body su dung JSON.

## Tong quan

| Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- |
| `POST /partner/vouchers/:id/branches` | Phan bo voucher cho cac branch | Partner |
| `GET /partner/vouchers/:id/branches` | Xem danh sach branch da duoc phan bo voucher, co phan trang | Partner |
| `PUT /partner/vouchers/:id/branches/:branchId` | Cap nhat quota cua mot branch | Partner |
| `DELETE /partner/vouchers/:id/branches/:branchId` | Thu hoi/xoa phan bo voucher cua mot branch | Partner |

Tat ca endpoint trong module nay chi cho role `Partner`.

`:id` la `voucherProductId`. Voucher phai thuoc partner dang dang nhap. Rieng
API tao phan bo yeu cau voucher co status `active`.

## 1. Phan bo voucher cho branch

### Muc dich

Partner gan voucher cho mot hoac nhieu branch voi `totalQuantity`. Backend chi
chap nhan branch thuoc partner dang dang nhap. Cac allocation da ton tai se bi
skip bang conflict handling.

### Request

```http
POST /api/partner/vouchers/:id/branches
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
[
  {
    "branchProfileId": "00000000-0000-4000-8000-000000000011",
    "totalQuantity": 100
  },
  {
    "branchProfileId": "00000000-0000-4000-8000-000000000012",
    "totalQuantity": 50
  }
]
```

Body phai la array. Moi item hop le can co:

```text
branchProfileId la UUID
totalQuantity la so nguyen >= 0
```

### Response thanh cong

HTTP `201 Created` neu tat ca allocation hop le duoc tao:

```json
{
  "data": [
    {
      "branchProfileId": "00000000-0000-4000-8000-000000000011",
      "voucherProductId": "00000000-0000-4000-8000-000000000004",
      "totalQuantity": 100,
      "soldQuantity": 0,
      "remainingQuantity": 100
    }
  ],
  "message": "Allocations created successfully"
}
```

HTTP `409 Conflict` neu mot so allocation da ton tai va bi skip:

```json
{
  "data": [],
  "message": "Some branch allocations already existed and were skipped (Conflict)"
}
```

## 2. Lay danh sach allocation cua voucher

### Request

```http
GET /api/partner/vouchers/:id/branches?page=1&pageSize=20
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
```

Query ho tro:

| Query | Y nghia | Mac dinh |
| --- | --- | --- |
| `page` | Trang hien tai, bat dau tu 1 | `1` |
| `pageSize` | So item moi trang, toi da 100 | `20` |

### Response thanh cong

HTTP `200 OK`:

```json
{
  "data": [
    {
      "branchProfileId": "00000000-0000-4000-8000-000000000011",
      "voucherProductId": "00000000-0000-4000-8000-000000000004",
      "totalQuantity": 100,
      "soldQuantity": 20,
      "branchName": "Eco Branch 1",
      "address": "District 1, Ho Chi Minh City",
      "phone": "0911111111",
      "remainingQuantity": 80
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

`remainingQuantity = totalQuantity - soldQuantity`.

## 3. Cap nhat quota cua branch

### Muc dich

Partner cap nhat `totalQuantity` cua mot branch allocation. `totalQuantity`
khong duoc nho hon `soldQuantity` hien tai.

### Request

```http
PUT /api/partner/vouchers/:id/branches/:branchId
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "totalQuantity": 120
}
```

### Response thanh cong

HTTP `200 OK`:

```json
{
  "data": {
    "branchProfileId": "00000000-0000-4000-8000-000000000011",
    "voucherProductId": "00000000-0000-4000-8000-000000000004",
    "totalQuantity": 120,
    "soldQuantity": 20,
    "remainingQuantity": 100
  },
  "message": "Allocation updated successfully"
}
```

Neu `totalQuantity < soldQuantity`, API tra HTTP `400 Bad Request`:

```json
{
  "error": "Total quantity cannot be less than sold quantity (20)"
}
```

## 4. Thu hoi allocation cua branch

### Muc dich

Partner thu hoi voucher khoi branch.

Neu `soldQuantity = 0`, backend xoa allocation.

Neu `soldQuantity > 0`, backend khong hard delete de giu lich su va tinh dung
inventory. Thay vao do, backend cap nhat `totalQuantity = soldQuantity`, tuc la
branch khong con quota kha dung nua.

### Request

```http
DELETE /api/partner/vouchers/:id/branches/:branchId
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
```

### Response thanh cong

HTTP `200 OK` neu hard delete:

```json
{
  "message": "Allocation deleted successfully"
}
```

HTTP `200 OK` neu smart revoke:

```json
{
  "message": "Allocation updated (Smart Revoked) to match soldQuantity"
}
```

## Luong su dung de xuat

1. Partner tao voucher qua `POST /api/partner/vouchers`.
2. Admin duyet voucher sang `active`.
3. Partner goi `POST /api/partner/vouchers/:id/branches` de phan bo quota cho
   branch.
4. Partner xem phan bo qua `GET /api/partner/vouchers/:id/branches`.
5. Partner cap nhat quota bang `PUT /api/partner/vouchers/:id/branches/:branchId`.
6. Partner thu hoi quota bang
   `DELETE /api/partner/vouchers/:id/branches/:branchId`.

## Loi pho bien

Response loi co format:

```json
{
  "error": "Error message"
}
```

| HTTP status | Y nghia |
| --- | --- |
| `400` | Voucher ID/branch ID sai dinh dang, body/query khong hop le, voucher chua active, totalQuantity nho hon soldQuantity |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Voucher khong thuoc partner, branch khong thuoc partner, role khong co quyen |
| `404` | Khong tim thay partner profile hoac allocation |
| `409` | Allocation da ton tai hoac update that bai do race condition |
