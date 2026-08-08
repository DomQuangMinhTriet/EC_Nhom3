# Frontend — Next.js 14 + TypeScript

Customer / Partner / Branch / Admin web app for the EC Voucher System, built
with Next.js 14 (App Router), Tailwind CSS, TanStack Query, Zustand, React
Hook Form + Zod, and `supabase-js` for auth.

> **Migrated from Vite + React (JS) on 28/07/2026.** The previous scaffold is
> kept at [`_legacy-vite/`](_legacy-vite/) for reference only and is not run
> anymore.
>
> [`prototype/EC-Voucher-UI.html`](prototype/EC-Voucher-UI.html) is the
> visual reference for every screen — components, layout, and design tokens
> get extracted from it into `src/` incrementally (see Phase 6,
> "Components từ Prototype").

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Supabase URL/anon key, API URL
npm run dev                         # http://localhost:3000
```

## Scripts

| Command             | What it does                    |
| -------------------- | -------------------------------- |
| `npm run dev`         | Start the dev server              |
| `npm run build`       | Production build                  |
| `npm start`            | Serve the production build        |
| `npm run lint`         | `next lint`                       |
| `npm run typecheck`    | Type-check without emitting       |
| `npm run test`         | Run the Vitest frontend suite     |
| `npm run test:watch`   | Run tests interactively           |

## Project structure

```
frontend/
├── prototype/                 # Static HTML/CSS design reference (do not run)
├── src/
│   ├── app/                   # App Router — pages, layouts, route handlers
│   │   ├── layout.tsx          # Root layout, wraps <AppProviders>
│   │   ├── page.tsx            # Placeholder landing page
│   │   └── globals.css         # Tailwind + design-token CSS variables
│   ├── providers/
│   │   └── app-providers.tsx  # TanStack QueryClientProvider
│   └── lib/
│       └── supabase/
│           ├── client.ts       # Browser Supabase client
│           └── server.ts       # Server Component / Route Handler Supabase client
├── _legacy-vite/              # Reference only — see note above
└── .env.local.example
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

## Design tokens

`src/app/globals.css` defines CSS variables (`--background`, `--primary`,
`--border`, …) consumed by `tailwind.config.ts`. These are placeholders —
replace their values with the real palette from
`prototype/EC-Voucher-UI.html` before building screens against them.

## Auth

Sign-up/sign-in go straight to Supabase Auth via `supabase-js`
(`src/lib/supabase/client.ts` for Client Components,
`src/lib/supabase/server.ts` for Server Components / Route Handlers). The
Express backend never sees a password — it only verifies the Supabase JWT on
requests that need it.
