# Auth API

## Base URL

```text
http://localhost:<PORT>/api/auth
```

Request body dung JSON. Cac endpoint tao account noi bo can bearer token theo
role ghi trong bang tong quan.

## Tong quan

| Method | Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- | --- |
| `POST` | `/register/customer` | Customer tu dang ky | Public |
| `POST` | `/register/super-admin` | Tao Super Admin | Super Admin |
| `POST` | `/register/operational-admin` | Tao Operational Admin | Super Admin |
| `POST` | `/register/partner` | Tao Partner | Super Admin, Operational Admin |
| `POST` | `/register/branch` | Tao Branch | Partner |
| `POST` | `/login` | Dang nhap | Public, account active |
| `POST` | `/refresh` | Lam moi token | Refresh token hop le |

## Register

### Customer

```http
POST /api/auth/register/customer
Content-Type: application/json
```

```json
{
  "email": "customer@example.com",
  "password": "strong-password"
}
```

Response `201 Created`:

```json
{
  "message": "Registration successful.",
  "user": {
    "userId": "00000000-0000-4000-8000-000000000001",
    "email": "customer@example.com",
    "roleCode": "Customer",
    "status": "active"
  }
}
```

### Managed accounts

Tat ca request managed account dung body:

```json
{
  "email": "partner@example.com",
  "password": "strong-password"
}
```

Vi du tao Partner:

```http
POST /api/auth/register/partner
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

Branch duoc tao voi `status = pending`. Cac role managed khac duoc tao theo
status trong service hien tai.

## Login

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

Response `200 OK`:

```json
{
  "user": {
    "userId": "00000000-0000-4000-8000-000000000001",
    "email": "user@example.com",
    "roleCode": "Customer",
    "status": "active"
  },
  "accessToken": "<ACCESS_TOKEN>",
  "refreshToken": "<REFRESH_TOKEN>"
}
```

Dung access token cho API bao ve:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

## Refresh

```http
POST /api/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "<REFRESH_TOKEN>"
}
```

Response tra ve cap access/refresh token moi.

## Loi pho bien

| HTTP status | Y nghia |
| --- | --- |
| `400` | Thieu `email`/`password`, refresh token thieu, hoac Supabase tu choi request |
| `401` | Sai credential, thieu bearer token, token khong hop le |
| `403` | Account khong active hoac role khong du quyen |
| `500` | Khong tao/doc duoc local user |
| `502` | Supabase khong tra ve user hop le |
