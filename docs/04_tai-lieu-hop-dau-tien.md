# Tài Liệu Chuẩn Bị Cuộc Họp Đầu Tiên

**Đề tài:** Hệ thống thương mại điện tử bán voucher giảm giá trực tuyến  
**Loại cuộc họp:** Kickoff Meeting — Họp khởi động dự án  
**Thời gian dự kiến:** 60–90 phút  

---

## 1. Mục tiêu cuộc họp

Sau cuộc họp này, cả nhóm phải đạt được sự đồng thuận về:

1. Hiểu chung về yêu cầu đồ án và phạm vi hệ thống
2. Phân công vai trò và trách nhiệm rõ ràng
3. Chọn công nghệ & công cụ sẽ dùng
4. Thống nhất quy trình làm việc nhóm (Git, task management, giao tiếp)
5. Xác định lịch họp định kỳ
6. Xác nhận các mốc quan trọng và deadline từng giai đoạn

---

## 2. Agenda chi tiết

| # | Nội dung | Thời gian | Người dẫn |
|---|---|---|---|
| 1 | Giới thiệu mục tiêu cuộc họp | 5 phút | Nhóm trưởng |
| 2 | Đọc & thảo luận BRD — Đặc tả đồ án | 20 phút | Cả nhóm |
| 3 | Thảo luận phân công vai trò | 15 phút | Nhóm trưởng |
| 4 | Chọn công nghệ & công cụ | 15 phút | Cả nhóm |
| 5 | Thống nhất quy trình làm việc | 10 phút | Nhóm trưởng |
| 6 | Xác nhận lịch trình & deadline | 10 phút | Cả nhóm |
| 7 | Tổng kết & giao task đầu tiên | 5 phút | Nhóm trưởng |

---

## 3. Chuẩn bị trước cuộc họp

Mỗi thành viên **cần đọc trước**:
- [ ] File `Project Requirements.pdf` (BRD đồ án)
- [ ] File `01_tom-tat-do-an.md` (Tóm tắt đồ án)
- [ ] File `02_ke-hoach-tong-quat.md` (Kế hoạch tổng quát)

---

## 4. Nội dung thảo luận chi tiết

### 4.1 Thảo luận BRD

Các câu hỏi cần thảo luận và chốt đáp án:

**Về phạm vi:**
- Có thực hiện chức năng đánh giá & phản hồi (BR-CUS-08, BR-PAR-07) không? → Ưu tiên trung bình, làm sau nếu còn thời gian
- Báo cáo đối tác (BR-PAR-07) sẽ ở mức độ chi tiết nào?
- Nhật ký hệ thống (BR-ADM-07) sẽ log những thao tác gì?

**Về kỹ thuật:**
- Mô phỏng QR bằng cách nào? (hiển thị ảnh QR tĩnh hay dùng thư viện sinh QR)
- Mô phỏng thanh toán bằng cách nào? (click "Thanh toán" → thành công)
- Mã voucher code sinh theo format gì? (UUID / 8 ký tự / có tiền tố)

### 4.2 Chọn công nghệ

Cần thống nhất **một** stack cho cả nhóm:

| Hạng mục | Lựa chọn A | Lựa chọn B | Lựa chọn C |
|---|---|---|---|
| Backend | Node.js + Express | PHP + Laravel | Python + Django |
| Frontend | React | Vue.js | Template engine (Blade/Thymeleaf) |
| Database | MySQL | PostgreSQL | SQL Server |
| Auth | JWT | Session | Passport |

**Tiêu chí chọn:** cả nhóm đều biết, dễ setup, có tài liệu phong phú.

### 4.3 Phân công vai trò

Điền vào bảng dưới sau khi thảo luận:

| Thành viên | Vai trò chính | Vai trò phụ | Ghi chú |
|---|---|---|---|
| | | | |
| | | | |
| | | | |
| | | | |

**Gợi ý phân công cho nhóm 4 người:**
- Thành viên 1 (Nhóm trưởng): PM + BA (SRS, Use Case)
- Thành viên 2: DB Designer + Backend (DB, API)
- Thành viên 3: Backend Developer (Logic nghiệp vụ, Auth)
- Thành viên 4: Frontend Developer + Tester (UI, Test)

### 4.4 Quy trình làm việc nhóm

Thống nhất các điểm sau:

**Git workflow:**
- [ ] Tạo repo GitHub/GitLab, thêm tất cả thành viên
- [ ] Branch strategy: `main` / `develop` / feature branches (`feature/login`, `feature/voucher-create`...)
- [ ] Quy ước commit message: `feat:`, `fix:`, `docs:`, `test:`
- [ ] Pull Request: cần ít nhất 1 người review trước khi merge

**Task management:**
- [ ] Dùng công cụ: Trello / Notion / GitHub Projects / Jira
- [ ] Mỗi task có: tiêu đề, người phụ trách, deadline, status (Todo / In Progress / Done)
- [ ] Cập nhật task board ít nhất 2 lần/tuần

**Giao tiếp:**
- [ ] Kênh chính: Messenger / Zalo / Slack / Discord
- [ ] Thời gian phản hồi tin nhắn: trong vòng 4 giờ (giờ hành chính)
- [ ] Lịch họp định kỳ: ______ (ngày trong tuần, giờ)

### 4.5 Xác nhận lịch trình

| Giai đoạn | Deadline | Người chịu trách nhiệm chính |
|---|---|---|
| GĐ1: SRS + Use Case | | |
| GĐ2a: ERD + DataDict | | |
| GĐ2b: Wireframe | | |
| GĐ3: Sprint 1 (Auth + Setup) | | |
| GĐ3: Sprint 2 (Partner + Admin) | | |
| GĐ3: Sprint 3 (Mua hàng) | | |
| GĐ3: Sprint 4 (Xác thực + Hoàn thiện) | | |
| GĐ4: Kiểm thử | | |
| GĐ5: Báo cáo + Thuyết trình | | |

---

## 5. Quyết định cần đưa ra trong cuộc họp

Đánh dấu ✅ sau khi đã thống nhất:

- [ ] Phân công vai trò đã hoàn tất
- [ ] Stack công nghệ đã chọn
- [ ] Repo Git đã tạo và thêm thành viên
- [ ] Tool quản lý task đã chọn
- [ ] Deadline từng giai đoạn đã xác định
- [ ] Lịch họp định kỳ đã xác định
- [ ] Task đầu tiên đã giao (đọc BRD + bắt đầu SRS)

---

## 6. Task ngay sau cuộc họp

| Task | Người thực hiện | Deadline |
|---|---|---|
| Tạo repo Git + cấu trúc thư mục | | Ngay sau họp |
| Tạo board quản lý task + tạo task GĐ1 | Nhóm trưởng | Ngay sau họp |
| Đọc kỹ BRD, liệt kê toàn bộ Use Case | BA | Trước họp tuần sau |
| Bắt đầu phác thảo ERD sơ bộ | DB Designer | Trước họp tuần sau |
| Research + setup môi trường dev | Developer | Trước họp tuần sau |

---

## 7. Biên bản cuộc họp (template)

**Ngày họp:** _______________  
**Địa điểm / Nền tảng:** _______________  
**Thành viên tham dự:** _______________  
**Thư ký:** _______________  

**Các quyết định đã thống nhất:**
1. 
2. 
3. 

**Các vấn đề còn tồn đọng:**
1. 
2. 

**Task được giao:**

| Task | Người thực hiện | Deadline |
|---|---|---|
| | | |

**Lịch họp tiếp theo:** _______________
