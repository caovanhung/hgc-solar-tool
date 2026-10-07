# Phần 2 — Catalog thiết bị & vật tư trên server (PostgreSQL)

- **Ngày:** 2026-10-07
- **Trạng thái:** Bản nháp chờ duyệt
- **Phụ thuộc:** [Phần 1 — Xác thực & Phân quyền](./2026-10-07-auth-roles-design.md) (cần `req.user`, `requireRole('admin')`, cấu trúc `server/`).
- **Chia giai đoạn:** **2a** (catalog trên server, cài đặt giá, lịch sử, báo lệch giá) là phần chính, giao được độc lập. **2b** (server tự tính BOM) — **hoãn, chưa làm** (đã chốt 2026-10-07); giữ mô tả ở mục 10 để tham khảo khi cần.

---

## 1. Mục tiêu

1. **Một bảng giá duy nhất cho cả công ty**, lưu trong PostgreSQL. Mọi người dùng thấy cùng một giá.
2. **Chỉ admin** thêm/sửa/ngừng dùng vật tư, tấm pin, inverter và cài đặt giá mặc định. Sales chỉ đọc.
3. **Có nhật ký thay đổi**: ai sửa, sửa gì (cũ → mới), lúc nào; xem theo từng vật tư.
4. **Báo giá đã lưu giữ nguyên giá lúc tạo.** Khi catalog đổi giá, mở dự án sẽ thấy cảnh báo "giá đã thay đổi" kèm nút "Cập nhật theo giá mới".
5. Không còn trường hợp vật tư mới thêm không xuất hiện, hoặc BOM lặng lẽ dùng giá fallback.

**Thành công khi:** admin đổi giá một vật tư trên máy A thì sales trên máy B tạo dự án mới thấy ngay giá mới; dự án cũ có dùng vật tư đó hiện cảnh báo lệch giá; tab lịch sử ghi lại thay đổi đó.

---

## 2. Hiện trạng (đã kiểm tra trong code)

| # | Vấn đề | Vị trí |
|---|---|---|
| C1 | Dữ liệu gốc gán cứng trong code: `INITIAL_PANELS`, `INITIAL_INVERTERS`, `INITIAL_MATERIALS` (98 vật tư, SKU không trùng; còn 89 sau khi Phần 1 gỡ SCADA/EVN). `excel_data.json` không được code nào đọc. | `src/data/catalog.ts:7, 124, 1784` |
| C2 | Vật tư khi chạy lấy từ `localStorage['hgc_materials_catalog_excel_v1']`, nếu trống mới dùng `INITIAL_MATERIALS`. Mỗi trình duyệt một bảng giá. Sửa `catalog.ts` không tới được trình duyệt đã lưu bảng giá. | `App.tsx:310-330` |
| C3 | Tấm pin và inverter chỉ là `useState`; sửa ở Admin mất khi tải lại trang. | `App.tsx:308-309` |
| C4 | Hai chỗ bỏ qua giá admin, dùng thẳng `INITIAL_MATERIALS` / `INITIAL_PANELS` / `INITIAL_INVERTERS`. | `App.tsx:150-180` (`upgradeProjectIfNeeded`), `QuickProposalModal.tsx:98` |
| C5 | `findMat` khớp theo id, SKU **hoặc tên có chứa key**; không thấy thì lặng lẽ dùng giá fallback gán cứng; `brand` luôn lấy fallback. | `bom.ts:81-100` |
| C6 | Import CSV: tách cột bằng `split(',')` (sai khi tên/spec có dấu phẩy), chỉ cập nhật vật tư đã có, bỏ qua dòng mới, không báo kết quả. | `AdminCatalog.tsx:143-180` |
| C7 | Margin mặc định, đơn giá vận chuyển/canopy/nhân công là hằng số rải rác; điện giá `2850` gán cứng khi nâng cấp dự án. (Sự lệch VAT `0`/`10` được xử lý ở Phần 1, mục 8.1.2.) | `App.tsx:180-195`, `Step5QuotationBOM.tsx:371, 456`, `bom.ts:1131` |
| C8 | `BomLine` không lưu id vật tư catalog, dự án không lưu phiên bản catalog → không phát hiện được lệch giá. | `src/types/solar.ts:192-210` |

---

