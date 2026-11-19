# Báo cáo cuối: Model-Based Testing vòng đời booking của Cal.diy (Phần A–H)

Đề tài: **R05 Cal.diy + K02 Model-Based / Stateful Testing** (GraphWalker 4.3.3), môn Kiểm thử phần mềm, Đại học Đà Lạt, giảng viên Nguyễn Thế Lâm. Tài liệu này gom báo cáo Phần A–H, chốt một mốc SHA duy nhất và hướng dẫn chạy lại trên máy mới. Chi tiết nằm trong các tài liệu được liên kết; báo cáo này không lặp lại toàn bộ nội dung đó.

## 1. Kết luận

- Nhóm mô hình hóa vòng đời booking cá nhân thành **model v2: 7 vertex, 12 edge**, gồm đặt (xác nhận mặc định và cần organizer xác nhận), confirm, reject, hủy khi `PENDING`, đổi lịch, lỗi slot không khả dụng, hủy booking đã nhận và bắt đầu phiên mới.
- Harness (GraphWalker sinh đường đi → Playwright thao tác qua UI → oracle chỉ-đọc từ PostgreSQL) chạy **pass 12/12 edge, 7/7 vertex** trên model v2. Trạng thái nghiệp vụ được phủ: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` (4/5; `AWAITING_HOST` ngoài phạm vi).
- Độ ổn định: **8/8 lần chạy thật pass** trên 4 seed (3030, 6006, 9999, 5555), mỗi seed chạy hai lần, `dirty=false`, Node 20.20.2. Sáu seed dài hơn của tập 10 seed ghi `NOT_VERIFIED` (mỗi seed 10 đến 25 phút).
- Lần chạy xác nhận từ checkout sạch ngày 19/11 trên đúng mã đã chốt: **2/3 pass**. Lần đầu tiên (sau khi checkout, bộ nhớ đệm biên dịch của Next.js còn trống) **fail** ở edge `e_RejectPendingBooking` do hết thời gian chờ nút Reject; hai lần sau pass 12/12, 7/7. Đây là một điểm flaky khi khởi động lạnh, được ghi trung thực ở mục 6.5 và 7.
- **Không phát hiện lỗi ứng dụng booking** trong phạm vi đã nêu. Điều này nghĩa là coverage và oracle đạt, không phải bằng chứng ứng dụng không có lỗi ngoài phạm vi. Các hành vi bất thường đã gặp là lỗi môi trường hoặc harness và được phân tích ở Phần G.
- Các lần chạy cùng một máy vật lý chưa chứng minh tái lập trên phần cứng khác (mục 6.4).

## 2. Mốc cố định (một SHA duy nhất)

| Mục | Giá trị |
| --- | --- |
| Kho mã | `BoyTay/cal.diy`, nhánh tích hợp `qa/model-based-booking` |
| Gốc upstream | `calcom/cal.diy` tại `54343aa685ae8f33159d2f485ec4a57bad5c574a` (20/09/2026, điểm tách của nhánh QA khỏi `main`) |
| Baseline v1 | Tag `mbt-baseline-1` → commit `280ae3a6d3a58961f4552025f470ae52c829a96c` |
| **Mã kiểm thử đã chốt** | `51b392b3e136b7e665adbbafaeea5a4ba2166881`: mã harness, runner, model và cấu hình không đổi từ commit này đến tag cuối |
| **Tag cuối** | `mbt-final`, trỏ vào commit merge của PR đưa tài liệu này vào `qa/model-based-booking` |
| Evidence chính (model v2) | [`issue-06-2026-11-10T05-41-58-918Z.json`](evidence/issue-06-2026-11-10T05-41-58-918Z.json): SHA `9acfc728fe`, pass 12/12, 7/7 |
| Evidence trên SHA đã chốt | Bốn file ngày 17/11 trên `51b392b3e1`; ba file ngày 19/11 từ checkout sạch tại `b7c0cd44de` (mục 5 và 6.5) |

Kiểm tra "một SHA" mà không cần tin tài liệu: sau khi có tag, lệnh sau phải **không in ra file nào**, nghĩa là mọi commit sau `51b392b3e1` chỉ thêm tài liệu hoặc evidence:

```powershell
git diff --name-only 51b392b3e1 mbt-final -- apps scripts packages docker-compose.yml docs/qa/model package.json yarn.lock
```

## 3. Bản đồ Phần A–H

| Phần | Nội dung | Tài liệu / mã | Issue và PR | Người thực hiện |
| --- | --- | --- | --- | --- |
| A | Mục tiêu hệ thống, actor/use case, cây thư mục, dependency, luồng dữ liệu | [Phần A–B hợp nhất](issue-08-system-goals-architecture.md); gốc: [Issue 01](issue-01-booking-onboarding-architecture.md), [khảo sát luồng](booking-flow-nghia.md) | #3, #15; PR #1, #9, #26 | Hiếu Nghĩa (#9), BoyTay (#1), Ân (#26) |
| B | Sơ đồ container/component, 5 module liên quan kiểm thử | [Phần A–B hợp nhất](issue-08-system-goals-architecture.md) mục 4–6 | #15; PR #26 | Ân |
| C | Môi trường, phiên bản, lệnh build/run, seed, ≥ 3 luồng chạy được | [Runtime và evidence](issue-09-runtime-and-evidence.md); [dữ liệu nghiệp vụ Issue 04](issue-04-booking-business-data.md) | #4, #19; PR #10, #32 | Ân |
| D | Nguyên lý MBT, phạm vi, giả định, rủi ro, tiêu chí pass/fail | [Nguyên lý MBT](issue-17-mbt-principles.md) | #17; PR #30 | Đoan |
| E | Model, scenario, precondition, expected result, dữ liệu test | [Mô hình trạng thái](issue-05-booking-state-model.md); [model v2](model/booking-model-v2.json), [v1](model/booking-model-v1.json), [model đang dùng](model/booking-model.json) | #5, #16; PR #11, #30 | Đoan |
| F | Harness chạy lại tự động, README | [README harness](../../apps/web/playwright/mbt/README.md); [e2e](../../apps/web/playwright/mbt/issue-06.e2e.ts); [runner](../../scripts/run-issue-06-mbt.mjs); [đa seed](../../scripts/run-mbt-multi-seed.mjs) | #6, #18, #21; PR #12, #31, #35 | Kiên |
| G | Log, metrics, bất thường, phân tích nguyên nhân | [Log và RCA](issue-20-mbt-log-analysis.md); [độ ổn định đa seed](issue-21-multi-seed-stability.md) | #20, #21; PR #34, #35, #36 | Ân, Kiên |
| H | Pin commit/tag, lưu cấu hình, cách chạy lại trên máy mới | **Mục 6 của tài liệu này** | #14, #22; PR #8, #24, #25 | BoyTay |

## 4. Tóm tắt từng phần

**A và B.** Cal.diy cho host công bố event type và giờ khả dụng để booker đặt, đổi, hủy lịch. Phạm vi là event type cá nhân, một booking không lặp, không seat, không thanh toán, không calendar ngoài. Luồng web đi qua `POST /api/book/event` → `RegularBookingService` → `createBooking`, hủy qua `/api/cancel` → `handleCancelBooking`, và slot qua `slots.getSchedule`; dữ liệu nằm ở các model Prisma `Booking`, `EventType`, `Schedule`, `Availability`. Năm module gắn trực tiếp với kiểm thử: event type, schedule/availability, slot, tạo/đổi booking, hủy booking. Sơ đồ container và component nằm trong [Phần A–B](issue-08-system-goals-architecture.md).

**C.** Hệ thống được dựng bằng hai đường: Compose (web, API v2, PostgreSQL, Redis, Studio) và đường harness (dev server cổng 3000, PostgreSQL 17 riêng ở cổng 5450). Chỉ đường harness được kiểm chứng đầy đủ; các lệnh còn lại được đánh dấu chưa kiểm chứng trong [Phần C](issue-09-runtime-and-evidence.md). Năm luồng chạy được có evidence: đặt/đổi lịch/hủy, pending → reject, pending → cancel, pending → confirm, slot đổi lịch không khả dụng (HTTP 409).

**D.** Model là hợp đồng hành vi, không phải bản sao schema. Sinh đường đi bằng GraphWalker không phải bằng chứng; một edge chỉ tính pass khi action đã chạy qua ứng dụng và oracle DB sau action khớp. Nhãn kết quả: `PASS`, `FAIL`, `NOT_VERIFIED`, `BLOCKED`. Tiêu chí pass của phiên đầy đủ: edge 12/12, vertex 7/7, state ≥ 4/5, không oracle sai, không dữ liệu nhạy cảm trong evidence.

**E.** Model v2 gồm 7 vertex (`v_NoBooking`, `v_Pending`, `v_BookedA`, `v_BookedB`, `v_Rejected`, `v_Cancelled`, `v_SlotUnavailable`) và 12 edge. Ma trận chuỗi tối thiểu S01–S05 (đặt/đổi/hủy; confirm; reject; cancel khi pending; lỗi slot rồi chọn slot khác) nằm trong [Phần D](issue-17-mbt-principles.md), còn bảng chuyển tiếp T01–T08 với precondition, oracle và nguồn mã nằm trong [Phần E](issue-05-booking-state-model.md). Model v1 (6 edge, 5 vertex) được giữ để đối chiếu hồi quy.

**F.** Runner `scripts/run-issue-06-mbt.mjs` sinh đường đi bằng GraphWalker `offline` (seed mặc định 6006, hoặc `--seed` / `MBT_SEED`), kiểm tra source/target/coverage, rồi chạy `issue-06.e2e.ts` bằng Playwright. Oracle chỉ `select` các trường `uid`, `status`, `rescheduled`, `fromReschedule`, `startTime`, `endTime`, `cancellationReason`, `rejectionReason`, `oneTimePassword`. UID chỉ giữ trong bộ nhớ; evidence không có email, token, UID hay URL quản lý. Lệnh chạy đầy đủ nằm trong [README](../../apps/web/playwright/mbt/README.md).

**G.** Bảy lần chạy theo thời gian đã được phân loại: hai lần bị chặn hoặc fail do harness cũ (menu action chưa hydrate), các lần pass của model v1 và v2. Lần xác nhận ngày 19/11 bổ sung một lần fail do khởi động lạnh (mục 6.5), chưa nằm trong tài liệu Phần G. Năm hành vi bất thường đều không phải lỗi ứng dụng: thiếu runtime (`BLOCKED`), lookup menu action của harness cũ, `dirty=true` do line ending sau `yarn install`, PowerShell 5.1 không tương thích script chuẩn bị, và HTTP 409 khi slot bị chiếm (hành vi từ chối đúng; `P2002` ánh xạ sang `BookingConflict`). Phần độ ổn định đo thời gian thật khoảng 2,2 đến 3,8 giây mỗi bước và nêu các giả thuyết flaky chưa đo cho seed dài.

## 5. Bảng evidence

Mọi file nằm trong [`docs/qa/evidence/`](evidence/). Tên file theo thời điểm UTC.

| Nhóm | File (rút gọn) | Model | SHA | Kết quả |
| --- | --- | --- | --- | --- |
| Chạy đầu, bị chặn | `10-12T18-28` | v1 | `a8bb2613b9` | `BLOCKED`: thiếu Java, JAR, `node_modules` |
| Harness cũ | `10-12T19-18`, `10-12T19-24` | v1 | `b6312cbbd8`, `c4a8f9875f` | `FAIL` 1/6 edge: lookup menu action |
| v1 pass | `10-12T19-31`, `11-01T04-09`, `11-02T15-07` | v1 | `67f426243f`, `280ae3a6d3` | pass 6/6 edge, 5/5 vertex (lần 11-02 `dirty=true` do line ending) |
| **v2 đầy đủ** | `11-10T05-41` | v2 | `9acfc728fe` | **pass 12/12 edge, 7/7 vertex**, `dirty=false` |
| Đa seed, trước | `11-16T15-59` (3030), `16-19` (6006), `16-39` (5555), `16-42` (9999) | v2 | `1d116d3891`, `59077feaa8` | pass 12/12, 7/7 |
| **Đa seed, SHA đã chốt** | `11-17T12-20` (3030), `12-27` (6006), `12-39` (9999), `12-42` (5555) | v2 | `51b392b3e1` | pass 12/12, 7/7, `dirty=false` |
| **Checkout sạch, 19/11** | `11-19T02-49` (lần 1), `02-53` (lần 2), `02-54` (lần 3), seed 6006 | v2 | `b7c0cd44de` | lần 1 **`FAIL`** 1/12 edge, 2/7 vertex; lần 2 và 3 pass 12/12, 7/7. Cả ba ghi `dirty=true` vì thư mục chạy có file log chưa theo dõi của người chạy, không phải do thay đổi mã |

Tổng số lần chạy thật của model v2: **12** (một lần ngày 10/11, tám lần đa seed, ba lần xác nhận ngày 19/11): **11 pass, 1 fail** (lần fail đầu tiên ngày 19/11, mục 6.5).

## 6. Phần H: pin, cấu hình và chạy lại trên máy mới

### 6.1 Những gì đã được pin

| Thành phần | Cách pin |
| --- | --- |
| Mã nguồn | Tag `mbt-baseline-1` (baseline v1) và `mbt-final` (v2); SHA trong mục 2 |
| Model và seed | `docs/qa/model/booking-model.json` (= v2), seed 6006 mặc định; tập seed đa seed ghi trong [Phần G](issue-21-multi-seed-stability.md) |
| Dependency JS | `yarn@4.12.0` (`packageManager`), `corepack yarn install --immutable` theo lockfile |
| Image dữ liệu trong Compose | `postgres:18@sha256:5a5a84b19854a9ffaa54082c166ff4ec27473a361e496e5ea167f298f2da9722`, `redis:8@sha256:6f81e8915c60b065a524e6967e0ad1c639ba6efa84d669f823683ea04d9150ee`; `calcom` và `studio` build từ Dockerfile nên gắn với SHA Git |
| Cơ sở dữ liệu của harness | `postgres:17-alpine`, digest của image cục bộ trên máy kiểm tra ngày 19/11/2026 (chưa đối chiếu với máy của các thành viên khác): `sha256:eee6c6e1b0894fa4fe0075eb054af9fd1cf39a35321c2d4110626cfe506411fb`. Repo không ghim digest này; script khởi động dùng tag |
| GraphWalker | CLI 4.3.3. Không nằm trong repo; SHA-256 của file đã dùng: `8300b4ad7faf2ad2c0acde9ec0a6ffbbafe59ce51d05b5e00e971272c9364317` |
| Runtime | Node 20.20.2, Temurin JDK 21 (21.0.10 đến 21.0.13 đã dùng trong evidence; runner chấp nhận 11 đến 21 và từ chối 22 trở lên), PowerShell 7, Docker 29.x, Chromium theo Playwright 1.57.0 |

### 6.2 Cấu hình test

Cấu hình nằm trong repo: model (`docs/qa/model/`), runner (`scripts/run-issue-06-mbt.mjs`, `scripts/run-mbt-multi-seed.mjs`), e2e và cấu hình Playwright (`apps/web/playwright/mbt/`), script chuẩn bị môi trường (`scripts/prepare-issue-04-env.ps1`, `start-issue-04-db.ps1`, `run-issue-04-local.ps1`). Biến môi trường được sinh cục bộ trong `.env` (bị Git bỏ qua) với secret ngẫu nhiên; **không commit `.env`, JAR hay secret**. Reporter, trace, screenshot và video của Playwright đều tắt để không lộ dữ liệu.

### 6.3 Chạy lại trên máy mới

Yêu cầu: Windows, Git, Docker Desktop, kết nối mạng để tải runtime. Chi tiết từng lệnh và các lưu ý nằm trong [README harness](../../apps/web/playwright/mbt/README.md); đây là trình tự rút gọn.

1. `git clone https://github.com/BoyTay/cal.diy.git`, rồi `git checkout mbt-final`. Ghi lại `git rev-parse HEAD`.
2. Chuẩn bị `tools/issue06-env`: Node 20.20.2 (zip Windows x64), Temurin JDK 21, PowerShell 7 portable; tải GraphWalker 4.3.3 vào `tools/graphwalker/` và đối chiếu SHA-256 ở mục 6.1.
3. Đặt `PATH`, `ISSUE04_NODE_EXECUTABLE`, `PLAYWRIGHT_BROWSERS_PATH` như README, rồi `corepack yarn install --immutable` và `corepack yarn playwright install chromium` (khoảng 6 phút).
4. **Chạy bằng `pwsh`, không dùng Windows PowerShell 5.1:** `pwsh -File scripts/prepare-issue-04-env.ps1`, `docker pull postgres:17-alpine`, `pwsh -File scripts/start-issue-04-db.ps1`, rồi `prisma migrate deploy` và `prisma generate` qua `scripts/run-issue-04-local.ps1`.
5. Terminal riêng: `$env:NEXT_PUBLIC_IS_E2E = "1"` rồi `pwsh -File scripts/run-issue-04-local.ps1 workspace @calcom/web dev --port 3000`. Dùng `--port`, không dùng `-p`.
6. Kiểm tra model: `java -jar tools/graphwalker/graphwalker-cli-4.3.3.jar check -m docs/qa/model/booking-model.json "random(edge_coverage(100))"`. Kết quả mong đợi: `No issues found with the model(s).`
7. Chạy harness: `node scripts/run-issue-06-mbt.mjs --seed 6006` (khoảng 1 đến 1,5 phút khi dev server đã biên dịch các route). **Lần chạy đầu tiên trên một checkout mới có thể fail do biên dịch lạnh** (mục 6.5): nếu `e_RejectPendingBooking` báo `wait for reject button ... timed out`, hãy chạy lại; evidence của lần fail vẫn là kết quả hợp lệ `FAIL` và phải được giữ, không xóa để che.

