# Phần 1 — Xác thực & Phân quyền phía server

- **Ngày:** 2026-10-07
- **Trạng thái:** Bản nháp chờ duyệt
- **Phụ thuộc:** Không. Là tiền đề cho [Phần 2 — Catalog trên server](./2026-10-07-server-catalog-design.md).

---

## 1. Mục tiêu

Biến vai trò tài khoản từ "nhãn hiển thị" thành quyền thật được **server** kiểm soát, để:

1. Server tự biết ai đang gọi API (không tin dữ liệu client tự khai).
2. Chỉ còn 2 vai trò: **admin** và **sales**, với quyền đúng như nghiệp vụ.
3. Các API quản trị (người dùng, sau này là catalog) chỉ admin gọi được.
4. Mật khẩu không còn lưu dạng chữ thường.

**Thành công khi:** một tài khoản sales, dù dùng Postman/curl, không thể: tự nâng quyền, xem/sửa/xóa dự án không thuộc quyền, đổi đơn giá/chi phí của dự án hay giá thiết bị/vật tư; và giao diện không còn nút "Chuyển vai trò thử nghiệm".

---

## 2. Hiện trạng (đã kiểm tra trong code)

| # | Vấn đề | Vị trí |
|---|---|---|
| H1 | Đăng nhập chỉ trả về object user; không có token/session. Client lưu user vào `localStorage['hgc_solar_auth_user_v1']`. | `server.ts:818-853`, `src/services/authApi.ts` |
| H2 | Mọi API dự án xác định người gọi qua header `x-user-email`, `x-user-role` do client tự gửi → giả mạo được. | `src/services/api.ts:5-12`, `server.ts:880-960` |
| H3 | `GET /api/auth/users`, `PUT /api/auth/users/:id/role`, `DELETE /api/auth/users/:id` không kiểm tra quyền → ai cũng tự nâng mình lên admin, xóa tài khoản người khác. | `server.ts:855-876` |
| H4 | Mật khẩu lưu plaintext, so sánh `===`. Admin mặc định `admin@hgcvn.cloud` / `123456` được seed cứng. | `server.ts:152, 266-280, 827` |
| H5 | Giao diện có menu "Chuyển vai trò thử nghiệm" cho mọi người; `userRole` là state client mặc định `'ky_su'`. | `Header.tsx:200-236, 446-452`, `App.tsx:240` |
| H6 | Nút "Admin Catalog" hiện cho mọi tài khoản; view admin không bị chặn. | `Header.tsx:131-140`, `App.tsx:747` |
| H7 | `POST /api/projects` lấy chủ sở hữu từ header client. | `server.ts:909-917` |
| H8 | Có 3 vai trò `ky_su | sales | admin`; đăng ký mới mặc định `ky_su`. | `src/types/user.ts:1`, `server.ts:742` |
| H9 | Không có giao diện quản lý người dùng (không chỗ nào gọi `/api/auth/users`). | — |

---

## 3. Phạm vi

**Trong phạm vi**
- Session đăng nhập bằng cookie HttpOnly, lưu trong PostgreSQL.
- Hash mật khẩu, migrate mật khẩu cũ, đổi mật khẩu.
- Mô hình 2 vai trò + migrate `ky_su → sales`.
- Middleware xác thực/phân quyền cho mọi API.
- Ràng buộc trường giá trên dự án đối với sales (server-side).
- Gỡ chuyển vai trò trên UI, khóa các ô giá ở bước 5 với sales, chặn view admin.
- Tab "Người dùng" tối thiểu trong trang Admin.
- Tách `server.ts` thành module để kiểm thử được.
- Gỡ bỏ hạng mục **SCADA** và **hồ sơ EVN** (không dùng); **bỏ VAT** khỏi tính toán vì đơn giá đã gồm VAT — mục 8.1.

**Ngoài phạm vi** (ghi nhận, làm sau)
- Quên mật khẩu / reset qua email.
- 2FA, SSO.
- Ẩn giá vốn với sales — **không cần**: sales được xem đầy đủ (đã chốt).
- Catalog trên server (Phần 2).

