# Review API

Tai lieu nay mo ta API danh gia (review) voucher.

## Base URL

```text
http://localhost:<PORT>/api
```

Thay `<PORT>` bang port backend trong file `.env`. Moi request deu can access
token trong header:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

Request body su dung JSON.

## Tong quan

| Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- |
| `POST /customers/me/reviews` | Tao review cho voucher da su dung | Customer |
| `PUT /customers/me/reviews/:id` | Sua review cua chinh minh | Customer |
| `GET /vouchers/:id/reviews` | Xem danh sach review va diem trung binh cua mot voucher | Partner, Super Admin, Operational Admin |
| `PATCH /admin/reviews/:id/status` | An hoac xoa (mem) mot review | Super Admin, Operational Admin |

`:id` o `PUT /customers/me/reviews/:id` va `PATCH /admin/reviews/:id/status`
la `reviewId`. `:id` o `GET /vouchers/:id/reviews` la `voucherProductId`.

## 1. Tao review

### Muc dich

Customer chi tao duoc review cho voucher instance (`voucherCode`) thuoc so huu
cua minh va da o trang thai `used`.

### Request

```http
POST /api/customers/me/reviews
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

Field bat buoc: `voucherCodeId`, `rating` (so nguyen 1-5), `comment`.

### Response thanh cong

HTTP `201 Created`, tra ve review vua tao voi `status: "active"`.

## 2. Sua review

### Request

```http
PUT /api/customers/me/reviews/:id
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "rating": 4,
  "comment": "Cap nhat lai danh gia sau khi dung them."
}
```

Chi sua duoc review thuoc so huu cua chinh Customer dang dang nhap. Review sau
khi sua duoc danh dau `isEdited: true`.

## 3. Xem review cua mot voucher

### Request

```http
GET /api/vouchers/:id/reviews
Authorization: Bearer <ACCESS_TOKEN>
```

Partner chi xem duoc review cua voucher thuoc partner profile cua minh.
Super Admin/Operational Admin xem duoc moi voucher.

### Response thanh cong

HTTP `200 OK`:

```json
{
  "data": {
    "averageRating": 4.5,
    "reviews": []
  }
}
```

`averageRating` va `reviews` chi tinh tren review co `status: "active"`.

## 4. An/xoa review (Admin)

### Request

```http
PATCH /api/admin/reviews/:id/status
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "status": "hidden"
}
```

`status` hop le: `hidden`, `deleted`. Day la xoa mem — record van con trong
database, chi doi `status`, khong bi xoa that.

## Loi pho bien

Response loi co format:

```json
{
  "error": "Error message"
}
```

| HTTP status | Y nghia |
| --- | --- |
| `400` | Thieu field bat buoc, `rating` ngoai khoang 1-5, voucher instance chua o trang thai `used`, `status` khong hop le |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong co quyen, hoac voucher/review khong thuoc ve nguoi goi |
| `404` | Khong tim thay customer profile, voucher instance, voucher product, hoac review |
