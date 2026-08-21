# Profile API

## Base URL

```text
http://localhost:<PORT>/api/profile
```

Moi request can bearer token. Request body dung JSON.

```http
Authorization: Bearer <ACCESS_TOKEN>
```

## Tong quan

| Method | Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- | --- |
| `GET` | `/` | Lay profile cua user dang dang nhap | Customer, Partner, Branch |
| `POST` | `/` | Tao profile theo role hien tai | Customer, Partner, Branch |
| `PATCH` | `/` | Cap nhat profile theo role hien tai | Customer, Partner, Branch |
| `POST` | `/avatar` | Upload avatar customer qua Cloudinary | Customer |
| `GET` | `/branches` | Partner lay branches cua minh | Partner |
| `GET` | `/admin/partners` | Lay tat ca partner profiles | Super Admin, Operational Admin |
| `GET` | `/admin/branches` | Lay tat ca branch profiles | Super Admin, Operational Admin |
| `PATCH` | `/:profileType/:profileId/status` | Cap nhat status Partner/Branch profile | Super Admin, Operational Admin |

## Gia tri hop le

Gender:

```text
Nam
Nu
```

Luu y code hien tai dang dung gia tri database cho nu gioi theo encoding trong
source. Khi test, nen lay gia tri hop le tu seed/schema hien tai.

Profile type:

```text
partner
branch
```

Partner status:

```text
pending
active
suspended
terminated
rejected
```

Branch status:

```text
pending
active
suspended
closed
rejected
```

## Lay profile cua minh

```http
GET /api/profile
Authorization: Bearer <ACCESS_TOKEN>
```

Response tra ve object theo role:

```json
{
  "profile": {
    "customerProfileId": "00000000-0000-4000-8000-000000000001",
    "userId": "00000000-0000-4000-8000-000000000002",
    "fullName": "Nguyen Van A"
  }
}
```

## Tao profile

### Customer

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

### Partner

```json
{
  "partnerProfileCode": "PARTNER001",
  "partnerName": "Eco Partner",
  "taxCode": "0312345678",
  "representativeName": "Tran Thi B"
}
```

### Branch

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

Response `201 Created`:

```json
{
  "profile": {
    "userId": "00000000-0000-4000-8000-000000000002"
  }
}
```

## Cap nhat profile

```http
PATCH /api/profile
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

Customer co the cap nhat:

```text
fullName
phone
birthDate
gender
avatarUrl
address
```

Partner co the cap nhat:

```text
partnerName
taxCode
representativeName
```

Branch co the cap nhat:

```text
branchName
phone
address
email
```

## Upload avatar

```http
POST /api/profile/avatar
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "avatarBase64": "data:image/png;base64,..."
}
```

Response tra ve profile customer da cap nhat `avatarUrl`.

## Partner lay branches cua minh

```http
GET /api/profile/branches
Authorization: Bearer <PARTNER_ACCESS_TOKEN>
```

## Admin lay all profiles

```http
GET /api/profile/admin/partners
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

```http
GET /api/profile/admin/branches
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

## Admin cap nhat status profile

```http
PATCH /api/profile/:profileType/:profileId/status
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "status": "rejected",
  "rejectionReason": "Thong tin chua hop le"
}
```

`:profileType` la `partner` hoac `branch`.

## Loi pho bien

| HTTP status | Y nghia |
| --- | --- |
| `400` | Field sai kieu, gender/status/profileType/profileId khong hop le |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong du quyen |
| `404` | Profile hoac partner profile khong ton tai |
| `409` | User da co profile |
