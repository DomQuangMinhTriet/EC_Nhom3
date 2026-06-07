# Hướng Dẫn Initialize Toàn Bộ Đồ Án

**Đề tài:** Hệ thống thương mại điện tử bán voucher giảm giá trực tuyến  

Tài liệu này hướng dẫn từng bước khởi tạo đồ án từ đầu — từ cấu trúc thư mục, setup môi trường, đến chuẩn bị dữ liệu mẫu.

---

## Bước 1 — Khởi tạo Repository Git

```bash
# Tạo repo mới trên GitHub/GitLab, sau đó clone về local
git clone https://github.com/<your-org>/voucher-ecommerce.git
cd voucher-ecommerce

# Tạo branch develop
git checkout -b develop
git push -u origin develop
```

**Cấu trúc thư mục đề xuất:**

```
voucher-ecommerce/
├── docs/                    # Tài liệu dự án
│   ├── BRD/                 # Business Requirements Document
│   ├── SRS/                 # Software Requirements Specification
│   ├── UseCase/             # Use Case Diagrams & Specifications
│   ├── ERD/                 # Entity Relationship Diagram
│   ├── Wireframe/           # UI Wireframes
│   ├── TestPlan/            # Test Plan & Test Cases
│   └── Diagrams/            # Activity Diagrams, BPMN
├── src/                     # Mã nguồn ứng dụng
│   ├── backend/             # Backend API / Server
│   └── frontend/            # Frontend (nếu tách biệt)
├── database/
│   ├── schema.sql           # DDL - Tạo bảng
│   ├── seed.sql             # Dữ liệu mẫu
│   └── migrations/          # Migration files (nếu dùng ORM)
├── .env.example             # Template biến môi trường
├── .gitignore
└── README.md
```

---

## Bước 2 — Khởi tạo Backend

### Option A: Node.js + Express

```bash
cd src/backend
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken
npm install sequelize mysql2    # hoặc pg cho PostgreSQL
npm install --save-dev nodemon

# Cấu trúc backend
mkdir -p src/{controllers,models,routes,middlewares,services,utils}
touch src/app.js src/server.js .env
```

**Cấu trúc backend chi tiết:**

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── voucherController.js
│   │   ├── orderController.js
│   │   ├── partnerController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Partner.js
│   │   ├── VoucherProduct.js
│   │   ├── VoucherCode.js
│   │   ├── Order.js
│   │   └── ...
│   ├── routes/
│   │   ├── auth.js
│   │   ├── customer.js
│   │   ├── partner.js
│   │   └── admin.js
│   ├── middlewares/
│   │   ├── authenticate.js    # Kiểm tra JWT
│   │   └── authorize.js       # Kiểm tra role
│   ├── services/
│   │   └── voucherCodeService.js  # Sinh mã duy nhất
│   └── app.js
├── .env
└── package.json
```

**File `.env.example`:**

```env
# App
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=voucher_db
DB_USER=root
DB_PASS=yourpassword

# Auth
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
```

### Option B: PHP + Laravel

```bash
composer create-project laravel/laravel backend
cd backend
cp .env.example .env
php artisan key:generate

# Cài đặt các package cần thiết
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Tạo cấu trúc module
php artisan make:model User -m
php artisan make:model Partner -m
php artisan make:model VoucherProduct -m
php artisan make:model VoucherCode -m
php artisan make:model Order -m
php artisan make:model OrderItem -m
```

### Option C: Python + Django

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install django djangorestframework djangorestframework-simplejwt pillow qrcode
django-admin startproject config .
python manage.py startapp accounts
python manage.py startapp vouchers
python manage.py startapp orders
python manage.py startapp partners
```

---

## Bước 3 — Khởi tạo Database

### Tạo database

```sql
-- MySQL
CREATE DATABASE voucher_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'voucher_user'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON voucher_db.* TO 'voucher_user'@'localhost';
FLUSH PRIVILEGES;
```

### Schema cốt lõi (schema.sql)

```sql
-- Roles
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE  -- 'customer', 'partner', 'admin'
);

-- Users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role_id INT NOT NULL,
    status ENUM('active', 'locked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Partners
CREATE TABLE partners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    tax_code VARCHAR(50),
    representative_name VARCHAR(255),
    status ENUM('pending', 'approved', 'locked') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Branches
CREATE TABLE branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    partner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (partner_id) REFERENCES partners(id)
);

-- Voucher Categories
CREATE TABLE voucher_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE
);

-- Voucher Products
CREATE TABLE voucher_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    partner_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    original_price DECIMAL(15,2) NOT NULL,
    sale_price DECIMAL(15,2) NOT NULL,
    quantity_issued INT NOT NULL DEFAULT 0,
    quantity_sold INT NOT NULL DEFAULT 0,
    sale_start DATETIME,
    sale_end DATETIME,
    use_start DATETIME,
    use_end DATETIME,
    status ENUM('draft', 'pending', 'approved', 'on_sale', 'paused', 'ended', 'rejected') DEFAULT 'draft',
    image_url VARCHAR(500),
    terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES partners(id),
    FOREIGN KEY (category_id) REFERENCES voucher_categories(id),
    CONSTRAINT chk_price CHECK (sale_price < original_price),
    CONSTRAINT chk_quantity CHECK (quantity_sold <= quantity_issued)
);

-- Orders
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'simulated',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    order_status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- Order Items
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    voucher_product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (voucher_product_id) REFERENCES voucher_products(id)
);

-- Voucher Codes (phát hành sau khi thanh toán)
CREATE TABLE voucher_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(100) NOT NULL UNIQUE,
    order_item_id INT NOT NULL,
    voucher_product_id INT NOT NULL,
    owner_id INT NOT NULL,
    status ENUM('active', 'used', 'expired', 'cancelled') DEFAULT 'active',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    expire_at DATETIME,
    verified_by_branch_id INT NULL,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    FOREIGN KEY (voucher_product_id) REFERENCES voucher_products(id),
    FOREIGN KEY (owner_id) REFERENCES users(id),
    INDEX idx_code (code)
);

-- Reviews
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    voucher_product_id INT NOT NULL,
    customer_id INT NOT NULL,
    voucher_code_id INT,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voucher_product_id) REFERENCES voucher_products(id),
    FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- System Logs
CREATE TABLE system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    actor_id INT,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    detail JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);
```