Kết quả mong đợi: file `docs/qa/evidence/issue-06-<UTC>.json` có `result: "pass"`, edge 12/12, vertex 7/7, 41 bước với seed 6006. Runner dùng cùng đường đi cho cùng seed, nên đường đi của seed 6006 trùng với evidence ngày 10/11.

### 6.4 Giới hạn của việc tái lập

- Mọi lần chạy ở đây dùng **cùng một máy vật lý** (với toolchain và checkout tải mới); chưa có lần chạy trên phần cứng khác.
- Bản build của `calcom` và `studio` trong Compose phụ thuộc registry và máy build; chỉ đường harness (dev server) được kiểm chứng đầy đủ.
- Evidence chạy trên Windows với Docker 29.x; chưa thử Linux hoặc macOS.
- `postgres:17-alpine` của harness chưa được ghim digest trong script; nếu image thay đổi, kết quả có thể lệch dù chưa từng thấy.

### 6.5 Lần chạy xác nhận từ checkout sạch (19/11/2026)

Chạy lại từ một bản checkout riêng tại `b7c0cd44de` (mã đã chốt, chỉ khác `51b392b3e1` ở tài liệu và evidence), Node 20.20.2, Temurin JDK 21.0.13, Docker 29.x, `yarn install --immutable` hoàn tất, GraphWalker `check` báo `No issues found with the model(s).`. Seed 6006, ba lần liên tiếp:

