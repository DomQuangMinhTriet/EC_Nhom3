# Kế Hoạch Tổng Quát Dự Án

**Đề tài:** Hệ thống thương mại điện tử bán voucher giảm giá trực tuyến  
**Môn học:** Thương mại Điện tử — HK3 2025–2026  

---

## 1. Tổng quan kế hoạch

Dự án được chia thành **5 giai đoạn** theo vòng đời phát triển hệ thống thông tin, từ phân tích nghiệp vụ đến bàn giao sản phẩm. Mỗi giai đoạn có đầu vào, đầu ra và tiêu chí hoàn thành rõ ràng.

## 2. Tổng quan các giai đoạn

| Giai đoạn | Tên | Mục tiêu chính | Tài liệu đầu ra |
|---|---|---|---|
| **GĐ1** | Phân tích & Đặc tả | Hiểu rõ yêu cầu, mô hình hóa nghiệp vụ | SRS, Use Case Spec, Activity Diagram |
| **GĐ2** | Thiết kế hệ thống | Thiết kế dữ liệu và giao diện | ERD, Data Dictionary, Wireframe |
| **GĐ3** | Cài đặt | Xây dựng ứng dụng theo thiết kế | Source code, DB script, Seed data |
| **GĐ4** | Kiểm thử | Đảm bảo chất lượng, phát hiện lỗi | Test plan, Test cases, Bug report |
| **GĐ5** | Tổng hợp & Bàn giao | Hoàn thiện tài liệu, thuyết trình | Báo cáo, Slide, Video demo |

## 3. Phân công vai trò nhóm (gợi ý)

| Vai trò | Trách nhiệm |
|---|---|
| **Nhóm trưởng / PM** | Điều phối tiến độ, tổng hợp tài liệu, kết nối các thành viên |
| **BA (Business Analyst)** | Phân tích yêu cầu, viết SRS, Use Case Specification |
| **DB Designer** | Thiết kế ERD, từ điển dữ liệu, script DB, seed data |
| **UI/UX Designer** | Thiết kế wireframe, prototype, responsive layout |
| **Developer (Backend)** | Xây dựng API, logic nghiệp vụ, phân quyền |
| **Developer (Frontend)** | Xây dựng giao diện khách hàng, đối tác, quản trị |
| **Tester** | Viết test case, thực hiện kiểm thử, ghi bug report |

> Với nhóm nhỏ (3–4 người), mỗi thành viên có thể đảm nhận 2–3 vai trò.

## 4. Lịch trình tổng quát

```
Tuần 1–2   │ GĐ1: Phân tích & Đặc tả yêu cầu
Tuần 3     │ GĐ2a: Thiết kế dữ liệu (ERD)
Tuần 4     │ GĐ2b: Thiết kế giao diện (Wireframe)
Tuần 5–8   │ GĐ3: Cài đặt ứng dụng
Tuần 9     │ GĐ4: Kiểm thử
Tuần 10    │ GĐ5: Hoàn thiện tài liệu & Thuyết trình
```

## 5. Công cụ & công nghệ (gợi ý)

| Hạng mục | Công cụ gợi ý |
|---|---|
| Quản lý dự án | Trello / Notion / GitHub Projects |
| Quản lý mã nguồn | Git + GitHub / GitLab |
| Cơ sở dữ liệu | MySQL / PostgreSQL / SQL Server |
| Backend | Node.js (Express) / PHP (Laravel) / Java (Spring Boot) / Python (Django/FastAPI) |
| Frontend | React / Vue / Blade (Laravel) / Thymeleaf |
| Thiết kế UI | Figma / Balsamiq |
| Kiểm thử | Postman (API) / Selenium / kiểm thử thủ công |
| Tài liệu | draw.io / Lucidchart (diagram), Word / Markdown |

## 6. Rủi ro & Biện pháp phòng ngừa

| Rủi ro | Mức độ | Biện pháp |
|---|---|---|
| Thiết kế DB không đúng vòng đời voucher | Cao | Review ERD sớm với toàn nhóm trước khi code |
| Bán vượt số lượng (race condition) | Cao | Dùng transaction DB + kiểm tra tồn kho trước khi tạo đơn |
| Voucher code không duy nhất | Cao | Dùng UUID hoặc hash + kiểm tra trùng khi sinh mã |
| Phân quyền lỏng lẻo | Cao | Thiết kế middleware xác thực role từ đầu |
| Tiến độ chậm do phân công không rõ | Trung bình | Họp tuần, cập nhật task board hàng ngày |
| Dữ liệu demo thiếu thực tế | Trung bình | Chuẩn bị seed data đủ đa dạng trước khi demo |

## 7. Tiêu chí hoàn thành dự án

- [ ] Hệ thống chạy được toàn bộ luồng nghiệp vụ từ đầu đến cuối
- [ ] Đủ 3 vai trò với phân quyền đúng
- [ ] Tài liệu học thuật đầy đủ theo template báo cáo
- [ ] Có dữ liệu mẫu chứng minh được quy mô hoạt động
- [ ] Thuyết trình thể hiện rõ liên hệ yêu cầu nghiệp vụ ↔ giải pháp hệ thống

## 8. Các mốc quan trọng (Milestones)

| Mốc | Nội dung | Kết quả kiểm tra |
|---|---|---|
| M1 | Hoàn tất phân tích & đặc tả | SRS + Use Case được review |
| M2 | Hoàn tất thiết kế DB & UI | ERD + Wireframe được duyệt bởi nhóm |
| M3 | Demo Alpha (luồng cơ bản chạy được) | Customer mua được voucher end-to-end |
| M4 | Demo Beta (đủ tính năng) | Đủ 3 vai trò, đủ 5 quy trình chính |
| M5 | Bàn giao & Thuyết trình | Đủ hồ sơ, demo live hoặc video |
