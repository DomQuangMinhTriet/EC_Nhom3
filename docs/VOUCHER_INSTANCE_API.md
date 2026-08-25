# Voucher Instance API

## Base URL

```text
http://localhost:<PORT>/api/voucher-instances
```

Endpoint xem voucher cua minh can bearer token cua `Customer`.
Endpoint redeem can bearer token cua `Branch`.

```http
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Module nay doc voucher code da cap cho Customer sau khi thanh toan thanh cong.
Dong thoi ho tro Branch tra cuu va xac nhan su dung voucher code tai chi
nhanh.

## Tong quan

| Method  | Endpoint        | Muc dich                                         |
| ------- | --------------- | ------------------------------------------------ |
| `GET`   | `/`             | Lay voucher instances cua Customer               |
| `GET`   | `/redeem/:code` | Branch tra cuu voucher code truoc khi redeem     |
| `PATCH` | `/redeem/:code` | Branch xac nhan su dung voucher code             |
| `GET`   | `/:id`          | Lay chi tiet mot voucher instance va QR data URI |

`:id` la `voucherCodeId`. `:code` la ma voucher khach hang dua cho chi
nhanh.

## Lay voucher instances cua minh

```http
GET /api/voucher-instances
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Co the loc theo status:

```http
GET /api/voucher-instances?status=available
```

Status duoc repository chap nhan:

```text
available
used
expired
cancelled
```

Response:

```json
{
  "data": [
    {
      "voucherCodeId": "00000000-0000-4000-8000-000000000010",
      "code": "ABCD1234",
      "status": "available",
      "expiredAt": "2026-09-20T00:00:00.000Z",
      "usedAt": null,
      "voucherProduct": {
        "voucherProductId": "00000000-0000-4000-8000-000000000004",
        "title": "Eco Coffee Voucher"
      }
    }
  ]
}
```

## Lay chi tiet voucher instance

```http
GET /api/voucher-instances/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Response:

```json
{
  "data": {
    "voucherCodeId": "00000000-0000-4000-8000-000000000010",
    "code": "ABCD1234",
    "status": "available",
    "qrDataUri": "data:image/png;base64,..."
  }
}
```

Backend chi tra voucher thuoc Customer dang dang nhap.
`qrDataUri` duoc generate on-the-fly tu `code`; bang `voucher_codes` khong
luu column `qr`.

## Branch tra cuu voucher code

```http
GET /api/voucher-instances/redeem/SECRET-CODE-123
Authorization: Bearer <BRANCH_ACCESS_TOKEN>
```

Backend se:

- Tim voucher theo `voucher_codes.code`.
- Lay branch profile tu user dang dang nhap.
- Kiem tra voucher product da duoc phan bo cho branch trong
  `branch_voucher_products`.
- Tra ve `redeemable` va `reason` de FE hien thi trang thai.

Response hop le:

```json
{
  "data": {
    "voucherCodeId": "00000000-0000-4000-8000-000000000010",
    "voucherProductId": "00000000-0000-4000-8000-000000000004",
    "customerProfileId": "00000000-0000-4000-8000-000000000002",
    "code": "SECRET-CODE-123",
    "status": "available",
    "expiredAt": "2026-09-20T00:00:00.000Z",
    "usedAt": null,
    "redeemable": true,
    "reason": null,
    "customer": {
      "customerProfileId": "00000000-0000-4000-8000-000000000002",
      "fullName": "Nguyen Van A",
      "phone": "0900000000"
    },
    "voucherProduct": {
      "voucherProductId": "00000000-0000-4000-8000-000000000004",
      "title": "Eco Coffee Voucher"
    }
  }
}
```

Neu voucher da het han hoac da su dung, API van tra `200 OK` de Branch co the
xem ly do:

```json
{
  "data": {
    "code": "SECRET-CODE-123",
    "status": "used",
    "usedAt": "2026-08-25T10:30:00.000Z",
    "redeemable": false,
    "reason": "Voucher has already been used"
  }
}
```

## Branch xac nhan su dung voucher code

```http
PATCH /api/voucher-instances/redeem/SECRET-CODE-123
Authorization: Bearer <BRANCH_ACCESS_TOKEN>
```

Backend chi cho redeem khi voucher:

- Ton tai.
- Thuoc voucher product da phan bo cho branch dang dang nhap.
- `status = available`.
- `usedAt IS NULL`.
- `expiredAt` lon hon thoi diem hien tai.

Khi thanh cong, backend update `voucher_codes.status = used` va
`voucher_codes.usedAt = now()`. Khong can migration database moi.

Response `200 OK`:

```json
{
  "data": {
    "code": "SECRET-CODE-123",
    "status": "used",
    "usedAt": "2026-08-25T10:30:00.000Z",
    "redeemable": false,
    "reason": null
  }
}
```

Neu voucher het han/da dung/cancelled, API tra `400`. Neu request khac vua
redeem truoc do, API tra `409`.

## Loi pho bien

| HTTP status | Y nghia                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `400`       | Voucher code ID sai dinh dang, code rong, voucher da het han/da dung/cancelled                       |
| `401`       | Thieu bearer token hoac token khong hop le                                                           |
| `403`       | Role khong phu hop, hoac voucher khong duoc phan bo cho branch nay                                   |
| `404`       | Customer/Branch profile khong ton tai, voucher khong thuoc Customer, hoac voucher code khong ton tai |
| `409`       | Voucher vua bi thay doi trang thai truoc khi xac nhan redeem                                         |
