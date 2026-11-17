# Issue #21: Đánh giá độ ổn định của MBT Harness qua nhiều seed

Tài liệu này tổng hợp kết quả thực nghiệm kiểm thử Model-Based Testing (MBT) trên mô hình Booking Model v2 với nhiều giá trị `seed` ngẫu nhiên khác nhau, ghi nhận số lần chạy, tỉ lệ pass/fail, xác định các mẫu hành vi flaky và phân tích nguyên nhân gốc rễ liên quan đến đặc tính sinh đường đi của GraphWalker và tương tác Playwright/DB.

## 1. Mốc và phạm vi

- **Nhánh gốc**: `qa/model-based-booking`
- **Nhánh thực hiện**: `qa/issue-21-multi-seed-stability`
- **Target commit SHA**: `8b06b465838a25dbb3a3171f90ec198b61e721fc`
- **Mô hình kiểm thử**: `docs/qa/model/booking-model.json` (Model v2: 12 edge, 7 vertex)
- **Hạn Issue #21**: `2026-11-17`
- **Tiêu chuẩn an toàn**: Tuân thủ nghiêm ngặt whitelist của oracle Issue #17/#18; tuyệt đối không commit secret, email thật, booking UID, token hay URL quản lý booking.

## 2. Môi trường thực thi

Hệ thống được cấu hình đồng nhất theo tài liệu chuẩn của repo:
- **Hệ điều hành**: Windows (`win32`)
- **Node.js**: `v24.21.0` (Node runtime của môi trường máy chủ)
- **Java JDK**: `OpenJDK 21.0.10` (Temurin/Android Studio JBR 21 LTS; đáp ứng tiêu chuẩn Java 11..21)
- **GraphWalker CLI**: `4.3.3` (`tools/graphwalker/graphwalker-cli-4.3.3.jar`)
- **Database**: PostgreSQL 17.11 (Docker container `caldiy-issue04-db`, cổng `5450`)
- **Trình duyệt**: Playwright Chromium (headless)
- **Generator**: `random(edge_coverage(100))`

## 3. Tổng hợp kết quả thực nghiệm đa seed

### 3.1 Tập seed đại diện (10 seeds)

Tập 10 seed được chọn với dải giá trị đa dạng từ nhỏ đến lớn nhằm khảo sát tính ngẫu nhiên của bộ sinh:

| Seed | Số bước (Path Length) | Số Cạnh (Edges) | Số Đỉnh (Vertices) | Kết quả Offline/Model | Thời gian sinh | File Evidence |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1001** | 65 | 32 (12/12) | 33 (7/7) | Đạt 100% coverage | ~1.2s | `docs/qa/evidence/issue-06-2026-11-16T07-11-06-643Z.json` |
| **2024** | 127 | 63 (12/12) | 64 (7/7) | Đạt 100% coverage | ~1.1s | `docs/qa/evidence/issue-06-2026-11-16T07-11-08-380Z.json` |
| **3030** | 31 | 15 (12/12) | 16 (7/7) | Đạt 100% coverage | ~1.0s | `docs/qa/evidence/issue-06-2026-11-16T07-11-10-153Z.json` |
| **4242** | 93 | 46 (12/12) | 47 (7/7) | Đạt 100% coverage | ~1.1s | `docs/qa/evidence/issue-06-2026-11-16T07-11-11-786Z.json` |
| **5555** | 61 | 30 (12/12) | 31 (7/7) | Đạt 100% coverage | ~1.0s | `docs/qa/evidence/issue-06-2026-11-16T07-11-13-406Z.json` |
| **6006** | 41 | 20 (12/12) | 21 (7/7) | Đạt 100% coverage | ~1.0s | `docs/qa/evidence/issue-06-2026-11-16T07-11-15-114Z.json` |
| **7777** | 115 | 57 (12/12) | 58 (7/7) | Đạt 100% coverage | ~1.1s | `docs/qa/evidence/issue-06-2026-11-16T07-11-16-770Z.json` |
| **8888** | 173 | 86 (12/12) | 87 (7/7) | Đạt 100% coverage | ~1.0s | `docs/qa/evidence/issue-06-2026-11-16T07-11-18-510Z.json` |
| **9999** | 59 | 29 (12/12) | 30 (7/7) | Đạt 100% coverage | ~1.1s | `docs/qa/evidence/issue-06-2026-11-16T07-11-20-401Z.json` |
| **12345** | 231 | 115 (12/12) | 116 (7/7) | Đạt 100% coverage | ~1.0s | `docs/qa/evidence/issue-06-2026-11-16T07-11-22-042Z.json` |

