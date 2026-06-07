# Kế Hoạch Chi Tiết Từng Giai Đoạn

**Đề tài:** Hệ thống thương mại điện tử bán voucher giảm giá trực tuyến  

---

## Giai Đoạn 1 — Phân Tích & Đặc Tả Yêu Cầu

**Thời gian:** Tuần 1–2  
**Mục tiêu:** Chuyển hóa BRD thành tài liệu đặc tả phần mềm (SRS) và use case chi tiết có thể dùng để thiết kế và cài đặt.

### Công việc cần thực hiện

**Tuần 1**
- Đọc kỹ BRD, thống nhất nhóm về phạm vi và luồng nghiệp vụ
- Xác định danh sách Use Case đầy đủ cho 3 vai trò
- Vẽ Use Case Diagram tổng thể
- Viết Use Case Specification cho các use case ưu tiên cao (CRUD voucher, mua hàng, xác thực mã)

**Tuần 2**
- Hoàn thiện SRS (Software Requirements Specification)
  - Mô tả hệ thống, phạm vi, giả định
  - Yêu cầu chức năng chi tiết theo từng actor
  - Yêu cầu phi chức năng (hiệu năng, bảo mật, khả năng dùng)
- Vẽ Activity Diagram / BPMN cho luồng nghiệp vụ chính:
  - Luồng mua voucher
  - Luồng tạo & duyệt voucher
  - Luồng xác thực sử dụng voucher
- Xác nhận lại SRS với cả nhóm trước khi chuyển sang GĐ2

### Đầu ra

| Tài liệu | Mô tả |
|---|---|
| `SRS.md / SRS.docx` | Đặc tả yêu cầu phần mềm đầy đủ |
| `UseCase-Diagram.png` | Sơ đồ Use Case tổng thể |
| `UseCase-Specification.docx` | Đặc tả chi tiết từng use case |
| `ActivityDiagram/` | Các biểu đồ luồng hoạt động |

### Tiêu chí hoàn thành

- [ ] Đủ use case cho 3 vai trò (≥ 20 use case)
- [ ] SRS bao gồm đủ yêu cầu chức năng và phi chức năng
- [ ] Ít nhất 3 Activity Diagram cho 3 luồng chính

---

## Giai Đoạn 2 — Thiết Kế Hệ Thống

**Thời gian:** Tuần 3–4  
**Mục tiêu:** Thiết kế cấu trúc dữ liệu và giao diện người dùng làm cơ sở cho cài đặt.

### GĐ2a — Thiết kế cơ sở dữ liệu (Tuần 3)

**Công việc**
- Xác định các thực thể chính từ DR-01 → DR-06:
  - User, Role, Partner, Branch
  - VoucherProduct, VoucherCategory
  - Order, OrderItem
  - VoucherCode, VoucherCodeLog
  - Review, SystemLog
- Thiết kế ERD chi tiết: khóa chính, khóa ngoại, kiểu dữ liệu, ràng buộc
- Viết từ điển dữ liệu (Data Dictionary) cho từng bảng
- Viết SQL script tạo bảng (DDL)
- Chuẩn bị seed data mẫu thực tế (≥ 3 đối tác, ≥ 10 voucher, ≥ 20 đơn hàng)

**Lưu ý thiết kế quan trọng**
- Bảng `voucher_codes` cần trường `status` (pending / active / used / expired / cancelled)
- Bảng `orders` cần trường `payment_status` tách biệt `order_status`
- Bảng `system_logs` cần lưu `actor_id`, `action`, `target_type`, `target_id`, `timestamp`
- Index trên `voucher_codes.code` để tra cứu nhanh khi xác thực

**Đầu ra**

| Tài liệu | Mô tả |
|---|---|
| `ERD.png / ERD.drawio` | Sơ đồ quan hệ thực thể |
| `DataDictionary.xlsx` | Từ điển dữ liệu đầy đủ |
| `schema.sql` | Script DDL tạo bảng |
| `seed.sql` | Dữ liệu mẫu |

### GĐ2b — Thiết kế giao diện (Tuần 4)

**Công việc**
- Thiết kế wireframe / mockup cho các màn hình chính:

  **Khách hàng:** Trang chủ, Tìm kiếm & lọc voucher, Chi tiết voucher, Giỏ hàng, Checkout, Thanh toán (mô phỏng), Trang "Voucher của tôi", Lịch sử đơn hàng

  **Đối tác:** Dashboard đối tác, Tạo / sửa voucher, Danh sách voucher, Xác thực voucher code, Báo cáo đối tác

  **Quản trị viên:** Dashboard admin, Quản lý người dùng, Duyệt đối tác, Duyệt voucher, Quản lý đơn hàng, Nhật ký hệ thống

- Thiết kế hệ thống màu sắc, typography nhất quán
- Đảm bảo responsive (desktop + mobile) cho màn hình khách hàng

**Đầu ra**

| Tài liệu | Mô tả |
|---|---|
| `Wireframe/` | Wireframe toàn bộ màn hình (Figma / Balsamiq / PDF) |
| `UI-Style-Guide.md` | Quy ước màu, font, component |

### Tiêu chí hoàn thành GĐ2

- [ ] ERD đúng vòng đời voucher (voucher product ≠ voucher code)
- [ ] DDL script chạy được không lỗi
- [ ] Wireframe đủ 3 nhóm màn hình
- [ ] Cả nhóm review và chốt thiết kế trước khi code

---