## 3. Phạm vi

**2a — trong phạm vi**
- Bảng `catalog_items`, `catalog_changes`, `pricing_settings` + seed từ `catalog.ts`.
- API đọc (mọi người đã đăng nhập) và API ghi (admin), import CSV có xem trước, lịch sử.
- Client nạp catalog từ server; bỏ localStorage làm nguồn bảng giá; trang Admin ghi lên server.
- `findMat` khớp chặt + cảnh báo vật tư thiếu.
- `materialId` trên dòng BOM, `catalogVersion` trên dự án, phát hiện lệch giá và cập nhật theo giá mới.
- Cài đặt giá mặc định do admin quản lý (thay hằng số rải rác).

**2b — hoãn (chưa làm)**
- Tách luồng tính dự án khỏi `App.tsx` thành hàm thuần dùng chung client/server.
- Server tự tính `bomLines`/`financial` khi sales lưu dự án.

**Ngoài phạm vi**
- Ẩn giá vốn với sales (sales được xem đầy đủ — đã chốt).
- Bảng giá theo khách hàng/khu vực, nhiều bảng giá song song.
- Đồng bộ trực tiếp từ file Excel `BÁO GIÁ SOLAR.xlsx` (vẫn dùng CSV).
- Quản lý tồn kho.

---

## 4. Mô hình dữ liệu

### 4.1. Bảng

```sql
-- Một bảng cho cả 3 loại, dữ liệu chi tiết trong JSONB (giữ nguyên shape TypeScript hiện có)
CREATE TABLE IF NOT EXISTS catalog_items (
  kind        VARCHAR(16)  NOT NULL CHECK (kind IN ('material','panel','inverter')),
  id          VARCHAR(255) NOT NULL,
  sku         VARCHAR(255),                         -- material: bắt buộc; panel/inverter: NULL
  data        JSONB        NOT NULL,                -- MaterialItem | PanelModel | InverterModel
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,   -- "xóa" = ngừng dùng (soft delete)
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_by  VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (kind, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_material_sku
  ON catalog_items (lower(sku)) WHERE kind = 'material';

-- Cài đặt giá mặc định: đúng 1 dòng
CREATE TABLE IF NOT EXISTS pricing_settings (
  id          SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data        JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  VARCHAR(255) NOT NULL DEFAULT ''
);

-- Nhật ký thay đổi: id tăng dần cũng chính là "phiên bản catalog"
CREATE TABLE IF NOT EXISTS catalog_changes (
  id          BIGSERIAL PRIMARY KEY,
  kind        VARCHAR(16)  NOT NULL,               -- material | panel | inverter | settings
  item_id     VARCHAR(255) NOT NULL,               -- 'pricing' cho settings
  action      VARCHAR(16)  NOT NULL CHECK (action IN ('seed','create','update','deactivate','reactivate')),
  before      JSONB,                               -- NULL khi create/seed
  after       JSONB,
  batch_id    UUID,                                -- cùng một lần import CSV
  changed_by  VARCHAR(255) NOT NULL,
  changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_catalog_changes_item ON catalog_changes (kind, item_id, id DESC);
```

**Lý do chọn 1 bảng + JSONB** thay vì 3 bảng nhiều cột:
- Shape TypeScript hiện có (`MaterialItem`, `PanelModel`, `InverterModel`) giữ nguyên, không phải ánh xạ cột.
- Một bộ API, một nhật ký, một cơ chế phiên bản cho cả 3 loại.
- Kiểm tra dữ liệu (validate) thực hiện ở tầng ứng dụng (mục 6), không phụ thuộc DB.

### 4.2. Phiên bản catalog

`catalogVersion = MAX(catalog_changes.id)` (0 nếu chưa có). Mọi thay đổi (kể cả cài đặt giá) đều ghi một dòng `catalog_changes` **trong cùng transaction** với thay đổi dữ liệu, nên phiên bản luôn tăng đúng khi dữ liệu đổi.

### 4.3. Cài đặt giá mặc định (`pricing_settings.data`)

