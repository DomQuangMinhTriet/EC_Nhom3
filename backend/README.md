# Backend — Express + TypeScript + Drizzle ORM

REST API server for the EC Voucher System, backed by Supabase PostgreSQL via
[Drizzle ORM](https://orm.drizzle.team/) and Supabase Auth.

> **Migrated from Sequelize/JavaScript on 28/07/2026.** The previous
> implementation (models, routes, controllers, services, repositories) is kept
> at [`_legacy-sequelize/`](_legacy-sequelize/) purely as a field-by-field
> reference while the Drizzle schema and API layers are rebuilt — it is not
> run anymore and will be deleted once Phase 5 is complete.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in Supabase + Cloudinary credentials
npm run dev             # http://localhost:8080
```

## Scripts

| Command             | What it does                                              |
| -------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Start the API with hot reload (`tsx watch`)                |
| `npm run build`       | Bundle `src/` to `dist/` for production (`tsup`)            |
| `npm start`            | Run the built server (`node dist/index.js`)                 |
| `npm run typecheck`    | Type-check without emitting                                 |
| `npm run lint`         | ESLint                                                       |
| `npm run db:generate`  | Generate a SQL migration from the current Drizzle schema    |
| `npm run db:push`      | Push the schema straight to the configured database          |
| `npm run db:studio`    | Open Drizzle Studio against the configured database          |

## Project structure

```
backend/
├── src/
│   ├── index.ts              # Express entry point
│   ├── db/
│   │   ├── client.ts          # Drizzle client (Supabase Postgres connection)
│   │   └── schema/            # Table definitions, grouped like the Data Dictionary
│   │       ├── enums.ts
│   │       ├── account.ts     # Role, User, Profile, Customer/Partner/BranchProfile
│   │       ├── product.ts     # Category, VoucherProduct, BranchVoucherProduct, VoucherCode
│   │       ├── transaction.ts # Cart, CartItem, Order, OrderItem, Payment, Review
│   │       ├── notification.ts
│   │       ├── relations.ts   # drizzle `relations()` for the query API
│   │       └── index.ts       # barrel export
│   └── lib/
│       ├── cloudinary.ts      # uploadToCloudinary() helper
│       └── supabaseAdmin.ts   # server-side Supabase client (service role key)
├── drizzle/                  # Generated SQL migrations (checked in)
├── drizzle.config.ts
├── _legacy-sequelize/        # Reference only — see note above
└── .env.example
```

Routes/controllers/services for each domain land here incrementally across
Phase 2–5 of the [implementation plan](../docs); this scaffold intentionally
ships with a single health-check route (`GET /`, `GET /api/health/db`) so the
next phase starts from a clean, verified base.

## Database schema

The schema in `src/db/schema/` mirrors Data Dictionary v3.1 (17 tables). Two
deviations from v3.0, decided 28/07/2026:

- **`User.passwordHash` was removed.** Supabase Auth (`auth.users`) is the
  single source of truth for credentials — the app never hashes or checks a
  password itself.
- **`User.userId` has no default.** It must be set to the corresponding
  `auth.users.id` by the `auth.users → public.users` trigger (Phase 1,
  "Supabase Auth Config"), not auto-generated, so RLS policies can rely on
  `auth.uid()` matching it directly.

Run `npm run db:generate` after editing schema files, review the SQL under
`drizzle/`, then `npm run db:push` (or apply the migration via the Supabase
dashboard) against the real project.

## Auth & storage

- **Auth**: Supabase Auth. The frontend talks to Supabase directly for
  sign-up/sign-in; this backend verifies the JWT (`SUPABASE_JWT_SECRET`) on
  protected routes and uses `supabaseAdmin` (service role key) for
  admin-only operations like approving a Partner or Branch.
- **File storage**: Cloudinary, via `src/lib/cloudinary.ts`. Used for voucher
  images and avatars — see `.env.example` for the required credentials.

## Environment variables

See [`.env.example`](.env.example) for the full list: app port, Supabase
Postgres connection, Supabase Auth keys, and Cloudinary credentials.