| Lần | Điều kiện | Kết quả | Evidence |
| --- | --- | --- | --- |
| 1 | Dev server mới khởi động, bộ nhớ đệm biên dịch trống | **FAIL**, edge 1/12, vertex 2/7. Bước `e_RejectPendingBooking` ghi `wait for reject button in unconfirmed bookings: action unavailable or timed out`; các bước sau ghi `chưa kiểm chứng`. Chạy khoảng 3 phút | `issue-06-2026-11-19T02-49-37-718Z.json` |
| 2 | Dev server mới, bộ nhớ đệm đã có | pass, edge 12/12, vertex 7/7, 41 bước, khoảng 1 phút | `issue-06-2026-11-19T02-53-29-749Z.json` |
| 3 | Dev server đang chạy | pass, edge 12/12, vertex 7/7, 41 bước, khoảng 1 phút | `issue-06-2026-11-19T02-54-27-775Z.json` |

**Diễn giải, có giới hạn:** lần fail xảy ra ở bước đầu tiên cần mở trang `/bookings/unconfirmed`, và hai lần sau cùng mã, cùng seed, cùng máy đều pass. Điều này phù hợp với giả thuyết là Next.js dev server biên dịch lười route đó trong lần đầu nên nút Reject không xuất hiện kịp trong thời gian chờ của harness. **Giả thuyết này chưa được kiểm chứng trực tiếp** (chưa đo thời gian biên dịch, chưa thử khởi động nóng trước khi chạy). Vì vậy không thể khẳng định harness ổn định ở lần chạy đầu trên checkout mới: kết quả quan sát là 2 pass và 1 fail trên 3 lần. Cách giảm rủi ro đề xuất cho lần chạy trình diễn: chạy một lần khởi động nóng (mở các trang `/bookings/unconfirmed` và `/bookings/upcoming` hoặc chạy harness một lần trước) rồi chạy lần chính thức, hoặc tăng thời gian chờ nút Reject trong harness (thay đổi mã sẽ cần chạy lại evidence).