| Khóa | Ý nghĩa | Giá trị seed (lấy từ code hiện tại) |
|---|---|---|
| `defaultMarginPct` | Margin cho dự án mới | `18` |
| `defaultDiscountPct` | Chiết khấu cho dự án mới | `0` |
| `canopyUnitCostVnd` | Đơn giá khung canopy / m² | `450000` |
| `transportCostVnd` | Vận chuyển, cẩu kéo | `3500000` |
| `installCostVndPerKwp` | Nhân công lắp đặt / kWp | `550000` (`bom.ts:1131`) |

Không có VAT: đơn giá trong catalog đã bao gồm VAT (Phần 1, mục 8.1.2). Margin và chiết khấu trên từng dự án vẫn do người lập báo giá (admin hoặc sales) chỉnh trong giới hạn 0–60% / 0–30%; đây chỉ là giá trị khởi tạo.

Dự án mới lấy các giá trị này. Theo Phần 1, sales không đổi được các trường này trên dự án; giá trị mặc định khi sales tạo dự án lấy từ đây thay cho hằng số trong code.

### 4.4. Thay đổi kiểu dữ liệu phía client

```ts
// src/types/solar.ts
interface MaterialItem { /* giữ nguyên */ brand?: string; origin?: string; isActive?: boolean; updatedAt?: string; updatedBy?: string; }
interface PanelModel    { /* giữ nguyên */ isActive?: boolean; updatedAt?: string; updatedBy?: string; }
interface InverterModel { /* giữ nguyên */ isActive?: boolean; updatedAt?: string; updatedBy?: string; }

interface BomLine { /* giữ nguyên */ materialId?: string; materialKind?: 'material' | 'panel' | 'inverter'; }
interface Project { /* giữ nguyên */ catalogVersion?: number; }

interface CatalogSnapshot {
  version: number;
  materials: MaterialItem[];
  panels: PanelModel[];
  inverters: InverterModel[];
  pricing: PricingSettings;
}
```

---

## 5. Seed & chuyển đổi dữ liệu

1. Khi khởi động, nếu `catalog_items` **trống**: chèn toàn bộ `INITIAL_MATERIALS`, `INITIAL_PANELS`, `INITIAL_INVERTERS` (giữ thứ tự → `sort_order`), chèn `pricing_settings` theo bảng 4.3, ghi `catalog_changes` với `action='seed'`, `changed_by='system'`. Chạy trong 1 transaction.
2. Khi catalog đã có dữ liệu, **không bao giờ** ghi đè từ `catalog.ts`. Từ thời điểm này `catalog.ts` chỉ là dữ liệu seed cho môi trường mới; thêm comment đầu file ghi rõ điều đó.
3. Server import `src/data/catalog.ts` trực tiếp (esbuild đã bundle `server.ts`, không cần bước build riêng).
4. **Bảng giá cục bộ cũ** (`localStorage['hgc_materials_catalog_excel_v1']`): xem mục 8.4.
5. **Dự án đã lưu**: không chạm vào dữ liệu. Dự án chưa có `catalogVersion` được coi là "phiên bản không rõ" (mục 9).
6. **Chế độ file JSON dự phòng** (không có `DATABASE_URL`): lưu `data_storage/catalog.json` (items + settings + changes), dùng cùng hàm nghiệp vụ; ghi file kiểu atomic (ghi file tạm rồi rename).

---

## 6. Quy tắc kiểm tra dữ liệu

Viết thành hàm thuần `validateCatalogItem(kind, data)` trả danh sách lỗi theo trường, dùng chung cho tạo/sửa/import.

| Loại | Bắt buộc | Ràng buộc |
|---|---|---|
| material | `id`, `name`, `sku`, `unit`, `costVnd`, `categoryCode` | `costVnd` là số nguyên ≥ 0; `categoryCode` thuộc `I, II, IV, V, VI, VII, VIII` (nhóm `X` đã gỡ ở Phần 1); `sku` không trùng (không phân biệt hoa thường) |
| panel | `id`, `brand`, `model`, `wp`, `voc`, `vmpp`, `isc`, `impp`, `lengthMm`, `widthMm`, `priceHintVnd` | số > 0; `vmpp < voc`; `impp < isc` |
| inverter | `id`, `brand`, `model`, `type`, `phases`, `acKw`, `vdcMax`, `mpptCount`, `mpptVmin`, `mpptVmax`, `priceHintVnd` | `type ∈ on_grid/hybrid/off_grid`; `phases ∈ '1','3'`; `mpptVmin < mpptVmax ≤ vdcMax` |
| settings | tất cả khóa ở 4.3 | phần trăm trong `[0, 100]`; tiền ≥ 0 |

