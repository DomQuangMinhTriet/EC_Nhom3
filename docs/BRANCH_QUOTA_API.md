# Branch Quota API

## Base URL

```text
http://localhost:<PORT>/api/quotas
```

Tat ca endpoint can bearer token cua `Partner`.

```http
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
```

## Tong quan

| Method | Endpoint | Muc dich |
| --- | --- | --- |
| `POST` | `/vouchers/:id/branches` | Phan bo voucher cho branch |
| `GET` | `/vouchers/:id/branches` | Lay allocation cua voucher |
| `PUT` | `/vouchers/:id/branches/:branchId` | Cap nhat quota branch |
| `DELETE` | `/vouchers/:id/branches/:branchId` | Thu hoi/xoa allocation |

`:id` la `voucherProductId`. `:branchId` la `branchProfileId`.

Voucher phai thuoc Partner dang dang nhap. Tao allocation yeu cau voucher da
`active`.

## Phan bo voucher cho branch

```http
POST /api/quotas/vouchers/:id/branches
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
[
  {
    "branchProfileId": "00000000-0000-4000-8000-000000000011",
    "totalQuantity": 100
  }
]
```

Body phai la array. Moi item can `branchProfileId` hop le va
`totalQuantity >= 0`.

Response `201 Created`:

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

Neu allocation da ton tai, API co the tra `409 Conflict` va skip cac item do.

## Lay allocations

```http
GET /api/quotas/vouchers/:id/branches?page=1&pageSize=20
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
```

Response `200 OK`:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Cap nhat quota

```http
PUT /api/quotas/vouchers/:id/branches/:branchId
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "totalQuantity": 120
}
```

`totalQuantity` khong duoc nho hon `soldQuantity`.

Response:

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

## Thu hoi allocation

```http
DELETE /api/quotas/vouchers/:id/branches/:branchId
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
```

Neu `soldQuantity = 0`, backend hard delete. Neu `soldQuantity > 0`, backend
smart revoke bang cach set `totalQuantity = soldQuantity`.

Response hard delete:

```json
{
  "message": "Allocation deleted successfully"
}
```

Response smart revoke:

```json
{
  "message": "Allocation updated (Smart Revoked) to match soldQuantity"
}
```

## Lien quan Cart

Cart tinh available stock tu tong allocation:

```text
sum(totalQuantity) - sum(soldQuantity)
```

Neu voucher active nhung chua co allocation, Customer van khong them vao cart
duoc.

## Loi pho bien

| HTTP status | Y nghia |
| --- | --- |
| `400` | UUID/body/query sai, voucher chua active, totalQuantity < soldQuantity |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Voucher/branch khong thuoc Partner hoac role khong du quyen |
| `404` | Khong tim thay partner profile hoac allocation |
| `409` | Allocation da ton tai hoac update race condition |
