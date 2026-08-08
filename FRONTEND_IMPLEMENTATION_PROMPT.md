# Nhiệm vụ: Hoàn thiện toàn bộ Frontend EC Voucher System

## Vai trò và mục tiêu

Bạn là senior frontend engineer. Hoàn thiện **toàn bộ frontend production-ready** cho EC Voucher System trong repository hiện tại, bám sát tuyệt đối UI/UX đã có trong:

`frontend/prototype/EC-Voucher-UI.html`

Không chỉnh sửa hoặc xóa prototype. Prototype là nguồn thiết kế duy nhất: màu sắc, typography, khoảng cách, trạng thái, icon, layout desktop/mobile và nội dung mẫu phải được chuyển thành các component Next.js có thể tái sử dụng.

Mục tiêu cuối cùng: toàn bộ 36 màn hình hoạt động trong Next.js 14 App Router, responsive, có phân quyền, gọi backend APIs bằng TanStack Query và dùng Supabase Auth ở client.

## Ràng buộc bắt buộc

- Làm việc trong `frontend/`; không sửa `backend/` trừ khi chỉ cần cập nhật tài liệu API do phát hiện blocker.
- Dùng **Next.js 14 App Router + TypeScript**.
- Dùng **Tailwind CSS**; không tạo một CSS framework khác hoặc thay đổi visual system của prototype.
- Dùng `@supabase/ssr` / `@supabase/supabase-js` cho session/auth client.
- Dùng **TanStack Query** cho tất cả API server-state; không dùng `useEffect` trực tiếp để gọi API.
- Dùng **Zustand** chỉ cho global UI/client state, đặc biệt là cart UI state; không dùng Zustand thay TanStack Query.
- Dùng **React Hook Form + Zod** cho mọi form quan trọng.
- Không hard-code secret, URL thật, access token hoặc Supabase service role key.
- Dùng biến môi trường theo `frontend/.env.local.example`.
- Chỉ dùng UI/library đã có. Nếu cần cài thêm package, giải thích lý do ngắn gọn, kiểm tra tương thích Next.js 14, sau đó cập nhật `package.json` và lock file.
- Không thay prototype bằng giao diện tối giản/default. Ưu tiên fidelity UI trước, sau đó mới tinh chỉnh code.
- Không làm giả API thành kết quả cuối. Có thể dùng typed mock data tạm thời khi endpoint chưa có, nhưng mọi mock phải nằm trong `src/lib/mocks/`, được đánh dấu rõ `TODO(API)`, và hook phải sẵn sàng đổi sang API thật.

## Nguồn tham chiếu

- UI chuẩn: `frontend/prototype/EC-Voucher-UI.html`
- Kế hoạch triển khai: `EC Project HK3 2526/EC_ImplementationPlan.pdf`
- SRS/Use Case/Data Dictionary bản chốt: `Deliverables_EC_Nhom3/02_Phan_tich_thiet_ke/`
- Thay đổi model dữ liệu đã chốt: `Deliverables_EC_Nhom3/03_Ma_nguon_va_co_so_du_lieu/Data_Model_Implementation_Changes.md`
- Backend contract hiện có: `backend/README.md`, `backend/src/`, `backend/drizzle/`

## Bước 0 - Khảo sát trước khi code

1. Đọc toàn bộ `frontend/prototype/EC-Voucher-UI.html`, `frontend/package.json`, `frontend/src/`, `frontend/README.md` và `backend/README.md`.
2. Liệt kê design tokens trong prototype: font, màu, border radius, shadow, spacing, button, card, input, badge, toast, nav, dashboard layout.
3. Đối chiếu endpoint thực tế từ backend. Nếu API chưa được triển khai, tạo typed client/hook với interface đúng và mock fallback tạm thời; ghi blocker vào `frontend/README.md`.
4. Trước mỗi nhóm màn hình, xem UI prototype tương ứng và giữ đúng visual hierarchy, text và trạng thái có trong prototype.
5. Không báo hoàn thành khi chưa chạy `npm run typecheck`, `npm run lint` và `npm run build`.

## Kiến trúc frontend cần tạo

Tạo/hoàn thiện cấu trúc sau, điều chỉnh tên file khi cần nhưng không phá vỡ App Router:

```text
frontend/src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                         # S01 landing
│   │   ├── vouchers/page.tsx                # S05 listing
│   │   ├── vouchers/[id]/page.tsx           # S06 detail
│   │   └── search/page.tsx                  # S07 search
│   ├── (auth)/
│   │   ├── login/page.tsx                   # S02
│   │   ├── register/page.tsx                # S03
│   │   ├── forgot-password/page.tsx         # S04
│   │   └── update-password/page.tsx
│   ├── (customer)/
│   │   ├── cart/page.tsx                    # S08
│   │   ├── checkout/page.tsx                # S09
│   │   ├── order-confirmation/[id]/page.tsx # S10
│   │   ├── account/page.tsx                 # S11
│   │   ├── my-vouchers/page.tsx             # S12
│   │   ├── orders/page.tsx                  # S13
│   │   ├── notifications/page.tsx           # S14
│   │   └── settings/page.tsx                # S15
│   ├── partner/
│   │   ├── dashboard/page.tsx               # S16
│   │   ├── vouchers/page.tsx                # S17
│   │   ├── vouchers/new/page.tsx            # S18
│   │   ├── vouchers/[id]/edit/page.tsx      # S19
│   │   ├── profile/page.tsx                 # S20
│   │   ├── reports/page.tsx                 # S21
│   │   ├── notifications/page.tsx           # S22
│   │   ├── settings/page.tsx                # S23
│   │   └── branches/page.tsx                # S24
│   ├── branch/
│   │   └── redeem/page.tsx                  # S25
│   ├── admin/
│   │   ├── dashboard/page.tsx               # S26
│   │   ├── users/page.tsx                   # S27
│   │   ├── partners/page.tsx                # S28
│   │   ├── partners/new/page.tsx            # S29
│   │   ├── vouchers/approval/page.tsx       # S30
│   │   ├── vouchers/page.tsx                # S31
│   │   ├── categories/page.tsx              # S32
│   │   ├── reports/page.tsx                 # S33
│   │   ├── settings/page.tsx                # S34
│   │   ├── notifications/page.tsx           # S35
│   │   └── audit-log/page.tsx               # S36
│   ├── api/health/route.ts
│   ├── layout.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/
│   ├── ui/                                 # Primitive UI theo prototype
│   ├── common/                             # Button, Card, Input, Icon, Toast, EmptyState...
│   ├── navigation/                         # TopNav, Sidebar, MobileNav, Breadcrumb
│   ├── voucher/                            # VoucherCard, VoucherFilters, VoucherForm...
│   ├── cart/
│   ├── customer/
│   ├── partner/
│   ├── branch/
│   └── admin/
├── features/
│   ├── auth/
│   ├── vouchers/
│   ├── cart/
│   ├── orders/
│   ├── payments/
│   ├── redemption/
│   ├── reviews/
│   ├── notifications/
│   └── reports/
├── hooks/
│   └── queries/                            # TanStack Query hooks
├── lib/
│   ├── api/                                # Typed API client + endpoint modules
│   ├── supabase/                           # client/server helpers
│   ├── schemas/                            # Zod schemas
│   ├── utils/
│   └── mocks/                              # Temporary, typed mock data only
├── stores/
│   ├── cart-store.ts
│   └── ui-store.ts
├── types/
└── middleware.ts
```

## Thiết kế và hành vi chung

### Design system

- Trích token trực tiếp từ object/theme CSS trong prototype rồi đưa vào Tailwind config hoặc CSS variables.
- Tạo component primitive có props TypeScript: `Button`, `Input`, `Select`, `Textarea`, `Modal`, `Toast`, `Badge`, `Card`, `DataTable`, `Pagination`, `Avatar`, `EmptyState`, `LoadingState`.
- Dùng icon library đã có trong prototype hoặc Lucide nếu prototype đã dùng; không trộn nhiều style icon.
- Responsive tối thiểu: 360px, tablet và desktop. Không có cuộn ngang ngoài ý muốn.
- Mọi màn hình phải có loading, empty, error và success state phù hợp UI prototype.

### Auth và quyền truy cập

