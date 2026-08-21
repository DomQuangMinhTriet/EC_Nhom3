# Category API

## Base URL

```text
http://localhost:<PORT>/api/categories
```

Request body dung JSON. API xem danh muc la public; API tao/sua/xoa can bearer
token cua `Super_Admin` hoac `Operational_Admin`.

## Tong quan

| Method | Endpoint | Muc dich | Quyen truy cap |
| --- | --- | --- | --- |
| `GET` | `/` | Lay tat ca category | Public |
| `POST` | `/` | Tao category | Super Admin, Operational Admin |
| `PUT` | `/:id` | Cap nhat category | Super Admin, Operational Admin |
| `DELETE` | `/:id` | Xoa category | Super Admin, Operational Admin |

## Lay tat ca category

```http
GET /api/categories
```

Response `200 OK`:

```json
{
  "data": [
    {
      "categoryId": "00000000-0000-4000-8000-000000000001",
      "name": "Food",
      "parentCategoryId": null
    }
  ]
}
```

## Tao category

```http
POST /api/categories
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "name": "Coffee",
  "parentCategoryId": "00000000-0000-4000-8000-000000000001"
}
```

`parentCategoryId` co the bo qua de tao root category.

Response `201 Created`:

```json
{
  "data": {
    "categoryId": "00000000-0000-4000-8000-000000000002",
    "name": "Coffee",
    "parentCategoryId": "00000000-0000-4000-8000-000000000001"
  },
  "message": "Category created successfully"
}
```

## Cap nhat category

```http
PUT /api/categories/:id
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "name": "Coffee Updated",
  "parentCategoryId": null
}
```

## Xoa category

```http
DELETE /api/categories/:id
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

Response `200 OK`:

```json
{
  "message": "Category deleted successfully"
}
```

## Loi pho bien

| HTTP status | Y nghia |
| --- | --- |
| `400` | Name thieu, UUID sai, parent khong hop le, category con co children |
| `401` | Thieu bearer token hoac token khong hop le |
| `403` | Role khong du quyen |
| `404` | Category hoac parent category khong ton tai |
