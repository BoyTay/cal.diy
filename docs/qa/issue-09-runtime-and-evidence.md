# Runtime, build, seed va evidence booking

Tai lieu nay ghi lai cach chuan bi moi truong, build/run, seed data va cac ket qua
chay duoc cho luong booking co ban. PR nay duoc tao tu nhanh
`docs/qa-runtime-evidence` va nham vao `qa/model-based-booking`.

## Moc phien ban

- Target branch tai luc viet tai lieu: `qa/model-based-booking`
- Target SHA: `49008921b2`
- Evidence MBT da cong bo: `280ae3a6d3a58961f4552025f470ae52c829a96c`
- Thoi han cong viec: `2026-11-12`
- Evidence chi ghi SHA/tag va ket qua da loc; khong ghi secret, email, UID
  booking, token, URL quan ly booking hay link thao tac quan tri.

> Evidence duoc tao truoc target SHA hien tai. Khi chay lai tren commit khac,
> phai ghi SHA moi trong file evidence thay vi coi ket qua cu la ket qua cua
> commit moi.

## Moi truong

### Chay local va seed co ban

Can co Windows, PowerShell 7, Git, Node theo version trong repo, Corepack/Yarn,
PostgreSQL va Chromium Playwright. Moi truong MBT da duoc ghi nhan:

| Thanh phan | Phien ban trong evidence |
| --- | --- |
| OS | Windows (`win32`) |
| Node.js | `20.20.2` |
| Yarn | `4.12.0` |
| Java | Temurin/OpenJDK `21.0.13` |
| Docker | `29.4.1` |
| PostgreSQL | `17.11` |
| GraphWalker | `4.3.3` |

Lenh chuan bi local:

```powershell
corepack enable
corepack yarn install --immutable
corepack yarn playwright install chromium
Copy-Item .env.example .env
# Dien secret local vao .env; khong commit .env.
corepack yarn prisma generate
corepack yarn db-seed
```

`db-seed` dung du lieu mau cho local development. Khong dung tai khoan, database
hoac credential production. Neu `.env` da ton tai, kiem tra lai `DATABASE_URL`
truoc khi seed de tranh ghi nham database.

### Build va run

Chay web development:

```powershell
corepack yarn dev
```

Build web production:

```powershell
corepack yarn build
corepack yarn start
```

Chay stack Compose, gom PostgreSQL, Redis, web, API v2 va Prisma Studio:

```powershell
docker compose up -d --build
docker compose ps
```

Compose hien tai expose web o `http://localhost:3001`, API theo `API_PORT` va
Studio o `http://localhost:5555`. Harness MBT khong dung Compose; harness dung
dev server o port `3000` va PostgreSQL test rieng o port `5450`.

Dung stack ma khong xoa volume:

```powershell
docker compose down
```

Khong dung `docker compose down -v` khi can giu du lieu test. Khong dua ket qua
`docker compose config`, `.env` hoac log co the chua secret vao PR.

## Chay MBT va tao evidence

Harness su dung PowerShell 7, Node 20, JDK 21 va GraphWalker 4.3.3. Chuan bi
database va schema test:

```powershell
pwsh -File scripts/prepare-issue-04-env.ps1
docker pull postgres:17-alpine
pwsh -File scripts/start-issue-04-db.ps1
pwsh -File scripts/run-issue-04-local.ps1 prisma migrate deploy
pwsh -File scripts/run-issue-04-local.ps1 prisma generate
```

Terminal web rieng:

```powershell
$env:NEXT_PUBLIC_IS_E2E = "1"
pwsh -File scripts/run-issue-04-local.ps1 workspace @calcom/web dev --port 3000
```

Kiem tra model va chay harness:

```powershell
java -jar tools/graphwalker/graphwalker-cli-4.3.3.jar check -m docs/qa/model/booking-model.json "random(edge_coverage(100))"
node scripts/run-issue-06-mbt.mjs
```

Moi lan chay pass tao mot file `docs/qa/evidence/issue-06-<UTC>.json` co SHA,
thoi gian, moi truong, tung buoc, coverage va gioi han. Generate-only khong
duoc tinh la evidence booking pass.

## Evidence it nhat ba luong

File [issue-06-2026-11-02T15-07-24-820Z.json](evidence/issue-06-2026-11-02T15-07-24-820Z.json)
ghi `result: pass`, `dirty: true`, edge coverage `6/6` va vertex coverage `5/5`
tren SHA `280ae3a6d3a58961f4552025f470ae52c829a96c`. File nay khong chua email,
UID booking, token hay URL quan ly.

| Luong | Buoc da quan sat | Ket qua |
| --- | --- | --- |
| Dat booking A | `e_CreateBookingA` | A duoc tao tu trang thai khong co booking |
| Doi lich A -> B | `e_RescheduleToB` | A van duoc giu dung khi nhay loi slot; sau do B duoc tao va lien ket voi A |
| Huy booking B | `e_CancelBookingB` | B chuyen sang `CANCELLED` |
| Bat dau phien moi | `e_StartNewBooking` | Phien moi tro ve trang thai khong co booking |

Evidence cung bao phu nhanh loi slot khong kha dung: HTTP `409`, booking goc
khong doi va khong tao booking thay the. Cac gioi han da ghi trong evidence:
khong bao phu PENDING/REJECTED/AWAITING_HOST, seats, payment, recurring,
external calendar, email va webhook.

## Kiem tra truoc khi gui PR

- [ ] Xac nhan `git rev-parse HEAD` va ghi SHA vao evidence moi.
- [ ] Kiem tra `git status --short` va khong commit `.env`, log, secret hoac JAR.
- [ ] Kiem tra evidence khong co email, UID/token booking hoac URL quan ly.
- [ ] Chay formatter/linter va type-check theo thay doi tai lieu.
- [ ] Mo draft PR vao `qa/model-based-booking` va yeu cau it nhat mot reviewer.
