# Backend - Express + TypeScript + Drizzle ORM

Backend API cho EC Voucher System. Server dung Express + TypeScript, ket noi
Supabase PostgreSQL qua Drizzle ORM, Supabase Auth cho xac thuc, va Cloudinary
cho luu tru hinh anh.

## Quick Start

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Server mac dinh chay tai:

```text
http://localhost:8080
```

Chay kieu production:

```bash
npm start
```

`npm start` tu dong chay `npm run build` truoc, sau do chay
`dist/index.js`. Vi vay co the xoa `dist/` bat cu luc nao; no se duoc tao lai
khi start/build.

Trong luc phat trien, uu tien dung:

```bash
npm run dev
```

## Folder Structure

```text
backend/
|-- drizzle/
|   |-- meta/                 # Drizzle migration metadata
|   `-- *.sql                 # Generated SQL migrations
|-- src/
|   |-- modules/
|   |   `-- <feature>/
|   |       |-- <feature>.controller.ts
|   |       |-- <feature>.repository.ts
|   |       |-- <feature>.routes.ts
|   |       `-- <feature>.service.ts
|   |-- routes/
|   |   `-- index.ts           # Register module routers
|   |-- shared/
|   |   |-- errors/
|   |   |   `-- AppError.ts
|   |   `-- http/
|   |       |-- asyncHandler.ts
|   |       |-- errorHandler.ts
|   |       `-- notFoundHandler.ts
|   |-- db/
|   |   |-- schema/
|   |   |   |-- account.ts
|   |   |   |-- enums.ts
|   |   |   |-- index.ts
|   |   |   |-- notification.ts
|   |   |   |-- product.ts
|   |   |   |-- relations.ts
|   |   |   `-- transaction.ts
|   |   |-- client.ts          # Drizzle database client
|   |   |-- migrate.ts         # Run migrations
|   |   |-- seed.ts            # Seed data
|   |   `-- verify.ts          # Verify database connection/schema
|   |-- lib/
|   |   |-- cloudinary.ts      # Cloudinary upload helper
|   |   `-- supabaseAdmin.ts   # Supabase admin client
|   |-- app.ts                # Express app composition
|   `-- index.ts              # Express server entry point
|-- .env.example              # Environment variable template
|-- .gitignore
|-- drizzle.config.ts
|-- eslint.config.ts
|-- package-lock.json
|-- package.json
|-- README.md
`-- tsconfig.json
```

Generated/local folders khong nam trong source tree:

```text
node_modules/   # created by npm install
dist/           # created by npm run build or npm start
```

## Scripts

| Command               | Purpose                                                 |
| --------------------- | ------------------------------------------------------- |
| `npm run dev`         | Start dev server with hot reload via `tsx watch`        |
| `npm run build`       | Build TypeScript source into `dist/` with `tsup`        |
| `npm start`           | Build, then run compiled server from `dist/index.js`    |
| `npm run typecheck`   | Type-check TypeScript without emitting files            |
| `npm run lint`        | Run ESLint for TypeScript source                        |
| `npm run test`        | Run TypeScript tests with Node's test runner            |
| `npm run db:generate` | Generate Drizzle SQL migration files                    |
| `npm run db:migrate`  | Apply checked-in migrations                             |
| `npm run db:seed`     | Seed development data                                   |
| `npm run db:verify`   | Verify database connectivity/schema assumptions         |
| `npm run db:push`     | Push current schema directly to configured database     |
| `npm run db:studio`   | Open Drizzle Studio                                     |

## Architecture

Backend dang di theo layered architecture de code de test, de thay doi, va
gan voi SOLID hon:

```text
HTTP request
-> routes
-> controller
-> service
-> repository
-> Drizzle ORM / database
```

Quy uoc cho moi feature/module:

```text
src/modules/<feature>/
|-- <feature>.routes.ts       # Khai bao endpoint va middleware
|-- <feature>.controller.ts   # Doc req, goi service, tra res
|-- <feature>.service.ts      # Business logic / use case
`-- <feature>.repository.ts   # Truy van database bang Drizzle ORM
```

Nguyen tac tach lop:

- Controller khong query database truc tiep.
- Service khong import Express `Request`/`Response`.
- Repository la noi lam viec voi Drizzle ORM va `src/db`.
- Loi ung dung nen nem bang `AppError` de `errorHandler` xu ly thong nhat.
- Route moi nen duoc dang ky vao `src/routes/index.ts`.

Vi du module hien tai:

```text
src/modules/notification/
|-- notification.routes.ts
|-- notification.controller.ts
|-- notification.service.ts
`-- notification.repository.ts
```

`GET /api/notifications` di qua controller, service va repository de lay
notification cua Customer, nen day la mau nho de copy khi them module moi.

## Environment Variables

Copy `.env.example` to `.env`, then fill in real values:

```env
PORT=8080
NODE_ENV=development

DB_HOST=
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=
DB_SSL=true

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

`.env` la local-only va khong commit.

## Current API

Tai lieu API chi tiet nam trong thu muc `docs/`, vi du:

| Tai lieu | Noi dung |
| --- | --- |
| `docs/API_INDEX.md` | Muc luc tat ca endpoint hien tai |
| `docs/AUTH_API.md` | Dang ky, dang nhap, refresh token |
| `docs/PROFILE_API.md` | Tao va cap nhat profile |
| `docs/USER_API.md` | Quan ly user |
| `docs/CATEGORY_API.md` | Category |
| `docs/VOUCHER_PRODUCT_API.md` | Voucher product |
| `docs/BRANCH_QUOTA_API.md` | Branch quota |
| `docs/CART_API.md` | Cart |
| `docs/VOUCHER_INSTANCE_API.md` | Voucher instance cua Customer |
| `docs/REVIEW_API.md` | Review |
| `docs/NOTIFICATION_API.md` | Notification va email |

## Notes

- Backend hien tai la TypeScript-first. Legacy JavaScript/Sequelize da duoc go.
- `dist/` khong can commit va co the xoa bat cu luc nao.
- Neu `npm run dev` bao thieu `tsx`, chay lai `npm install` trong thu muc
  `backend`.
