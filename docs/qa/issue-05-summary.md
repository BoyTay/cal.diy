# Tóm tắt công việc Issue #5

Ngày cập nhật: 13/10/2026  
Issue: [#5 - Mô hình trạng thái booking cho Model-Based Testing](https://github.com/BoyTay/cal.diy/issues/5)

## Tôi vừa làm gì?

Tôi đã hoàn thành phần tài liệu QA cho Issue #5. File chính là [`issue-05-booking-state-model.md`](issue-05-booking-state-model.md).

Tài liệu đó gồm:

- Sơ đồ trạng thái booking: `PENDING`, `ACCEPTED`, `AWAITING_HOST`, `REJECTED`, `CANCELLED`.
- Bảng chuyển tiếp có trạng thái trước, sự kiện, điều kiện, trạng thái sau và oracle kiểm thử.
- Giải thích việc đổi lịch tạo UID mới, đồng thời lưu `fromReschedule` để liên kết booking mới với UID cũ.
- Phạm vi, giả định và các nhánh chưa được kiểm chứng.
- Tiêu chí coverage cho state, transition, guard và dữ liệu oracle.
- Ba chuỗi kiểm thử S01, S02, S03 đi qua các nhánh khác nhau.
- Điều kiện pass/fail để biết kết quả kiểm thử có đáng tin cậy hay không.

## Tại sao phải làm?

Issue #5 yêu cầu biến hành vi booking trong mã nguồn và bằng chứng chạy thử thành một mô hình có thể dùng để thiết kế Model-Based Testing. Nếu chỉ mô tả luồng bằng UI, ta có thể bỏ sót trạng thái database, nhầm UID khi đổi lịch hoặc coi một giả định là kết quả đã được kiểm chứng.

Mô hình này giúp nhóm:

1. Biết booking có thể đi qua những trạng thái nào.
2. Biết điều kiện nào cho phép hoặc chặn từng chuyển tiếp.
3. Có oracle cụ thể để đối chiếu sau mỗi thao tác.
4. Nhìn thấy các nhánh còn thiếu test thay vì kết luận quá rộng từ một kịch bản thành công.

## Đã làm bằng cách nào?

Tôi đã đọc nội dung Issue #5, sau đó đối chiếu tài liệu và mã nguồn liên quan:

- Enum và model booking trong [`packages/prisma/schema.prisma`](../../packages/prisma/schema.prisma).
- Logic tạo booking và đổi lịch trong [`createBooking.ts`](../../packages/features/bookings/lib/handleNewBooking/createBooking.ts).
- Logic confirm/reject trong [`confirm.handler.ts`](../../packages/trpc/server/routers/viewer/bookings/confirm.handler.ts) và bài test [`booking-confirm-reject.e2e.ts`](../../apps/web/playwright/booking-confirm-reject.e2e.ts).
- Logic hủy trong [`handleCancelBooking.ts`](../../packages/features/bookings/lib/handleCancelBooking.ts).
- Điều kiện tìm booking gốc khi đổi lịch trong [`originalRescheduledBookingUtils.ts`](../../packages/features/bookings/lib/handleNewBooking/originalRescheduledBookingUtils.ts).
- Bằng chứng chạy thực tế của Issue 01 và Issue 04, đặc biệt bài test [`issue-04-booking-lifecycle.e2e.ts`](../../apps/web/playwright/issue-04-booking-lifecycle.e2e.ts).

Mỗi kết luận trong tài liệu chính được ghi rõ là đọc từ code, có test, đã quan sát hoặc chỉ là giả định. Riêng Issue 01 chỉ được dùng để xác nhận quan hệ giữa UID cũ và UID mới; không dùng nó để suy ra trạng thái database trung gian vì phiên đó không chụp dữ liệu sau từng bước.

## Kết quả hiện tại

- Nhánh làm việc: `docs/issue-05-booking-state-model`.
- Commit tài liệu chính: `4bfcad9a7a docs(qa): add booking state model`.
- Nhánh đã được push lên fork `BoyTay/cal.diy`.
- Working tree hiện sạch.
- Kiểm tra khoảng trắng bằng `git diff --check` đã đạt.
- Yarn `4.12.0` đã được tải và kích hoạt qua Corepack.
- `corepack yarn install --immutable` hoàn tất theo lockfile, có các cảnh báo peer dependency của monorepo.

## Kết quả type-check

Đã chạy `corepack yarn type-check:ci --force`. Lệnh đã bắt đầu được Turbo và chạy code generation, nhưng dừng ở lỗi môi trường:

```text
Error: spawn tsc ENOENT
Failed: @calcom/app-store#type-check:ci
```

Lỗi xảy ra khi Turbo chạy package `@calcom/app-store`, không phải lỗi được báo từ file Markdown. Các file generated và `schema.prisma` bị code generation chạm vào trong lúc kiểm tra đã được khôi phục; chúng không nằm trong thay đổi của issue này.

## Trước khi tạo PR

Hiện chưa tạo PR. PR dự kiến sẽ có:

- Base: `qa/model-based-booking`.
- Compare: `docs/issue-05-booking-state-model`.
- Loại: draft PR theo quy ước của repo.

Bạn có thể đọc tài liệu chính trước tại [`issue-05-booking-state-model.md`](issue-05-booking-state-model.md), sau đó quyết định có cần chỉnh nội dung trước khi mở PR hay không.

