# Voucher Instance API

## Base URL

```text
http://localhost:<PORT>/api/voucher-instances
```

Tat ca endpoint can bearer token cua `Customer`.

```http
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Module nay doc voucher code da cap cho Customer sau khi thanh toan thanh cong.

## Tong quan

| Method | Endpoint | Muc dich |
| --- | --- | --- |
| `GET` | `/` | Lay voucher instances cua Customer |
| `GET` | `/:id` | Lay chi tiet mot voucher instance va QR data URI |

`:id` la `voucherCodeId`.

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
      "qr": "ABCD1234",
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

## Loi pho bien

| HTTP status | Y nghia |
| --- | --- |
| `400` | Voucher code ID sai dinh dang |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong phai Customer |
| `404` | Customer profile khong ton tai hoac voucher khong thuoc Customer |
