# Kế hoạch triển khai — EC Voucher System
**HK3 2025–2026 · HCMUS E-Commerce**
Stack: `Next.js 14` + `Express` + `PostgreSQL` · Ngày: 17/07/2026

---

## 1. Tech Stack

| Tầng | Công nghệ | Lý do |
|------|-----------|-------|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR/SSG sẵn có, routing tự động, tối ưu SEO trang public |
| UI Library | Tailwind CSS + shadcn/ui | Tái sử dụng component nhanh, nhất quán với prototype |
| Server State | TanStack Query | Cache tự động, tránh duplicate fetch |
| Client State | Zustand | Nhẹ hơn Redux, đủ dùng cho cart/auth |
| Forms | React Hook Form + Zod | Validation type-safe, ít re-render |
| Backend | Node.js + Express + TypeScript | JS xuyên suốt FE–BE |
| Database | PostgreSQL 16 | Phù hợp ERD sẵn có, hỗ trợ UUID, TIMESTAMPTZ |
| ORM | Drizzle ORM | Type-safe, gần SQL nguyên bản, migration đơn giản |
| Auth | JWT (access 15m + refresh 7d) + bcrypt | Stateless REST, refresh token tránh logout liên tục |
| QR Code | `qrcode` (npm) | Generate QR cho voucher code |
| Email | Nodemailer + Gmail SMTP | Gửi link reset password |
| Dev Infra | Docker Compose + ESLint + Prettier | Đồng nhất môi trường giữa thành viên |

---

## 2. Folder Structure

```
ec-voucher/
├── frontend/                         # Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/             # Không cần auth
│   │   │   │   ├── page.tsx          # S01 — Trang chủ
│   │   │   │   ├── vouchers/
│   │   │   │   │   ├── page.tsx      # S05 — Lọc Voucher
│   │   │   │   │   ├── [id]/page.tsx # S06 — Chi tiết
│   │   │   │   │   └── search/page.tsx # S07 — Tìm kiếm
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/        # S02
│   │   │   │   │   ├── register/     # S03
│   │   │   │   │   └── forgot-password/ # S04
│   │   │   │   └── cart/
│   │   │   │       ├── page.tsx      # S08 — Giỏ hàng
│   │   │   │       ├── checkout/     # S09 — Thanh toán
│   │   │   │       └── confirm/      # S10 — Xác nhận đơn
│   │   │   ├── (customer)/           # Role: customer
│   │   │   │   ├── profile/          # S11
│   │   │   │   ├── my-vouchers/      # S12
│   │   │   │   ├── orders/           # S13
│   │   │   │   ├── notifications/    # S14
│   │   │   │   └── settings/         # S15
│   │   │   ├── (partner)/            # Role: partner / branch
│   │   │   │   ├── dashboard/        # S16
│   │   │   │   ├── vouchers/
│   │   │   │   │   ├── page.tsx      # S17 — Quản lý
│   │   │   │   │   ├── new/          # S18 — Tạo mới
│   │   │   │   │   └── [id]/edit/    # S19 — Sửa
│   │   │   │   ├── profile/          # S20
│   │   │   │   ├── reports/          # S21
│   │   │   │   ├── notifications/    # S22
│   │   │   │   ├── settings/         # S23
│   │   │   │   ├── staff/            # S24
│   │   │   │   └── scan/             # S25 — QR Scan
│   │   │   └── (admin)/              # Role: admin
│   │   │       ├── dashboard/        # S26
│   │   │       ├── users/            # S27
│   │   │       ├── partners/
│   │   │       │   ├── page.tsx      # S28
│   │   │       │   └── new/          # S29
│   │   │       ├── voucher-approval/ # S30
│   │   │       ├── vouchers/         # S31
│   │   │       ├── categories/       # S32
│   │   │       ├── reports/          # S33
│   │   │       ├── settings/         # S34
│   │   │       ├── notifications/    # S35
│   │   │       └── audit-log/        # S36
│   │   ├── components/
│   │   │   ├── ui/                   # Button, Card, Input, Badge, Modal…
│   │   │   ├── layout/               # DashLayout, TopNav, Sidebar
│   │   │   └── features/             # VoucherCard, StatCard, QRModal…
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios instance + interceptors
│   │   │   ├── auth.ts               # Token helpers
│   │   │   └── utils.ts
│   │   ├── hooks/                    # useVouchers, useOrders, useCart…
│   │   └── types/                    # TypeScript interfaces
│
├── backend/                          # Express + TypeScript
│   ├── src/
│   │   ├── routes/                   # Khai báo endpoints
│   │   ├── controllers/              # Xử lý request/response
│   │   ├── services/                 # Business logic
│   │   ├── middlewares/              # auth, role, validate, error
│   │   ├── db/
│   │   │   ├── schema.sql            # DDL PostgreSQL
│   │   │   ├── seed.sql              # Dữ liệu mẫu
│   │   │   └── drizzle/              # Schema & migrations
│   │   └── utils/                    # jwt, qrcode, email, logger
│   └── .env
│
└── docker-compose.yml                # PostgreSQL 16 local dev
```