---

## 4. Mô hình vai trò & Ma trận quyền

Vai trò: `admin`, `sales`. Đăng ký mới → `sales`. Tài khoản `ky_su` hiện có → chuyển thành `sales`.

| Hành động | sales | admin |
|---|---|---|
| Đăng nhập, đổi mật khẩu của mình | ✅ | ✅ |
| Tạo dự án, chạy wizard bước 1 → 5 | ✅ | ✅ |
| Xem/sửa dự án **của mình** hoặc được chia sẻ (email/nhóm/công khai) | ✅ | ✅ (mọi dự án) |
| Xóa dự án | Chỉ dự án của mình | Mọi dự án |
| Đổi chia sẻ (`sharedWithEmails`, `sharedWithRoles`, `isPublic`) | Chỉ dự án của mình | Mọi dự án |
| Bật/tắt hạng mục tùy chọn ở bước 5 (vận chuyển, khung canopy) — đơn giá vẫn do admin đặt | ✅ | ✅ |
| Đặt **margin %** (0–60) và **chiết khấu %** (0–30) như hiện tại; Price Guard cảnh báo khi lợi nhuận gộp < 15% (chỉ cảnh báo, không chặn) | ✅ | ✅ |
| Sửa các **đơn giá/chi phí** cấp dự án (canopy/m², vận chuyển, nhân công/kWp) và giá thiết bị/vật tư | ❌ | ✅ |
| "Cập nhật theo giá mới" — áp giá catalog chính thức cho dự án (có từ Phần 2) | ✅ | ✅ |
| Xem chế độ "Nội bộ" (giá vốn, lợi nhuận gộp) & xuất CSV ERP có giá vốn | ✅ | ✅ |
| Xem & xuất báo giá khách hàng, BOM mẫu HGC (giá bán), hồ sơ giá trị, checklist | ✅ | ✅ |
| Trang Admin: catalog thiết bị/vật tư | ❌ | ✅ |
| Trang Admin: người dùng (xem, đổi vai trò, xóa) | ❌ | ✅ |


**Ràng buộc an toàn cho admin**
- Không tự hạ vai trò hoặc tự xóa chính mình.
- Không hạ/xóa admin cuối cùng (phải luôn còn ≥ 1 admin).

---

## 5. Thiết kế xác thực

### 5.1. Session cookie (chọn thay vì JWT)

Lý do: cần **thu hồi ngay** khi đổi vai trò/xóa người dùng/đổi mật khẩu; session lưu DB làm việc này đơn giản, JWT thì không.

- Khi đăng nhập thành công (hoặc xác thực OTP thành công): sinh `token = randomBytes(32)` (base64url).
- Lưu **`sha256(token)`** (không lưu token gốc) vào bảng `sessions`.
- Gửi cookie:
  `hgc_sid=<token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800` + `Secure` khi `COOKIE_SECURE !== 'false'` và `NODE_ENV=production`.
- Hạn 7 ngày, **trượt**: mỗi request hợp lệ, nếu `expires_at - now < 6 ngày` thì gia hạn lại 7 ngày (tối đa 1 lần ghi DB/ngày/session).
- Mỗi request: đọc cookie → hash → `SELECT ... FROM sessions JOIN users` → gắn `req.user = { id, email, fullName, role }`. **Vai trò luôn đọc từ bảng `users`** nên đổi vai trò có hiệu lực ngay.
- Đăng xuất: xóa dòng session + xóa cookie.
- Đổi mật khẩu / admin đổi vai trò / xóa user → xóa mọi session khác của user đó.

**Không thêm thư viện**: tự parse header `Cookie` bằng helper nhỏ; hash bằng `node:crypto`.

### 5.2. CSRF

- `SameSite=Lax` chặn cookie trên request POST/PUT/DELETE cross-site.
- Thêm lớp chặn: mọi request thay đổi dữ liệu (`POST/PUT/PATCH/DELETE` dưới `/api`) phải có `Content-Type: application/json`, nếu không → `415`. Form HTML cross-site không gửi được JSON.

### 5.3. Mật khẩu