## 7. Giới hạn và rủi ro tồn đọng

| Hạng mục | Tình trạng |
| --- | --- |
| `AWAITING_HOST`, team, round-robin, seats, recurring, thanh toán, calendar ngoài, email, webhook | Ngoài phạm vi, không tính coverage |
| Gửi email | Không xác nhận (SMTP cục bộ không chạy; log `ECONNREFUSED`) |
| Lần chạy đầu trên checkout mới | Có thể fail do biên dịch lạnh của dev server (1 trên 3 lần xác nhận ngày 19/11); nguyên nhân là giả thuyết chưa kiểm chứng. Xem mục 6.5 |
| Sáu seed dài (1001, 2024, 4242, 7777, 8888, 12345) | `NOT_VERIFIED` (10 đến 25 phút mỗi seed); nguy cơ flaky ở seed dài mới là giả thuyết chưa đo |
| Khảo sát 30 seed | Chỉ là sinh đường đi (GraphWalker offline), không phải chạy booking thật |
| Type-check toàn monorepo | `yarn type-check:ci --force` dừng với `spawn tsc ENOENT` trên Windows; chỉ type-check file test liên quan được kiểm tra |
| Số liệu `dirty` | Lần 02/11 `dirty=true` do line ending sau `yarn install`; nội dung không đổi (`git diff --ignore-cr-at-eol` rỗng). Từ PR #35, `dirty` bỏ qua thư mục evidence |
| Tài liệu có nội dung lịch sử | Xem mục 8 |