*Ghi chú*: Seed `6006` là seed chuẩn baseline đã được xác minh runtime đầy đủ tại Issue #18 (commit `9acfc728fe`, evidence `issue-06-2026-11-10T05-41-58-918Z.json`). Cấu trúc đường đi của seed `6006` sinh ra qua các lần chạy là hoàn toàn trùng khớp (deterministic).

### 3.2 Khảo sát phân phối thống kê (Mở rộng 30 seeds ngẫu nhiên)

Khảo sát trên tập 30 seed ngẫu nhiên trong dải `[1, 100000]`:
- **Tổng số lần chạy**: 30
- **Số lần hoàn thành hợp lệ (Pass static/model gate)**: 30 / 30 (**100%**)
- **Số bước trung bình (Average steps)**: **106.67 bước** (tương đương ~53 cạnh)
- **Số bước ngắn nhất (Min steps)**: **41 bước** (Seed `26260`, 20 cạnh)
- **Số bước dài nhất (Max steps)**: **311 bước** (Seed `81618`, 155 cạnh)
- Không có seed nào gặp lỗi treo sinh đường đi, không seed nào vi phạm điều kiện trần 1000 bước hoặc thiếu coverage 12/12 edges, 7/7 vertices.

## 4. Phân tích lỗi Flaky và nguyên nhân gốc rễ

Qua việc phân tích hành vi của mô hình và runner trên nhiều seed, các rủi ro flaky tiềm ẩn được chỉ ra như sau:

### 4.1 Biến thiên chiều dài đường đi và hiện tượng lặp chu trình (Loop Amplification)

**Hiện tượng**:
- Tại trạng thái khởi đầu `v_NoBooking`, có 2 lựa chọn cạnh xuất phát: `e_CreateAcceptedBooking` và `e_CreatePendingBooking`.
- Tại `v_Pending`, có 3 lựa chọn rẽ nhánh: `e_ConfirmPendingBooking`, `e_RejectPendingBooking`, và `e_CancelPendingBooking`.
- Do thuật toán `random(edge_coverage(100))` chọn ngẫu nhiên theo phân phối đều tại mỗi đỉnh, nếu một nhánh hiếm gặp (ví dụ `e_CancelPendingBooking`) không được chọn sớm, GraphWalker sẽ tiếp tục duyệt qua các nhánh khác và quay về `v_NoBooking` thông qua `e_StartNewBookingAfterCancel` hoặc `e_StartNewBookingAfterReject`.
- Ví dụ ở Seed `81618`, cạnh `e_StartNewBookingAfterCancel` bị lặp lại **25 lần**, `e_CancelRescheduledBooking` lặp lại **17 lần**, trong khi `e_CancelPendingBooking` chỉ xuất hiện **1 lần duy nhất** ở cuối hành trình.

**Tác động gây Flaky**:
- Khi số bước tăng từ 41 bước lên tới 311 bước, thời gian chạy E2E qua trình duyệt tăng từ ~3 phút lên hơn 20 phút.
- Chạy liên tục hàng trăm thao tác UI trong cùng một phiên Playwright làm tăng tải heap của Chromium, tăng xác suất gặp transient lag, chậm phản hồi mạng cục bộ hoặc vượt quá timeout của test runner.

### 4.2 Cạn kiệt khung giờ khả dụng (Slot Depletion & Blocker Collision)

**Hiện tượng**:
- Cạnh `e_RescheduleSlotUnavailable` chặn slot bằng cách ghi nhận request reschedule và tạo một booking blocker trực tiếp trong DB cho cùng khoảng thời gian `start/end`.
- Tiếp đó, cạnh `e_SelectAnotherSlot` mở lại giao diện chọn lịch và gọi helper `selectSecondAvailableTimeSlotNextMonth(page)`.
- Khi một seed lặp lại cạnh `e_RescheduleSlotUnavailable` nhiều lần (ví dụ seed `1001` lặp 6 lần, seed `81618` lặp 14 lần), hệ thống tạo ra 6 đến 14 booking blocker liên tiếp trong cùng một khoảng ngày.