- Thuật toán: `crypto.scrypt` (N=16384, r=8, p=1, salt 16 byte, key 64 byte).
- Định dạng lưu: `scrypt$16384$8$1$<saltB64>$<hashB64>`. So sánh bằng `timingSafeEqual`.
- Mật khẩu mới tối thiểu **8 ký tự**.
- **Migration lúc khởi động** (`initDatabase` và chế độ file JSON): mọi giá trị `password` không bắt đầu bằng `scrypt$` được hash ngay tại chỗ (giá trị cũ chính là mật khẩu gốc nên hash được). Sau lần chạy đầu không còn plaintext.
- Cột mới `must_change_password BOOLEAN DEFAULT FALSE`. Bật `TRUE` cho tài khoản có mật khẩu cũ là `123456` (gồm admin mặc định).
- Seed admin khi DB trống: email `admin@hgcvn.cloud`, mật khẩu lấy từ env `ADMIN_INITIAL_PASSWORD`; nếu không có env → sinh ngẫu nhiên 16 ký tự, in **một lần** ra console; luôn `must_change_password = TRUE`. Bỏ mật khẩu `123456` khỏi code.

### 5.4. Giới hạn đăng nhập sai

Bộ đếm trong bộ nhớ theo `email` + theo IP: sai quá **5 lần / 15 phút** → `429` với thông báo thử lại sau. Reset khi đăng nhập đúng. (Mất khi restart — chấp nhận được.)

---

## 6. Thay đổi cơ sở dữ liệu

```sql
-- Session đăng nhập
CREATE TABLE IF NOT EXISTS sessions (
  id_hash      CHAR(64) PRIMARY KEY,           -- sha256(token) hex
  user_id      VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent   TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Vai trò: bỏ ky_su
UPDATE users SET role = 'sales' WHERE role = 'ky_su';
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'sales';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','sales'));

-- Dự án đang chia sẻ theo nhóm 'ky_su' → 'sales' (loại trùng)
UPDATE projects
SET data = jsonb_set(data, '{sharedWithRoles}',
  (SELECT COALESCE(jsonb_agg(DISTINCT CASE WHEN r = 'ky_su' THEN 'sales' ELSE r END), '[]'::jsonb)
   FROM jsonb_array_elements_text(data->'sharedWithRoles') r))
WHERE data ? 'sharedWithRoles' AND data->'sharedWithRoles' @> '["ky_su"]';
```

- Session hết hạn được dọn khi khởi động và mỗi 6 giờ (`DELETE FROM sessions WHERE expires_at < NOW()`).
- Tất cả câu lệnh chạy idempotent trong `initDatabase()` (giữ đúng cách repo đang làm).
- **Chế độ file JSON dự phòng** (không có `DATABASE_URL`): session giữ trong `Map` bộ nhớ (restart là phải đăng nhập lại); migrate vai trò & hash mật khẩu áp dụng cho `data_storage/users.json` và `projects.json`.

---

## 7. API

### 7.1. Middleware

- `loadSession` (toàn cục cho `/api`): nếu có cookie hợp lệ → `req.user`, ngược lại `req.user = null`.
- `requireAuth`: `req.user` null → `401 { error: 'UNAUTHENTICATED' }`.
- `requireRole('admin')`: role khác → `403 { error: 'FORBIDDEN' }`.
- `requireJson` cho method thay đổi dữ liệu (mục 5.2).
- Header `x-user-email`, `x-user-role`, query `userEmail`, `userRole` bị **bỏ qua hoàn toàn**.

### 7.2. Bảng endpoint

