# Profile API

Tai lieu nay mo ta muc dich va cach su dung API tao va cap nhat profile cho
Customer, Partner va Branch theo implementation hien tai.

## Base URL

```text
http://localhost:<PORT>/api/profile
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
| `POST /` | Tao profile cho user dang dang nhap | Customer, Partner, Branch |
| `PATCH /` | Cap nhat profile cua user dang dang nhap | Customer, Partner, Branch |
| `PATCH /:profileType/:profileId/status` | Cap nhat status Partner/Branch profile | Super Admin, Operational Admin |

`Super_Admin` va `Operational_Admin` khong duoc truy cap API tao/cap nhat
profile ca nhan. Rieng API cap nhat status profile chi danh cho `Super_Admin`
va `Operational_Admin`.

## Gia tri hop le

### Gender

```text
Nam
Nữ
```

### Profile type

```text
partner
branch
```

### Partner status

```text
pending
active
suspended
terminated
rejected
```

### Branch status

```text
pending
active
suspended
closed
rejected
```

## 1. Tao profile

### Muc dich

Tao profile cho user dang dang nhap dua tren `roleCode` trong access token. Moi
user chi tao duoc mot profile tuong ung voi role hien tai.

### Customer request

```http
POST /api/profile
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0900000000",
  "birthDate": "2000-01-01",
  "gender": "Nam",
  "avatarUrl": "https://example.com/avatar.png",
  "address": "Ho Chi Minh City"
}
```

Field bat buoc: `fullName`.

### Partner request

```http
POST /api/profile
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "partnerProfileCode": "PARTNER001",
  "partnerName": "Eco Partner",
  "taxCode": "0312345678",
  "representativeName": "Tran Thi B"
}
```

Field bat buoc: `partnerProfileCode`, `partnerName`, `taxCode`,
`representativeName`.

### Branch request

```http
POST /api/profile
Authorization: Bearer <BRANCH_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "partnerProfileId": "00000000-0000-4000-8000-000000000010",
  "branchProfileCode": "BRANCH001",
  "branchName": "Eco Branch 1",
  "phone": "0911111111",
  "address": "District 1, Ho Chi Minh City",
  "email": "branch@example.com"
}
```

Field bat buoc: `partnerProfileId`, `branchProfileCode`, `branchName`.

`partnerProfileId` phai ton tai trong bang `partner_profiles`.

Partner profile va Branch profile duoc tao voi status mac dinh `active`. Client
khong can gui `status`; neu gui thi backend cung khong ghi field nay tu request.

### Response thanh cong

HTTP `201 Created`:

```json
{
  "profile": {
    "customerProfileId": "00000000-0000-4000-8000-000000000001",
    "userId": "00000000-0000-4000-8000-000000000002",
    "fullName": "Nguyen Van A",
    "phone": "0900000000",
    "birthDate": "2000-01-01",
    "gender": "Nam",
    "avatarUrl": "https://example.com/avatar.png",
    "address": "Ho Chi Minh City",
    "createdAt": "2026-08-17T10:00:00.000Z",
    "updatedAt": "2026-08-17T10:00:00.000Z"
  }
}
```

Neu user da co profile, API tra HTTP `409 Conflict`:

```json
{
  "error": "Profile already exists"
}
```

## 2. Cap nhat profile

### Muc dich

Cap nhat profile cua user dang dang nhap. API chi cap nhat field duoc phep theo
role va tu dong cap nhat `updatedAt`.

Khong cho cap nhat cac field dinh danh va trang thai nhu:

```text
partnerProfileCode
branchProfileCode
partnerProfileId
status
rejectionReason
```

### Customer request

```http
PATCH /api/profile
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "fullName": "Nguyen Van A Updated",
  "phone": "0900000001",
  "address": "Thu Duc City"
}
```

Field co the cap nhat: `fullName`, `phone`, `birthDate`, `gender`, `avatarUrl`,
`address`.

### Partner request

```http
PATCH /api/profile
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "partnerName": "Eco Partner Updated",
  "taxCode": "0312345678",
  "representativeName": "Tran Thi B"
}
```

Field co the cap nhat: `partnerName`, `taxCode`, `representativeName`.

### Branch request

```http
PATCH /api/profile
Authorization: Bearer <BRANCH_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "branchName": "Eco Branch 1 Updated",
  "phone": "0911111112",
  "address": "District 3, Ho Chi Minh City",
  "email": "branch-updated@example.com"
}
```

Field co the cap nhat: `branchName`, `phone`, `address`, `email`.

Request phai co it nhat mot field profile hop le. Field khac trong body khong
duoc ghi vao database.

### Response thanh cong

HTTP `200 OK`:

```json
{
  "profile": {
    "partnerProfileId": "00000000-0000-4000-8000-000000000010",
    "userId": "00000000-0000-4000-8000-000000000002",
    "partnerProfileCode": "PARTNER001",
    "partnerName": "Eco Partner Updated",
    "taxCode": "0312345678",
    "representativeName": "Tran Thi B",
    "status": "active",
    "rejectionReason": "",
    "createdAt": "2026-08-17T10:00:00.000Z",
    "updatedAt": "2026-08-17T10:30:00.000Z"
  }
}
```

Neu user chua co profile, API tra HTTP `404 Not Found`:

```json
{
  "error": "Profile not found"
}
```

## 3. Cap nhat status profile

### Muc dich

Cho phep `Super_Admin` hoac `Operational_Admin` cap nhat status cua Partner
profile hoac Branch profile.

### Endpoint

```http
PATCH /api/profile/:profileType/:profileId/status
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

