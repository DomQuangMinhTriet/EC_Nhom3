# User API

Tai lieu nay mo ta muc dich va cach su dung cac API quan ly tai khoan user cua
backend.

## Base URL

Tat ca endpoint user co prefix:

```text
http://localhost:<PORT>/api/users
```

Thay `<PORT>` bang port backend trong file `.env`.

Moi request deu can access token trong header:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

## Tong quan quyen truy cap

| Endpoint | Muc dich | Super Admin | Operational Admin |
| --- | --- | --- | --- |
| `GET /api/users` | Lay danh sach user | Tat ca user | Chi Partner va Branch |
| `PATCH /api/users/:userId` | Cap nhat tai khoan | Status va role | Chi status |

Role khac nhu `Customer`, `Partner` va `Branch` khong duoc truy cap cac API nay.

## Gia tri hop le

### Role

```text
Super_Admin
Operational_Admin
Customer
Partner
Branch
```

### User status

```text
banned
pending
active
deactivated
```

## 1. Lay danh sach user

### Muc dich

Lay danh sach tai khoan co phan trang. API ho tro loc theo role va status.

Quyen xem du lieu phu thuoc vao role trong bearer token:

- `Super_Admin` xem duoc tat ca user.
- `Operational_Admin` chi xem duoc user co role `Partner` hoac `Branch`.

Gioi han cua Operational Admin duoc ap dung ngay trong truy van database, khong
phai loc sau khi da lay du lieu.

### Request co ban

```http
GET /api/users?page=1&limit=20
Authorization: Bearer <ACCESS_TOKEN>
```

### Query parameters

| Parameter | Bat buoc | Mac dinh | Mo ta |
| --- | --- | --- | --- |
| `page` | Khong | `1` | Trang hien tai, phai la so nguyen duong |
| `limit` | Khong | `20` | So user moi trang, tu `1` den `100` |
| `role` | Khong | Tat ca role duoc phep | Loc theo role |
| `status` | Khong | Tat ca status | Loc theo status |

### Vi du cho Super Admin

Lay tat ca user:

```http
GET /api/users?page=1&limit=20
Authorization: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
```

Lay Customer dang active:

```http
GET /api/users?page=1&limit=20&role=Customer&status=active
Authorization: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
```

### Vi du cho Operational Admin

Lay Partner va Branch:

```http
GET /api/users?page=1&limit=20
Authorization: Bearer <OPERATIONAL_ADMIN_ACCESS_TOKEN>
```

Chi lay Partner dang pending:

```http
GET /api/users?role=Partner&status=pending
Authorization: Bearer <OPERATIONAL_ADMIN_ACCESS_TOKEN>
```

Operational Admin khong duoc loc role ngoai `Partner` va `Branch`. Vi du request
sau tra HTTP `403 Forbidden`:

```http
GET /api/users?role=Customer
Authorization: Bearer <OPERATIONAL_ADMIN_ACCESS_TOKEN>
```

```json
{
  "error": "Operational Admin can only view Partner and Branch users"
}
```

### Response thanh cong

HTTP `200 OK`:

```json
{
  "users": [
    {
      "userId": "00000000-0000-4000-8000-000000000001",
      "email": "partner@example.com",
      "roleCode": "Partner",
      "status": "pending",
      "createdAt": "2026-08-16T10:00:00.000Z",
      "updatedAt": "2026-08-16T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

`total` va `totalPages` duoc tinh sau khi ap dung filter va gioi han quyen xem.

## 2. Cap nhat user

### Muc dich

Cap nhat `status`, `roleCode` hoac ca hai cho mot tai khoan. API chi ghi cac
field duoc phep va tu dong cap nhat `updatedAt`.

API khong cap nhat email vi email dang duoc Supabase Auth quan ly. Cap nhat email
chi trong database local co the lam du lieu khong dong bo.

### Endpoint

```http
PATCH /api/users/:userId
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

`:userId` phai la UUID hop le cua user can cap nhat.

### Cap nhat status

Super Admin va Operational Admin deu co the cap nhat status:

```http
PATCH /api/users/00000000-0000-4000-8000-000000000001
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "status": "active"
}
```

### Cap nhat role

Chi Super Admin duoc cap nhat role:

```http
PATCH /api/users/00000000-0000-4000-8000-000000000001
Authorization: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "roleCode": "Partner"
}
```

Neu Operational Admin gui `roleCode`, API tra HTTP `403 Forbidden`:

```json
{
  "error": "Only Super Admin can update user roles"
}
```

### Cap nhat status va role cung luc

Chi Super Admin duoc su dung request nay:

```json
{
  "status": "active",
  "roleCode": "Partner"
}
```

Request phai co it nhat mot trong hai field `status` hoac `roleCode`. Field khac
trong body khong duoc ghi vao database.

### Response thanh cong

HTTP `200 OK`:

```json
{
  "message": "User updated successfully.",
  "user": {
    "userId": "00000000-0000-4000-8000-000000000001",
    "email": "partner@example.com",
    "roleCode": "Partner",
    "status": "active",
    "createdAt": "2026-08-16T10:00:00.000Z",
    "updatedAt": "2026-08-16T10:30:00.000Z"
  }
}
```

Neu `userId` hop le nhung khong ton tai, API tra HTTP `404 Not Found`:

```json
{
  "error": "User not found"
}
```

## Luong su dung de xuat

1. Admin dang nhap qua `POST /api/auth/login` de nhan access token.
2. Gui access token trong header `Authorization` khi goi User API.
3. Goi `GET /api/users` de tim user va lay `userId`.
4. Goi `PATCH /api/users/:userId` de cap nhat status hoac role trong pham vi
   quyen cua admin.
5. Goi lai `GET /api/users` voi filter phu hop de kiem tra ket qua.

## Loi pho bien

Response loi co format:

```json
{
  "error": "Error message"
}
```

| HTTP status | Y nghia |
| --- | --- |
| `400` | Query, UUID, status hoac roleCode khong hop le |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong co quyen xem hay cap nhat du lieu yeu cau |
| `404` | Khong tim thay user can cap nhat |

