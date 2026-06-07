# Tóm Tắt Đồ Án

**Môn học:** Thương mại Điện tử  
**Đề tài:** Xây dựng hệ thống thương mại điện tử bán voucher giảm giá trực tuyến  
**Phiên bản BRD:** 1.0 — Tháng 03/2026  

---

## 1. Bối cảnh & Vấn đề

Mô hình bán voucher trực tuyến đang phổ biến tại Việt Nam trong các lĩnh vực ẩm thực, mua sắm, giải trí, làm đẹp, du lịch, sức khỏe và giáo dục. Tuy nhiên, các quy trình quản lý thủ công hoặc rời rạc gây ra nhiều vấn đề: khó kiểm soát số lượng phát hành, khó xác thực mã, khó theo dõi trạng thái sử dụng và tổng hợp báo cáo doanh thu.

## 2. Giải pháp đề xuất

Xây dựng một **nền tảng sàn trung gian tập trung** hỗ trợ toàn bộ quy trình: tạo voucher → kiểm duyệt → bán hàng → thanh toán → phát hành mã → xác thực sử dụng → báo cáo quản trị.

## 3. Luồng nghiệp vụ tổng quát

```
Đối tác đăng ký
    → Admin duyệt đối tác
    → Đối tác tạo voucher
    → Admin duyệt voucher
    → Công bố bán trên sàn
    → Khách hàng tìm kiếm & mua
    → Thanh toán (mô phỏng)
    → Hệ thống phát hành voucher code duy nhất
    → Khách hàng xuất trình tại đối tác
    → Đối tác xác thực & xác nhận sử dụng
    → Ghi nhận báo cáo
```

## 4. Các vai trò trong hệ thống

| Vai trò | Trách nhiệm chính |
|---|---|
| **Khách hàng** | Tìm kiếm, mua, thanh toán, nhận và sử dụng voucher; đánh giá |
| **Đối tác** | Tạo và quản lý voucher; xác thực sử dụng tại chi nhánh; xem báo cáo |
| **Quản trị viên** | Duyệt đối tác & voucher; quản lý người dùng, đơn hàng, nội dung; xem dashboard |

## 5. Yêu cầu nghiệp vụ chính (tóm lược)

**Cấp hệ thống (BR-01 → BR-07):** Quản lý tài khoản, danh mục voucher, mua hàng, phát hành mã, xác thực, kiểm duyệt, báo cáo.

**Khách hàng (BR-CUS-01 → BR-CUS-08):** Đăng ký/đăng nhập, tìm kiếm & lọc, xem chi tiết, giỏ hàng, đặt hàng, nhận mã, đánh giá.

**Đối tác (BR-PAR-01 → BR-PAR-07):** Đăng ký doanh nghiệp, tạo & gửi duyệt voucher, quản lý voucher, xác thực và xác nhận sử dụng, báo cáo.

**Quản trị viên (BR-ADM-01 → BR-ADM-07):** Quản lý người dùng & đối tác, duyệt voucher, quản lý đơn hàng, dashboard, nhật ký hệ thống.

## 6. Quy tắc nghiệp vụ nổi bật

- Voucher chỉ bán sau khi được Admin duyệt (RB-01)
- Giá bán < giá gốc (RB-02)
- Voucher code phải duy nhất và khó đoán (RB-06)
- Không bán vượt số lượng phát hành (RB-11, RB-15)
- Voucher đã dùng không dùng lại (RB-07)
- Các thao tác quản trị phải được lưu vết (RB-12)

## 7. Yêu cầu kỹ thuật

- Cơ sở dữ liệu **quan hệ** (bắt buộc)
- Tối thiểu **3 vai trò** phân quyền rõ ràng
- Giao diện **responsive** (hỗ trợ mobile)
- Mật khẩu được mã hóa; không lộ voucher code khi chưa thanh toán
- Thanh toán, OTP, QR: **mô phỏng** (không bắt buộc thật)

## 8. Sản phẩm bàn giao

| # | Hạng mục |
|---|---|
| 1 | Báo cáo đồ án (theo template) |
| 2 | BRD → SRS → Use Case Specification |
| 3 | ERD & từ điển dữ liệu |
| 4 | BPMN / Activity Diagram |
| 5 | Thiết kế giao diện (Wireframe/Prototype) |
| 6 | Mã nguồn ứng dụng |
| 7 | Script cơ sở dữ liệu + dữ liệu mẫu |
| 8 | Kế hoạch & báo cáo kiểm thử |
| 9 | Slide thuyết trình + Video demo (nếu yêu cầu) |

## 9. Tiêu chí nghiệm thu

- Đủ 3 vai trò, đủ 5 quy trình chính (tạo → duyệt → mua → phát hành → sử dụng)
- Trạng thái dữ liệu nhất quán theo quy tắc nghiệp vụ
- Có dữ liệu mẫu thực tế
- Tài liệu học thuật đầy đủ
- Thuyết trình thể hiện rõ liên hệ giữa yêu cầu nghiệp vụ và giải pháp