| Endpoint | Trước | Sau |
|---|---|---|
| `GET /api/health` | công khai, trả số lượng user/dự án | công khai, chỉ trả `{ ok, database }` (bỏ số lượng) |
| `POST /api/auth/register` | công khai, role `ky_su` | công khai, role `sales` |
| `POST /api/auth/verify-email` | trả user | trả user **+ tạo session (set cookie)** |
| `POST /api/auth/resend-code` | công khai | công khai (giới hạn 1 lần/60s/email) |
| `POST /api/auth/login` | trả user | trả `{ user, mustChangePassword }` + set cookie; rate limit |
| `POST /api/auth/logout` | — | **mới**, requireAuth |
| `GET /api/auth/me` | — | **mới**, requireAuth → `{ user, mustChangePassword }` |
| `POST /api/auth/change-password` | — | **mới**, requireAuth; body `{ currentPassword, newPassword }`; hủy session khác |
| `GET /api/auth/users` | công khai | **admin** |
| `PUT /api/auth/users/:id/role` | công khai | **admin**; chặn tự hạ quyền & hạ admin cuối; hủy session của user đó |
| `DELETE /api/auth/users/:id` | công khai | **admin**; chặn tự xóa & xóa admin cuối; dự án của user giữ nguyên |
| `GET /api/projects` | header | requireAuth; lọc theo `req.user` |
| `GET /api/projects/:id` | header | requireAuth; kiểm tra quyền xem |
| `POST /api/projects` | header | requireAuth; `createdByEmail/Name` = `req.user` (bỏ giá trị client) |
| `PUT /api/projects/:id` | header | requireAuth; quyền sửa + ràng buộc trường (7.3) |
| `DELETE /api/projects/:id` | header | requireAuth; chủ sở hữu hoặc admin |

### 7.3. Ràng buộc trường khi lưu dự án

Áp dụng ở `POST` và `PUT /api/projects` (server là nơi quyết định, không dựa vào UI):

1. **Trường chủ sở hữu** `createdByEmail`, `createdByName`: luôn lấy từ bản ghi đã có (hoặc `req.user` nếu tạo mới). Client không đổi được.
2. **Trường chia sẻ** `sharedWithEmails`, `sharedWithRoles`, `isPublic`: chỉ chủ sở hữu hoặc admin được đổi; người khác gửi lên → giữ giá trị cũ. `sharedWithRoles` chỉ nhận `'sales' | 'admin'`.
3. **Trường giá** — danh sách `PRICE_LOCKED_FIELDS`:
   `canopyUnitCostVnd, transportCostVnd, installCostVndPerKwp`
   - Nếu người gọi là **sales**: giá trị được ghi đè bằng giá trị đang lưu; nếu dự án mới → bằng **giá trị mặc định** (Phần 1: hằng số `DEFAULT_PRICING` gom từ code hiện tại — `marginPct 18`, `discountPct 0`, `canopyUnitCostVnd 450000`, `transportCostVnd 3500000`, `installCostVndPerKwp 550000`; Phần 2 chuyển sang cài đặt do admin quản lý).
   - Ghi log `console.warn` khi phát hiện sales gửi giá trị khác (để phát hiện client lỗi/cố tình).
   - Không trả lỗi (client tự lưu cả object dự án sau mỗi thay đổi; trả lỗi sẽ làm hỏng auto-save).
4. **Margin & chiết khấu** (mọi vai trò): server kẹp `marginPct` trong `[0, 60]`, `discountPct` trong `[0, 30]` — đúng giới hạn slider hiện có ở `Step5QuotationBOM.tsx:77-83`, để không lưu được giá trị vô lý qua API. Price Guard giữ nguyên trên giao diện.
5. **`bomLines`, `financial`**: vẫn nhận từ client (giới hạn đã biết — mục 11).

Gom các quy tắc này vào một hàm thuần `sanitizeProjectWrite(existing, incoming, user, defaults)` để kiểm thử độc lập.

### 7.4. Mã lỗi thống nhất

| HTTP | `error` | Khi nào | Client xử lý |
|---|---|---|---|
| 401 | `UNAUTHENTICATED` | Không/hết session | Xóa trạng thái user, mở hộp đăng nhập |
| 403 | `FORBIDDEN` | Sai vai trò / không có quyền với dự án | Toast "Bạn không có quyền…" |
| 403 | `EMAIL_NOT_VERIFIED` | Đăng nhập tài khoản chưa OTP | Giữ luồng OTP hiện có |
| 409 | `LAST_ADMIN` / `SELF_ACTION` | Hạ/xóa admin cuối, tự hạ/xóa mình | Thông báo cụ thể |
| 415 | `JSON_REQUIRED` | Mutation không phải JSON | (lỗi lập trình) |
| 429 | `TOO_MANY_ATTEMPTS` | Đăng nhập sai quá ngưỡng | Thông báo thời gian chờ |