---

## Bước 4 — Seed Data Mẫu

```sql
-- Roles
INSERT INTO roles (name) VALUES ('customer'), ('partner'), ('admin');

-- Admin user (password: Admin@123 — bcrypt hash)
INSERT INTO users (email, password_hash, full_name, role_id, status)
VALUES ('admin@voucher.com', '$2a$10$...', 'System Admin', 3, 'active');

-- Danh mục voucher
INSERT INTO voucher_categories (name, slug) VALUES
('Ẩm thực', 'am-thuc'),
('Mua sắm', 'mua-sam'),
('Làm đẹp & Spa', 'lam-dep-spa'),
('Du lịch', 'du-lich'),
('Giải trí', 'giai-tri'),
('Sức khỏe', 'suc-khoe');
```

> **Lưu ý:** Chạy `seed.sql` sau `schema.sql`. Hash mật khẩu phải được sinh từ code (bcrypt), không lưu plain text.

---

## Bước 5 — Logic Sinh Voucher Code

Voucher code phải **duy nhất** và **khó đoán**. Gợi ý cách sinh:

```javascript
// Node.js — dùng UUID v4
const { v4: uuidv4 } = require('uuid');

function generateVoucherCode(prefix = 'VCH') {
    const raw = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 12);
    return `${prefix}-${raw}`;
    // Ví dụ: VCH-A3F7B2C9D1E4
}

// Kiểm tra trùng trước khi lưu
async function issueVoucherCode(orderItemId, voucherProductId, ownerId, expireAt) {
    let code, exists;
    do {
        code = generateVoucherCode();
        exists = await VoucherCode.findOne({ where: { code } });
    } while (exists);

    return await VoucherCode.create({
        code,
        order_item_id: orderItemId,
        voucher_product_id: voucherProductId,
        owner_id: ownerId,
        expire_at: expireAt,
        status: 'active'
    });
}
```

---

## Bước 6 — Middleware Phân Quyền

```javascript
// middlewares/authorize.js
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Chưa xác thực' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }
        next();
    };
}

// Sử dụng trong routes
router.post('/vouchers', authenticate, authorize('partner'), createVoucher);
router.put('/vouchers/:id/approve', authenticate, authorize('admin'), approveVoucher);
router.get('/my-vouchers', authenticate, authorize('customer'), getMyVouchers);
```

---

## Bước 7 — Checklist Khởi Tạo Hoàn Tất

**Repository & Môi trường**
- [ ] Repo Git đã tạo, tất cả thành viên đã được thêm
- [ ] Branch `develop` đã tạo, `.gitignore` đã setup
- [ ] File `.env.example` đã có, file `.env` đã tạo (không commit `.env`)
- [ ] `README.md` có hướng dẫn setup cơ bản

**Database**
- [ ] Database đã tạo
- [ ] `schema.sql` chạy không lỗi
- [ ] `seed.sql` chạy không lỗi
- [ ] Đăng nhập được bằng tài khoản admin mẫu

**Backend**
- [ ] Server khởi động không lỗi (`npm start` / `php artisan serve` / `python manage.py runserver`)
- [ ] Kết nối DB thành công
- [ ] Route `/health` hoặc `/api` trả về 200 OK
- [ ] Đăng ký / Đăng nhập hoạt động
- [ ] JWT / Session hoạt động đúng

**Cấu trúc dự án**
- [ ] Thư mục `docs/` có BRD gốc
- [ ] Task board đã setup, task GĐ1 đã tạo

---

## Bước 8 — README.md Tối Thiểu

```markdown
# Voucher E-Commerce System

Hệ thống thương mại điện tử bán voucher giảm giá trực tuyến.

## Yêu cầu

- Node.js >= 18 (hoặc PHP >= 8.1 / Python >= 3.10)
- MySQL >= 8.0
- Git

## Cài đặt

\`\`\`bash
git clone <repo-url>
cd voucher-ecommerce/src/backend
npm install
cp .env.example .env
# Điền thông tin DB vào .env
\`\`\`

## Khởi tạo Database

\`\`\`bash
mysql -u root -p voucher_db < database/schema.sql
mysql -u root -p voucher_db < database/seed.sql
\`\`\`

## Chạy ứng dụng

\`\`\`bash
npm run dev
\`\`\`

## Tài khoản mẫu

| Role | Email | Password |
|---|---|---|
| Admin | admin@voucher.com | Admin@123 |
| Partner | partner@demo.com | Partner@123 |
| Customer | customer@demo.com | Customer@123 |
```

---

## Lưu ý quan trọng

**Không commit lên Git:**
- File `.env` (chứa thông tin bí mật)
- Thư mục `node_modules/` / `vendor/` / `venv/`
- File upload của người dùng

**Nên commit:**
- File `.env.example` (template không chứa giá trị thật)
- `schema.sql` và `seed.sql`
- Tất cả tài liệu trong `docs/`
