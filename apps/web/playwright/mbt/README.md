# Issue #6 — GraphWalker booking harness

Harness thực thi đường đi model Issue #5 qua UI/API, rồi đọc DB ngay sau từng
edge/vertex. Oracle chỉ `select` uid, status, rescheduled, fromReschedule,
startTime, endTime, cancellationReason. UID chỉ dùng trong bộ nhớ; không xuất
email/token/UID/URL quản lý. Không dùng tài khoản thật hoặc database production.

## Môi trường

Windows, PowerShell 7, Node theo phiên bản của repo (Issue 04 dùng 20.20.2),
Yarn 4.12.0, Docker Desktop, PostgreSQL 17-alpine, Chromium Playwright,
Java **11**, GraphWalker **4.3.3**. **KHÔNG dùng Java 25**.
Tải JAR từ [release chính thức](https://github.com/GraphWalker/graphwalker-project/releases/tag/4.3.3)
về `tools/graphwalker/graphwalker-cli-4.3.3.jar`, giữ cục bộ và không commit.
Đặt Java 11 vào PATH rồi kiểm tra `java -version`.

Lần chạy evidence hiện tại (13/10/2026 Asia/Saigon) có Node v24.21.0,
Docker CLI 29.8.0, chưa xác minh Docker Engine/PostgreSQL; output thử Java:

```text
spawnSync java ENOENT
```

Đây là lỗi không tìm thấy Java, không phải phiên bản Java đã đạt yêu cầu.
GraphWalker JAR và node_modules cũng chưa có. Chưa chạy UI/API/DB.

## Chạy từ thư mục gốc repo

Không thêm dependency hoặc sửa schema. Cài các dependency đã có trong lockfile:

```powershell
node .yarn/releases/yarn-4.12.0.cjs install --immutable
node .yarn/releases/yarn-4.12.0.cjs playwright install chromium
pwsh -File scripts/prepare-issue-04-env.ps1
pwsh -File scripts/start-issue-04-db.ps1
pwsh -File scripts/run-issue-04-local.ps1 prisma migrate deploy
pwsh -File scripts/run-issue-04-local.ps1 prisma generate
```

Nếu `.env` đã có, giữ nguyên và kiểm tra đó là cấu hình Issue 04 cục bộ;
prepare script chủ động từ chối ghi đè. Không commit `.env`, secret hoặc JAR.
Các thao tác tạo/dọn fixture chỉ tác động host/event/booking giả của phiên test;
oracle không ghi DB. Không reset database hoặc volume dùng chung.

Ở terminal riêng, khởi động web cục bộ theo Issue 04:

```powershell
$env:NEXT_PUBLIC_IS_E2E = "1"
pwsh -File scripts/run-issue-04-local.ps1 workspace @calcom/web dev -p 3000
```

Lệnh GraphWalker sinh đường đi (JSON từng dòng):

```powershell
java -version
java -jar tools/graphwalker/graphwalker-cli-4.3.3.jar check -m docs/qa/model/booking-model.json "random(edge_coverage(100))"
java -jar tools/graphwalker/graphwalker-cli-4.3.3.jar offline --seed 6006 -m docs/qa/model/booking-model.json "random(edge_coverage(100))"
```

Runner tự gọi offline với seed 6006, kiểm tra liên tục các source/target và
coverage của đường đi trước khi chạy browser. Không nhập đường đi viết tay:

```powershell
node scripts/run-issue-06-mbt.mjs --generate-only
node scripts/run-issue-06-mbt.mjs
node .yarn/releases/yarn-4.12.0.cjs biome check --write apps/web/playwright/mbt/issue-06.e2e.ts apps/web/playwright/mbt/playwright.config.ts scripts/run-issue-06-mbt.mjs
node .yarn/releases/yarn-4.12.0.cjs type-check:ci --force
```

## Hai edge khó

`e_RescheduleSlotUnavailable`: chọn slot qua helper trước, đọc `date` từ URL
chỉ trong bộ nhớ, rồi dùng fixture `bookings.create` chặn đúng khoảng slot
cho cùng host/event type. Sau đó gửi form reschedule còn giữ slot cũ.
Yêu cầu HTTP 4xx và DB chứng minh A không thay đổi, vẫn ACCEPTED, không có
booking với `fromReschedule=A`. Blocker không được tính là B và được giữ lại
để `e_SelectAnotherSlot` chứng minh chọn slot khác không trùng blocker.
Nếu UI ngăn gửi request hoặc timeout, edge ghi **chưa kiểm chứng**, không pass.
Chưa xác minh thực nghiệm selector/URL `date` và hành vi stale form trên máy này.

`e_StartNewBooking`: snapshot booking của phiên cũ, tạo host/event type giả
mới và mở trang booking mới. DB của phiên mới phải rỗng; snapshot phiên cũ
phải giữ nguyên, kể cả B CANCELLED. Fixture được dọn sau khi lưu evidence.

## Đọc và gửi kết quả

Mỗi lần chạy ghi file riêng `docs/qa/evidence/issue-06-<UTC>.json`: SHA gốc,
cờ dirty, thời điểm UTC/Asia/Saigon, môi trường, lỗi preflight, từng bước,
coverage và giới hạn. Đường đi sinh chỉ là kế hoạch; chỉ bước hoàn tất oracle
mới tăng coverage. Edge coverage = số edge pass / 6; vertex coverage = số
vertex pass / 5. Pass toàn harness cần cả hai đạt 100%. Fail khi oracle sai;
chưa kiểm chứng khi chưa hoàn tất action/DB hoặc thiếu môi trường.
Generate-only không chứng minh booking pass. Runner trả mã lỗi nếu không pass.

Tắt reporter/trace/screenshot/video; runner giữ output browser trong bộ nhớ và
không xuất nó. Lỗi browser được thay bằng lý do an toàn; lỗi công cụ preflight
không chứa booking data được giữ nguyên văn. Không đính kèm output server thô.

Ngay sau mỗi lần chạy, gửi file evidence cùng coverage cho **@anvodangiu**
(Issue #7, Phần G) và báo **@BoyTay**. Môi trường hiện không có GitHub CLI hoặc
connector gửi GitHub nên chưa gửi được; không coi bản ghi cục bộ là đã báo cáo.

Giới hạn: chỉ model cá nhân 6 edge/5 vertex; chưa chứng minh PENDING, REJECTED,
AWAITING_HOST, token guards, seats, recurring, payment/calendar/email/webhook.
