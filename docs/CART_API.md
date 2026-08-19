# Cart API

Tai lieu nay mo ta API gio hang cho Customer.

## Base URL

```text
http://localhost:<PORT>/api
```

Thay `<PORT>` bang port backend trong file `.env`. Moi request deu can access
token cua Customer trong header:

```http
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Request body su dung JSON.

## Tong quan

| Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- |
| `GET /customers/me/cart` | Xem gio hang hien tai, tu dong tao gio hang neu chua co | Customer |
| `POST /customers/me/cart/items` | Them voucher vao gio hang | Customer |
| `PUT /customers/me/cart/items/:id` | Cap nhat so luong mot item trong gio | Customer |
| `DELETE /customers/me/cart/items/:id` | Xoa mot item khoi gio hang | Customer |

Tat ca endpoint trong module nay chi cho role `Customer`. `:id` o
`PUT`/`DELETE` la `cartItemId`.

## 1. Xem gio hang

### Request

```http
GET /api/customers/me/cart
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

### Response thanh cong

HTTP `200 OK`:

```json
{
  "data": {
    "cartId": "00000000-0000-4000-8000-000000000001",
    "customerProfileId": "00000000-0000-4000-8000-000000000002",
    "items": [
      {
        "cartItemId": "00000000-0000-4000-8000-000000000003",
        "quantity": 2,
        "unitPrice": "100000.00",
        "voucherProduct": {
          "voucherProductId": "00000000-0000-4000-8000-000000000004",
          "title": "Eco Coffee Voucher",
          "imageUrl": null,
          "originalPrice": "100000.00",
          "discountType": "percentage",
          "discountValue": "20.00",
          "status": "active"
        }
      }
    ]
  }
}
```

## 2. Them voucher vao gio hang

### Muc dich

Them moi hoac cong don so luong neu voucher da co san trong gio. Backend kiem
tra voucher dang `active` va con du so luong (`available stock`) truoc khi cho
them.

### Request

```http
POST /api/customers/me/cart/items
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "voucherProductId": "00000000-0000-4000-8000-000000000004",
  "quantity": 2
}
```

### Response thanh cong

HTTP `201 Created`, tra ve cart item (them moi hoac da cong don).

## 3. Cap nhat so luong

### Request

```http
PUT /api/customers/me/cart/items/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "quantity": 3
}
```

Giam so luong luon duoc chap nhan ma khong kiem tra ton kho. Tang so luong se
kiem tra lai `available stock` nhu khi them moi.

## 4. Xoa item

### Request

```http
DELETE /api/customers/me/cart/items/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

## Available stock duoc tinh nhu the nao

`available stock` cua mot voucher = tong `totalQuantity` tru tong
`soldQuantity` tren tat ca allocation trong bang `branch_voucher_products`
(xem [BRANCH_QUOTA_API.md](BRANCH_QUOTA_API.md)). Neu Partner chua phan bo
voucher cho branch nao, `available stock = 0` va API tra loi rieng (xem ben
duoi) thay vi loi "het hang" chung chung.

## Loi pho bien

Response loi co format:

```json
{
  "error": "Error message"
}
```

| HTTP status | Y nghia |
| --- | --- |
| `400` | `quantity` khong hop le, voucher khong `active`, voucher chua duoc phan bo cho branch nao, hoac vuot qua `available stock` |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong phai Customer |
| `404` | Khong tim thay customer profile, voucher product, hoac cart item |

Loi `400` khi voucher chua duoc phan bo cho branch nao co message:

```json
{
  "error": "This voucher has not been allocated to any branch yet and is not available for purchase"
}
```

Khac voi loi het hang thong thuong:

```json
{
  "error": "Not enough stock available. Available: 0"
}
```
