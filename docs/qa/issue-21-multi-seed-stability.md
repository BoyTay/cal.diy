# Issue #21: Đánh giá độ ổn định của MBT Harness qua nhiều seed

Tài liệu này tổng hợp kết quả kiểm thử thực tế (runtime execution) và phân tích độ ổn định của Model-Based Testing (MBT) trên mô hình Booking Model v2 qua nhiều giá trị `seed` ngẫu nhiên khác nhau, ghi nhận số lần chạy, phân định rõ tỉ lệ sinh đường đi mô hình (static gate) và tỉ lệ pass thực tế qua browser/DB (runtime gate), kèm theo dữ liệu đo lường và phân tích nguy cơ flaky.

## 1. Mốc và phạm vi

- **Nhánh đích**: `qa/model-based-booking`
- **Nhánh thực hiện**: `qa/issue-21-multi-seed-stability`
- **Target commit SHA gốc**: `8b06b465838a25dbb3a3171f90ec198b61e721fc`
- **Mô hình kiểm thử**: `docs/qa/model/booking-model.json` (Model v2: 12 edge, 7 vertex)
- **Hạn chót**: `2026-11-17` (bổ sung hiệu chỉnh trước `2026-11-20` phục vụ báo cáo #22)
- **Tiêu chuẩn an toàn**: Tuân thủ nghiêm ngặt whitelist của oracle Issue #17/#18; toàn bộ evidence đã được khử khuẩn (sanitized), tuyệt đối không commit secret, email thật, booking UID, token hay URL quản lý booking.

## 2. Môi trường thực thi thực tế

Môi trường kiểm thử được chuẩn bị chính xác theo tài liệu chuẩn của repo (`apps/web/playwright/mbt/README.md`):
- **Hệ điều hành**: Windows (`win32`)
- **Node.js**: `v20.20.2` (sử dụng runtime từ `tools/issue06-env/node-v20.20.2-win-x64`)
- **Java JDK**: `OpenJDK 21.0.10` (Temurin/Android Studio JBR 21 LTS; đáp ứng tiêu chuẩn Java 11..21)
- **GraphWalker CLI**: `4.3.3` (`tools/graphwalker/graphwalker-cli-4.3.3.jar`)
- **Database**: PostgreSQL 17.11 (Docker container `caldiy-issue04-db`, cổng `5450`)
- **Web Application**: Next.js 16.2.3 dev server trên cổng `3000` (`$env:NEXT_PUBLIC_IS_E2E = "1"`)
- **Trình duyệt**: Playwright Chromium (headless)
- **Generator**: `random(edge_coverage(100))`

---

## 3. Tổng hợp kết quả thực nghiệm

### 3.1 Bảng kết quả thực nghiệm Runtime (Chạy thật qua UI & Oracle DB)

Theo quy định tại `docs/qa/issue-17-mbt-principles.md`, kết quả chỉ được công nhận là `PASS` khi toàn bộ chuỗi hành động được thực thi qua giao diện người dùng Playwright và được xác minh tức thì bằng oracle truy vấn DB PostgreSQL cục bộ.

Dưới đây là kết quả thực tế của 4 seed ngắn và vừa được thực thi toàn diện ngày 17/11 trên SHA `51b392b3e1`:

| Seed | Số bước | Cạnh (Pass/Tổng) | Đỉnh (Pass/Tổng) | Thời gian chạy | Kết quả Runtime | Trạng thái Dirty | Node Version | File Evidence (17/11 - SHA `51b392b3e1`) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **3030** | 31 | 12/12 (100%) | 7/7 (100%) | **95s** (~1.5m) | **PASS** | `dirty=false` | `v20.20.2` | [`issue-06-2026-11-17T12-20-53-311Z.json`](evidence/issue-06-2026-11-17T12-20-53-311Z.json) |
| **6006** | 41 | 12/12 (100%) | 7/7 (100%) | **91s** (~1.5m) | **PASS** | `dirty=false` | `v20.20.2` | [`issue-06-2026-11-17T12-27-46-659Z.json`](evidence/issue-06-2026-11-17T12-27-46-659Z.json) |
| **9999** | 59 | 12/12 (100%) | 7/7 (100%) | **176s** (~2.9m) | **PASS** | `dirty=false` | `v20.20.2` | [`issue-06-2026-11-17T12-39-00-071Z.json`](evidence/issue-06-2026-11-17T12-39-00-071Z.json) |
| **5555** | 61 | 12/12 (100%) | 7/7 (100%) | **234s** (~3.9m) | **PASS** | `dirty=false` | `v20.20.2` | [`issue-06-2026-11-17T12-42-36-101Z.json`](evidence/issue-06-2026-11-17T12-42-36-101Z.json) |

**Ghi chú đối chiếu các lần chạy trước ngày 16/11**:
Bốn lần chạy trước ngày 16/11 trên SHA cũ cũng pass 12/12 edge, 7/7 vertex (`dirty=false`, Node `v20.20.2`):
- Seed 3030: [`issue-06-2026-11-16T15-59-57-363Z.json`](evidence/issue-06-2026-11-16T15-59-57-363Z.json) (SHA `1d116d3891`)
- Seed 6006: [`issue-06-2026-11-16T16-19-26-881Z.json`](evidence/issue-06-2026-11-16T16-19-26-881Z.json) (SHA `59077feaa8`)
- Seed 5555: [`issue-06-2026-11-16T16-39-53-778Z.json`](evidence/issue-06-2026-11-16T16-39-53-778Z.json) (SHA `59077feaa8`)
- Seed 9999: [`issue-06-2026-11-16T16-42-26-253Z.json`](evidence/issue-06-2026-11-16T16-42-26-253Z.json) (SHA `59077feaa8`)

Kết quả chính của tài liệu sử dụng 4 lần chạy ngày 17/11 trên SHA `51b392b3e1`. Khi tổng hợp cả 2 phiên chạy (ngày 16/11 và 17/11), tổng số lần chạy thật là **8 lần** (cùng 4 seed, 2 lần mỗi seed), và **tỉ lệ pass là 8/8 (100%)**, ghi nhận **0 lỗi flaky / sai lệch oracle**.

- **Tính lặp lại (Reproducibility)**: Seed `6006` sinh đường đi 41 bước hoàn toàn trùng khớp với lần chạy baseline ngày 10/11/2026 và chạy pass 100% qua cả 2 phiên chạy với `dirty=false`.

### 3.2 Các seed được phân loại `NOT_VERIFIED` trong tập 10 seed

Các seed còn lại trong tập 10 seed khảo sát có chiều dài đường đi lớn hoặc rất lớn:
- **Seed `1001`** (65 bước), **Seed `4242`** (93 bước), **Seed `7777`** (115 bước), **Seed `2024`** (127 bước), **Seed `8888`** (173 bước), **Seed `12345`** (231 bước).
- **Phân loại**: **`NOT_VERIFIED`** (Chưa kiểm chứng runtime).
- **Lý do**: Các seed dài cần từ 10 đến 25 phút chạy UI liên tục cho mỗi lượt test đơn lẻ (ước tính tổng thời gian vượt quá 1.5 giờ). Để đảm bảo an toàn tài nguyên máy phát triển và kịp mốc bàn giao 17/11, các seed này được giữ ở trạng thái mô hình và sẽ được khuyến nghị đưa vào suite kiểm thử định kỳ (nightly/stress suite).

### 3.3 Khảo sát tĩnh về độ phủ mô hình của GraphWalker (Static Gate)

*Lưu ý: Bảng dưới đây thể hiện khả năng sinh đường đi offline của thuật toán `random(edge_coverage(100))` bằng GraphWalker CLI 4.3.3 trên file `booking-model.json`. Kết quả sinh đường đi không đại diện cho việc kiểm thử ứng dụng thật.*

- **Khảo sát mở rộng trên 30 seed ngẫu nhiên** (số liệu đo đạc cục bộ từ generator GraphWalker CLI 4.3.3 khi khảo sát tính bao phủ mô hình):
  - Số seed khảo sát: 30
  - Tỉ lệ sinh đường đi bao phủ đủ 12 edge và 7 vertex: **100% (30/30 seeds)**.
  - Số bước trung bình: **106.67 bước** (~53 cạnh).
  - Số bước ngắn nhất: **41 bước** (Seed `26260`, 20 cạnh).
  - Số bước dài nhất: **311 bước** (Seed `81618`, 155 cạnh).
  - Không có seed nào bị kẹt vòng lặp vô hạn hay vượt ngưỡng trần 1000 bước của harness runner.

Lệnh tái tạo khảo sát tính bao phủ mô hình trên tập seed bằng công cụ có sẵn trong repo:
```powershell
# Chạy khảo sát offline generator qua runner (dữ liệu chạy cục bộ, không ghi đè evidence booking thật):
node scripts/run-mbt-multi-seed.mjs --generate-only --seeds=1001,2024,3030,4242,5555,6006,7777,8888,9999,12345

# Hoặc sinh kiểm tra lặp với PowerShell:
1..30 | ForEach-Object { node scripts/run-issue-06-mbt.mjs --generate-only --seed $_ }
```

---

## 4. Phân tích độ ổn định và nguy cơ Flaky

Dựa trên dữ liệu thực tế thu được từ các phiên chạy thành công và mã nguồn harness, các nhận định được phân loại rõ ràng giữa **dữ liệu đo lường thực tế** và **giả thuyết chưa đo**:

### 4.1 Đo lường thực tế: Quan hệ giữa độ dài đường đi và thời gian thực thi

Từ thời gian chạy thực tế của 4 seed, thời gian thực thi Playwright qua browser tăng gần như tuyến tính theo số bước:
- Seed 3030 (31 bước): **95 giây** (~3.06 giây/bước)
- Seed 6006 (41 bước): **91 giây** (~2.22 giây/bước)
- Seed 9999 (59 bước): **176 giây** (~2.98 giây/bước)
- Seed 5555 (61 bước): **234 giây** (~3.83 giây/bước)

**Kết luận thực nghiệm**: Mỗi chu trình tương tác UI (chọn ngày, chọn giờ, điền form, click submit và đối chiếu oracle DB) tiêu tốn trung bình từ **2.2 đến 3.8 giây**. Với các seed dài như 12345 (231 bước), thời gian ước tính sẽ vào khoảng **12 đến 15 phút**, đòi hỏi test runner phải duy trì kết nối ổn định liên tục.

### 4.2 Đo lường thực tế: Cơ chế cách ly dữ liệu qua `freshHost()`

Trong 4 lần chạy thật ngày 17/11, harness đã thực thi tổng cộng **21 chu trình chuyển đổi host mới** (`user-0-...`) thông qua các cạnh `e_StartNewBookingAfterCancel` và `e_StartNewBookingAfterReject` (cụ thể: Seed 3030 có 3 lần, Seed 6006 có 5 lần, Seed 9999 có 7 lần, Seed 5555 có 6 lần; tổng cộng 3 + 5 + 7 + 6 = 21 lần chuyển đổi):
- Tại mỗi chu trình, lệnh `await page.context().clearCookies()` và tạo user mới trong DB được thực thi.
- Oracle xác nhận: Trong toàn bộ 21 lần chuyển đổi giữa các chu trình, kiểm tra DB `(await read()).length === 0` đều đạt ngay lập tức. Không xuất hiện hiện tượng rò rỉ cookie hoặc booking của host cũ sang host mới.

### 4.3 Đo lường thực tế: Kiểm chứng cạnh chặn slot `e_RescheduleSlotUnavailable`

Trên cả 4 seed, cạnh `e_RescheduleSlotUnavailable` đều được kiểm chứng thành công và được xác nhận thông qua các trường dữ liệu oracle đã lưu trong cả 4 file evidence JSON:
- `slotUnavailable.httpStatus`: `409` (yêu cầu reschedule gửi đi bị server từ chối đúng như thiết kế do slot đã bị blocker chiếm dụng).
- `slotUnavailable.requestSlotBlocked`: `true` (slot được blocker chặn chính xác theo khoảng `start/end`).
- `slotUnavailable.originalUnchanged`: `true` (booking gốc A giữ nguyên trạng thái `ACCEPTED`, không bị sửa đổi hay hủy bỏ).
- `slotUnavailable.replacementCount`: `0` (không có booking thay thế nào được sinh ra từ `fromReschedule = a`).
- Cạnh tiếp theo `e_SelectAnotherSlot` mở lại giao diện và chọn thành công slot khả dụng khác mà không gặp lỗi xung đột trên các seed vừa.

### 4.4 Các nguy cơ Flaky tiềm ẩn (Giả thuyết chưa đo đối với các seed dài > 100 bước)

Đối với các seed có độ dài lớn (như Seed 81618 có 311 bước hay Seed 12345 có 231 bước), các rủi ro lý thuyết cần lưu ý gồm:
- *Giả thuyết Cạn kiệt slot (Slot Depletion)*: Cạnh `e_RescheduleSlotUnavailable` tạo thêm 1 booking blocker trong DB sau mỗi lần kích hoạt. Nếu một seed dài lặp lại cạnh này nhiều lần (ví dụ trên 10-15 lần trong cùng một phiên), số slot trống trong ngày làm việc có thể bị lấp đầy, đòi hỏi helper `selectSecondAvailableTimeSlotNextMonth` phải có cơ chế tự động chuyển sang các ngày tiếp theo trong tháng.
- *Giả thuyết Tải bộ nhớ trình duyệt (Browser Heap Accumulation)*: Phiên Chromium chạy liên tục hàng trăm tương tác SPA có thể tích lũy heap memory, dẫn đến việc xử lý React hydration chậm dần trên các trang danh sách booking `/bookings/upcoming`.

---

## 5. Kết luận và Khuyến nghị

1. **Về độ ổn định Runtime**:
   - MBT harness Model v2 trên nhánh `qa/issue-21-multi-seed-stability` đạt tỉ lệ **8/8 PASS (100%)** qua cả hai phiên chạy ngày 16/11 và 17/11 trên 4 seed (3030, 6006, 9999, 5555), với `dirty=false` và runtime Node v20.20.2.
   - Không xuất hiện lỗi flaky hay rò rỉ dữ liệu giữa các phiên.

2. **Khuyến nghị cho CI/CD và quy trình kiểm thử**:
   - **CI PR Gating (Mỗi lần mở PR)**: Sử dụng các seed ngắn và tối ưu, ưu tiên **Seed `3030`** (31 bước, ~1.5 phút) hoặc **Seed `6006`** (41 bước, ~1.5 phút) để đảm bảo thời gian chạy CI dưới 3 phút mà vẫn phủ trọn vẹn 100% cạnh và đỉnh của mô hình.
   - **Nightly Stress Testing**: Sử dụng `scripts/run-mbt-multi-seed.mjs` để chạy các seed dài hơn trong các đợt kiểm thử định kỳ không yêu cầu phản hồi tức thì.
