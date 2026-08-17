# Yêu Cầu Viết Code Cho API Phân Bổ Voucher (Branch_Voucher_Product)

## 1. Ngữ Cảnh (Context)

Hệ thống là một Web App (kiến trúc BE / FE tách rời).
Các thực thể chính trong luồng này:

- **Partner (Đối tác):** Có thể quản lý nhiều chi nhánh (Branches).
- **Voucher:** Partner tạo ra các metadata của Voucher (gọi là `voucherProduct`).
- **Branch (Chi nhánh):** Partner sẽ "giao" (phân bổ) một số lượng (`totalQuantity`) Voucher nhất định cho từng Branch. Branch sẽ phát hành/áp dụng cho khách hàng dựa trên số lượng này. Số lượng đã sử dụng được lưu trữ qua trường `soldQuantity`.

## 2. Cấu Trúc Database (Schema)

Bảng trung gian `Branch_Voucher_Product` (Lưu trữ trạng thái phân bổ Voucher cho Branch):

- `branchProfileId` (uuid): Khóa ngoại liên kết tới Branch.
- `voucherProductId` (uuid): Khóa ngoại liên kết tới Voucher metadata.
- `totalQuantity` (int4): Tổng số lượng voucher mà Branch được cấp.
- `soldQuantity` (int4): Số lượng voucher mà Branch đã thực tế sử dụng.

_(Khóa chính của bảng này là composite key: `branchProfileId` + `voucherProductId`)_

## 3. Nhiệm Vụ (Task Definition)

Viết code Backend (Controller, Service, Repository) cho 4 API RESTful dưới đây. Đảm bảo tuân thủ nghiêm ngặt các Business Logic được ghi chú.

### API 1: Giao/Phân bổ Voucher cho Branch

- **Endpoint:** `POST /partner/vouchers/:id/branches`
- **Path Variable:** `:id` = `voucherProductId`
- **Request Body (Example):** `[ { "branchProfileId": "uuid-1", "totalQuantity": 100 } ]`
- **Business Logic:**
  - Insert bản ghi vào bảng `Branch_Voucher_Product`.
  - Mặc định set `soldQuantity = 0`.
  - **Validation:** Nếu cặp `voucherProductId` + `branchProfileId` đã tồn tại, throw lỗi `409 Conflict`.

### API 2: Lấy danh sách phân bổ của một Voucher

- **Endpoint:** `GET /partner/vouchers/:id/branches`
- **Path Variable:** `:id` = `voucherProductId`
- **Business Logic:**
  - Trả về danh sách các branch đang sở hữu voucher này.
  - Cần map thêm một trường ảo vào response: `remainingQuantity = totalQuantity - soldQuantity`.

### API 3: Cập nhật số lượng Voucher của Branch

- **Endpoint:** `PUT /partner/vouchers/:id/branches/:branchId`
- **Path Variable:** `:id` = `voucherProductId`, `:branchId` = `branchProfileId`
- **Request Body (Example):** `{ "totalQuantity": 150 }`
- **Business Logic:**
  - Query DB để lấy `soldQuantity` hiện tại của record này.
  - **Validation:** Kiểm tra `totalQuantity` mới gửi lên phải `>= soldQuantity`. Nếu nhỏ hơn, throw lỗi `400 Bad Request` (Không thể set tổng số lượng nhỏ hơn số lượng đã dùng).
  - Nếu hợp lệ, thực hiện Update `totalQuantity`.

### API 4: Thu hồi phân bổ Voucher

- **Endpoint:** `DELETE /partner/vouchers/:id/branches/:branchId`
- **Path Variable:** `:id` = `voucherProductId`, `:branchId` = `branchProfileId`
- **Business Logic (Quan trọng):**
  - Xử lý dạng "Smart Revoke": Query kiểm tra `soldQuantity` hiện tại.
  - Nếu `soldQuantity > 0`: KHÔNG được Hard Delete vì sẽ làm mất lịch sử bán hàng. Thực hiện update `totalQuantity = soldQuantity` (nhằm đưa `remainingQuantity` về 0 để Branch không thể dùng thêm).
  - Nếu `soldQuantity == 0`: Có thể tiến hành Hard Delete dòng này khỏi database.

## 4. Yêu Cầu Về Output Code Của AI

- **Chính xác & Rõ ràng:** Code phải focus trực tiếp vào xử lý logic.
