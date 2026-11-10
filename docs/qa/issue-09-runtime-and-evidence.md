# Môi trường, build/run, seed và evidence booking

Tài liệu này ghi lại môi trường, phiên bản, lệnh build/run, seed data và các
kết quả chạy được cho luồng booking model-based testing (MBT). PR này nằm trên
nhánh `docs/qa-runtime-evidence` và nhắm vào `qa/model-based-booking`.

## Mốc phiên bản

- Nhánh đích: `qa/model-based-booking`
- Target SHA tại thời điểm cập nhật: `49008921b2`
- Evidence mới nhất: `issue-06-2026-11-10T05-41-58-918Z.json`
- SHA được kiểm thử trong evidence: `9acfc728feacac8434edd69665e142c8932a0169`
- Hạn issue #19: `2026-11-12`
- Evidence đã lọc không ghi secret, email, UID/token booking hoặc URL quản lý
  booking.

Evidence phải được đối chiếu với SHA mà nó ghi. Không dùng kết quả của SHA cũ
để khẳng định cho một commit mới nếu chưa chạy lại.

## Môi trường

### Đường chạy đã kiểm chứng: MBT harness

PowerShell 7 là bắt buộc cho các script chuẩn bị harness. Môi trường được ghi
nhận trong evidence mới nhất:

| Thành phần | Phiên bản trong evidence |
| --- | --- |
| OS | Windows (`win32`) |
| Node.js | `20.20.2` |
| Java | Temurin/OpenJDK `21.0.13` |
| Docker | `29.8.0` |
| PostgreSQL | `17.11` |
| GraphWalker | `4.3.3` |

Các lệnh chuẩn bị đã được tài liệu hóa cho harness:

```powershell
pwsh -File scripts/prepare-issue-04-env.ps1
docker pull postgres:17-alpine
pwsh -File scripts/start-issue-04-db.ps1
pwsh -File scripts/run-issue-04-local.ps1 prisma migrate deploy
pwsh -File scripts/run-issue-04-local.ps1 prisma generate
```

Terminal web riêng:

```powershell
$env:NEXT_PUBLIC_IS_E2E = "1"
pwsh -File scripts/run-issue-04-local.ps1 workspace @calcom/web dev --port 3000
```

Kiểm tra model và chạy harness:

```powershell
java -jar tools/graphwalker/graphwalker-cli-4.3.3.jar check -m docs/qa/model/booking-model.json "random(edge_coverage(100))"
node scripts/run-issue-06-mbt.mjs
```

Harness không dùng app Compose. Harness dùng dev server ở port `3000` và
PostgreSQL test riêng ở port `5450`. Mỗi lần chạy pass tạo một file
`docs/qa/evidence/issue-06-<UTC>.json` có SHA, thời gian, môi trường, từng bước,
coverage và giới hạn. `generate-only` không được tính là evidence booking pass.

### Các đường local chưa kiểm chứng trong PR này

Các lệnh dưới đây là tham khảo từ README, chưa có evidence chạy thành công trên
checkout/commit này:

```powershell
corepack enable
corepack yarn install --immutable
corepack yarn playwright install chromium
corepack yarn prisma generate
corepack yarn db-seed
corepack yarn dev
corepack yarn build
corepack yarn start
```

Không dùng `Copy-Item .env.example .env` như một quy trình đã kiểm chứng. Tài
liệu Issue 01 ghi rõ `.env.example` chưa đủ biến cho Compose và bộ `.env` tối
thiểu cho cài đặt sạch chưa được kiểm chứng. Nếu cần chạy local, phải tạo
`.env` riêng, điền secret local không in ra terminal và xác nhận từng biến kết
nối trước khi seed; không commit `.env`.

Compose cũng chưa được dùng làm bằng chứng chạy trong PR này. Theo
`docker-compose.yml` của target, web expose ở `http://localhost:3000`, Studio ở
`http://localhost:5555`, còn API dùng `API_PORT`:

```powershell
docker compose up -d --build  # Chưa kiểm chứng trên checkout này
docker compose ps              # Chưa kiểm chứng trên checkout này
```

Không đưa `.env`, `docker compose config` hoặc log có thể chứa secret vào PR.
Không dùng `docker compose down -v` khi cần giữ volume test.

## Evidence 12 edge, 7 vertex

File [issue-06-2026-11-10T05-41-58-918Z.json](evidence/issue-06-2026-11-10T05-41-58-918Z.json)
ghi `result: pass`, `dirty: false`, edge coverage `12/12` và vertex coverage
`7/7`. Evidence chạy trên SHA
`9acfc728feacac8434edd69665e142c8932a0169` với GraphWalker `4.3.3`.

| Luồng | Edge tiêu biểu | Kết quả quan sát |
| --- | --- | --- |
| Pending → reject | `e_CreatePendingBooking`, `e_RejectPendingBooking` | Booking chuyển qua `PENDING` rồi `REJECTED`; phiên mới trở về `v_NoBooking`. |
| Pending → cancel | `e_CreatePendingBooking`, `e_CancelPendingBooking` | Booking chuyển từ `PENDING` sang `CANCELLED`; phiên mới không còn booking. |
| Slot đổi lịch không khả dụng | `e_RescheduleSlotUnavailable` | HTTP `409`; booking gốc không đổi và không tạo booking thay thế. |
| Đặt, đổi lịch và hủy | `e_CreateAcceptedBooking`, `e_RescheduleToNewSlot`, `e_CancelRescheduledBooking` | Tạo A, đổi sang B, sau đó hủy booking đã đổi lịch. |
| Pending → confirm | `e_CreatePendingBooking`, `e_ConfirmPendingBooking` | Booking chuyển từ `PENDING` sang trạng thái đã xác nhận `v_BookedA`. |

Evidence mới đã bao phủ các nhánh `PENDING`, `REJECTED`, `CANCELLED` và luồng
xác nhận. Các giới hạn còn lại là `AWAITING_HOST`, seats, payment, recurring,
external calendar, email, webhook và các guard bổ sung ngoài model hiện tại.

## Kiểm tra trước khi merge

- [x] Xác nhận target SHA và SHA chạy evidence trong tài liệu.
- [x] Kiểm tra `git status --short`; working tree sạch sau commit.
- [x] Quét evidence để bảo đảm không có secret, email, UID/token hoặc URL quản
      lý booking.
- [x] Chạy `git diff --check`; Biome không xử lý Markdown theo cấu hình repo.
- [x] Chạy `corepack yarn type-check:ci --force`; lệnh bị chặn bởi lỗi môi
      trường hiện hữu `spawn tsc ENOENT` tại `@calcom/app-store`, không có thay
      đổi mã nguồn từ lần chạy này.
- [x] Đổi draft PR sang trạng thái sẵn sàng review sau khi push bản cập nhật;
      base vẫn là `qa/model-based-booking` và reviewer đã được yêu cầu.