## 8. Lưu ý khi đọc các tài liệu thành phần

Một số tài liệu được viết trước khi harness model v2 hoàn thành và vẫn giữ nội dung lịch sử. Khi mâu thuẫn, **các evidence ngày 10/11 và 17/11 là kết quả mới nhất**:

- [Phần D](issue-17-mbt-principles.md) mục "Kết quả chạy thực tế ngày 04/11/2026" ghi S02–S04 qua form là `NOT_VERIFIED` và `incrementMonth` dừng. Đó là trạng thái ngày 04/11. Sau Issue #18, ba chuỗi này đã chạy qua form và pass (evidence 10/11).
- [Phần E](issue-05-booking-state-model.md) mục 5 và 6 mô tả S02–S04 là kế hoạch "phải chạy" và ghi `REJECTED` chưa có bằng chứng UI độc lập; hiện đã có evidence UI cho cả ba nhánh.
- [Issue 01](issue-01-booking-onboarding-architecture.md) và [khảo sát luồng](booking-flow-nghia.md) có cổng hoặc SHA cũ (cổng chuẩn hiện tại là 3000; SHA khảo sát riêng của từng tài liệu). Bản hợp nhất [Phần A–B](issue-08-system-goals-architecture.md) là nguồn dùng khi diễn giải.
- [Issue 01](issue-01-booking-onboarding-architecture.md) mục 7 có hai UID booking của dữ liệu giả cục bộ, trong khi quy ước của dự án là không đưa UID booking vào tài liệu và evidence. Các UID này thuộc cơ sở dữ liệu thử nghiệm đã bỏ, không dẫn tới dữ liệu thật; nên thay bằng nhãn `UID A` và `UID B` nếu nhóm muốn tuân thủ quy ước tuyệt đối.