---

## 8. Thay đổi phía client

| Vị trí | Thay đổi |
|---|---|
| `src/types/user.ts` | `UserRole = 'admin' \| 'sales'`; thêm `mustChangePassword?: boolean` vào kết quả đăng nhập |
| `src/types/solar.ts:256` | `sharedWithRoles?: ('sales' \| 'admin')[]` |
| `src/services/authApi.ts` | Bỏ lưu user làm "bằng chứng đăng nhập". Thêm `fetchMe()`, `logout()`, `changePassword()`. Có thể giữ bản cache hồ sơ chỉ để hiển thị nhanh, nhưng **nguồn sự thật là `/api/auth/me`** |
| `src/services/api.ts` | Bỏ `getAuthHeaders` với `x-user-*`; dùng `credentials: 'same-origin'`; gặp `401` → phát sự kiện `auth:expired` |
| `App.tsx` | Khởi động: gọi `fetchMe()` (hiện spinner) → có user thì nạp dự án, `401` thì mở `AuthModal`. `userRole` **suy ra từ `currentUser.role`**, bỏ state `useState('ky_su')` và `setUserRole`. Chặn `activeView === 'admin'` nếu không phải admin. Lắng nghe `auth:expired`. Đăng xuất gọi `logout()` rồi xóa cache dự án cục bộ |
| `Header.tsx` | Xóa menu "Chuyển vai trò thử nghiệm" (desktop & mobile), chỉ hiển thị nhãn vai trò. Nút Admin chỉ hiện với admin |
| `AuthModal.tsx` | Xử lý `429`; sau login/verify nếu `mustChangePassword` → mở `ChangePasswordModal` bắt buộc (không đóng được) |
| `ChangePasswordModal.tsx` (mới) | Mật khẩu hiện tại, mới, nhập lại; tối thiểu 8 ký tự; truy cập thêm từ menu tài khoản |
| `Step4TechnicalResults.tsx:41` | `detailMode` mặc định `true` cho admin, `false` cho sales (sales vẫn bật xem được) |
| `Step5QuotationBOM.tsx` | Với sales: các ô đơn giá/chi phí (canopy/m², vận chuyển, nhân công/kWp) → **chỉ đọc**; margin, chiết khấu, Price Guard, chế độ Nội bộ, xuất CSV ERP, bật/tắt hạng mục, in/xuất báo giá **giữ nguyên như hiện tại**. Prop `userRole` đổi kiểu |
| `ProjectList.tsx` | Chia sẻ theo nhóm: chỉ còn lựa chọn `sales` |
| `AdminUsers.tsx` (mới) + tab trong trang Admin | Bảng: họ tên, email, vai trò, đã xác thực, ngày tạo. Đổi vai trò (select), xóa (xác nhận). Hiển thị lỗi `LAST_ADMIN`/`SELF_ACTION` |


### 8.1. Dọn nghiệp vụ giá: gỡ SCADA, hồ sơ EVN và VAT

Làm đầu tiên trong Phần 1 vì giảm số trường phải khóa giá.

#### 8.1.1. Gỡ SCADA và hồ sơ EVN

Hai hạng mục tùy chọn này không dùng đến; gỡ hẳn khỏi code:

