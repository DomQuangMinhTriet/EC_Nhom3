# Frontend - Next.js 14 + TypeScript

Customer / Partner / Branch / Admin web app for EC Voucher System. The app uses
Next.js App Router, TypeScript, Tailwind CSS, TanStack Query, Zustand, React
Hook Form + Zod, and Supabase Auth.

## Quick Start

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend runs at:

| Command             | What it does                    |
| -------------------- | -------------------------------- |
| `npm run dev`         | Start the dev server              |
| `npm run build`       | Production build                  |
| `npm start`            | Serve the production build        |
| `npm run lint`         | `next lint`                       |
| `npm run typecheck`    | Type-check without emitting       |
| `npm run test`         | Run the Vitest frontend suite     |
| `npm run test:watch`   | Run tests interactively           |

Production-style start:

```bash
npm run build
npm start
```

## Folder Structure

```text
frontend/
|-- prototype/
|   |-- EC-Voucher-UI.html
|   `-- EC_Voucher_ImplementationPlan.md
|-- src/
|   |-- app/
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components/           # Shared reusable UI components
|   |-- config/
|   |   `-- env.ts            # Public frontend environment values
|   |-- features/             # Feature-specific UI and client logic
|   |-- hooks/                # Reusable React hooks
|   |-- lib/
|   |   `-- supabase/
|   |       |-- client.ts
|   |       `-- server.ts
|   |-- providers/
|   |   `-- app-providers.tsx # TanStack Query provider
|   |-- services/
|   |   `-- api/
|   |       `-- http-client.ts # Typed API request helper
|   `-- types/                # Shared TypeScript types
|-- .env.local.example
|-- .eslintrc.json
|-- next.config.mjs
|-- package-lock.json
|-- package.json
|-- postcss.config.js
|-- tailwind.config.ts
`-- tsconfig.json
```

Generated/local folders are not part of the source tree:

```text
node_modules/
.next/
out/
dist/
```

## JavaScript Cleanup

Legacy Vite/React JavaScript code has been removed. Frontend source code and
tooling config are TypeScript-first.

One framework exception remains:

```text
next.config.mjs
```

Next.js 14 does not support `next.config.ts`; `next build` fails if the config
is renamed to TypeScript. Keep this file as `.mjs` until the project upgrades
to a Next.js version that supports TypeScript config.

## Scripts

| Command             | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the Next.js dev server                 |
| `npm run build`     | Create a production build                    |
| `npm start`         | Serve the production build                   |
| `npm run lint`      | Run Next.js ESLint rules                     |
| `npm run typecheck` | Type-check TypeScript without emitting files |

## Architecture

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

## Current implementation

All **S01–S36** frontend screens are implemented as Next.js App Router routes:

- Public/auth: `/`, `/login`, `/register`, `/forgot-password`,
  `/update-password`, `/vouchers`, `/vouchers/[id]`, `/search`.
- Customer: `/cart`, `/checkout`, `/order-confirmation/[id]`, `/account`,
  `/my-vouchers`, `/orders`, `/notifications`, `/settings`.
- Partner and branch: `/partner/dashboard`, `/partner/vouchers`,
  `/partner/vouchers/new`, `/partner/vouchers/[id]/edit`, `/partner/profile`,
  `/partner/reports`, `/partner/notifications`, `/partner/settings`,
  `/partner/branches`, `/branch/redeem`.
- Admin: `/admin/dashboard`, `/admin/users`, `/admin/partners`,
  `/admin/partners/new`, `/admin/vouchers/approval`, `/admin/vouchers`,
  `/admin/categories`, `/admin/reports`, `/admin/settings`,
  `/admin/notifications`, `/admin/audit-log`.

Design tokens from the prototype have been transferred to Tailwind/CSS
(`Plus Jakarta Sans`, indigo/orange palette, radii and tinted shadows). Forms
use React Hook Form + Zod; server-state is exposed through TanStack Query
domain hooks. Cart UI state uses Zustand.

Protected route layouts use `src/components/auth/protected-page.tsx` server
side. With configured Supabase credentials, it checks the temporary role source
`user.user_metadata.role` (`customer`, `partner`, `branch`, `admin`). Local
visual development without Supabase credentials deliberately remains open.

## API blockers

At 06/08/2026 the Express backend exposes only `GET /` and
`GET /api/health/db`. It has no auth profile, voucher, cart, order, partner,
branch, admin, payment or notification endpoints. The frontend API adapter is
ready at `src/lib/api/client.ts`; typed temporary data is under
`src/lib/mocks/` and every module is marked `TODO(API)` for replacement once
the backend contracts are implemented.

See [`API_INTEGRATION_CHECKLIST.md`](API_INTEGRATION_CHECKLIST.md) for the
mock-to-endpoint migration map and [`FRONTEND_QA_CHECKLIST.md`](FRONTEND_QA_CHECKLIST.md)
for the automated/manual quality checklist.

```text
src/features/<feature>/
|-- components/
|-- hooks/
|-- services/
|-- types.ts
`-- index.ts
```

Layer rules:

- Pages in `src/app` compose features and layouts.
- Feature components should not read raw environment variables directly.
- Backend calls should go through `src/services/api` or feature services.
- Supabase client creation stays in `src/lib/supabase`.
- Shared UI belongs in `src/components`; domain-specific UI belongs in
  `src/features/<feature>`.

## Environment Variables

Copy `.env.local.example` to `.env.local`, then fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

Only variables prefixed with `NEXT_PUBLIC_` are exposed to browser code.

## Current State

The app is currently a clean Next.js + TypeScript scaffold. Real screens will
be built from:

```text
prototype/EC-Voucher-UI.html
```

The existing route is:

```text
GET /  # Placeholder landing page
```