- `id` gồm chữ thường, số, `-`, `.`; không đổi được sau khi tạo (là khóa tham chiếu từ BOM).
- Trường lạ trong `data` bị loại bỏ (không lưu rác vào JSONB).

---

## 7. API

Tất cả nằm dưới `server/catalog/`. Mọi endpoint yêu cầu đăng nhập; endpoint ghi yêu cầu admin.

| Endpoint | Quyền | Mô tả |
|---|---|---|
| `GET /api/catalog` | đã đăng nhập | Trả `CatalogSnapshot` (chỉ mục đang dùng). Header `ETag: "v<version>"`; client gửi `If-None-Match` → `304` nếu không đổi. Admin thêm `?includeInactive=1` để thấy cả mục đã ngừng. |
| `GET /api/catalog/version` | đã đăng nhập | `{ version }` — rẻ, dùng để kiểm tra định kỳ. |
| `POST /api/catalog/:kind` | admin | Tạo mục mới. Body = `data`. `409 DUPLICATE_ID / DUPLICATE_SKU`. |
| `PUT /api/catalog/:kind/:id` | admin | Sửa. Body `{ data, expectedUpdatedAt }`. Nếu `updated_at` hiện tại khác `expectedUpdatedAt` → `409 STALE` (kèm bản mới nhất) để tránh hai admin ghi đè nhau. |
| `POST /api/catalog/:kind/:id/deactivate` | admin | Ngừng dùng (không xóa cứng — BOM cũ và lịch sử vẫn tra được). |
| `POST /api/catalog/:kind/:id/reactivate` | admin | Dùng lại. |
| `PUT /api/catalog/settings` | admin | Sửa cài đặt giá; cùng cơ chế `expectedUpdatedAt`. |
| `POST /api/catalog/import?dryRun=1` | admin | Body `{ kind: 'material', rows: [...] }` → trả bản xem trước: `{ create[], update[{id, changes}], unchanged, errors[{row, field, message}] }`. Không ghi gì. |
| `POST /api/catalog/import` | admin | Như trên nhưng ghi. **Tất cả hoặc không** (1 transaction, 1 `batch_id`). Có lỗi bất kỳ → `422`, không ghi dòng nào. |
| `GET /api/catalog/changes?kind=&itemId=&limit=50&before=` | admin | Lịch sử, mới nhất trước, phân trang theo `id`. |

- Mỗi lần ghi trả về `{ item, version }` để client cập nhật state mà không tải lại toàn bộ.
- Mọi lần ghi: `updated_by = req.user.email`, ghi `catalog_changes` cùng transaction.
- `PUT` mà dữ liệu không đổi → không ghi, không tăng phiên bản.

---

## 8. Phía client

### 8.1. Nạp catalog

- `src/services/catalogApi.ts` (mới): `fetchCatalog(etag?)`, `fetchCatalogVersion()`, các hàm ghi/import/lịch sử cho admin.
- `src/state/CatalogContext.tsx` (mới): sau khi đăng nhập, nạp `CatalogSnapshot` → cung cấp `materials`, `panels`, `inverters`, `pricing`, `version` cho toàn app. Thay `useState(INITIAL_…)` ở `App.tsx:308-330`.
- **Cache đọc**: lưu snapshot cuối vào `localStorage['hgc_catalog_cache_v2']` chỉ để mở app nhanh/khi mất mạng. Cache **không bao giờ** là nơi sửa giá.
- **Khi không tải được catalog**: dùng cache + banner vàng "Đang dùng bảng giá lưu tạm lúc HH:mm dd/MM — có thể chưa cập nhật". Không có cache → banner đỏ, chặn tạo dự án mới (không để báo giá ra với giá seed cũ).
- **Kiểm tra cập nhật**: khi cửa sổ được focus lại và mỗi 5 phút gọi `/api/catalog/version`; khác phiên bản → tải lại (dùng ETag).

### 8.2. Thay các chỗ dùng dữ liệu gán cứng