| Vị trí | Gỡ |
|---|---|
| `src/types/solar.ts:103` | Nhóm vật tư `X — Hệ thống Scada` khỏi danh sách nhóm và khỏi `MaterialCategoryCode` |
| `src/types/solar.ts:307-308, 312-313` | Trường `includeEvnDocs`, `evnDocsCostVnd`, `includeScada`, `scadaCostVnd` của `Project` |
| `src/engine/bom.ts:31-37, 1198-1241` | Tham số tương ứng của `GenerateBomParams` và 2 dòng BOM `bom-evn-docs`, `bom-scada-logger` |
| `src/App.tsx:90-92, 139-140, 405-411, 476-482` | Giá trị mặc định dự án mới, điều kiện tính lại, tham số truyền vào `generateProjectBom` |
| `src/components/wizard/Step5QuotationBOM.tsx:400-495` | Hai khối bật/tắt + ô đơn giá EVN và SCADA |
| `src/components/admin/AdminCatalog.tsx:472-480, 560, 575` | Nhãn đặc biệt cho `scada-logger`/`s-testing-evn`, nhóm `X` trong form thêm vật tư; nhãn nhóm `VIII` bỏ chữ "Hồ sơ EVN" |
| `src/data/catalog.ts` | 8 vật tư nhóm `X` (`scada-*`) và `s-testing-evn` |
| `src/types/solar.ts:102` | Mô tả nhóm `VIII` bỏ "kiểm định thí nghiệm, hồ sơ EVN" |

**Dữ liệu cũ:**
- Dự án đã lưu có dòng `bom-evn-docs` / `bom-scada-logger`: **giữ nguyên** trong ảnh chụp BOM (báo giá đã gửi không bị đổi); lần tính lại kế tiếp các dòng này tự biến mất. Các trường `includeEvnDocs`/`includeScada`… còn trong JSON dự án được bỏ qua (server loại khỏi dữ liệu khi lưu).
- `upgradeProjectIfNeeded` không được coi sự thiếu vắng các trường này là "dự án cũ cần nâng cấp".
- Bảng giá cục bộ trong localStorage có vật tư nhóm `X`: bỏ qua khi hiển thị (Phần 2 bỏ hẳn localStorage).
- `docs/TAI_LIEU_NGHIEP_VU_VA_CONG_THUC_TINH_TOAN.md` Phần 4, mục D.3 ("Chi phí hồ sơ thỏa thuận đấu nối & thủ tục điện lực EVN"): xóa dòng này để tài liệu khớp với tool.

#### 8.1.2. Bỏ VAT khỏi tính toán

**Quyết định:** đơn giá thiết bị/vật tư trong catalog **đã bao gồm VAT**. Tool không cộng VAT nữa: `Tổng thanh toán = Tổng giá bán − Chiết khấu`. Hiện tại code đang lệch nhau: luồng chính dùng `vatPct: 0`, luồng nâng cấp dự án dùng `10`, file xuất CSV cộng cứng `× 0.1` → cùng một dự án có thể ra hai tổng tiền khác nhau.

| Vị trí | Thay đổi |
|---|---|
| `src/engine/financial.ts:9, 20, 30-31, 116-128` | Bỏ tham số `vatPct` và `vatVnd`; `grandTotalVnd = subtotalAfterDiscount`. Gộp `investmentRatePreVatVndPerKwp` / `investmentRatePostVatVndPerKwp` thành `investmentRateVndPerKwp` |
| `src/types/solar.ts:216-221` | `FinancialResult`: bỏ `vatVnd`, đổi 2 trường suất đầu tư thành `investmentRateVndPerKwp`. Giữ 2 trường cũ dạng tùy chọn `@deprecated` chỉ để đọc dự án cũ |
| `src/App.tsx:103, 149, 193, 493` | Bỏ `vatPct` khi gọi `calculateFinancials` và trong điều kiện nâng cấp dự án |
| `src/engine/bom.ts:1404-1441, 1561-1570` | File xuất CSV: bỏ dòng "Thuế VAT (10%)", "chưa VAT", "đã gồm VAT 10%"; chỉ còn "Tổng cộng thanh toán (đơn giá đã bao gồm VAT)" và một dòng suất đầu tư/kWp |
| `Step5QuotationBOM.tsx:86-99, 295-316, 518-525` | Bỏ dòng VAT và suất đầu tư "trước/sau VAT"; thêm ghi chú "Đơn giá đã bao gồm VAT" dưới tổng tiền |
| `DetailedBomPrint.tsx:27-28, 242-287` | Như trên cho bản in BOM |
| `CustomerValueProposalPrint.tsx:47-49, 253-255, 504-560` | Như trên cho hồ sơ giá trị khách hàng |
| `QuickProposalModal.tsx:108, 332-356` | Bỏ `vatPct` và dòng VAT |
| `ProjectList.tsx:322` | Nhãn "Gồm VAT" → "Đã gồm VAT" (giữ, vì đúng nghĩa) |
| `AdminCatalog.tsx:136` | Tiêu đề cột giá xuất CSV ghi rõ "(đã gồm VAT)" |
| `SystemTechnicalDocModal.tsx:612-652, 800-802` | Phần 5.1 công thức: bỏ bước VAT, ghi "đơn giá đã bao gồm VAT" |
| `docs/TAI_LIEU_NGHIEP_VU_VA_CONG_THUC_TINH_TOAN.md` mục 5.1.4 | Sửa tương ứng để tài liệu khớp với tool |

