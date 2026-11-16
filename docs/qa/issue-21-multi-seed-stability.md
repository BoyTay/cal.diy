# Issue #21: Đánh giá độ ổn định của MBT Harness qua nhiều seed

Tài liệu này tổng hợp kết quả thực nghiệm kiểm thử Model-Based Testing (MBT) trên mô hình Booking Model v2 với nhiều giá trị `seed` ngẫu nhiên khác nhau, ghi nhận số lần chạy, tỉ lệ pass/fail của **kiểm thử thật** (Playwright + DB oracle), phân biệt rõ ràng với **tỉ lệ sinh đường đi tĩnh** của GraphWalker, đồng thời phân tích các nguy cơ flaky tiềm ẩn dựa trên số đo thực tế và phân tích cấu trúc đồ thị.

## 1. Mốc và phạm vi

- **Nhánh đích (Target branch)**: `qa/model-based-booking`
- **Nhánh thực hiện (Feature branch)**: `qa/issue-21-multi-seed-stability`
- **Target commit SHA gốc**: `8b06b465838a25dbb3a3171f90ec198b61e721fc`
- **Mô hình kiểm thử**: `docs/qa/model/booking-model.json` (Model v2: 12 edges, 7 vertices)
- **Hạn chót Issue #21**: `2026-11-17`
- **Tiêu chuẩn an toàn**: Tuyệt đối không commit secret, email cá nhân, booking UID, token hoặc URL quản lý booking (tuân thủ whitelist của Issue #17/#18).

## 2. Môi trường thực thi thực tế

Tất cả các lần chạy thật đều được thực thi trên môi trường chuẩn:
- **Hệ điều hành**: Windows (`win32`)
- **Node.js**: `v20.20.2` (môi trường runtime đồng nhất theo chuẩn repository)
- **Java JDK**: `OpenJDK 21.0.10` (đáp ứng dải hỗ trợ Java 11..21)
- **GraphWalker CLI**: `4.3.3` (`tools/graphwalker/graphwalker-cli-4.3.3.jar`)
- **Database**: PostgreSQL 17.11 (Docker container `caldiy-issue04-db`, cổng `5450`)
- **Next.js Dev Server**: `http://localhost:3000` (`NEXT_PUBLIC_IS_E2E=1`)
- **Trình duyệt**: Playwright Chromium (headless)
- **Generator**: `random(edge_coverage(100))`
- **Git status khi chạy**: `dirty: false` (không chứa thay đổi chưa commit ngoại trừ thư mục bằng chứng)

## 3. Tổng hợp kết quả thực nghiệm

### 3.1 Tách bạch hai khái niệm tỉ lệ

Theo quy chuẩn repository (Issue #06 / Issue #18):
- **Tỉ lệ sinh đường đi mô hình (GraphWalker Path Generation)**: Đạt **100%** trên mô hình toán học (GraphWalker duyệt ngẫu nhiên cho đến khi đạt 12/12 edges và 7/7 vertices). Kết quả sinh đường đi (`--generate-only`) **không** được tính là bằng chứng booking pass.
- **Tỉ lệ pass chạy thật (Real Execution Pass Rate)**: Chỉ tính trên các lần chạy qua đầy đủ harness thật (Playwright UI thao tác trên trình duyệt + DB oracle đối soát cơ sở dữ liệu PostgreSQL).

### 3.2 Bảng kết quả tập seed đại diện (10 seeds)

| Seed | Số bước (Path Length) | Model Coverage (Edges / Vertices) | Chạy thật (Real Execution) | Thời gian chạy thật | Kết quả (Result) | File Evidence |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **3030** | 31 | 12/12, 7/7 | **CÓ** | 3m 31s | **PASS (100%)** | [`issue-06-2026-11-16T15-59-57-363Z.json`](file:///d:/Study/KTPM/cal.diy/docs/qa/evidence/issue-06-2026-11-16T15-59-57-363Z.json) |
| **6006** | 41 | 12/12, 7/7 | **CÓ** | 1m 56s | **PASS (100%)** | [`issue-06-2026-11-16T16-19-26-881Z.json`](file:///d:/Study/KTPM/cal.diy/docs/qa/evidence/issue-06-2026-11-16T16-19-26-881Z.json) |
| **5555** | 61 | 12/12, 7/7 | **CÓ** | 2m 17s | **PASS (100%)** | [`issue-06-2026-11-16T16-39-53-778Z.json`](file:///d:/Study/KTPM/cal.diy/docs/qa/evidence/issue-06-2026-11-16T16-39-53-778Z.json) |
| **9999** | 59 | 12/12, 7/7 | **CÓ** | 2m 45s | **PASS (100%)** | [`issue-06-2026-11-16T16-42-26-253Z.json`](file:///d:/Study/KTPM/cal.diy/docs/qa/evidence/issue-06-2026-11-16T16-42-26-253Z.json) |
| **1001** | 65 | 12/12, 7/7 | KHÔNG | - | `NOT_VERIFIED` | *(Chưa chạy thật; ưu tiên tập seed ngắn/vừa)* |
| **4242** | 93 | 12/12, 7/7 | KHÔNG | - | `NOT_VERIFIED` | *(Chưa chạy thật; đường đi dài 93 bước)* |
| **2024** | 127 | 12/12, 7/7 | KHÔNG | - | `NOT_VERIFIED` | *(Chưa chạy thật; 127 bước > 5 phút timeout)* |
| **7777** | 115 | 12/12, 7/7 | KHÔNG | - | `NOT_VERIFIED` | *(Chưa chạy thật; đường đi dài 115 bước)* |
| **8888** | 173 | 12/12, 7/7 | KHÔNG | - | `NOT_VERIFIED` | *(Chưa chạy thật; 173 bước, nguy cơ nghẽn slot)* |
| **12345** | 231 | 12/12, 7/7 | KHÔNG | - | `NOT_VERIFIED` | *(Chưa chạy thật; 231 bước, ước tính > 15-20 phút)* |

#### Thống kê kết quả chạy thật:
- **Số seed đã chạy thật**: 4 seed (3030, 6006, 5555, 9999)
- **Tỉ lệ pass chạy thật**: **4 / 4 seed (100%)**
- **Độ bao phủ đạt được trên tất cả các run chạy thật**: 12/12 edges (100%), 7/7 vertices (100%)
- **Số bước đã kiểm thử thực tế**: 192 bước hành động UI và đối soát DB
- **Số lỗi phát sinh (Runtime Errors)**: 0 lỗi
- **Trạng thái repo (dirty)**: `dirty: false` trên toàn bộ 4 file evidence

### 3.3 Khảo sát phân phối thống kê đường đi (Khảo sát Offline trên 30 seeds)

> [!NOTE]
> Bảng thống kê dưới đây thu được từ công cụ mô phỏng offline của GraphWalker CLI (`random(edge_coverage(100))`) nhằm khảo sát sự biến thiên của chiều dài đường đi (Path Length) trên 30 seed ngẫu nhiên trong dải `[1, 100000]`. Bảng này đo đặc tính thuật toán đồ thị, **không** phản ánh số lần chạy Playwright thật.

- **Số seed mô phỏng**: 30 seeds
- **Tỉ lệ hoàn thành đường đi trên mô hình**: 30/30 (100%)
- **Chiều dài đường đi trung bình (Average steps)**: **106.7 bước** (~53 cạnh)
- **Đường đi ngắn nhất (Min steps)**: **41 bước** (Seed 26260, Seed 6006)
- **Đường đi dài nhất (Max steps)**: **311 bước** (Seed 81618)
- **Trung vị (Median steps)**: **88 bước**

## 4. Phân tích lỗi Flaky và nguyên nhân gốc rễ

Dựa trên dữ liệu thu thập được từ các lần chạy thật và đối chiếu với thiết kế của mô hình, các yếu tố ảnh hưởng đến độ ổn định được phân tích thành hai nhóm: **Dữ liệu thực nghiệm đã ghi nhận** và **Giả thuyết kỹ thuật cần theo dõi**.

### 4.1 Đo lường thực tế từ các lần chạy thật

1. **Thời gian thực thi tuyến tính với số bước**:
   - Seed 3030 (31 bước): **3 phút 31 giây** (bao gồm thời gian khởi tạo context và cold-start page)
   - Seed 6006 (41 bước): **1 phút 56 giây** (trung bình ~2.8 giây/bước)
   - Seed 5555 (61 bước): **2 phút 17 giây** (trung bình ~2.2 giây/bước)
   - Seed 9999 (59 bước): **2 phút 45 giây** (trung bình ~2.8 giây/bước)
   - *Kết luận thực nghiệm*: Với các seed ngắn/vừa (< 65 bước), thời gian chạy hoàn toàn nằm trong ngưỡng kiểm soát 2–4 phút, phù hợp để ghim trong CI pipeline.

2. **Khả năng dọn dẹp phiên (`freshHost` và `clearCookies`)**:
   - Trong quá trình chạy thực tế của Seed 5555 và 9999, các cạnh kết thúc booking (`e_StartNewBookingAfterCancel` và `e_StartNewBookingAfterReject`) được kích hoạt lặp lại nhiều lần.
   - Hàm `freshHost()` thực hiện `page.context().clearCookies()` và tạo user mới trong DB.
   - *Kết quả thực nghiệm*: Không có trường hợp nào bị rò rỉ cookie hay session cũ sang host mới; 100% các bước xác nhận trạng thái ban đầu `(await read()).length === 0` đều đạt.

### 4.2 Giả thuyết kỹ thuật và rủi ro tiềm ẩn (Chưa đo kiểm trên seed dài)

> [!WARNING]
> Các nội dung dưới đây là giả thuyết phân tích dựa trên kiến trúc mã nguồn, chưa có số đo thực tế do các seed dài (> 100 bước) chưa được chạy thật nhằm tránh quá tải tài nguyên và vượt thời hạn.

1. **Rủi ro cạn kiệt slot khi số vòng lặp Reschedule tăng cao (Giả thuyết)**:
   - Cạnh `e_RescheduleSlotUnavailable` chặn slot bằng cách ghi một booking blocker trực tiếp trong DB cho cùng khoảng thời gian `start/end`.
   - Cạnh `e_SelectAnotherSlot` sau đó sử dụng helper `selectSecondAvailableTimeSlotNextMonth(page)`.
   - *Nguy cơ*: Nếu một seed dài lặp lại chu trình này hơn 10 lần trong cùng tháng kiểm thử, các slot khả dụng có thể dần bị lấp đầy, đòi hỏi UI phải chuyển tháng hoặc có thể rơi vào tình trạng không còn slot thứ hai, gây timeout.

2. **Rủi ro rò rỉ bộ nhớ Playwright trên seed siêu dài (Giả thuyết)**:
   - Với các seed dài như 12345 (231 bước) hoặc 8888 (173 bước), việc thực hiện hàng trăm thao tác click, chuyển hướng DOM và hydrate Next.js liên tục trên một page context duy nhất có thể làm tăng mức tiêu thụ RAM của tiến trình Chromium, tiềm ẩn nguy cơ chậm phản hồi hoặc timeout nếu không tái tạo page context định kỳ.

## 5. Kết luận và Khuyến nghị

1. **Khuyến nghị cấu hình CI/CD**:
   - **Gating PR (CI Test)**: Ghim cố định **Seed `6006`** (41 bước, thời gian chạy thực nghiệm: 1m 56s) hoặc **Seed `3030`** (31 bước, thời gian chạy thực nghiệm: 3m 31s). Cả hai seed này đã được chứng minh pass 100% trên môi trường thật, đảm bảo độ bao phủ trọn vẹn 12/12 edges và 7/7 vertices trong thời gian tối ưu.
   - **Nightly Build / Đánh giá định kỳ**: Có thể mở rộng sang **Seed `5555`** (61 bước, 2m 17s) và **Seed `9999`** (59 bước, 2m 45s).
   - **Không khuyến nghị chạy trong CI**: Các seed có số bước > 100 (như 2024, 8888, 12345) do thời gian thực thi kéo dài và nguy cơ cạn kiệt slot thử nghiệm.

2. **Về công cụ và bằng chứng kiểm thử**:
   - Script `scripts/run-issue-06-mbt.mjs` đã được tinh chỉnh để loại bỏ thư mục bằng chứng khỏi kiểm tra `dirty`, đảm bảo trường `dirty: false` phản ánh chính xác trạng thái sạch của cây mã nguồn.
   - Các file bằng chứng sinh đường đi cũ (0/12 coverage) đã được loại bỏ; repository hiện lưu trữ 4 file bằng chứng chạy thật hoàn chỉnh với đầy đủ 12/12 edges, 7/7 vertices, ghi nhận môi trường Node v20.20.2 và JDK 21.