| Vị trí | Thay bằng |
|---|---|
| `App.tsx:37` (`INITIAL_PANELS[0]` cho dự án mặc định) | `catalog.panels[0]` |
| `App.tsx:63, 86` | `catalog.inverters`, `catalog.materials` |
| `App.tsx:147-200` `upgradeProjectIfNeeded` | Nhận `catalog` làm tham số; chạy **sau** khi catalog đã nạp (hiện đang chạy trong `useState` khởi tạo, trước khi có catalog). Điện giá lấy theo biểu giá của dự án (`getEffectiveTariffVnd`) thay vì `2850`. |
| `QuickProposalModal.tsx:3, 98` | Lấy từ `CatalogContext` |
| Giá trị mặc định dự án mới (`marginPct`, `discountPct`, các `*CostVnd`) | `pricing.*` |
| Hằng số `DEFAULT_PRICING` của Phần 1 (server & client) | `pricing.*` |
| `Step5QuotationBOM.tsx:371, 456` và `bom.ts:1131` — các giá trị fallback `450000`, `3500000`, `550000` | `pricing.*` |

### 8.3. `findMat` và cảnh báo vật tư thiếu (`bom.ts`)

- Chỉ khớp theo `id`, sau đó `sku` (không phân biệt hoa thường). **Bỏ khớp theo tên**.
- Lấy `brand`, `origin` từ catalog nếu có.
- Không tìm thấy → vẫn dùng fallback để không chặn người dùng, **nhưng** trả kèm cảnh báo: `generateProjectBom` trả `{ lines, warnings: [{ key, message }] }`; Step 5 hiển thị "Thiếu N vật tư trong catalog: … (đang dùng giá tạm)" — admin thấy kèm link sang trang Admin.
- Mỗi dòng BOM ghi `materialId` (id catalog đã khớp) và `materialKind`.
- *Lưu ý:* thay đổi này chồng lên phần sửa công thức BOM (rail 4.2m, tủ điện theo dải, tiết diện cáp) bạn đang tự làm trong `bom.ts`; nên làm phần công thức trước, rồi mới đổi `findMat`.

### 8.4. Bảng giá cục bộ cũ

Khi khởi động, nếu `localStorage['hgc_materials_catalog_excel_v1']` tồn tại:
- **Admin**: banner "Trình duyệt này có bảng giá cục bộ cũ khác với server" + nút **Xuất CSV** (để đối chiếu/nhập lại qua luồng import có xem trước) + nút **Bỏ qua & xóa**.
- **Sales**: xóa luôn (bảng giá của họ không còn được dùng).

### 8.5. Trang Admin (`AdminCatalog.tsx`)

- 4 tab: **Vật tư**, **Tấm pin**, **Inverter**, **Cài đặt giá** (+ tab **Người dùng** từ Phần 1).
- Thêm/sửa gọi API, hiển thị lỗi theo trường từ server, trạng thái đang lưu; `409 STALE` → hộp thoại "Mục này vừa được người khác sửa" hiện bản mới nhất, cho tải lại.
- "Xóa" đổi thành **Ngừng dùng / Dùng lại**; có bộ lọc "Hiện cả mục đã ngừng".
- Nút **Lịch sử** trên mỗi dòng → ngăn bên phải liệt kê thay đổi: thời gian, người sửa, trường đổi (cũ → mới, tiền định dạng VNĐ). Tab "Lịch sử chung" xem toàn bộ, lọc theo loại.
- **Import CSV** (vật tư):
  1. Chọn file → parse **đúng chuẩn CSV** (xử lý ngoặc kép, dấu phẩy và xuống dòng trong ô, BOM UTF-8) bằng hàm `parseCsv` tự viết, có test.
  2. Giữ định dạng cột của nút Export hiện tại (8 cột), thêm 3 cột tùy chọn ở cuối: `Thương hiệu`, `Xuất xứ`, `Đang dùng (1/0)`.
  3. Gọi `dryRun` → hiện bảng xem trước: **Thêm mới / Cập nhật (cũ → mới) / Không đổi / Lỗi**.
  4. Có lỗi → không cho xác nhận. Không lỗi → **Xác nhận nhập** → ghi; toast "Đã thêm X, cập nhật Y".
  - Dòng có `id` mới → tạo mới (khác hành vi hiện tại là bỏ qua).
  - Vật tư không có trong file → **không** bị đụng tới (import không xóa ngầm).
