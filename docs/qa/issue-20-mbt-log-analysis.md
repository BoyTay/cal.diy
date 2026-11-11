# Issue #20: Tổng hợp log và phân tích bất thường của Issue #18

Tài liệu này tổng hợp các lần chạy của harness GraphWalker/Playwright từ Issue
#18, phân loại lỗi hoặc hành vi bất thường, cung cấp reproducer an toàn và truy
nguyên nguyên nhân đến mã nguồn. Không có lỗi ứng dụng booking được xác nhận
trong lần chạy đầy đủ mới nhất; các mục còn lại là lỗi chuẩn bị môi trường,
flaky của harness cũ hoặc hành vi từ chối đúng của ứng dụng.

## Mốc và phạm vi

- Nhánh đích: `qa/model-based-booking`
- Target SHA khảo sát: `a16edc21e66093b5b1ee1ebf25ba77ab746cf0c8`
- Evidence runtime đầy đủ: SHA `9acfc728feacac8434edd69665e142c8932a0169`
- Evidence đầy đủ: [issue-06-2026-11-10T05-41-58-918Z.json](evidence/issue-06-2026-11-10T05-41-58-918Z.json)
- Hạn issue #20: `2026-11-18`
- Phạm vi: booking cá nhân, không recurring, không seats/payment/calendar ngoài.

Evidence chỉ giữ các trường oracle được whitelist: trạng thái, liên kết
reschedule, thời gian, lý do reject/cancel và coverage. Không commit secret,
email, UID/token booking hoặc URL quản lý booking.

## Tổng hợp các lần chạy

| Thời điểm UTC | SHA | Kết quả | Coverage | Phân loại |
| --- | --- | --- | --- | --- |
| 2026-10-12 18:28 | `a8bb2613b9bb21ff821ecef56abc7dbff102086b` | Chưa kiểm chứng | 0/12 edge, 0/7 vertex | Bị chặn trước khi chạy: thiếu Java, JAR và `node_modules`. |
| 2026-10-12 19:18 | `b6312cbbd8b43c1a16ef604d9ab3e6c3a0bed4db` | Fail | 1/6 edge, 2/5 vertex | Harness không tìm được booking tổng hợp trong menu action trước khi gửi request. |
| 2026-10-12 19:24 | `c4a8f9875ff1e55851f7a4607d6258aa7d9da8e2` | Fail | 1/6 edge, 2/5 vertex | Cùng nhóm lỗi lookup/menu action; không kết luận lỗi ứng dụng. |
| 2026-10-12 19:31 | `67f426243f8553b73e0d3059e30cb0248f8e10ab` | Pass | 6/6 edge, 5/5 vertex | Model v1 chạy đủ sau khi sửa harness. |
| 2026-11-01 04:09 | `280ae3a6d3a58961f4552025f470ae52c829a96c` | Pass | 6/6 edge, 5/5 vertex | Baseline v1; chưa bao phủ nhánh `PENDING`. |
| 2026-11-02 15:07 | `280ae3a6d3a58961f4552025f470ae52c829a96c` | Pass | 6/6 edge, 5/5 vertex | `dirty=true` do khác newline/generated files; nội dung không đổi. |
| 2026-11-10 05:41 | `9acfc728feacac8434edd69665e142c8932a0169` | Pass | 12/12 edge, 7/7 vertex | Model v2 đầy đủ, `dirty=false`, tất cả oracle pass. |

Hai lần fail ngày 12/10 không được tính là lỗi runtime booking: evidence ghi rõ
action chưa gửi request và các bước sau được đánh dấu chưa kiểm chứng. Lần chạy
ngày 10/11 đạt toàn bộ tiêu chí runtime của model v2.

## Danh sách bất thường và reproducer

### 1. Preflight thiếu runtime — lỗi môi trường, không phải lỗi ứng dụng

**Triệu chứng:** Evidence `a8bb...` ghi `spawnSync java ENOENT`, thiếu
`tools/graphwalker/graphwalker-cli-4.3.3.jar` và thiếu `node_modules`, coverage
0%. Đây là `BLOCKED`, không phải `FAIL` của booking.

**Reproducer:** Từ checkout sạch, chưa cài JDK/JAR/dependency, chạy:

```powershell
node scripts/run-issue-06-mbt.mjs
```

**Nguyên nhân mã nguồn:** `scripts/run-issue-06-mbt.mjs:17-20` gọi `java` và
`docker` trong preflight; `scripts/run-issue-06-mbt.mjs:55-57` kiểm tra JAR;
`scripts/run-issue-06-mbt.mjs:68-82` dừng việc sinh/chạy path khi GraphWalker
không chạy được. Đây là cơ chế bảo vệ đúng: runner không tăng coverage khi
thiếu runtime.

**Cách xử lý:** Dùng JDK 11–21, GraphWalker 4.3.3, dependency lockfile và
PostgreSQL test trước khi chạy. Evidence mới đã xác nhận đường này pass.

### 2. Lookup booking trong menu action — lỗi flaky của harness cũ, đã sửa

**Triệu chứng:** Hai evidence `b631...` và `c4a8...` dừng tại
`e_RescheduleSlotUnavailable`, lần lượt ghi “action list was enumerated without
waiting for hydration” và “action unavailable or timed out”. Chỉ có booking A
được tạo; không có request reschedule nên không được suy ra lỗi HTTP/DB.