---

## 3. Database Schema (PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role
CREATE TABLE role (
  role_code  VARCHAR(20) PRIMARY KEY,
  role_name  VARCHAR(100) NOT NULL
);
INSERT INTO role VALUES
  ('admin','Quản trị viên'),
  ('partner','Đối tác'),
  ('branch','Nhân viên chi nhánh'),
  ('customer','Khách hàng');

-- User
CREATE TABLE "user" (
  user_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_code     VARCHAR(20) NOT NULL REFERENCES role(role_code),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gender        VARCHAR(10) CHECK (gender IN ('male','female','other')),
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','inactive','banned')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CustomerProfile
CREATE TABLE customer_profile (
  user_id       UUID PRIMARY KEY REFERENCES "user"(user_id),
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  date_of_birth DATE,
  address       TEXT,
  avatar_url    TEXT
);

-- PartnerProfile
CREATE TABLE partner_profile (
  user_id         UUID PRIMARY KEY REFERENCES "user"(user_id),
  business_name   VARCHAR(255) NOT NULL,
  representative  VARCHAR(255),
  phone           VARCHAR(20),
  tax_code        VARCHAR(50),
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','active','suspended')),
  logo_url        TEXT
);

-- BranchProfile
CREATE TABLE branch_profile (
  user_id     UUID PRIMARY KEY REFERENCES "user"(user_id),
  partner_id  UUID NOT NULL REFERENCES partner_profile(user_id),
  branch_name VARCHAR(255) NOT NULL,
  address     TEXT,
  phone       VARCHAR(20)
);

-- Category
CREATE TABLE category (
  category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  icon_url    TEXT,
  sort_order  INT DEFAULT 0
);

-- VoucherProduct
CREATE TABLE voucher_product (
  voucher_product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id         UUID NOT NULL REFERENCES partner_profile(user_id),
  category_id        UUID REFERENCES category(category_id),
  title              VARCHAR(255) NOT NULL,
  description        TEXT,
  original_price     NUMERIC(12,2),
  sale_price         NUMERIC(12,2) NOT NULL,
  discount_value     NUMERIC(5,2),
  total_quantity     INT NOT NULL,
  sold_quantity      INT NOT NULL DEFAULT 0,
  start_date         TIMESTAMPTZ NOT NULL,
  end_date           TIMESTAMPTZ NOT NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','pending','active','paused','expired')),
  image_url          TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VoucherCode (mỗi mã riêng lẻ)
CREATE TABLE voucher_code (
  voucher_code_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_product_id UUID NOT NULL REFERENCES voucher_product(voucher_product_id),
  owner_id           UUID REFERENCES "user"(user_id), -- null nếu chưa bán
  code               VARCHAR(50) UNIQUE NOT NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available','sold','used','expired','cancelled')),
  used_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cart / CartItem
CREATE TABLE cart (
  cart_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE NOT NULL REFERENCES "user"(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE cart_item (
  cart_item_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id            UUID NOT NULL REFERENCES cart(cart_id),
  voucher_product_id UUID NOT NULL REFERENCES voucher_product(voucher_product_id),
  quantity           INT NOT NULL DEFAULT 1,
  added_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order / OrderItem
CREATE TABLE "order" (
  order_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES "user"(user_id),
  total      NUMERIC(12,2) NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','completed','cancelled','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE order_item (
  order_item_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES "order"(order_id),
  voucher_code_id UUID NOT NULL REFERENCES voucher_code(voucher_code_id),
  unit_price      NUMERIC(12,2) NOT NULL
);

-- Payment
CREATE TABLE payment (
  payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES "order"(order_id),
  method     VARCHAR(30) NOT NULL
             CHECK (method IN ('momo','vnpay','credit_card','bank_transfer')),
  amount     NUMERIC(12,2) NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','success','failed','refunded')),
  paid_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Review
CREATE TABLE review (
  review_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES "user"(user_id),
  voucher_product_id UUID NOT NULL REFERENCES voucher_product(voucher_product_id),
  rating             NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 4. API Endpoints

### 🔐 Auth
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| POST | `/api/auth/register` | Public | Đăng ký tài khoản (customer / partner) |
| POST | `/api/auth/login` | Public | Đăng nhập → accessToken + refreshToken |
| POST | `/api/auth/logout` | Auth | Xoá refresh token |
| POST | `/api/auth/refresh` | Public | Đổi refreshToken → accessToken mới |
| POST | `/api/auth/forgot-password` | Public | Gửi email reset link |
| POST | `/api/auth/reset-password` | Public | Đặt lại mật khẩu bằng token |

### 🏷️ Vouchers (Public)
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/vouchers` | Public | Danh sách (filter category, price, discount; search; paginate) |
| GET | `/api/vouchers/:id` | Public | Chi tiết voucher + reviews |
| GET | `/api/categories` | Public | Danh mục để hiển thị filter |

### 🛒 Cart & Checkout
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/cart` | Customer | Lấy giỏ hàng hiện tại |
| POST | `/api/cart/items` | Customer | Thêm voucher vào giỏ |
| PATCH | `/api/cart/items/:id` | Customer | Sửa số lượng |
| DELETE | `/api/cart/items/:id` | Customer | Xoá item |
| POST | `/api/orders` | Customer | Checkout → tạo Order + Payment + cập nhật VoucherCode.owner |
| POST | `/api/payments/callback` | System | Webhook thanh toán → cập nhật trạng thái |

### 👤 Customer Dashboard
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/me/profile` | Customer | Hồ sơ cá nhân |
| PATCH | `/api/me/profile` | Customer | Cập nhật thông tin |
| GET | `/api/me/vouchers` | Customer | Voucher đã mua (filter: active/used/expired) |
| GET | `/api/me/orders` | Customer | Lịch sử đơn hàng |
| GET | `/api/me/orders/:id` | Customer | Chi tiết đơn hàng |
| GET | `/api/me/notifications` | Customer | Danh sách thông báo |
| POST | `/api/reviews` | Customer | Đánh giá voucher sau khi dùng |

### 🏪 Partner — Quản lý
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/partner/dashboard` | Partner | Thống kê tổng quan |
| GET | `/api/partner/vouchers` | Partner | Danh sách voucher của partner |
| POST | `/api/partner/vouchers` | Partner | Tạo voucher mới → status `pending` chờ Admin duyệt |
| GET | `/api/partner/vouchers/:id` | Partner | Chi tiết voucher |
| PATCH | `/api/partner/vouchers/:id` | Partner | Sửa (chỉ khi `draft`/`paused`) |
| DELETE | `/api/partner/vouchers/:id` | Partner | Xoá (chỉ `draft`) |
| GET | `/api/partner/reports` | Partner | Báo cáo doanh thu |
| GET | `/api/partner/staff` | Partner | Danh sách nhân viên chi nhánh |
| POST | `/api/partner/staff` | Partner | Thêm nhân viên |
| GET | `/api/partner/profile` | Partner | Hồ sơ đối tác |
| PATCH | `/api/partner/profile` | Partner | Cập nhật thông tin đối tác |

### 📲 Branch — Nhân viên
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| POST | `/api/scan/verify` | Branch | Kiểm tra mã QR voucher có hợp lệ |
| POST | `/api/scan/redeem` | Branch | Đánh dấu đã dùng (`used_at = now()`) |

### 🛡️ Admin
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/admin/stats` | Admin | Thống kê tổng hệ thống |
| GET | `/api/admin/users` | Admin | Danh sách user (filter role, status; search) |
| PATCH | `/api/admin/users/:id/status` | Admin | Khoá/mở khoá tài khoản |
| GET | `/api/admin/partners` | Admin | Danh sách đối tác |
| POST | `/api/admin/partners` | Admin | Thêm partner mới |
| PATCH | `/api/admin/partners/:id/status` | Admin | Duyệt/đình chỉ partner |
| GET | `/api/admin/vouchers/pending` | Admin | Danh sách voucher chờ duyệt |
| POST | `/api/admin/vouchers/:id/approve` | Admin | Duyệt → `active` |
| POST | `/api/admin/vouchers/:id/reject` | Admin | Từ chối kèm lý do |
| GET | `/api/admin/categories` | Admin | Danh mục |
| POST | `/api/admin/categories` | Admin | Tạo danh mục mới |
| PATCH | `/api/admin/categories/:id` | Admin | Sửa danh mục |
| DELETE | `/api/admin/categories/:id` | Admin | Xoá danh mục |
| GET | `/api/admin/reports` | Admin | Báo cáo GMV, users mới, đơn hàng |
| GET | `/api/admin/audit-logs` | Admin | Lịch sử thao tác admin |

### Middleware Stack (Express)
```
app
  ├── cors()                        # Allow Next.js origin
  ├── express.json()
  ├── morgan("dev")                 # Request logging
  ├── /api/auth/*   → (public)
  ├── verifyToken()                 # Kiểm tra JWT header
  ├── attachUser()                  # Gắn user object vào req
  ├── /api/admin/*  → requireRole("admin")
  ├── /api/partner/* → requireRole("partner","branch")
  ├── /api/me/*     → requireRole("customer")
  └── errorHandler()                # Catch-all error middleware
```

---

## 5. Phân công Module theo Ưu tiên

| Module | Screens | Ưu tiên | Ghi chú |
|--------|---------|---------|---------|
| Auth & Public | S01–S07 | **P0 — Bắt buộc** | Core flow, không có không demo được |
| Cart & Payment | S08–S10 | **P0 — Bắt buộc** | Liên kết trực tiếp Order và VoucherCode |
| Customer Dashboard | S11–S15 | P1 — Quan trọng | My-vouchers cần sau khi checkout xong |
| Partner Dashboard | S16–S24 | P1 — Quan trọng | CRUD voucher + approval flow là trọng tâm |
| Branch QR Scan | S25 | P1 — Quan trọng | Kết nối VoucherCode.used_at trong DB |
| Admin Portal | S26–S36 | P2 — Demo thêm | Dashboard + duyệt voucher là P1, còn lại P2 |

---

## 6. Sprint Plan (7 tuần)

| Sprint | Mục tiêu | Việc cần làm | Deliverable | Nhân lực |
|--------|----------|-------------|-------------|---------|
| Sprint 1 (Tuần 1) | Setup & Auth | Init Express + DB schema + Docker; Init Next.js + Tailwind + shadcn | `/auth/*` endpoints · S02 S03 S04 | 1 BE + 1 FE |
| Sprint 2 (Tuần 2) | Public — Voucher | Voucher CRUD, category API; S01 S05 S07 | `GET /vouchers`, `/categories` · S01 S05 S06 S07 | 1 BE + 1 FE |
| Sprint 3 (Tuần 3) | Cart & Checkout | Cart logic, order creation, payment flow | Cart API, `POST /orders` · S08 S09 S10 | 1 BE + 1 FE |
| Sprint 4 (Tuần 4) | Customer Dashboard | Profile, my-vouchers, order history, notification | `/me/*` endpoints · S11–S15 | 1 BE + 1 FE |
| Sprint 5 (Tuần 5) | Partner — Quản lý | Partner dashboard, voucher CRUD + approval flow | `/partner/*` endpoints · S16–S24 | 2 BE + 2 FE |
| Sprint 6 (Tuần 6) | Branch & Admin | QR scan/redeem, admin endpoints | `/scan/*`, `/admin/*` · S25–S36 | 2 BE + 2 FE |
| Sprint 7 (Tuần 7) | Testing & Polish | Unit test API (Jest), responsive check, seed data | Toàn bộ API có test · Demo hoàn chỉnh | Cả nhóm |

---

## 7. Lệnh khởi động dự án

### Clone & Install
```bash
# Clone repo
git clone <repo-url> && cd ec-voucher

# Backend
cd backend
cp .env.example .env        # Điền DB_URL, JWT_SECRET, SMTP_*
npm install

# Frontend
cd ../frontend
cp .env.local.example .env.local   # Điền NEXT_PUBLIC_API_URL
npm install
```

### Chạy Database (Docker)
```bash
cd ..   # về root
docker-compose up -d         # Khởi động PostgreSQL port 5432

cd backend
npm run db:migrate           # Chạy schema.sql
npm run db:seed              # Chèn dữ liệu mẫu
```

### Start Development
```bash
# Terminal 1 — Backend
cd backend && npm run dev    # http://localhost:4000

# Terminal 2 — Frontend
cd frontend && npm run dev   # http://localhost:3000
```

### Environment Variables (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ec_voucher
JWT_ACCESS_SECRET=<random-32-chars>
JWT_REFRESH_SECRET=<random-32-chars>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<gmail>
SMTP_PASS=<app-password>
CLIENT_URL=http://localhost:3000
PORT=4000
```

---

*EC Voucher System — Implementation Plan · 17/07/2026 · EC Project HK3*