- Bỏ `onUpdatePanels`, `onUpdateInverters`, `onUpdateMaterials` dạng "thay cả mảng"; bỏ nút xuất JSON toàn bộ (hoặc giữ làm sao lưu, chỉ đọc).
- Sales không vào được trang này (Phần 1); thêm kiểm tra phía server là đủ.

---

## 9. Giữ giá cũ & báo lệch giá

**Nguyên tắc:** `bomLines` đã lưu là ảnh chụp giá tại thời điểm tính. Không tự động đổi.

**Ghi phiên bản**: mỗi khi BOM được tính lại (đổi thông số wizard hoặc bấm cập nhật giá), ghi `project.catalogVersion = catalog.version`.

**Phát hiện lệch** (hàm thuần `detectPriceDrift(project, catalog)`), chạy khi mở dự án và khi catalog đổi phiên bản:
1. `project.catalogVersion === catalog.version` → không lệch.
2. Ngược lại, với mỗi dòng BOM có `materialId`: so `unitCostVnd` với giá hiện tại của mục đó; mục đã **ngừng dùng** hoặc **không còn** cũng tính là lệch.
3. Dòng cũ không có `materialId` (dự án tạo trước Phần 2): khớp theo `sku`; không khớp được → bỏ qua.
4. Kết quả: `{ changedLines: [{ lineId, name, oldCost, newCost }], inactiveLines: [...], totalDeltaSellVnd }`.

**Giao diện** (Step 5 và khi mở dự án):
- Banner: "Giá catalog đã thay đổi kể từ khi lập báo giá này: N vật tư, chênh lệch tổng giá bán ±X đ." + **Xem chi tiết** (bảng cũ → mới) + **Cập nhật theo giá mới**.
- **Cập nhật theo giá mới** = tính lại BOM bằng đúng thông số hiện tại của dự án với catalog mới (cùng luồng tính như khi đổi thông số), rồi tính lại `financial`, ghi `catalogVersion`. Hỏi xác nhận trước. Dùng được cho **cả admin và sales** (đã chốt) — sales chỉ áp dụng giá chính thức do admin đặt, **không** sửa được giá thiết bị/vật tư. Margin, chiết khấu, các tùy chọn của dự án giữ nguyên khi cập nhật giá.
- Báo giá in/xuất **luôn** dùng giá đã lưu trong dự án, kèm ngày lập báo giá.

---

## 10. Giai đoạn 2b — Server tự tính BOM (HOÃN)

> **Trạng thái: hoãn, chưa làm** (đã chốt 2026-10-07). Mô tả giữ lại để tham khảo nếu sau này cần đảm bảo BOM không bị sửa qua API (giới hạn nêu ở Phần 1, mục 11).

### 10.1. Tách luồng tính dự án
- Chuyển khối tính trong `App.tsx:374-512` (`handleUpdateProject`) (layout → chọn inverter → cáp/tủ → mounting → BOM → tài chính) thành hàm thuần `computeProject(project, catalog, provinces): ComputedProject` tại `src/engine/computeProject.ts`. Không phụ thuộc React, không gọi API.
- `App.tsx` và `upgradeProjectIfNeeded` gọi chung hàm này (bỏ trùng lặp giữa hai luồng hiện có, vốn đang lệch điện giá).
- Danh sách trường đầu vào (`BOM_INPUT_FIELDS`) dùng chung để biết khi nào phải tính lại — thay cho chuỗi `updates.x !== undefined || …` ở `App.tsx:382-411`.

### 10.2. Server là nguồn sự thật cho BOM của sales
- Khi sales `POST/PUT /api/projects`:
  - Bỏ `bomLines`, `financial`, `layoutResult`, `inverterProposals`, `cableResults`, `distributionBoard`, `mountingResult` do client gửi.
  - Nếu có trường thuộc `BOM_INPUT_FIELDS` thay đổi so với bản đã lưu (hoặc dự án mới) → server chạy `computeProject` với catalog hiện tại → lưu, ghi `catalogVersion`.
  - Không đổi trường đầu vào → giữ nguyên kết quả đã lưu (giữ giá cũ).