**Reproducer:** Chạy harness trên các SHA trên, với path model v1, trong lúc
menu action của `/bookings/upcoming` chưa hydrate rồi gọi edge reschedule. Đây
là reproducer lịch sử; không cần tạo booking thật hoặc đưa UID vào log.

**Nguyên nhân mã nguồn:** Bản sửa tại commit `c4a8f9875f` thêm
`await actions.first().waitFor({ state: "visible" })` trong
`apps/web/playwright/mbt/issue-06.e2e.ts:65-75`; commit `67f426243f` hoàn thiện
việc tìm booking row. Bản hiện tại không còn enumerates menu trước khi chờ
visible. Vì vậy đây là lỗi đồng bộ của harness cũ, đã được khắc phục; không phải
lỗi của route booking.

### 3. `dirty=true` sau cài dependency — khác biệt checkout, không đổi mã nguồn

**Triệu chứng:** Evidence ngày 02/11 pass nhưng `dirty=true` trong khi evidence
ngày 01/11 cùng SHA pass với `dirty=false`.

**Reproducer:** Checkout SHA
`280ae3a6d3a58961f4552025f470ae52c829a96c`, bật `core.autocrlf=true`, chạy
`yarn install` rồi kiểm tra `git status --short`.

**Nguyên nhân:** Cài đặt sinh lại file `*.generated.ts` và `schema.prisma`,
đồng thời khác ký tự newline. Đối chiếu `git diff --ignore-cr-at-eol` rỗng.
Runner lấy SHA và cờ dirty từ `git rev-parse HEAD` và `git status --porcelain`
trong `scripts/run-issue-06-mbt.mjs:23-24`; cờ này giúp truy vết reproducibility,
không làm oracle booking pass giả.

### 4. PowerShell 5.1 không tương thích script chuẩn bị — lỗi toolchain

**Triệu chứng:** Windows PowerShell 5.1 có thể lỗi `GetBytes` nhưng vẫn ghi
`.env` không hoàn chỉnh. PowerShell 7 là môi trường bắt buộc của harness.

**Reproducer an toàn:** Không chạy trên checkout có dữ liệu; trong bản sao sạch
chạy `powershell.exe -File scripts/prepare-issue-04-env.ps1` thay vì `pwsh`.
Script sẽ tạo secret local nếu đi đến cuối, vì vậy không đưa `.env` hoặc output
secret vào evidence.

**Nguyên nhân mã nguồn:** `scripts/prepare-issue-04-env.ps1:25-28` dùng
`[Security.Cryptography.RandomNumberGenerator]::GetBytes(int)`, API được tài liệu
harness xác nhận cho PowerShell 7. Script cũng cố ý ghi giá trị vào `.env` nhưng
không in ra terminal ở dòng 43-44. Đây là giới hạn môi trường đã biết, không phải
lỗi logic booking.

### 5. HTTP 409 khi slot bị chiếm — hành vi từ chối đúng

**Triệu chứng:** Evidence mới ghi HTTP `409`, `requestSlotBlocked=true`, booking
gốc không đổi và không tạo booking thay thế. `urlDateMatchesRequestStart=false`
là thông tin chẩn đoán, không phải oracle fail.

**Reproducer:** Edge `e_RescheduleSlotUnavailable` trong
`apps/web/playwright/mbt/issue-06.e2e.ts:239-304` chặn đúng khoảng `start/end`
của request bằng một booking tổng hợp, sau đó tiếp tục request reschedule. Oracle
kiểm tra response 4xx, booking gốc giữ nguyên và không có `fromReschedule` mới.

**Nguyên nhân mã nguồn:** Harness tạo blocker từ body request ở dòng 263-273;
ứng dụng giữ nguyên transaction khi request bị từ chối. Nếu lỗi ghi booking
trùng unique constraint, `RegularBookingService.ts:1821-1825` ánh xạ Prisma
`P2002` thành HTTP `409` với `BookingConflict`. Việc `date` trong URL không bằng
thời điểm UTC chính xác là khác biệt giữa tham số ngày trên URL và `start/end`
đầy đủ của request; không chứng minh lỗi timezone hay lỗi dữ liệu.

## Kết luận coverage/score

Evidence ngày 10/11 là lần chạy đủ Model v2:

- `result: pass`, `dirty: false`.
- Edge coverage: `12/12` (`100%`).
- Vertex coverage: `7/7` (`100%`).
- Đã chạy các nhánh `PENDING -> ACCEPTED`, `PENDING -> REJECTED`,
  `PENDING -> CANCELLED`, accepted reschedule, slot unavailable và cancellation.
- Oracle sau mỗi action đọc các field trạng thái/liên kết/thời gian/lý do; không
  có lỗi oracle, không có bước bị đánh dấu chưa kiểm chứng.

Không phát hiện lỗi ứng dụng booking trong evidence đầy đủ. Các giới hạn còn lại
là `AWAITING_HOST`, seats, recurring, payment, calendar ngoài, email/webhook và
guard bổ sung ngoài model hiện tại.

## Lệnh xác minh và tiêu chí bàn giao

```powershell
java -jar tools/graphwalker/graphwalker-cli-4.3.3.jar check -m docs/qa/model/booking-model.json "random(edge_coverage(100))"
node scripts/run-issue-06-mbt.mjs
git rev-parse HEAD
git status --short
```

PR phải được tạo từ nhánh riêng vào `qa/model-based-booking`, yêu cầu ít nhất một
reviewer, và chỉ commit tài liệu/evidence đã lọc. Không commit `.env`, JAR,
secret, email, UID/token hoặc URL quản lý booking. Refs #20.