`:profileType` hop le:

```text
partner
branch
```

`:profileId` la `partnerProfileId` khi `profileType=partner`, hoac
`branchProfileId` khi `profileType=branch`.

`status` phai nam trong danh sach status hop le cua tung profile type o muc
"Gia tri hop le".

### Request

```json
{
  "status": "suspended"
}
```

### Response thanh cong

HTTP `200 OK`:

```json
{
  "message": "Profile status updated successfully.",
  "profile": {
    "partnerProfileId": "00000000-0000-4000-8000-000000000010",
    "userId": "00000000-0000-4000-8000-000000000002",
    "partnerProfileCode": "PARTNER001",
    "partnerName": "Eco Partner",
    "taxCode": "0312345678",
    "representativeName": "Tran Thi B",
    "status": "suspended",
    "rejectionReason": "",
    "createdAt": "2026-08-17T10:00:00.000Z",
    "updatedAt": "2026-08-17T10:30:00.000Z"
  }
}
```

Neu `profileId` hop le nhung khong ton tai, API tra HTTP `404 Not Found`:

```json
{
  "error": "Profile not found"
}
```

Neu `profileType`, `profileId` hoac `status` khong hop le, API tra HTTP
`400 Bad Request`. Vi du:

```json
{
  "error": "Invalid status"
}
```

## Luong su dung de xuat

1. User dang ky qua `POST /api/auth/register`.
2. Admin cap nhat user sang status `active` neu can.
3. User dang nhap qua `POST /api/auth/login` de nhan access token.
4. User goi `POST /api/profile` de tao profile theo role hien tai.
5. User goi `PATCH /api/profile` de cap nhat thong tin profile.
6. Admin goi `PATCH /api/profile/:profileType/:profileId/status` khi can thay
   doi trang thai Partner/Branch profile.

## Loi pho bien

Response loi co format:

```json
{
  "error": "Error message"
}
```

| HTTP status | Y nghia |
| --- | --- |
| `400` | Thieu field bat buoc, sai kieu field, gender/profileType/profileId/status khong hop le |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong co quyen truy cap Profile API |
| `404` | Khong tim thay profile hoac partner profile |
| `409` | User da co profile |