- Thêm `POST /api/projects/:id/reprice` (chủ dự án/được chia sẻ/admin) cho nút "Cập nhật theo giá mới".
- Admin vẫn có thể lưu kết quả do client tính (giữ khả năng chỉnh tay của admin).

---

## 11. Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Không tải được catalog | Cache + banner vàng; không cache → banner đỏ, chặn tạo dự án mới (8.1) |
| Vật tư BOM không có trong catalog | Giá tạm + cảnh báo trong Step 5 (8.3) |
| Hai admin sửa cùng mục | `409 STALE` + hộp thoại tải lại (7) |
| Import có dòng lỗi | `422`, không ghi gì, bảng lỗi theo dòng/trường |
| Trùng `id`/`sku` | `409 DUPLICATE_ID` / `DUPLICATE_SKU`, báo ngay ô tương ứng |
| Sales gọi API ghi | `403 FORBIDDEN` (Phần 1) |
| Mục đang dùng trong dự án bị ngừng | Cho phép; dự án cũ hiện cảnh báo ở 9; dự án mới không chọn được mục đó |
| Lỗi DB giữa transaction | Rollback toàn bộ, `500`, không tăng phiên bản |

---

## 12. Kiểm thử

Dùng hạ tầng test của Phần 1 (`tsx --test`, `createApp` với chế độ file JSON + `DATA_DIR` tạm).

**Unit**
- `validateCatalogItem`: từng quy tắc ở mục 6.
- `parseCsv`: ngoặc kép, `""` trong ô, dấu phẩy và xuống dòng trong ô, BOM UTF-8, `\r\n`; vòng tròn Export → Import → không đổi gì.
- `diffImport`: phân loại create/update/unchanged/error đúng.
- `detectPriceDrift`: cùng phiên bản; giá tăng/giảm; mục ngừng dùng; dòng cũ không có `materialId` khớp theo SKU.
- `findMat`: không còn khớp theo tên; trả cảnh báo khi thiếu.
- (2b — hoãn) `computeProject`: cùng đầu vào cho cùng kết quả như luồng `App.tsx` cũ trên 3 dự án mẫu (1P hybrid 10kW, 3P on-grid 20kW, 3P hybrid 15kW) — chụp kết quả trước khi tách để so.

**Tích hợp**
- Khởi động DB trống → seed đủ 89 vật tư (không có nhóm `X`, không có `s-testing-evn`) + tấm pin + inverter, `version > 0`, có dòng `seed` trong lịch sử.
- Khởi động lần 2 → không seed lại.
- Sales `GET /api/catalog` → 200; `PUT` → 403.
- Admin `PUT` giá → `version` tăng, `GET` thấy giá mới, lịch sử có `before/after`.
- `PUT` với `expectedUpdatedAt` cũ → 409.
- Import dry-run không thay đổi `version`; import thật có 1 dòng lỗi → không ghi gì.
- ETag: `If-None-Match` đúng phiên bản → 304.
- (2b — hoãn) Sales `PUT` dự án với `bomLines` giả → server bỏ qua, lưu BOM do server tính.

**Thủ công**: kịch bản thành công ở mục 1 trên hai trình duyệt khác nhau.

---

## 13. Triển khai

1. Phần 1 đã chạy ổn định.
2. Trước khi deploy, **admin đang giữ bảng giá cục bộ** xuất CSV từ trang Admin hiện tại (để không mất giá đã chỉnh trên máy mình).
3. Sao lưu DB. Deploy 2a → server seed catalog từ `catalog.ts`.
4. Admin nhập lại CSV đã xuất ở bước 2 qua luồng import có xem trước → kiểm tra phần chênh lệch → xác nhận.
5. Kiểm tra tab Cài đặt giá (margin, chiết khấu mặc định, các chi phí).
6. Thông báo sales tải lại trang.

---

## 14. Quyết định đã chốt

**Đã chốt (2026-10-07):**
- Không dùng VAT (đơn giá đã gồm VAT).
- Sales được "Cập nhật theo giá mới", không sửa giá thiết bị/vật tư.
- Sales chỉnh margin & chiết khấu trên dự án như hiện tại; sales xem được giá vốn.
- Tấm pin & inverter chỉ sửa qua form trên trang Admin (không import CSV).
- Giai đoạn 2b hoãn.

Không còn điểm mở.
