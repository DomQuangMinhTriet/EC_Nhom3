# API Index

Tai lieu nay tom tat nhanh cac endpoint backend hien tai. Doc chi tiet nam trong
cac file API rieng cung thu muc.

## Auth

Chi tiet: [AUTH_API.md](AUTH_API.md)

| Method | Path                                   |
| ------ | -------------------------------------- |
| `POST` | `/api/auth/register/customer`          |
| `POST` | `/api/auth/register/super-admin`       |
| `POST` | `/api/auth/register/operational-admin` |
| `POST` | `/api/auth/register/partner`           |
| `POST` | `/api/auth/register/branch`            |
| `POST` | `/api/auth/login`                      |
| `POST` | `/api/auth/refresh`                    |

## Profile

Chi tiet: [PROFILE_API.md](PROFILE_API.md)

| Method  | Path                                          |
| ------- | --------------------------------------------- |
| `GET`   | `/api/profile`                                |
| `POST`  | `/api/profile`                                |
| `PATCH` | `/api/profile`                                |
| `POST`  | `/api/profile/avatar`                         |
| `GET`   | `/api/profile/branches`                       |
| `GET`   | `/api/profile/admin/partners`                 |
| `GET`   | `/api/profile/admin/branches`                 |
| `PATCH` | `/api/profile/:profileType/:profileId/status` |

## Users

Chi tiet: [USER_API.md](USER_API.md)

| Method  | Path                 |
| ------- | -------------------- |
| `GET`   | `/api/users`         |
| `PATCH` | `/api/users/:userId` |

## Categories

Chi tiet: [CATEGORY_API.md](CATEGORY_API.md)

| Method   | Path                  |
| -------- | --------------------- |
| `GET`    | `/api/categories`     |
| `POST`   | `/api/categories`     |
| `PUT`    | `/api/categories/:id` |
| `DELETE` | `/api/categories/:id` |

## Vouchers

Chi tiet: [VOUCHER_PRODUCT_API.md](VOUCHER_PRODUCT_API.md)

| Method  | Path                       |
| ------- | -------------------------- |
| `GET`   | `/api/vouchers`            |
| `GET`   | `/api/vouchers/:id`        |
| `POST`  | `/api/vouchers`            |
| `GET`   | `/api/vouchers/mine`       |
| `PATCH` | `/api/vouchers/:id`        |
| `PATCH` | `/api/vouchers/:id/status` |

## Quotas

Chi tiet: [BRANCH_QUOTA_API.md](BRANCH_QUOTA_API.md)

| Method   | Path                                          |
| -------- | --------------------------------------------- |
| `POST`   | `/api/quotas/vouchers/:id/branches`           |
| `GET`    | `/api/quotas/vouchers/:id/branches`           |
| `PUT`    | `/api/quotas/vouchers/:id/branches/:branchId` |
| `DELETE` | `/api/quotas/vouchers/:id/branches/:branchId` |

## Carts

Chi tiet: [CART_API.md](CART_API.md)

| Method   | Path                      |
| -------- | ------------------------- |
| `GET`    | `/api/carts/me`           |
| `POST`   | `/api/carts/me/items`     |
| `PUT`    | `/api/carts/me/items/:id` |
| `DELETE` | `/api/carts/me/items/:id` |

## Orders

Chi tiet: [ORDER_API.md](ORDER_API.md)

| Method  | Path                     |
| ------- | ------------------------ |
| `GET`   | `/api/orders`            |
| `GET`   | `/api/orders/admin`      |
| `GET`   | `/api/orders/admin/:id`  |
| `GET`   | `/api/orders/:id`        |
| `POST`  | `/api/orders`            |
| `PATCH` | `/api/orders/:id/cancel` |
| `PUT`   | `/api/orders/:id`        |

## Payments

Chi tiet: [PAYMENT_API.md](PAYMENT_API.md)

| Method | Path                     |
| ------ | ------------------------ |
| `POST` | `/api/payments/initiate` |
| `POST` | `/api/payments/callback` |
| `POST` | `/api/payments/sepay/webhook` |

## Voucher Instances

Chi tiet: [VOUCHER_INSTANCE_API.md](VOUCHER_INSTANCE_API.md)

| Method  | Path                                  |
| ------- | ------------------------------------- |
| `GET`   | `/api/voucher-instances`              |
| `GET`   | `/api/voucher-instances/redeem/:code` |
| `PATCH` | `/api/voucher-instances/redeem/:code` |
| `GET`   | `/api/voucher-instances/:id`          |

## Reviews

Chi tiet: [REVIEW_API.md](REVIEW_API.md)

| Method  | Path                        |
| ------- | --------------------------- |
| `POST`  | `/api/reviews`              |
| `PUT`   | `/api/reviews/:id`          |
| `GET`   | `/api/reviews/vouchers/:id` |
| `PATCH` | `/api/reviews/:id/status`   |

## Notifications

Chi tiet: [NOTIFICATION_API.md](NOTIFICATION_API.md)

| Method | Path                       |
| ------ | -------------------------- |
| `GET`  | `/api/notifications`       |
| `POST` | `/api/notifications/email` |
