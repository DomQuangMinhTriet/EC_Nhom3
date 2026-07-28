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

Screens (S01–S36 in the implementation plan) and reusable components
(`Btn`, `Card`, `Input`, `TopNav`, `DashLayout`, `Toast`, …) get built out under
`src/app/` and `src/components/` starting in Phase 6, once the backend APIs
they depend on exist. Until then this scaffold is deliberately minimal — a
verified, building Next.js app is the Phase 1 deliverable.

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
