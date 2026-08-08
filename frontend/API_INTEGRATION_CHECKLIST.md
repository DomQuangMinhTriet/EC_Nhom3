# Frontend API Integration Checklist

Use this checklist when the backend contracts are available. Backend payloads
are the source of truth; update the adapter/types rather than page components.

| Domain | Current frontend source | Replace with backend contract | Validation after integration |
| --- | --- | --- | --- |
| Auth/session | `features/auth/auth-api.ts`, `AuthSessionProvider` | Supabase Auth + customer profile role | Sign-in, refresh, logout, role redirect |
| Public vouchers | `features/vouchers/api.ts`, `lib/mocks/vouchers.ts` | `GET /vouchers`, `GET /vouchers/:id`, categories/reviews | Browse, filter, search, detail, error state |
| Cart | `stores/cart-store.ts` | `/customers/me/cart` | Merge local cart on sign-in; invalidate after mutations |
| Checkout/orders | `components/cart/checkout-screen.tsx` | Order/payment endpoints and `/customers/me/orders` | Create order, payment status, confirmation, voucher issuance |
| Customer account | `lib/mocks/customer.ts` | Customer profile, vouchers, notifications | Edit profile, mark notification read, order history |
| Partner | `lib/mocks/partner.ts` | Partner profile, vouchers, branches, reports | Create/edit voucher, pending/approved lifecycle, quota |
| Branch redeem | `app/branch/redeem/page.tsx` | `POST /branch/redeem` | Invalid, expired, used, wrong branch and confirm redeem |
| Admin | `lib/mocks/admin.ts` | Admin users/partners/vouchers/categories/reports/audit log | Permission failures, approve/reject reason, pagination |

## Adapter rules

1. Keep `fetch` inside `src/lib/api/` or domain `api.ts`, never page components.
2. Model payloads with TypeScript types at the domain boundary.
3. Replace `TODO(API)` mocks only after a successful endpoint contract test.
4. Invalidate TanStack Query keys after every mutation.
5. Retain loading, empty, error and permission states while replacing mocks.
