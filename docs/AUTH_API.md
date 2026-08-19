# Auth API

Tai lieu nay mo ta muc dich va cach su dung cac API dang ky, dang nhap va lam
moi token theo implementation hien tai.

## Base URL

```text
http://localhost:<PORT>/api/auth
```

Thay `<PORT>` bang port backend trong file `.env`. Request body su dung JSON.

## Tong quan

| Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- |
| `POST /register` | Tu dang ky tai khoan | Cong khai |
| `POST /register/partner` | Admin tao tai khoan Partner | Super Admin, Operational Admin |
| `POST /register/branch` | Partner tao tai khoan Branch | Partner |
| `POST /login` | Dang nhap va nhan token | Cong khai, account phai active |
| `POST /refresh` | Tao cap token moi | Co refresh token hop le |

## 1. Tu dang ky

### Muc dich

Tao tai khoan Supabase Auth va user local. Neu khong gui `roleCode`, backend mac
dinh dung role `Customer`.

Role tu dang ky hop le:

```text
Customer
Partner
Branch
```

`Super_Admin` va `Operational_Admin` khong duoc tu dang ky qua endpoint nay.
User local duoc tao voi status mac dinh `pending`.

### Request

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "email": "customer@example.com",
  "password": "strong-password",
  "roleCode": "Customer"
}
```

Co the bo `roleCode` neu muon dang ky Customer:

```json
{
  "email": "customer@example.com",
  "password": "strong-password"
}
```

### Response thanh cong

HTTP `201 Created`:

```json
{
  "message": "Registration successful. Please verify your email before logging in.",
  "user": {
    "userId": "00000000-0000-4000-8000-000000000001",
    "email": "customer@example.com",
    "roleCode": "Customer",
    "status": "pending",
    "createdAt": "2026-08-16T10:00:00.000Z",
    "updatedAt": "2026-08-16T10:00:00.000Z"
  }
}
```

## 2. Admin tao Partner

### Muc dich

Cho phep `Super_Admin` hoac `Operational_Admin` tao tai khoan dang nhap cho
Partner. API su dung Supabase Admin, xac nhan email ngay va luon gan:

```json
{
  "roleCode": "Partner",
  "status": "pending"
}
```

Client khong can gui `roleCode` hay `status`.

### Request

```http
POST /api/auth/register/partner
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "email": "partner@example.com",
  "password": "strong-password"
}
```

### Response thanh cong

HTTP `201 Created`:

```json
{
  "message": "Partner registered successfully.",
  "user": {
    "userId": "00000000-0000-4000-8000-000000000003",
    "email": "partner@example.com",
    "roleCode": "Partner",
    "status": "pending",
    "createdAt": "2026-08-16T10:00:00.000Z",
    "updatedAt": "2026-08-16T10:00:00.000Z"
  }
}
```

Request thieu bearer token tra HTTP `401`. Token khong co role `Super_Admin`
hoac `Operational_Admin` tra HTTP `403`.

## 3. Partner tao Branch

### Muc dich

Cho phep Partner tao tai khoan dang nhap cho Branch. API su dung Supabase Admin,
xac nhan email ngay va luon gan:

```json
{
  "roleCode": "Branch",
  "status": "pending"
}
```

Client khong can gui `roleCode` hay `status`.

### Request

```http
POST /api/auth/register/branch
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "email": "branch@example.com",
  "password": "strong-password"
}
```

### Response thanh cong

HTTP `201 Created`:

```json
{
  "message": "Branch registered successfully.",
  "user": {
    "userId": "00000000-0000-4000-8000-000000000002",
    "email": "branch@example.com",
    "roleCode": "Branch",
    "status": "pending",
    "createdAt": "2026-08-16T10:00:00.000Z",
    "updatedAt": "2026-08-16T10:00:00.000Z"
  }
}
```

Request thieu bearer token tra HTTP `401`. Token khong co role `Partner` tra
HTTP `403`.

## 4. Dang nhap

### Muc dich

Xac thuc email/password qua Supabase va cap access token, refresh token cua
backend. Chi account co status `active` moi dang nhap thanh cong.

### Request

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

### Response thanh cong

HTTP `200 OK`:

```json
{
  "user": {
    "userId": "00000000-0000-4000-8000-000000000001",
    "email": "user@example.com",
    "roleCode": "Customer",
    "status": "pending"
  },
  "accessToken": "<ACCESS_TOKEN>",
  "refreshToken": "<REFRESH_TOKEN>"
}
```

Dung access token cho API can xac thuc:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

Sai email hoac password tra HTTP `401 Unauthorized`.

Account co status `pending`, `banned` hoac `deactivated` tra HTTP
`403 Forbidden`:

```json
{
  "error": "Account is not active"
}
```

## 5. Lam moi token

### Muc dich

Dung refresh token de tao access token va refresh token moi.

### Request

```http
POST /api/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "<REFRESH_TOKEN>"
}
```

### Response thanh cong

HTTP `200 OK`:

```json
{
  "user": {
    "userId": "00000000-0000-4000-8000-000000000001",
    "email": "user@example.com",
    "roleCode": "Customer",
    "status": "pending"
  },
  "accessToken": "<NEW_ACCESS_TOKEN>",
  "refreshToken": "<NEW_REFRESH_TOKEN>"
}
```

## Luong su dung de xuat

1. Nguoi dung goi `/register` de tao tai khoan.
2. Nguoi dung goi `/login` de nhan access token va refresh token.
3. Client gui access token trong header `Authorization` khi goi API bao ve.
4. Super Admin hoac Operational Admin goi `/register/partner` de tao tai khoan Partner.
5. Partner goi `/register/branch` de tao tai khoan Branch.
6. Khi access token het han, client goi `/refresh` bang refresh token.

## Loi pho bien

Response loi co format:

```json
{
  "error": "Error message"
}
```

| HTTP status | Y nghia |
| --- | --- |
| `400` | Thieu field, roleCode khong hop le hoac Supabase tu choi dang ky |
| `401` | Sai thong tin dang nhap, thieu token hoac token khong hop le |
| `403` | Role khong du quyen truy cap endpoint |
| `500` | Backend khong the tao hoac doc user local |
| `502` | Supabase khong tra ve user hop le |