**Không đổi:** `src/data/tariffs.ts:7` (`vatPct: 10`) là VAT của **biểu giá điện EVN** dùng để tính tiền điện tiết kiệm cho khách — khác nghĩa, giữ nguyên.

**Dự án cũ:** `financial` của dự án đã lưu có `vatVnd > 0` (tạo qua luồng nâng cấp với VAT 10%) là cộng VAT **hai lần** lên giá đã gồm VAT. Khi mở dự án như vậy, chỉ **tính lại `financial`** từ `bomLines` đã lưu (đơn giá và số lượng giữ nguyên) và lưu lại; hiện toast "Đã bỏ VAT cộng thêm khỏi tổng tiền (đơn giá đã gồm VAT)". Hiển thị dự án cũ chưa tính lại: đọc `investmentRateVndPerKwp ?? investmentRatePostVatVndPerKwp`.

---

## 9. Cấu trúc mã server (cải tiến có mục tiêu)

`server.ts` (~1000 dòng) đang gộp email, DB, auth, dự án, phục vụ static — không kiểm thử được vì `startServer()` chạy ngay khi import. Tách thành:

```
server.ts                 # entry: gọi createApp() + listen (giữ nguyên lệnh build esbuild)
server/
  app.ts                  # createApp({ store }) → express app (không listen)
  db.ts                   # pool, initDatabase, migrations, chế độ file JSON
  mail.ts                 # nodemailer + gửi OTP
  auth/
    password.ts           # hashPassword, verifyPassword, isHashed
    sessions.ts           # create/lookup/touch/revoke session
    middleware.ts         # loadSession, requireAuth, requireRole, requireJson
    rateLimit.ts          # bộ đếm đăng nhập sai
    routes.ts             # /api/auth/*
  users/routes.ts         # /api/auth/users*
  projects/
    sanitize.ts           # sanitizeProjectWrite (hàm thuần)
    routes.ts             # /api/projects*
```

`DATA_DIR` đọc từ env (mặc định `data_storage`) để test dùng thư mục tạm.

---

## 10. Kiểm thử

Repo chưa có test. Dùng **`node:test` chạy qua `tsx --test`** (đã có `tsx`, không thêm dependency). Thêm script `"test": "tsx --test server/**/*.test.ts"`.

**Unit**
- `password.test.ts`: hash/verify đúng, sai; định dạng; `isHashed`.
- `sanitize.test.ts`: sales không đổi được từng trường trong `PRICE_LOCKED_FIELDS`; admin đổi được; không ai đổi được `createdByEmail`; người được chia sẻ không đổi được trường chia sẻ; dự án mới của sales nhận giá trị mặc định; sales gửi `marginPct: 25`, `discountPct: 3.5` → lưu đúng; ai gửi `marginPct: 90` / `discountPct: 50` → kẹp về `60` / `30`; sales gửi `transportCostVnd` khác → giữ giá trị cũ.
- `financial.test.ts`: không còn VAT — `grandTotalVnd = tổng bán − chiết khấu`; suất đầu tư/kWp đúng.
- `rateLimit.test.ts`: 5 lần sai → khóa; đúng → reset.

