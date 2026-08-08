# Online Voucher Discount E-Commerce Platform

Full-stack e-commerce platform for buying and redeeming discount vouchers
online. The project is built with Next.js, Express, TypeScript, Supabase,
Drizzle ORM, and Cloudinary for HCMUS E-Commerce coursework.

## Project Overview

The platform supports three main user groups:

- Customers discover, buy, and redeem voucher codes.
- Partners create vouchers, manage inventory, and verify redemptions.
- Administrators approve partners/vouchers and monitor platform activity.

## Tech Stack

### Frontend

- Next.js 14 App Router
- React + TypeScript
- Tailwind CSS
- TanStack Query
- Zustand
- React Hook Form + Zod
- Supabase client SDK

### Backend

- Node.js + Express
- TypeScript
- Drizzle ORM
- Supabase PostgreSQL + Supabase Auth
- Cloudinary

## Project Structure

```text
EC_Nhom3/
|-- backend/
|   |-- drizzle/               # Drizzle SQL migrations
|   |-- src/
|   |   |-- app.ts
|   |   |-- index.ts
|   |   |-- routes/            # Registers backend module routers
|   |   |-- modules/           # Feature modules
|   |   |-- shared/            # Shared errors and HTTP helpers
|   |   |-- db/                # Drizzle client, schema, migrations, seed
|   |   `-- lib/               # Supabase admin and Cloudinary helpers
|   |-- .env.example
|   |-- drizzle.config.ts
|   |-- eslint.config.ts
|   |-- package.json
|   `-- README.md
|-- frontend/
|   |-- prototype/             # UI reference and implementation plan
|   |-- src/
|   |   |-- app/               # Next.js routes, layouts, pages
|   |   |-- components/        # Shared reusable UI components
|   |   |-- config/            # Frontend environment/config helpers
|   |   |-- features/          # Feature-specific UI and client logic
|   |   |-- hooks/             # Shared React hooks
|   |   |-- lib/               # External SDK/client wrappers
|   |   |-- providers/         # App-level providers
|   |   |-- services/          # API clients and service helpers
|   |   `-- types/             # Shared TypeScript types
|   |-- .env.local.example
|   |-- next.config.mjs        # Next 14 requires JS/MJS config
|   |-- postcss.config.ts
|   |-- tailwind.config.ts
|   |-- package.json
|   `-- README.md
|-- docs/
`-- README.md
```

Generated folders are not part of the source tree:

```text
backend/node_modules/
backend/dist/
frontend/node_modules/
frontend/.next/
frontend/out/
frontend/dist/
```

## Quick Start

### Prerequisites

- Node.js v20+
- npm v10+
- Supabase project
- Cloudinary account
- Git

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs at:

```text
http://localhost:8080
```

Production-style backend start:

```bash
npm start
```

`npm start` runs `npm run build` first, then starts `dist/index.js`.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

Production-style frontend start:

```bash
npm run build
npm start
```

## Backend Architecture

The backend follows a layered module structure:

```text
HTTP request
-> route
-> controller
-> service
-> repository
-> Drizzle ORM / Supabase PostgreSQL
```

Recommended backend feature shape:

```text
src/modules/<feature>/
|-- <feature>.routes.ts
|-- <feature>.controller.ts
|-- <feature>.service.ts
`-- <feature>.repository.ts
```

Backend layer rules:

- Controllers do not query the database directly.
- Services do not import Express `Request` or `Response`.
- Repositories are the only feature layer that talks to Drizzle ORM.
- Shared HTTP errors and middleware live in `src/shared`.
- New routers are registered in `src/routes/index.ts`.

Current backend API:

```text
GET /              # API health response
GET /api/health/db # Database connectivity check
```

## Frontend Architecture

The frontend follows a feature-oriented Next.js structure:

```text
src/app           # Routing, layouts, pages, route handlers
src/features      # Feature-specific components and client logic
src/components    # Shared UI components
src/hooks         # Shared React hooks
src/services/api  # Backend API access
src/lib           # External SDK/client wrappers
src/config        # Environment/config helpers
src/types         # Shared TypeScript types
```

Recommended frontend feature shape:

```text
src/features/<feature>/
|-- components/
|-- hooks/
|-- services/
|-- types.ts
`-- index.ts
```

Frontend layer rules:

- Pages in `src/app` compose features and layouts.
- Feature components do not read raw environment variables directly.
- Backend calls go through `src/services/api` or feature services.
- Supabase client creation stays in `src/lib/supabase`.
- Shared UI belongs in `src/components`.

Legacy Vite/React JavaScript code has been removed. The only JavaScript config
exception is `frontend/next.config.mjs`, because Next.js 14 does not support
`next.config.ts`.

## Common Commands

### Backend

```bash
cd backend
npm install
npm run dev
npm start
npm run build
npm run typecheck
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:verify
npm run db:push
npm run db:studio
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm start
npm run lint
npm run typecheck
```

## Environment Variables

See these files for the full list:

- [backend/.env.example](backend/.env.example)
- [frontend/.env.local.example](frontend/.env.local.example)

Backend summary:

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

Frontend summary:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

## Documentation

Project documentation lives in [docs/](docs/):

- [docs/01_tom-tat-do-an.md](docs/01_tom-tat-do-an.md)
- [docs/02_ke-hoach-tong-quat.md](docs/02_ke-hoach-tong-quat.md)
- [docs/03_ke-hoach-chi-tiet-giai-doan.md](docs/03_ke-hoach-chi-tiet-giai-doan.md)
- [docs/04_tai-lieu-hop-dau-tien.md](docs/04_tai-lieu-hop-dau-tien.md)
- [docs/05_huong-dan-initialize.md](docs/05_huong-dan-initialize.md)

## Troubleshooting

### Backend cannot start

- Run `npm install` inside `backend`.
- Check `.env` exists and has `PORT=8080`.
- Check whether port 8080 is already used:

```powershell
netstat -ano | findstr :8080
```

### Frontend cannot start

- Run `npm install` inside `frontend`.
- Check `.env.local` exists.
- Keep `next.config.mjs` as `.mjs` while using Next.js 14.
- Check whether port 3000 is already used:

```powershell
netstat -ano | findstr :3000
```

### Frontend cannot connect to backend

- Verify backend is running at `http://localhost:8080`.
- Verify `NEXT_PUBLIC_API_URL=http://localhost:8080` in `frontend/.env.local`.
- Review the browser console and terminal logs.

### Database connection fails

- Verify Supabase database credentials in `backend/.env`.
- Run `npm run db:verify` inside `backend`.
- Check whether the Supabase project is active and reachable.

## Notes

- This is an academic project for HCMUS E-Commerce coursework.
- Payment processing is mocked/not production-ready.
- Backend legacy JavaScript/Sequelize code has been removed.
- Frontend legacy Vite/React JavaScript code has been removed.
- Backend `dist/` and frontend `.next/` are generated and should not be committed.