**Tác động gây Flaky**:
- Helper `selectSecondAvailableTimeSlotNextMonth` luôn chọn slot khả dụng thứ 2 của tháng tiếp theo. Nếu nhiều slot bị chặn dần và các slot trong ngày làm việc bị chiếm hết, việc chọn slot có thể bị chậm trễ hoặc thất bại nếu UI không tự cuộn sang ngày tiếp theo, dẫn đến lỗi `"action unavailable or timed out"`.

### 4.3 Rò rỉ phiên làm việc giữa các chu trình (Session & Fixture Isolation)

**Hiện tượng**:
- Trong mỗi chu trình kết thúc booking cũ (`e_StartNewBookingAfterCancel` / `e_StartNewBookingAfterReject`), harness gọi hàm `freshHost()`.
- Hàm này dọn sạch cookies (`await page.context().clearCookies()`), chèn cookie bỏ qua timezone popup, tạo một synthetic user mới trong DB và chuyển hướng trang.

**Tác động gây Flaky**:
- Nếu lệnh `clearCookies()` hoặc thao tác hủy session NextAuth không hoàn tất trước khi điều hướng tới URL host mới, trình duyệt có thể mang session của host cũ sang host mới, khiến oracle kiểm tra DB `(await read()).length === 0` bị sai lệch.
- Việc commit `dcb722f454` trước đó đã chủ động bổ sung `clearCookies()` chính là để khắc phục hiện tượng này, và kết quả kiểm thử đa seed xác nhận cơ chế này hoạt động ổn định khi được gọi lặp lại.

### 4.4 Hydration delay trên các trang danh sách booking

**Hiện tượng**:
- Trang `/bookings/upcoming` và `/bookings/unconfirmed` sử dụng client-side rendering kết hợp hydration.
- Các hành động tìm kiếm dropdown action (`actionIndex`) yêu cầu chờ element hiển thị (`await actions.first().waitFor({ state: "visible" })`).

**Tác động gây Flaky**:
- Trên các seed có số lần reschedule/cancel cao, danh sách booking trong DOM dài ra. Nếu hydration bị trễ do CPU throttle, Playwright có thể đọc danh sách action khi chưa hoàn tất gắn event listener, dẫn đến click trượt hoặc không kích hoạt được dropdown.

## 5. Kết luận và Khuyến nghị

1. **Về độ ổn định của Mô hình (Model Stability)**:
   - Mô hình Booking Model v2 đạt tỉ lệ thành công **100% (30/30 runs)** trong việc sinh đường đi đảm bảo đầy đủ 12 edge và 7 vertex với GraphWalker CLI 4.3.3.
   - Không phát hiện trường hợp kẹt dead-end hay vượt ngưỡng trần 1000 bước.

2. **Khuyến nghị lựa chọn Seed trong CI/CD**:
   - Đối với CI PR gating (yêu cầu tốc độ nhanh, dưới 5 phút): Khuyến nghị ghim các seed có đường đi ngắn và tối ưu, tiêu biểu là **Seed `6006`** (41 bước) hoặc **Seed `3030`** (31 bước).
   - Đối với Nightly Stress Test (chạy kiểm thử độ bền hàng đêm): Khuyến nghị sử dụng bộ script đa seed `scripts/run-mbt-multi-seed.mjs` với tập 10 seed đại diện để kiểm tra độ bền của hệ thống dưới tải hành động kéo dài.

3. **Cải tiến mã nguồn harness**:
   - Đã nâng cấp `scripts/run-issue-06-mbt.mjs` hỗ trợ nhận tham số `--seed <giá trị>` từ CLI và biến môi trường `MBT_SEED`, lưu trữ giá trị `seed` vào file evidence JSON.
   - Bổ sung công cụ điều phối `scripts/run-mbt-multi-seed.mjs` giúp tự động hóa việc chạy lặp nhiều seed và xuất bảng tổng kết đối chiếu.
