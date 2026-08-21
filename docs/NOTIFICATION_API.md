# Notification API

Tai lieu nay mo ta muc dich va cach su dung cac API Notification theo
implementation hien tai.

## Base URL

```text
http://localhost:<PORT>/api/notifications
```

Thay `<PORT>` bang port backend trong file `.env`. Request body su dung JSON.

## Tong quan

| Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- |
| `GET /` | Lay tat ca notification cua customer dang dang nhap | Customer |
| `POST /email` | Gui email notification va luu notification neu email thuoc Customer | Internal service co `ec-voucher-api-key` |

`GET /` dung bearer token cua Customer. `POST /email` khong dung bearer token,
ma dung header noi bo `ec-voucher-api-key` de tranh bi spam.

## Cau hinh moi truong

Backend `.env` can co:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_EMAIL_FUNCTION_NAME=send-email
EC_VOUCHER_API_KEY=replace-with-a-long-random-api-key
```

Supabase Edge Function `send-email` can co secrets rieng tren Supabase
Dashboard, khong phai trong backend `.env`:

```env
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=EC Voucher <no-reply@your-domain.com>
```

Neu dung Resend voi domain rieng, domain trong `EMAIL_FROM` phai duoc verify
tren Resend truoc khi gui email that.

## 1. Lay notification cua customer hien tai

### Muc dich

Tra ve danh sach notification cua Customer dang dang nhap, sap xep moi nhat
truoc.

### Request

```http
GET /api/notifications
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

Endpoint nay khong can header `ec-voucher-api-key`.

### Response thanh cong

HTTP `200 OK`:

```json
{
  "notifications": [
    {
      "notificationId": "d429190f-cd71-4263-b007-052b232e6d38",
      "customerProfileId": "fb692f71-a5cd-4b64-a744-5d24d539a85d",
      "title": "Voucher approved",
      "body": "Your voucher is ready.",
      "isRead": false,
      "createdAt": "2026-08-20T14:52:27.732Z"
    }
  ]
}
```

Neu customer chua co profile, API tra HTTP `404 Not Found`:

```json
{
  "error": "Customer profile not found"
}
```

## 2. Gui email notification

### Muc dich

Gui email qua Supabase Edge Function va luu notification vao database neu
`email` trong request thuoc mot Customer profile.

Endpoint nay danh cho internal service hoac tool test, nen duoc bao ve bang
header `ec-voucher-api-key`.

### Request

```http
POST /api/notifications/email
ec-voucher-api-key: <EC_VOUCHER_API_KEY>
Content-Type: application/json
```

```json
{
  "email": "customer@example.com",
  "title": "Voucher approved",
  "body": "Your voucher is ready."
}
```

Field bat buoc: `email`, `title`, `body`.

### Response thanh cong khi tim thay customer

HTTP `201 Created`:

```json
{
  "message": "Email notification sent successfully.",
  "notification": {
    "notificationId": "d429190f-cd71-4263-b007-052b232e6d38",
    "customerProfileId": "fb692f71-a5cd-4b64-a744-5d24d539a85d",
    "title": "Voucher approved",
    "body": "Your voucher is ready.",
    "isRead": false,
    "createdAt": "2026-08-20T14:52:27.732Z"
  },
  "customerProfileId": "fb692f71-a5cd-4b64-a744-5d24d539a85d"
}
```

### Response thanh cong khi khong tim thay customer

Email van duoc gui, nhung backend khong luu notification vao database:

```json
{
  "message": "Email notification sent successfully.",
  "notification": null,
  "customerProfileId": null
}
```

### Loi thuong gap khi gui email

Thieu hoac sai API key:

```json
{
  "error": "Invalid EC Voucher API key"
}
```

Thieu field bat buoc:

```json
{
  "error": "email, title, and body are required"
}
```

Supabase Edge Function hoac Resend tra loi:

```json
{
  "error": "Could not send email through Supabase: 502 {\"error\":\"Email provider rejected request\"}"
}
```

Neu gap loi Resend domain chua verify, can vao Resend Domains va verify domain
trong `EMAIL_FROM`.

## Luong su dung de xuat

1. Internal service goi `POST /api/notifications/email` voi
   `ec-voucher-api-key`.
2. Backend goi Supabase Edge Function `send-email`.
3. Edge Function gui email that qua Resend.
4. Backend dung `email` tim Customer profile.
5. Neu tim thay Customer profile, backend luu record vao bang `notifications`.
6. Customer dang nhap goi `GET /api/notifications` bang access token de xem
   notification cua minh.

## Loi pho bien

Response loi co format:

```json
{
  "error": "Error message"
}
```

| HTTP status | Y nghia |
| --- | --- |
| `400` | Thieu field bat buoc hoac email khong hop le |
| `401` | Thieu bearer token, bearer token khong hop le, hoac sai `ec-voucher-api-key` |
| `403` | Role khong phai Customer khi goi `GET /api/notifications` |
| `404` | Customer chua co profile |
| `500` | Backend thieu bien moi truong bat buoc |
| `502` | Supabase Edge Function hoac email provider tra loi loi |