**Tích hợp** (createApp ở chế độ file JSON, `DATA_DIR` tạm, cổng ngẫu nhiên, dùng `fetch` có giữ cookie):
- Không cookie → `401` ở `/api/projects`, `/api/auth/users`.
- Gửi `x-user-role: admin` không cookie → vẫn `401`.
- Sales gọi `PUT /api/auth/users/:id/role` → `403`.
- Admin hạ chính mình / admin cuối → `409`.
- Sales A không đọc/sửa/xóa được dự án của sales B (không chia sẻ) → `403`; được chia sẻ → đọc/sửa được, không xóa được.
- Sales `PUT` dự án với `marginPct: 50` → lưu xong vẫn giá trị cũ.
- Đăng xuất → cookie cũ trả `401`.
- Admin đổi vai trò user → session của user đó bị hủy.
- Khởi động với `users.json` có mật khẩu plaintext → sau init là `scrypt$…`, đăng nhập bằng mật khẩu cũ vẫn được, `ky_su` → `sales`.

**Thủ công trên giao diện**: đăng nhập sales → không thấy nút Admin, không có menu chuyển vai trò, bước 5 các ô đơn giá/chi phí bị khóa, margin & chiết khấu vẫn kéo được, Price Guard vẫn hiện khi lợi nhuận gộp < 15%; đăng nhập admin lần đầu → bắt buộc đổi mật khẩu. Bước 5 không còn mục hồ sơ EVN/SCADA; mở một dự án cũ có 2 dòng này → báo giá vẫn hiển thị nguyên, đổi một thông số → 2 dòng biến mất. Tổng tiền ở Step 5, bản in BOM, hồ sơ giá trị, báo giá nhanh và file CSV **bằng nhau** và không còn dòng VAT; mở dự án cũ có `vatVnd > 0` → tổng tiền giảm đúng phần VAT cộng thêm.

---

## 11. Triển khai & rủi ro

**Thứ tự triển khai**
1. Sao lưu DB (`pg_dump hgc_solar`).
2. Thêm vào `.env` trên VPS: `ADMIN_INITIAL_PASSWORD` (nếu DB mới), giữ `COOKIE_SECURE` mặc định.
3. Deploy. Lần khởi động đầu chạy migration (hash mật khẩu, đổi vai trò, tạo bảng `sessions`).
4. Mọi người **phải đăng nhập lại** (thông báo trước). Admin đăng nhập → đổi mật khẩu.
5. Kiểm tra tab Người dùng: gán đúng ai là admin.

**Rủi ro / giới hạn đã biết**
- **Truy cập qua HTTP** (ví dụ `http://<ip>:3000` do `docker-compose.yml` mở cổng 3000): cookie `Secure` sẽ không được lưu → không đăng nhập được. Giải pháp: luôn dùng HTTPS qua nginx; nếu bắt buộc dùng HTTP nội bộ thì đặt `COOKIE_SECURE=false`.
- **`bomLines` vẫn do client gửi**: người rành kỹ thuật có thể sửa BOM qua API. Phần 1 khóa các đơn giá cấp dự án; toàn vẹn BOM tuyệt đối cần server tự tính (Phần 2, mục 10 — đang hoãn). Chấp nhận rủi ro này ở thời điểm hiện tại.
- Session ở chế độ file JSON mất khi restart.
- Rate limit trong bộ nhớ, không chia sẻ nếu chạy nhiều tiến trình (hiện chạy 1 tiến trình pm2).

---

## 12. Quyết định đã chốt

**Đã chốt (2026-10-07):**
- Sales được bật/tắt hạng mục tùy chọn.
- Sales chỉnh margin (0–60%) và chiết khấu (0–30%) như hiện tại, Price Guard chỉ cảnh báo.
- Sales được xem đầy đủ, kể cả chế độ Nội bộ và CSV ERP.
- Sales không sửa đơn giá/chi phí cấp dự án và giá thiết bị/vật tư; được "Cập nhật theo giá mới" (Phần 2).
- Bỏ VAT (đơn giá đã gồm VAT); bỏ SCADA và hồ sơ EVN.
- Session 7 ngày trượt.

Không còn điểm mở.