- Client Supabase phải dùng environment variables `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Lắng nghe `onAuthStateChange`; session tự refresh và persist đúng cách.
- Dùng Next.js middleware/protected layout để bảo vệ route theo role:
  - Customer: `/cart`, `/checkout`, `/account`, `/my-vouchers`, `/orders`, `/notifications`, `/settings`
  - Partner Representative: `/partner/*`
  - Branch Staff: `/branch/redeem`
  - Admin: `/admin/*`
- Sai role: chuyển về trang không có quyền hoặc dashboard đúng role; không chỉ ẩn menu ở UI.
- Login/register/forgot-password dùng RHF + Zod, hiển thị lỗi đúng theo prototype.

### API layer

- Tạo một `apiClient` duy nhất, tự thêm Supabase access token khi có session.
- Chuẩn hóa response/error: `ApiError`, trạng thái loading, retry hợp lý và toast thông báo.
- Mỗi domain có `keys.ts`, `api.ts`, `hooks.ts`, `types.ts` nếu phù hợp.
- Không để `fetch()` rải rác trong page component.
- Invalidates/invalidateQueries đúng sau mutation: cart, order, voucher, notification, approval, redeem.

## Danh sách màn hình bắt buộc

### Public/Auth - S01 đến S07

| ID | Màn hình | Yêu cầu chính |
|---|---|---|
| S01 | Landing | Hero, category, voucher nổi bật, CTA, top navigation như prototype. |
| S02 | Login | Supabase sign-in, validation, redirect theo role. |
| S03 | Register | Đăng ký Customer; liên kết luồng đăng ký Partner khi cần. |
| S04 | Forgot password | Gửi reset link/mô phỏng theo Supabase Auth. |
| S05 | Voucher listing/filter | Search, category, discount, price/range, pagination, query params. |
| S06 | Voucher detail | Điều kiện, chi nhánh, giá, số lượng, add to cart, review. |
| S07 | Search results | Đồng bộ search query, empty state, loading state. |

### Customer - S08 đến S15

| ID | Màn hình | Yêu cầu chính |
|---|---|---|
| S08 | Cart | Xem/sửa/xóa item, kiểm tra tồn, đồng bộ Zustand + API. |
| S09 | Checkout | Tạo order, chọn payment mock, validation. |
| S10 | Order confirmation | Hiển thị order completed, VoucherCode, QR/link nếu API trả về. |
| S11 | Customer profile | Xem/sửa profile, upload avatar. |
| S12 | My vouchers | Filter trạng thái, mở chi tiết mã/QR. |
| S13 | Order history | Danh sách và chi tiết order. |
| S14 | Notifications | Đọc/đánh dấu đã đọc, badge chưa đọc. |
| S15 | Settings | Cài đặt account đúng prototype; thao tác auth phù hợp Supabase. |

### Partner và Branch - S16 đến S25

| ID | Màn hình | Yêu cầu chính |
|---|---|---|
| S16 | Partner dashboard | KPI, shortcut, trạng thái voucher. |
| S17 | Voucher management | List/filter/search trạng thái voucher của Partner. |
| S18 | Create voucher | RHF + Zod, upload hình, branch quota, submit pending review. |
| S19 | Edit voucher | Chỉ cho sửa theo trạng thái backend cho phép. |
| S20 | Partner profile | Hồ sơ doanh nghiệp và trạng thái duyệt. |
| S21 | Partner reports | KPI doanh thu/bán/đã dùng theo khoảng thời gian. |
| S22 | Partner notifications | Thông báo xét duyệt/thay đổi voucher. |
| S23 | Partner settings | UI theo prototype. |
| S24 | Branches/staff | CRUD chi nhánh, trạng thái và quota voucher. |
| S25 | Redeem voucher | Nhập code là bắt buộc; camera QR là enhancement. Hiển thị lỗi: không tồn tại, hết hạn, đã dùng, sai chi nhánh; chỉ redeem sau xác nhận. |

### Admin - S26 đến S36

| ID | Màn hình | Yêu cầu chính |
|---|---|---|
| S26 | Admin dashboard | KPI users/partners/vouchers/orders/revenue. |
| S27 | User management | Search/filter, xem, khóa/mở khóa nếu API hỗ trợ. |
| S28 | Partner management | Danh sách, trạng thái và thao tác duyệt. |
| S29 | Add partner | Form theo prototype; liên kết API khi backend có. |
| S30 | Voucher approval | Xem chi tiết, approve/reject, bắt buộc lý do từ chối. |
| S31 | Voucher management | Search/filter, thay đổi trạng thái theo quyền. |
| S32 | Categories | CRUD danh mục, xử lý parent category nếu API hỗ trợ. |
| S33 | Admin reports | Chỉ số tổng quan và filter thời gian. |
| S34 | Admin settings | UI theo prototype. |
| S35 | Admin notifications | Danh sách/trạng thái đọc. |
| S36 | Audit log | Filter actor/action/time/target, pagination. |

## Thứ tự triển khai

### Đợt A - Nền tảng UI và auth

1. Setup providers, Tailwind tokens, Supabase browser client, query client và API client.
2. Tạo common components, navigation và responsive layouts.
3. Hoàn thiện S01-S04.
4. Hoàn thiện middleware và role redirect.

### Đợt B - Public và Customer flow

1. S05-S07 voucher browse/search/detail.
2. Cart Zustand + API hooks, S08.
3. Checkout/payment mock/order confirmation, S09-S10.
4. S11-S15 customer account screens.

### Đợt C - Partner, Branch và Admin

1. S16-S24 Partner screens.
2. S25 redeem screen và trạng thái lỗi đầy đủ.
3. S26-S36 Admin portal.

### Đợt D - Hoàn thiện chất lượng

1. Thay mock bằng API thật khi endpoint đã sẵn sàng.
2. Kiểm tra tất cả loading/error/empty/permission states.
3. So sánh từng màn với prototype ở desktop và mobile.
4. Chạy lint, typecheck, build; sửa tất cả lỗi.
5. Cập nhật `frontend/README.md`: setup, .env, scripts, route map, API blockers.

## API contract mong đợi

Ưu tiên endpoint đã nêu trong Implementation Plan. Dùng adapter có thể cấu hình base URL qua `NEXT_PUBLIC_API_URL`.

```text
Auth: /auth/register, /auth/login, /auth/refresh, /auth/forgot-password
Customer: /customers/me, /customers/me/avatar, /customers/me/cart, /customers/me/orders,
          /customers/me/vouchers, /customers/me/reviews, /customers/me/notifications
Partner: /partners/me, /partners/me/branches, /partner/vouchers, /partner/vouchers/:id/branches
Branch: /branches/me, /branch/redeem
Public: /categories, /vouchers, /vouchers/:id, /vouchers/:id/reviews
Admin: /admin/partners, /admin/branches, /admin/vouchers/:id/status, /admin/categories,
       /admin/reviews/:id/status, /admin/* dashboard/report/audit-log endpoints
Transaction: /payments/initiate, /payments/callback
```

Khi endpoint có tên hoặc payload khác code backend thực tế, dùng backend là source of truth và cập nhật README với sự khác biệt. Không tự ý sửa backend chỉ để làm UI pass.

## Tiêu chí nghiệm thu

Chỉ kết thúc khi tất cả điều kiện sau đạt:

- [ ] S01-S36 có route/màn hình rõ ràng và khớp prototype về visual hierarchy.
- [ ] Không còn placeholder UI chung chung ở route chính.
- [ ] Tất cả form quan trọng dùng RHF + Zod.
- [ ] Tất cả server-state gọi qua TanStack Query.
- [ ] Auth/session/role redirect hoạt động hoặc được đánh dấu blocker có hướng dẫn tái tạo.
- [ ] Customer happy path: browse → cart → checkout → payment mock → order confirmation → my vouchers.
- [ ] Partner happy path: dashboard → create voucher → submit → xem trạng thái.
- [ ] Branch flow: nhập code → validate → confirm redeem.
- [ ] Admin happy path: duyệt partner/voucher và xem dashboard/audit log.
- [ ] Mobile 360px không có horizontal scroll trên các màn chính.
- [ ] `npm run lint`, `npm run typecheck`, `npm run build` đều pass.
- [ ] `frontend/README.md` mô tả cách chạy, biến môi trường và các API chưa có.

## Cách báo cáo sau mỗi đợt

Kết thúc mỗi đợt, báo cáo ngắn gọn:

1. File/route/component đã tạo hoặc sửa.
2. Màn hình đã hoàn thành theo Sxx.
3. API đã kết nối và endpoint còn thiếu.
4. Kết quả lint/typecheck/build.
5. Những blocker cần backend hỗ trợ.

Không dừng ở kế hoạch. Hãy triển khai theo từng đợt, tự kiểm tra và tiếp tục cho đến khi đạt toàn bộ tiêu chí nghiệm thu.
