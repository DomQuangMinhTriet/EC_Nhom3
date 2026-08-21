# Cart API

## Base URL

```text
http://localhost:<PORT>/api/carts
```

Tat ca endpoint can bearer token cua `Customer`.

```http
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

## Tong quan

| Method | Endpoint | Muc dich |
| --- | --- | --- |
| `GET` | `/me` | Xem gio hang hien tai |
| `POST` | `/me/items` | Them voucher vao gio |
| `PUT` | `/me/items/:id` | Cap nhat quantity cua cart item |
| `DELETE` | `/me/items/:id` | Xoa cart item |

`:id` la `cartItemId`.

## Xem gio hang

```http
GET /api/carts/me
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Response `200 OK`:

```json
{
  "data": {
    "cartId": "00000000-0000-4000-8000-000000000001",
    "customerProfileId": "00000000-0000-4000-8000-000000000002",
    "items": []
  }
}
```

## Them item

```http
POST /api/carts/me/items
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "voucherProductId": "00000000-0000-4000-8000-000000000004",
  "quantity": 2
}
```

Response `201 Created`:

```json
{
  "data": {
    "cartItemId": "00000000-0000-4000-8000-000000000003",
    "quantity": 2,
    "unitPrice": "100000.00"
  }
}
```

## Cap nhat quantity

```http
PUT /api/carts/me/items/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "quantity": 3
}
```

Giam quantity duoc chap nhan ngay. Tang quantity se kiem tra lai available
stock.

## Xoa item

```http
DELETE /api/carts/me/items/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Response `200 OK`:

```json
{
  "data": {
    "message": "Item removed from cart successfully"
  }
}
```

## Available stock

Available stock cua voucher duoc tinh tu bang `branch_voucher_products`:

```text
sum(totalQuantity) - sum(soldQuantity)
```

Neu voucher chua duoc phan bo branch nao, API them vao gio se tra loi:

```json
{
  "error": "This voucher has not been allocated to any branch yet and is not available for purchase"
}
```

## Loi pho bien

| HTTP status | Y nghia |
| --- | --- |
| `400` | Quantity khong hop le, voucher khong active, chua duoc allocation, hoac vuot stock |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong phai Customer |
| `404` | Khong tim thay customer profile, voucher product, cart item |