## Giai Đoạn 3 — Cài Đặt

**Thời gian:** Tuần 5–8  
**Mục tiêu:** Xây dựng ứng dụng hoàn chỉnh theo thiết kế đã duyệt.

### Sprint 1 — Nền tảng (Tuần 5)

- Setup project (repo Git, cấu trúc thư mục, môi trường dev)
- Cài đặt DB từ `schema.sql`
- Xây dựng hệ thống xác thực: đăng ký, đăng nhập, phân quyền theo role (Customer / Partner / Admin)
- Middleware bảo vệ route theo role
- Layout tổng thể cho 3 giao diện (Customer, Partner, Admin)

### Sprint 2 — Nghiệp vụ đối tác & Admin (Tuần 6)

- Module Partner: đăng ký doanh nghiệp, quản lý hồ sơ, quản lý chi nhánh
- Module Voucher: tạo voucher, gửi duyệt, xem danh sách
- Module Admin: duyệt đối tác, duyệt/từ chối voucher, quản lý người dùng
- Dashboard Admin: số liệu tổng quan

### Sprint 3 — Nghiệp vụ mua hàng (Tuần 7)

- Trang chủ & tìm kiếm voucher (lọc theo danh mục, giá, khu vực)
- Chi tiết voucher
- Giỏ hàng (thêm / xóa / cập nhật)
- Tạo đơn hàng
- Thanh toán mô phỏng
- **Phát hành voucher code duy nhất** sau thanh toán thành công
- Trang "Voucher của tôi" — hiển thị mã & QR mô phỏng
- Lịch sử đơn hàng

### Sprint 4 — Xác thực & Hoàn thiện (Tuần 8)

- Module xác thực voucher cho đối tác: nhập mã / quét QR mô phỏng
- Xác nhận sử dụng, cập nhật trạng thái, ngăn dùng lại
- Nhật ký sử dụng voucher
- Báo cáo đối tác: doanh thu, tỷ lệ sử dụng
- Dashboard admin đầy đủ
- Nhật ký hệ thống (admin)
- Đánh giá & phản hồi (khách hàng)
- Load seed data, kiểm tra toàn bộ luồng

### Tiêu chí hoàn thành GĐ3

- [ ] Toàn bộ 5 quy trình chính chạy end-to-end không lỗi
- [ ] Phân quyền đúng (không thể truy cập chức năng ngoài role)
- [ ] Voucher code là duy nhất
- [ ] Không bán vượt số lượng phát hành
- [ ] Giao diện responsive trên mobile

---

## Giai Đoạn 4 — Kiểm Thử

**Thời gian:** Tuần 9  
**Mục tiêu:** Phát hiện và xử lý lỗi, đảm bảo hệ thống đáp ứng tiêu chí nghiệm thu.

### Công việc

- Viết **Test Plan** tổng thể
- Viết **Test Cases** cho từng luồng nghiệp vụ chính:
  - Đăng ký / Đăng nhập / Phân quyền
  - Tạo voucher → Duyệt → Bán
  - Mua voucher → Thanh toán → Phát hành mã
  - Xác thực & xác nhận sử dụng
  - Các quy tắc nghiệp vụ (RB-01 → RB-15)
- Thực hiện kiểm thử thủ công
- Kiểm thử API với Postman (nếu có REST API)
- Ghi nhận **Bug Report** và phân loại mức độ
- Fix lỗi theo mức độ ưu tiên
- Regression test sau fix

### Đầu ra

| Tài liệu | Mô tả |
|---|---|
| `TestPlan.md` | Kế hoạch kiểm thử |
| `TestCases.xlsx` | Bộ test case chi tiết |
| `BugReport.xlsx` | Danh sách lỗi phát hiện |
| `TestSummary.md` | Tóm tắt kết quả kiểm thử |

### Tiêu chí hoàn thành GĐ4

- [ ] ≥ 80% test case pass
- [ ] Không còn lỗi critical / blocker
- [ ] Các quy tắc nghiệp vụ được test đủ

---

## Giai Đoạn 5 — Tổng Hợp & Bàn Giao

**Thời gian:** Tuần 10  
**Mục tiêu:** Hoàn thiện toàn bộ hồ sơ và thuyết trình sản phẩm.

### Công việc

- Hoàn thiện **Báo cáo đồ án** theo template giảng viên cung cấp
- Soạn **Slide thuyết trình** (≤ 20 slide, súc tích, có demo screenshots)
- Quay **Video demo** (nếu giảng viên yêu cầu)
- Review lần cuối toàn bộ tài liệu
- Chuẩn bị môi trường demo live (DB sạch + seed data đủ)
- Nộp hồ sơ theo yêu cầu

### Cấu trúc slide thuyết trình (gợi ý)

1. Bìa — Tên đề tài, nhóm, môn học
2. Bối cảnh & Vấn đề
3. Giải pháp đề xuất
4. Kiến trúc hệ thống
5. Demo luồng mua voucher (Customer)
6. Demo luồng tạo & duyệt voucher (Partner + Admin)
7. Demo xác thực sử dụng (Partner)
8. ERD & Cấu trúc dữ liệu
9. Kết quả kiểm thử
10. Kết luận & Hướng phát triển

### Tiêu chí hoàn thành GĐ5

- [ ] Báo cáo đúng template, đủ nội dung
- [ ] Slide rõ ràng, mạch lạc
- [ ] Demo live không lỗi nghiêm trọng
- [ ] Nộp đúng hạn
