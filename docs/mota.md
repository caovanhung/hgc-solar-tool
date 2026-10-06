# TÀI LIỆU ĐÀO TẠO KỸ THUẬT NỘI BỘ HGC
## CHUYÊN ĐỀ: KHẢO SÁT, THIẾT KẾ, THI CÔNG VÀ VẬN HÀNH HỆ THỐNG ĐIỆN NĂNG LƯỢNG MẶT TRỜI ÁP MÁI (HYBRID & ON-GRID)

---

## MỤC LỤC
1. [Quy trình khảo sát hiện trường (4 bước chuẩn)](#phần-1-quy-trình-khảo-sát-hiện-trường-4-bước-chuẩn)
2. [Thiết kế & Tính toán cấu hình hệ thống](#phần-2-thiết-kế--tính-toán-cấu-hình-hệ-thống)
3. [Lựa chọn thiết bị ngoại vi & Bảng kê vật tư (BOM)](#phần-3-lựa-chọn-thiết-bị-ngoại-vi--bảng-kê-vật-tư-bom)
4. [Hướng dẫn thi công & Tiêu chuẩn kỹ thuật](#phần-4-hướng-dẫn-thi-công--tiêu-chuẩn-kỹ-thuật)
5. [Quy trình đóng điện nghiệm thu (Commissioning)](#phần-5-quy-trình-đóng-điện-nghiệm-thu-commissioning)
6. [Cài đặt Inverter Hybrid & Nền tảng giám sát](#phần-6-cài-đặt-inverter-hybrid--nền-tảng-giám-sát)
7. [Sự cố thường gặp & Phương án xử lý nhanh](#phần-7-sự-cố-thường-gặp--phương-án-xử-lý-nhanh)
8. [Quy trình bảo trì, bảo dưỡng định kỳ (O&M)](#phần-8-quy-trình-bảo-trì-bảo-dưỡng-định-kỳ-om)

---

## PHẦN 1: QUY TRÌNH KHẢO SÁT HIỆN TRƯỜNG (4 BƯỚC CHUẨN)

Mục tiêu cốt lõi của công tác khảo sát: **Đúng – Đủ – Chính xác**, tuyệt đối tránh việc phải đi khảo sát lại nhiều lần và hạn chế tối đa phát sinh chi phí trong quá trình thi công.

### Bước 1: Chuẩn bị trước khi khảo sát
1. **Thu thập dữ liệu ban đầu:**
   * Tọa độ GPS, địa chỉ công trình chính xác.
   * Hóa đơn tiền điện / biểu đồ phụ tải (qua ứng dụng CSKH EVN) tối thiểu 3–12 tháng gần nhất.
   * Hồ sơ thiết kế kiến trúc, bản vẽ kết cấu mái và sơ đồ đơn tuyến tủ điện hiện hữu (nếu có).
2. **Dụng cụ chuyên dụng:**
   * Thước cuộn thép ($7.5\text{ m}$ / $50\text{ m}$), thước đo góc / độ nghiêng điện tử.
   * La bàn xác định hướng mái (la bàn số hoặc GPS).
   * Đồng hồ vạn năng (VOM), ampe kìm đo dòng AC/DC.
   * Flycam (ghi lại hiện trạng mặt bằng từ trên cao, vật cản đổ bóng), thang chữ A / thang rút an toàn.
   * Phiếu khảo sát hiện trường (Survey Checklist) in sẵn và bảng kẹp ghi chú.

### Bước 2: Khảo sát mặt bằng mái & Đổ bóng
1. **Kiểm tra loại mái và kết cấu:**
   * **Mái tôn:**
     * Xác định chủng loại sóng tôn: sóng vuông, sóng tròn, Cliplock hay Seamlock để lựa chọn kẹp chuyên dụng tương ứng.
     * Đo kích thước bước sóng tôn (ví dụ: $100\text{ mm}$, $250\text{ mm}$).
     * Đo khoảng cách các thanh xà gồ (thường $1.0\text{ m} - 1.4\text{ m}$).
     * Đánh giá chất lượng xà gồ (thép hộp mạ kẽm, C-beam hay gỗ), độ ăn mòn và độ rỉ sét của tôn.
   * **Mái ngói:** Kiểm tra phương pháp tháo ngói, kích thước mè, rui để bố trí móc ngói Inox (Tile hook) bắn vào xà gồ.
   * **Mái bê tông cốt thép (BTCT):**
     * Xác định vị trí dầm chịu lực, sàn bê tông.
     * Tính toán phương án cấy bu-lông ngàm dầm $\ge 80\text{ mm}$ hoặc bu-lông hóa chất Hilti/Ramset kèm biện pháp chống thấm chuyên dụng.
2. **Hướng mái và góc nghiêng:**
   * Đo góc nghiêng mái: Góc tối ưu khuyến nghị tại Việt Nam là $10^\circ - 15^\circ$ để tự làm sạch bụi khi trời mưa.
   * Hướng mái: Ưu tiên hướng chính Nam, hoặc chếch Tây Nam / Đông Nam.
3. **Phân tích bóng che (Shading Analysis):**
   * Đo khoảng cách và chiều cao của các vật cản: bồn nước inox, chuồng cu/tum thang, cây cối, nhà cao tầng lân cận.
   * Xác định khoảng lùi an toàn cho giàn pin (ví dụ: bồn nước cao $1.0\text{ m}$ cần cách giàn pin tối thiểu $1.2\text{ m} - 1.5\text{ m}$ về hướng Bắc/Đông Bắc).

### Bước 3: Khảo sát hệ thống điện & Phụ tải
1. **Hạ tầng điện hiện hữu:**
   * Xác định lưới điện: 1 pha ($220\text{ V}$) hay 3 pha ($380\text{ V}$).
   * Kiểm tra thông số CB tổng: dòng định mức $I_n$, dòng cắt ngắn mạch $I_{cu}$.
   * Đo điện áp thực tế tại điểm hòa lưới dự kiến vào các khung giờ.
   * Đo dòng điện tải các pha để đánh giá độ lệch pha (hệ 3 pha).
2. **Phụ tải tiêu thụ & Tải ưu tiên (Backup Load):**
   * Xác định công suất đỉnh ($P_{peak}$) của gia đình/nhà xưởng.
   * Lập danh mục phụ tải ưu tiên cấp điện khi mất lưới (tủ lạnh, camera, wifi, chiếu sáng, máy bơm nước gia đình...) nhằm tính toán công suất ngõ ra Back-up.
   * Kiểm tra hệ thống máy phát điện, ổn áp hiện hữu (nếu có).
3. **Vị trí lắp đặt thiết bị & Tuyến đi dây:**
   * **Vị trí Inverter & Battery:** Chọn nơi khô ráo, thoáng khí, có mái che tránh mưa nắng tạt trực tiếp; không bố trí cạnh phòng ngủ để tránh tiếng ồn; đặt ngang tầm mắt ($1.4\text{ m} - 1.6\text{ m}$) thuận tiện theo dõi.
   * **Vị trí kẹp cảm biến dòng (CT/Meter):** Tuyến cáp tín hiệu CT đi kèm thường $< 5\text{ m}$ (mở rộng tối đa $15\text{ m}$). Nếu tủ điện cách xa Inverter $> 15\text{ m}$, bắt buộc phải lên phương án dùng Smart Meter truyền thông RS485.
   * **Vị trí bãi tiếp địa:** Khảo sát khu vực đất ẩm, gần tủ điện hoặc biến tần để thi công cọc tiếp địa.
   * **Nguồn nước vệ sinh mái:** Vị trí cấp nước, áp lực vòi rửa trên mái.

### Bước 4: Phương án vận chuyển & Biện pháp an toàn
* Mặt bằng tập kết vật tư tạm thời khô ráo, kín gió, không cản trở lối đi.
* Biện pháp đưa thiết bị nặng lên mái (tấm pin nặng $\approx 28 - 32\text{ kg}$, Battery $\approx 120 - 150\text{ kg}$, Inverter $\approx 35 - 45\text{ kg}$): tời điện, thang tải hàng chuyên dụng hoặc xe cẩu tự hành.

---

## PHẦN 2: THIẾT KẾ & TÍNH TOÁN CẤU HÌNH HỆ THỐNG

### 1. Phân loại giải pháp hệ thống
* **Hòa lưới bám tải (On-Grid Zero-Export):** Dành cho phụ tải tiêu thụ chủ yếu vào ban ngày; không phát điện dư thừa lên lưới EVN; tự động dừng khi mất lưới để chống phát điện ngược (*Anti-Islanding*).
* **Hòa lưới có lưu trữ (Hybrid ESS):** Vận hành linh hoạt 24/7; ban ngày cấp tải và sạc đầy pin lưu trữ; ban đêm xả pin nuôi phụ tải; khi mất điện lưới, bộ chuyển mạch ATS tự động chuyển phụ tải ưu tiên sang cổng Back-up/EPS.
* **Hệ độc lập (Off-Grid):** Dành cho khu vực không có lưới điện lưới; phụ thuộc hoàn toàn vào hệ quang điện và pin lưu trữ.

### 2. Ví dụ tính toán cấu hình mẫu (Hộ dân dụng tiêu thụ 1.300 kWh/tháng)
* **Dữ liệu đầu vào:**
  * Hóa đơn tiền điện: $4.600.000\text{ VNĐ/tháng} \rightarrow A_{thang} = 1.300\text{ kWh/tháng}$.
  * Tiêu thụ trung bình ngày: $A_{ngay} = \frac{1300}{30} \approx 43.33\text{ kWh/ngày}$.
  * Cơ cấu phụ tải: 70% Ban ngày ($30.33\text{ kWh}$), 30% Ban đêm ($13.00\text{ kWh}$).
  * Hệ thống điện: 1 pha 220V - 50Hz.
  * Số giờ nắng đỉnh trung bình ($T_{peak}$): $4.0\text{ giờ/ngày}$.

* **Bước 1: Tính toán công suất Inverter ($P_{inv}$)**
  $$P_{inv} = \frac{A_{ngay}}{T_{peak}} = \frac{43.33}{4.0} \approx 10.83\text{ kW}$$
  $\rightarrow$ **Lựa chọn: Inverter Hybrid 1 pha 10 kW** (Ví dụ: SolaX X1-Lite 10.0-LV hoặc GoodWe GW10K-ES-C10).

* **Bước 2: Tính toán công suất giàn pin PV và số lượng tấm**
  * Tỷ số quá công suất DC/AC khuyến nghị: $A = 1.10 - 1.15$.
  * Tổng công suất giàn PV: $P_{DC} = 10\text{ kW} \times 1.116 = 11.16\text{ kWp}$.
  * Chọn tấm pin JA Solar 620Wp Mono Half-cell (*JAM66D45-620/LB*):
    $$\text{Số lượng tấm pin} = \frac{11.160\text{ W}}{620\text{ Wp}} = 18\text{ tấm}$$
  * Diện tích mặt bằng cần thiết: Mỗi tấm $2.382\text{ m} \times 1.134\text{ m} \approx 2.7\text{ m}^2$. Tổng diện tích: $18 \times 2.7 \approx 48.6\text{ m}^2$ (mái $\ge 55\text{ m}^2$ đảm bảo thông thoáng).

* **Bước 3: Ghép chuỗi PV (String Design)**
  * Thông số tấm pin JA 620Wp:
    * $V_{oc} = 48.50\text{ V}$; $V_{mp} = 40.21\text{ V}$; $I_{mp} = 15.42\text{ A}$; $I_{sc} = 16.13\text{ A}$.
  * Thông số Inverter 10 kW:
    * 2 ngõ MPPT độc lập; dải điện áp MPPT: $50\text{ V} - 550\text{ V}$; điện áp tối đa $V_{max} = 600\text{ V}$.
  * Giới hạn an toàn chuỗi: $N_{max} < \frac{600\text{ V}}{48.50\text{ V}} = 12.37\text{ tấm}$.
  * **Phương án đấu nối:** Chia làm **2 chuỗi nối tiếp (mỗi chuỗi 9 tấm)**, đấu vào 2 MPPT riêng biệt:
    * $V_{oc\_string} = 9 \times 48.50\text{ V} = 436.5\text{ V} < 550\text{ V}$ (đạt dải MPPT tối ưu).
    * $V_{mp\_string} = 9 \times 40.21\text{ V} = 361.89\text{ V}$ (rất gần điện áp danh định tối ưu $360\text{ V}$ của Inverter).
    * $I_{mp} = 15.42\text{ A} \le I_{max\_mppt}$ của Inverter.

* **Bước 4: Tính toán dung lượng Pin lưu trữ (Battery)**
  * Nhu cầu năng lượng ban đêm: $A_{dem} = 13\text{ kWh}$.
  * Độ xả sâu DoD khuyến nghị: $90\%$.
  $$C_{battery} = \frac{13\text{ kWh}}{0.90} \approx 14.44\text{ kWh}$$
  $\rightarrow$ **Lựa chọn: Bộ pin Lithium LFP 16 kWh áp thấp (51.2V)** (Ví dụ: Pylontech 16 kWh hoặc Lithium Valley W16-5A 16.076 kWh).

* **Bước 5: Dự báo sản lượng điện phát hàng tháng**
  $$E_{ngay} = P_{DC} \times T_{peak} \times \eta = 11.16\text{ kWp} \times 4.0\text{ h} \times 0.90 = 40.18\text{ kWh/ngày}$$
  $$\rightarrow E_{thang} \approx 40.18 \times 30 \approx 1.205\text{ kWh/tháng}$$
  Hệ thống bù đắp được khoảng 92–95% lượng điện năng tiêu thụ thực tế.

---

## PHẦN 3: LỰA CHỌN THIẾT BỊ NGOẠI VI & BẢNG KÊ VẬT TƯ (BOM)

### 1. Nguyên tắc lựa chọn thiết bị bảo vệ và cáp dẫn

| Vị trí / Thiết bị | Tiêu chí tính toán kỹ thuật | Thông số cấu hình hệ 10 kW (1 Pha) |
| :--- | :--- | :--- |
| **CB AC Hòa lưới** | $I_{CB} \ge 1.25 \times I_{out\_max}$ ($I_{max} = 47.9\text{ A}$) | **MCB/MCCB 2P 63A - 220VAC** |
| **CB AC Back-up** | Tính theo công suất cực đại cổng EPS ($10\text{ kVA}$) | **MCB 2P 63A - 220VAC** |
| **Bộ chuyển nguồn ATS**| Tự động chuyển đổi giữa Lưới và Cổng Back-up | **ATS 2P 63A (hoặc 4P 100A)** |
| **Chống sét lan truyền AC (SPD)**| Type II, điện áp làm việc liên tục $U_c \ge 275\text{ VAC}$ | **SPD AC 2P 275V / 20-40kA** |
| **CB DC chuỗi PV** | $I_{CB\_DC} \ge 1.25 \times I_{sc}$, điện áp ngắt $> V_{oc\_string}$ | **MCB DC 2P 20A - 600VDC/1000VDC** (2 bộ) |
| **Chống sét lan truyền DC (SPD)**| Type II, điện áp định mức $U_c > V_{oc\_string}$ ($436.5\text{ V}$) | **SPD DC 2P 600VDC/1000VDC** (2 bộ) |
| **Cáp điện DC Solar** | Cáp chuyên dụng chịu UV, ruột đồng mạ thiếc, cách điện XLPO | **Cáp Solar XLPO 1Cx4.0 mm² (Đen/Đỏ)** |
| **Cáp AC ngõ ra** | Giới hạn sụt áp $\Delta U < 2\%$ theo chiều dài tuyến | **Cáp đồng Cu/PVC/PVC 1Cx10.0 mm²** |
| **Cáp động lực Battery**| Chịu dòng sạc/xả lớn ở điện áp thấp ($150 - 200\text{ A}$) | **Cáp mềm chuyên dụng 25 mm² - 50 mm²** |
| **Cáp tiếp địa PE** | Nối đất liên kết vỏ tủ, khung giàn và biến tần | **Cáp Cu/PVC 1Cx4.0 - 6.0 mm² (Vàng/Xanh)** |

### 2. Bảng kê vật tư mẫu (BOM chi tiết)

```
+----+--------------------------------------------+-----------------------+-------+----------+
| STT| Danh mục vật tư / Thiết bị                 | Tiêu chuẩn / Model    | ĐVT   | Số lượng |
+----+--------------------------------------------+-----------------------+-------+----------+
|  I | THIẾT BỊ CHÍNH                             |                       |       |          |
|  1 | Tấm pin quang điện (PV Module)             | JA Solar 620Wp Mono   | Tấm   |    18    |
|  2 | Inverter Hybrid 1 Pha                      | SolaX / GoodWe 10kW   | Máy   |     1    |
|  3 | Pin lưu trữ Lithium LFP                    | Pylontech / LV 16kWh  | Bộ    |     1    |
|  4 | Thiết bị đo đếm bám tải / CT               | Smart Meter / CT 100A | Bộ    |     1    |
+----+--------------------------------------------+-----------------------+-------+----------+
| II | PHỤ KIỆN KHUNG GIÀN CƠ KHÍ                 |                       |       |          |
|  1 | Thanh rail nhôm định hình chuyên dụng      | Nhôm Anode AL6005-T5  | Mét   |    46    |
|  2 | Chân L bắt mái tôn + Vít bắn xà gồ         | Inox 304 / Nhôm Anode | Bộ    |    36    |
|  3 | Kẹp biên (End Clamp) 30mm                  | Nhôm AL6005-T5        | Bộ    |     8    |
|  4 | Kẹp giữa (Mid Clamp)                       | Nhôm AL6005-T5        | Bộ    |    32    |
|  5 | Thanh nối rail nhôm kèm bu-lông            | Nhôm AL6005-T5        | Cái   |     8    |
|  6 | Lá tiếp địa (Grounding clip) kẹp pin       | Thép không gỉ 304     | Cái   |    36    |
|  7 | Keo trung tính chống dột mái               | Sikaflex chuyên dụng  | Tuýp  |     4    |
+----+--------------------------------------------+-----------------------+-------+----------+
|III | TỦ ĐIỆN VÀ THIẾT BỊ ĐÓNG CẮT               |                       |       |          |
|  1 | Vỏ tủ điện IP65 ngoài trời                 | Sơn tĩnh điện 2 lớp   | Tủ    |     1    |
|  2 | Bộ chuyển đổi nguồn tự động ATS            | 2P 63A                | Cái   |     1    |
|  3 | Aptomat MCB AC (Hòa lưới / Backup / Tải)   | 2P 63A 4.5kA          | Cái   |     3    |
|  4 | Aptomat MCB DC chuyên dụng                 | 2P 20A 600V/1000VDC   | Cái   |     2    |
|  5 | Thiết bị chống sét lan truyền SPD AC       | Type II, 2P 275V      | Cái   |     1    |
|  6 | Thiết bị chống sét lan truyền SPD DC       | Type II, 2P 600V/1000V| Cái   |     2    |
|  7 | Cặp đầu nối chuyên dụng                    | Giắc MC4 IP68         | Cặp   |     8    |
|  8 | Dây cáp Solar DC chuyên dụng               | 1Cx4.0 mm²            | Mét   |    80    |
|  9 | Dây cáp nguồn AC                           | Cu/PVC/PVC 1Cx10.0 mm²| Mét   |    35    |
| 10 | Cáp mềm động lực Battery                   | Chuyên dụng 35-50 mm² | Mét   |     6    |
| 11 | Ống luồn PVC chống UV & Ống ruột gà bọc    | D20 - D25             | Mét   |    45    |
+----+--------------------------------------------+-----------------------+-------+----------+
| IV | HỆ THỐNG TIẾP ĐỊA AN TOÀN                  |                       |       |          |
|  1 | Cọc tiếp địa đồng chuyên dụng              | D16 x 2.4m            | Cọc   |     3    |
|  2 | Cáp đồng trần liên kết cọc                 | M25 / M50             | Mét   |    15    |
|  3 | Mối nối hóa nhiệt hàn liên kết / Kẹp đồng  | Cadweld               | Điểm  |     3    |
|  4 | Hóa chất giảm điện trở đất (GEM)           | Bao 11.3 kg           | Bao   |     2    |
+----+--------------------------------------------+-----------------------+-------+----------+
```

---

## PHẦN 4: HƯỚNG DẪN THI CÔNG & TIÊU CHUẨN KỸ THUẬT

### 1. Thi công kết cấu cơ khí và lắp đặt tấm PV
* **Nguyên tắc an toàn trên mái:**
  * **Cấm tuyệt đối:** Không tì đè, không quỳ gối, không đứng trực tiếp lên bề mặt kính tấm quang điện. Thao tác sai sẽ gây ra các vết nứt vi mô (*Micro-cracks*) làm suy giảm hiệu suất và tạo điểm quá nhiệt (*Hot-spots*) gây cháy.
  * Phải luôn sử dụng thang thao tác hoặc ván gỗ chuyên dụng lót trên giàn xà gồ khi di chuyển.
* **Cố định chân L và khung Rail:**
  * Định vị tim xà gồ chính xác. Bắn bu-lông chân L xuyên đỉnh sóng tôn ngàm sâu vào xà gồ thép.
  * Bắt buộc lót đệm cao su EPDM đàn hồi tại chân L và bơm phủ kín keo silicon trung tính chống co ngót quanh điểm bắn để triệt tiêu nguy cơ dột nước mái.
  * Sử dụng lá tiếp địa inox đặt xen kẽ giữa khung nhôm tấm pin và thanh rail để xuyên thủng lớp nhôm Anode, tạo hệ thống liên kết đẳng thế.
  * Dùng cờ-lê cân lực (Torque wrench) siết đúng lực quy định của nhà sản xuất (bu-lông M8: $8 - 10\text{ N.m}$). Bắt buộc **chấm bút sơn đánh dấu (*Marking*)** trên toàn bộ ốc siết để nghiệm thu.

### 2. Đi dây cáp DC, AC và Tủ điện
* Tuyệt đối không để dây cáp DC chùng chạm vào mặt tôn (ma sát do gió làm mòn vỏ cách điện dẫn đến phóng điện hồ quang). Toàn bộ cáp DC dưới tấm pin phải được kẹp chặt vào rãnh rail nhôm bằng kẹp Inox hoặc dây thít nhựa chống tia UV.
* Tuyến cáp từ mái xuống biến tần phải đi trong ống nhựa uPVC chống tia cực tím hoặc ống ruột gà lõi thép bọc nhựa.
* Bấm đầu cos và giắc MC4 bằng kìm bấm chuyên dụng đúng chuẩn tiết diện dây. Kiểm tra lực giật nhẹ trước khi cắm; khi cắm phải nghe tiếng "click" ăn khớp.
* Tủ điện lắp đặt thẳng đứng, chống nước tạt, bên trong có rãnh lược đi dây, đánh số nhãn dây rõ ràng theo quy chuẩn thiết kế.

### 3. Thi công hệ thống tiếp địa ($R < 4\,\Omega$)
* Khoảng cách giữa các cọc tiếp địa tối thiểu bằng 1 lần chiều dài cọc ($2.4\text{ m}$).
* Đào rãnh sâu $0.6\text{ m} - 0.8\text{ m}$ dưới mặt đất, đóng cọc ngập sâu, liên kết dây đồng trần bằng phương pháp hàn hóa nhiệt (Cadweld) hoặc kẹp đồng siết bu-lông. Rải hóa chất GEM tại những nơi đất nhiều đá hoặc cát sỏi.
* Dùng đồng hồ đo điện trở đất chuyên dụng kiểm tra; bắt buộc giá trị đạt $R < 4\,\Omega$.

---

## PHẦN 5: QUY TRÌNH ĐÓNG ĐIỆN NGHIỆM THU (COMMISSIONING)

Thực hiện chuẩn chỉ theo quy trình **6 bước**:

```
[B1: Kiểm tra vật lý] ➔ [B2: Đo đạc chuỗi PV] ➔ [B3: Kiểm tra nguồn AC] ➔ [B4: Cài đặt Inverter] ➔ [B5: Vận hành thử nghiệm] ➔ [B6: Nghiệm thu & Bàn giao]
```

### Bước 1: Kiểm tra vật lý
* Siết lực các cọc đấu nối tủ điện, đảm bảo các đầu cos không bị lỏng lẻo.
* Kiểm tra đấu nối đúng cực tính (+/-) DC và đúng thứ tự pha L/N/PE ngõ AC.
* Kiểm tra độ liên tục của dây tiếp địa bảo vệ.

### Bước 2: Đo đạc chuỗi tấm pin PV
* Sử dụng đồng hồ VOM đo điện áp hở mạch ($V_{oc}$) từng chuỗi: giá trị phải mang dấu (+) và nằm trong ngưỡng thiết kế ($\approx 430\text{ V}$).
* Sử dụng ampe kìm đo dòng ngắn mạch ($I_{sc}$) trong điều kiện đủ nắng.
* Đo điện trở cách điện (Megohmmeter): Đo giữa cực (+)/(-) của chuỗi PV với vỏ tiếp địa PE, giá trị cách điện phải đạt $R_{cd} > 1\text{ M}\Omega$.

### Bước 3: Đo đạc nguồn AC
* Đo điện áp lưới điện pha-trung tính: $220\text{ V} \pm 10\%$.
* Tần số lưới: $50\text{ Hz} \pm 0.5\text{ Hz}$.
* Kiểm tra tiếp địa tủ điện với trung tính ($V_{N-PE} < 3\text{ V}$).

### Bước 4: Trình tự đóng điện khởi động hệ thống (Bắt buộc theo thứ tự)
1. **Bước 4.1:** Bật CB AC ngõ **Back-up** (tải ưu tiên).
2. **Bước 4.2:** Bật CB AC ngõ **On-Grid** (hòa lưới).
3. **Bước 4.3:** Bật CB Máy phát (nếu có cổng GEN).
4. **Bước 4.4:** Bật CB DC các chuỗi tấm pin mặt trời.
5. **Bước 4.5:** Xoay công tắc **DC Switch** trên thân Inverter sang vị trí **ON**.
6. **Bước 4.6:** Đóng CB Battery, nhấn giữ nút nguồn (*Power Button*) trên khối pin Lithium từ 3–5 giây để kích hoạt mạch BMS.

### Bước 5: Cài đặt & Giám sát vận hành thử nghiệm
* Kết nối Bluetooth/Wifi Inverter thông qua ứng dụng cấu hình (SolarGo hoặc SolaX Cloud).
* Kiểm tra chiều công suất tiêu thụ của phụ tải và công suất phát từ pin mặt trời.
* Thử nghiệm cắt CB On-Grid để kiểm tra tính năng chuyển mạch cấp nguồn Back-up tức thời cho phụ tải ưu tiên.

### Bước 6: Lập biên bản nghiệm thu & Bàn giao
* Ghi lại đầy đủ các thông số đo đạc thực tế vào biên bản Commissioning.
* Bàn giao tài khoản giám sát trên điện thoại cho khách hàng và hướng dẫn quy trình tắt/mở an toàn.

---

## PHẦN 6: CÀI ĐẶT INVERTER HYBRID & NỀN TẢNG GIÁM SÁT

### 1. Các chế độ hoạt động (Operation Modes)
* **Chế độ Tự dùng (Self-Consumption - Mặc định):**
  * Năng lượng mặt trời sinh ra ưu tiên cấp cho phụ tải gia đình $\rightarrow$ điện dư thừa sạc vào pin lưu trữ $\rightarrow$ nếu pin đầy thì phát lên lưới (hoặc kích hoạt chế độ Zero-Export cắt phát ngược).
  * Khi PV suy giảm hoặc ban đêm, pin lưu trữ tự động xả điện nuôi tải gia đình cho tới ngưỡng DoD đã cài đặt trước khi nhận điện lưới.
* **Chế độ Dự phòng (Backup Mode):**
  * Pin lưu trữ luôn duy trì trạng thái sạc đầy $100\%$, không xả vào ban đêm; chỉ kích hoạt xả điện nuôi tải quan trọng khi xảy ra mất điện lưới EVN.
* **Chế độ Biểu giá theo khung giờ (TOU - Time of Use):**
  * Cài đặt chủ động: sạc điện lưới vào khung giờ thấp điểm (đêm), xả pin nuôi phụ tải vào khung giờ cao điểm (sáng/tối) để tối ưu hóa hiệu quả tiền điện.
* **Chế độ Cắt đỉnh phụ tải (Peak Shaving):**
  * Đặt trần công suất tối đa nhận từ điện lưới. Khi phụ tải tổng vượt ngưỡng, pin lưu trữ xả phụ thêm vào để gọt phần đỉnh nhọn của đồ thị phụ tải.

### 2. Thiết lập kỹ thuật quan trọng
* **Mã lưới (Grid Code):** Khai báo chuẩn `50Hz Default` hoặc `IEC61727 50Hz` (chuẩn điện lưới Việt Nam).
* **Cài đặt Pin lưu trữ (Battery Parameters):** Chọn chính xác thương hiệu/model pin (*Pylontech*, *Lithium Valley*, *GoodWe Lynx*). Thiết lập độ xả sâu DoD bảo vệ khuyến nghị là $90\%$ (giữ lại $10\%$ chống kiệt cell).
* **Quy chuẩn kẹp biến dòng (CT):**
  * Chiều mũi tên trên thân kẹp CT phải hướng thẳng về phía **LƯỚI ĐIỆN QUỐC GIA (K $\rightarrow$ L)**.
  * Vị trí kẹp: Duy nhất trên dây Pha ($L$), nằm trước phụ tải và điểm hòa lưới của biến tần.
  * Nếu dùng Smart Meter: Khai báo đúng địa chỉ RS485 và cài đặt đúng tỷ số biến dòng (*CT Ratio*).

---

## PHẦN 7: SỰ CỐ THƯỜNG GẶP & PHƯƠNG ÁN XỬ LÝ NHANH

### 1. Lỗi ngược chiều CT / "CT Loss" / Công suất tải hiển thị sai lệch
* **Hiện tượng:** Khi trời nắng to phát điện mạnh, biểu đồ tải trên App tăng vọt bằng với công suất PV, hoặc Inverter báo lỗi truyền thông CT.
* **Nguyên nhân:** Kẹp ngược hướng mũi tên CT; kẹp nhầm dây Trung tính ($N$); hoặc cắm sai thứ tự pha giữa dây tín hiệu CT và dây pha điện áp hòa lưới.
* **Cách khắc phục:** Kiểm tra và xoay mũi tên CT hướng về phía điện lưới EVN; kiểm tra dây tín hiệu không bị đứt hoặc lỏng cọc domino.

### 2. Lỗi "BMS Lost" (Mất giao tiếp với Pin lưu trữ)
* **Hiện tượng:** Biến tần báo lỗi BMS, không cho sạc/xả pin lưu trữ.
* **Nguyên nhân:** Cáp truyền thông CAN/RS485 cắm sai cổng; bấm sai thứ tự chuẩn dây mạng; cấu hình sai model pin trên App.
* **Cách khắc phục:** Kiểm tra sơ đồ chân (Pinout) cáp truyền thông theo tài liệu hãng; cắm đúng ngõ BMS trên Inverter và CAN trên pin; bật lại công tắc nguồn pin và khởi động lại Inverter.

### 3. Lỗi "Ground Fault" / "PV Isolation Fault" (Lỗi chạm đất / Cách điện PV)
* **Hiện tượng:** Biến tần dừng phát điện, màn hình cảnh báo lỗi chạm vỏ.
* **Nguyên nhân:** Vỏ cáp DC bị rách xước chạm vào khung rail nhôm hoặc mặt tôn; giắc MC4 bị đọng nước mưa; chống sét SPD DC bị sét đánh nổ đánh thủng.
* **Cách khắc phục:** Ngắt toàn bộ chuỗi PV, dùng đồng hồ Megohmmeter đo điện trở cách điện từng chuỗi đối với dây tiếp địa PE để cô lập vị trí rò điện; thay mới giắc MC4 hoặc đoạn dây hỏng.

### 4. Lỗi "Grid Overvoltage / Undervoltage" (Quá áp / Thấp áp lưới AC)
* **Hiện tượng:** Biến tần ngắt liên tục vào buổi trưa lúc nắng gắt nhất.
* **Nguyên nhân:** Điện áp lưới tăng cao do ở gần trạm biến áp hoặc tiết diện dây dẫn AC từ tủ điện đến điểm đấu nối quá nhỏ khiến Inverter phát điện gây tăng sụt áp ngược.
* **Cách khắc phục:** Kiểm tra lại tiết diện dây AC (tăng tiết diện dây nếu quá dài); mở rộng dải điện áp làm việc trên Inverter (trong giới hạn EVN cho phép); kiến nghị ngành điện cân lại pha phụ tải ngoài cột.

### 5. Lỗi "Backup Overload" (Quá tải cổng Back-up)
* **Hiện tượng:** Mất điện lưới, Inverter kích hoạt cấp điện phụ tải ưu tiên nhưng lập tức ngắt và báo lỗi quá tải.
* **Nguyên nhân:** Tổng công suất các thiết bị cắm vào cổng Back-up vượt quá ngưỡng định mức tức thời của Inverter (ví dụ vượt quá 10 kW).
* **Cách khắc phục:** Rà soát và tách ngay các phụ tải công suất cao (bếp từ, bình nóng lạnh, điều hòa công suất lớn) ra khỏi nhánh điện ưu tiên của tủ ATS.

---

## PHẦN 8: QUY TRÌNH BẢO TRÌ, BẢO DƯỠNG ĐỊNH KỲ (O&M)

| Tần suất | Khu vực thiết bị | Nội dung kiểm tra & Tiêu chuẩn đánh giá |
| :--- | :--- | :--- |
| **Hàng tháng** | **Inverter & Battery** | • Vệ sinh khe hút gió và quạt tản nhiệt của Inverter.<br>• Kiểm tra nhiệt độ bề mặt thiết bị, không để vật cản che luồng đối lưu khí quyển.<br>• Đăng nhập App kiểm tra nhật ký vận hành và các cảnh báo ẩn. |
| **Mỗi 3 tháng**| **Giàn pin PV & Phụ kiện** | • Vệ sinh bề mặt kính tấm PV bằng nước sạch và chổi lau mềm chuyên dụng (tuyệt đối không rửa vào buổi trưa nắng gắt để tránh sốc nhiệt nứt kính).<br>• Kiểm tra các ống luồn dây ngoài trời, độ bám dính của các đai thít cáp. |
| **Mỗi 6 tháng**| **Hệ kết cấu mái** | • Kiểm tra độ siết lực bu-lông chân L, kẹp giữa, kẹp biên.<br>• Kiểm tra độ ăn mòn của khung giàn cơ khí.<br>• Kiểm tra lớp keo chống dột silicone tại các vị trí bắt vít mái tôn. |
| **Mỗi 6 tháng**| **Tủ điện & Tiếp địa** | • Dùng camera nhiệt hoặc ampe kìm kiểm tra điểm phát nhiệt bất thường tại các cọc đấu dây CB, ATS.<br>• Đo kiểm tra lại điện trở tiếp địa hệ thống, đảm bảo $R < 4\,\Omega$. |

---
*Tài liệu được biên soạn và ban hành phục vụ công tác đào tạo kỹ thuật nội bộ tại Công ty HGC.*