## 9. Lịch sử công việc

PR đã merge vào `qa/model-based-booking`:

| PR | Tác giả | Nội dung |
| --- | --- | --- |
| #1, #2 | BoyTay | Tài liệu cài đặt và kiến trúc Issue 01; hướng dẫn Docker |
| #8 | BoyTay | Ghim digest image Docker |
| #9 | Hiếu Nghĩa | Khảo sát luồng đặt, đổi, hủy (Issue 02) |
| #10 | Ân | Nghiệp vụ và dữ liệu kiểm thử Issue 04 |
| #11 | Đoan | Mô hình trạng thái booking |
| #12 | Kiên | Harness GraphWalker (model v1) |
| #24, #25 | Kiên, BoyTay | Baseline lại trên tag và máy sạch |
| #26, #28 | Ân, BoyTay | Phần A–B hợp nhất; sửa ghi chú cổng cũ |
| #27 | BoyTay | Hoàn nguyên thay đổi cổng chỉ dùng cục bộ trong Compose |
| #30 | Đoan | Model v2 và Phần D |
| #31 | Kiên | Harness model v2 (12 edge, 7 vertex) |
| #32 | Ân | Phần C: runtime và evidence |
| #34 | Ân | Phần G: log và phân tích nguyên nhân |
| #35, #36 | Kiên | Độ ổn định đa seed và hiệu chỉnh |

Hiếu Nghĩa không còn trong nhóm ở giai đoạn sau; các PR còn lại do bốn thành viên BoyTay, Ân, Đoan và Kiên thực hiện.
