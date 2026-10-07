# TÀI LIỆU NGHIỆP VỤ & TOÀN BỘ CÔNG THỨC - LOGIC TÍNH TOÁN HỆ THỐNG ĐIỆN NĂNG LƯỢNG MẶT TRỜI (1 PHA & 3 PHA)
**Dự án:** Phần Mềm Thiết Kế, Bóc Tách Vật Tư BOM & Dự Toán Tài Chính Điện Mặt Trời Áp Mái  
**Chuẩn hóa:** Theo Mẫu Bảng Kê Vật Tư Thiết Bị (ON-GRID / HYBRID) của Công Ty & Tiêu Chuẩn Kỹ Thuật TCVN / IEC  
**Ngày cập nhật:** Tháng 10/2026  

---

## MỤC LỤC TỔNG QUAN

1. [PHẦN 1: TỔNG QUAN HỆ THỐNG & ĐẶC TÍNH LƯỚI ĐIỆN 1 PHA VS 3 PHA](#phần-1-tổng-quan-hệ-thống--đặc-tính-lưới-điện-1-pha-vs-3-pha)
2. [PHẦN 2: CÔNG THỨC & LOGIC TÍNH TOÁN SẢN LƯỢNG VÀ BỐ TRÍ PIN (LAYOUT ENGINE)](#phần-2-công-thức--logic-tính-toán-sản-lượng-và-bố-trí-pin-layout-engine)
3. [PHẦN 3: LOGIC VÀ CÔNG THỨC LỰA CHỌN THIẾT BỊ CHO HỆ 1 PHA & 3 PHA](#phần-3-logic-và-công-thức-lựa-chọn-thiết-bị-cho-hệ-1-pha--3-pha)
   - [3.1. Lựa chọn Biến tần (Inverter Selection & String Sizing)](#31-lựa-chọn-biến-tần-inverter-selection--string-sizing)
   - [3.2. Lựa chọn Pin lưu trữ Lithium (Battery ESS)](#32-lựa-chọn-pin-lưu-trữ-lithium-battery-ess)
   - [3.3. Tính chọn Cáp điện AC, DC & Tiếp địa (Cabling Engine)](#33-tính-chọn-cáp-điện-ac-dc--tiếp-địa-cabling-engine)
   - [3.4. Tính chọn Thiết bị đóng cắt bảo vệ (CB/MCCB, SPD, ATS, Smart Meter)](#34-tính-chọn-thiết-bị-đóng-cắt-bảo-vệ-cbmccb-spd-ats-smart-meter)
   - [3.5. Tính toán Phụ kiện kết cấu & Rail nhôm (Mounting Engine)](#35-tính-toán-phụ-kiện-kết-cấu--rail-nhôm-mounting-engine)
4. [PHẦN 4: LOGIC BÓC TÁCH VẬT TƯ (BOM) THEO MẪU BẢNG KÊ CHUẨN 4 NHÓM (A - B - C - D)](#phần-4-logic-bóc-tách-vật-tư-bom-theo-mẫu-bảng-kê-chuẩn-4-nhóm-a---b---c---d)
5. [PHẦN 5: TOÀN BỘ CÔNG THỨC & LOGIC TÍNH TOÁN GIÁ, DÒNG TIỀN & HIỆU QUẢ KINH TẾ](#phần-5-toàn-bộ-công-thức--logic-tính-toán-giá-dòng-tiền--hiệu-quả-kinh-tế)
   - [5.1. Cơ cấu Đơn giá vốn, Giá bán, Chiết khấu & Thuế VAT](#51-cơ-cấu-đơn-giá-vốn-giá-bán-chiết-khấu--thuế-vat)
   - [5.2. Công thức Suất đầu tư (Vnđ / kWp & Vnđ / Wp)](#52-công-thức-suất-đầu-tư-vnđ--kwp--vnđ--wp)
   - [5.3. Biểu giá điện EVN áp dụng](#53-biểu-giá-điện-evn-áp-dụng)
   - [5.4. Mô hình Dòng tiền 20 năm có tính suy hao tấm pin 0.7%/năm](#54-mô-hình-dòng-tiền-20-năm-có-tính-suy-hao-tấm-pin-07năm)
   - [5.5. Công thức Thời gian hoàn vốn (Payback Period) & Tỷ suất nội hoàn (IRR)](#55-công-thức-thời-gian-hoàn-vốn-payback-period--tỷ-suất-nội-hoàn-irr)
   - [5.6. Chỉ số Môi trường (Giảm phát thải CO2 & Cây xanh)](#56-chỉ-số-môi-trường-giảm-phát-thải-co2--cây-xanh)

---

## PHẦN 1: TỔNG QUAN HỆ THỐNG & ĐẶC TÍNH LƯỚI ĐIỆN 1 PHA VS 3 PHA

### 1. Phân loại cấu hình hệ thống
* **Hòa lưới bám tải (On-Grid Zero-Export):**
  - **Nguyên lý:** Nguồn điện mặt trời phát ra được ưu tiên cấp trực tiếp cho phụ tải sử dụng. Khi sản lượng điện mặt trời lớn hơn tải tiêu thụ, biến tần tự động điều chỉnh giảm công suất phát thông qua cảm biến dòng CT / Smart Meter gắn tại ngõ vào điện lưới, đảm bảo **không phát ngược điện lên lưới EVN** (chống phát ngược 0W).
  - **Ưu điểm:** Chi phí đầu tư thấp nhất, tỷ suất hoàn vốn nhanh (thường 3.5 - 4.5 năm), không cần bảo trì ắc quy/pin lưu trữ.
  - **Nhược điểm:** Khi lưới điện EVN mất điện, biến tần tự động ngắt ngay lập tức (*Anti-Islanding Protection*) để đảm bảo an toàn cho nhân viên ngành điện, do đó phụ tải bị mất điện theo.
* **Hòa lưới có lưu trữ (Hybrid ESS - Energy Storage System):**
  - **Nguyên lý:** Ban ngày điện mặt trời cấp cho tải tiêu thụ và sạc đầy bộ pin lưu trữ Lithium. Khi dư điện, biến tần giảm công suất (Zero-Export) hoặc hòa lưới nếu được phép. Ban đêm hoặc khi trời mưa, hệ thống tự động xả pin nuôi phụ tải. Khi điện lưới EVN bị sự cố cắt điện, bộ chuyển mạch ATS tự động chuyển phụ tải ưu tiên sang cổng cấp nguồn dự phòng (Back-up / EPS) trong thời gian < 10 - 20ms, đảm bảo các thiết bị quan trọng không bị gián đoạn.
  - **Ưu điểm:** Độc lập năng lượng 24/7, có nguồn điện dự phòng khi cúp điện, tối đa hóa tỷ lệ tự dùng điện mặt trời lên đến 85% - 95%.
  - **Nhược điểm:** Chi phí đầu tư ban đầu cao hơn do có bộ lưu trữ Lithium và tủ chuyển nguồn ATS.

---

### 2. So sánh đặc tính kỹ thuật Lưới điện 1 Pha vs 3 Pha

| Tiêu chí kỹ thuật | Hệ Thống 1 Pha (1-Phase) | Hệ Thống 3 Pha (3-Phase) |
| :--- | :--- | :--- |
| **Điện áp danh định ($U$)** | $220\text{ VAC}$ (dây Pha L - dây Trung tính N) | $380\text{ VAC}$ (dây Pha - Pha) / $220\text{ VAC}$ (Pha - N) |
| **Tần số lưới** | $50\text{ Hz} \pm 1\text{ Hz}$ | $50\text{ Hz} \pm 1\text{ Hz}$ |
| **Đối tượng khách hàng** | Hộ gia đình dân dụng, căn hộ, biệt thự nhỏ | Biệt thự lớn, tòa nhà văn phòng, nhà xưởng, khách sạn |
| **Công suất lắp đặt khuyến nghị** | $3\text{ kWp} - 12\text{ kWp}$ (tối đa 10kW Inverter) | $10\text{ kWp} - 100\text{ kWp}+$ |
| **Giới hạn đấu nối EVN** | Thường giới hạn $I_{max} \le 40\text{A} - 50\text{A}$ (Inverter $\le 10\text{ kW}$) | Cho phép công suất lớn, yêu cầu thỏa thuận đấu nối kỹ thuật |
| **Số lượng dây dẫn AC** | 3 dây: 1 Pha (L) + 1 Trung tính (N) + 1 Tiếp địa (PE) | 5 dây: 3 Pha (L1, L2, L3) + 1 Trung tính (N) + 1 Tiếp địa (PE) |
| **Công thức tính dòng điện ($I_b$)** | $I_b = \frac{P_{AC} \times 1000}{U \times \cos\varphi}$ | $I_b = \frac{P_{AC} \times 1000}{\sqrt{3} \times U \times \cos\varphi}$ |
| **Độ lệch pha & Cân bằng tải** | Không có (tải đơn pha) | Cần kiểm tra dòng từng pha; Inverter 3P hiện đại hỗ trợ cân bằng pha không đối xứng (*Unbalanced Output*) |
| **Cảm biến bám tải (Zero-Export)** | 1 bộ Biến dòng CT 1 Pha (hoặc Smart Meter 1P) | 1 Smart Meter 3 Pha + 3 cuộn biến dòng CT (100A/5A hoặc 250A/5A) truyền thông RS-485 |
| **Pin lưu trữ Hybrid (ESS)** | Thường dùng Pin Lithium Áp Thấp (Low Voltage: 51.2V / 100Ah - 314Ah) | Pin Áp Thấp (51.2V) cho Inverter 3P LV hoặc Pin Áp Cao (High Voltage 150V - 600V) cho Inverter 3P HV |

---

## PHẦN 2: CÔNG THỨC & LOGIC TÍNH TOÁN SẢN LƯỢNG VÀ BỐ TRÍ PIN (LAYOUT ENGINE)

### 1. Tính toán nhu cầu điện và công suất đề xuất từ Hóa đơn tiền điện

#### 1.1. Ước tính sản lượng tiêu thụ hàng tháng ($A_{\text{tháng}}$):
Nếu khách hàng nhập trực tiếp sản lượng điện tiêu thụ: Lấy trực tiếp $A_{\text{tháng}}$ (kWh/tháng).  
Nếu khách hàng chỉ có số tiền trên hóa đơn tiền điện hàng tháng ($T_{\text{hóa\_đơn}}$ VNĐ):
$$A_{\text{tháng}} = \frac{T_{\text{hóa\_đơn}}}{\text{Giá điện trung bình}} \quad (\text{kWh/tháng})$$
*Trong đó:* Giá điện trung bình mặc định tại Việt Nam được lấy là $2.800 - 3.000\text{ VNĐ/kWh}$ (theo bậc 4 - bậc 5 điện sinh hoạt hoặc biểu giá kinh doanh bình thường).

#### 1.2. Công thức tính công suất lắp đặt tối ưu đề xuất ($P_{\text{recommended}}$):
Hệ thống hòa lưới bám tải phát huy hiệu quả kinh tế cao nhất khi bù đắp lượng điện tiêu thụ vào ban ngày (giờ nắng từ 7h00 đến 17h00).
- **Tỷ lệ tiêu thụ ban ngày ($K_{\text{daytime}}$):** Mặc định $70\%$ tổng điện năng tiêu thụ trong ngày.
- **Sản lượng mục tiêu cần bù đắp mỗi ngày ($A_{\text{ngày}}$):**
  $$A_{\text{ngày}} = \frac{A_{\text{tháng}} \times K_{\text{daytime}}}{30} = \frac{A_{\text{tháng}} \times 0.70}{30} \quad (\text{kWh/ngày})$$
- **Hệ số hướng mái ($K_{\text{hướng}}$):**
  - Hướng Chính Nam (S): $K_{\text{hướng}} = 1.00$ (tối ưu 100%)
  - Hướng Đông Nam (SE) / Tây Nam (SW): $K_{\text{hướng}} = 0.95$ (suy giảm 5%)
  - Hướng Chính Đông (E) / Chính Tây (W): $K_{\text{hướng}} = 0.85$ (suy giảm 15%)
- **Hiệu suất vận hành toàn hệ thống ($\eta_{\text{sys}}$):** Mặc định $0.85$ (85%), bao gồm tổn thất nhiệt độ cell, suy hao Inverter, tổn hao cáp dẫn và bụi bẩn.
- **Công suất giàn pin đề xuất ($P_{\text{recommended}}$):**
  $$P_{\text{recommended}} = \frac{A_{\text{ngày}}}{\text{GHI} \times K_{\text{hướng}} \times \eta_{\text{sys}}} \quad (\text{kWp})$$
  *Trong đó:* $\text{GHI}$ là số giờ nắng đỉnh trung bình ngày của địa phương (Peak Sun Hours, kWh/m²/ngày). Ví dụ: Miền Nam $\approx 4.5 - 5.0$, Miền Trung $\approx 4.2 - 4.8$, Miền Bắc $\approx 3.8 - 4.2\text{ h/ngày}$.

---

### 2. Logic xếp tấm pin trên mặt bằng mái (Roof Layout Algorithm)

#### 2.1. Diện tích mặt bằng và giới hạn lắp đặt:
- **Kích thước tấm pin công nghiệp tiêu chuẩn (620Wp - 630Wp):**
  - Chiều dài tấm ($L_p$): $2.382\text{ m}$ (hoặc $2.278\text{ m}$)
  - Chiều rộng tấm ($W_p$): $1.134\text{ m}$
  - Diện tích 1 tấm pin: $S_{1\_tấm} \approx 2.70\text{ m}^2$
  - Trọng lượng 1 tấm: $\approx 28.5\text{ kg} - 31.5\text{ kg}$
- **Khoảng lùi an toàn biên mái (Setback offset):** Tối thiểu $0.3\text{ m} - 0.5\text{ m}$ từ mép mái để tránh vùng lốc xoáy gió mép mái và làm lối đi bảo trì.
- **Khoảng cách giữa các tấm pin trong cùng 1 hàng:** $0.02\text{ m}$ (bằng bề rộng kẹp giữa Mid clamp).

#### 2.2. Tính số lượng tấm pin cực đại theo diện tích mái:
- Với mái chữ nhật kích thước khả dụng ($L_{\text{mái}} \times W_{\text{mái}}$):
  - Lắp đặt theo chiều dọc (Portrait - khuyến nghị):
    $$\text{Số cột (Cols)} = \left\lfloor \frac{L_{\text{mái}} - 2 \times \text{offset}}{W_p + 0.02} \right\rfloor$$
    $$\text{Số hàng (Rows)} = \left\lfloor \frac{W_{\text{mái}} - 2 \times \text{offset}}{L_p + 0.05} \right\rfloor$$
    $$\text{Số tấm tối đa} = \text{Cols} \times \text{Rows}$$
- Tổng công suất lắp đặt thực tế ($P_{DC}$):
  $$P_{DC} = N_{\text{tấm}} \times P_{\text{module}} \quad (\text{Wp hoặc kWp})$$

#### 2.3. Dự báo sản lượng điện phát thực tế:
- **Sản lượng ngày ($E_{\text{ngày}}$):**
  $$E_{\text{ngày}} = P_{DC} \times \text{GHI} \times K_{\text{hướng}} \times \eta_{\text{sys}} \quad (\text{kWh/ngày})$$
- **Sản lượng tháng ($E_{\text{tháng}}$):** $E_{\text{tháng}} = E_{\text{ngày}} \times 30 \quad (\text{kWh/tháng})$
- **Sản lượng năm thứ nhất ($E_{\text{năm\_1}}$):** $E_{\text{năm\_1}} = E_{\text{ngày}} \times 365 \quad (\text{kWh/năm})$

---

## PHẦN 3: LOGIC VÀ CÔNG THỨC LỰA CHỌN THIẾT BỊ CHO HỆ 1 PHA & 3 PHA

### 3.1. Lựa chọn Biến tần (Inverter Selection & String Sizing)

#### 1. Tỷ lệ quá công suất DC/AC (DC/AC Oversizing Ratio):
Do tấm pin quang điện hiếm khi đạt được công suất cực đại STC trong điều kiện thực tế (nhiệt độ cell cao hơn 25°C làm giảm điện áp), Inverter luôn được thiết kế nhận lượng DC lớn hơn công suất danh định AC:
$$\text{Ratio}_{DC/AC} = \frac{P_{DC}}{P_{AC\_inv}}$$
- **Tối ưu kinh tế kỹ thuật:** $1.15 \le \text{Ratio}_{DC/AC} \le 1.30$ (Đạt rating: `✓ Tối ưu`).
- **Chấp nhận được:** $1.00 \le \text{Ratio}_{DC/AC} \le 1.45$ (Đạt rating: `⚠ Chấp nhận được`).
- **Ngoài khoảng:** Đạt rating: `✗ Không khuyến nghị`.

#### 2. Kiểm tra an toàn điện áp chuỗi pin (String Voltage Verification):
Nhiệt độ môi trường cực trị tại Việt Nam: $T_{min} = 10^\circ\text{C}$ (mùa đông miền Bắc / sáng sớm), $T_{max} = 40^\circ\text{C}$ (nhiệt độ cell dưới nắng đạt $T_{cell\_max} = T_{max} + 25^\circ\text{C} = 65^\circ\text{C}$).
- **Điện áp hở mạch của tấm pin khi trời lạnh nhất ($V_{oc\_cold}$):**
  $$V_{oc\_cold} = V_{oc\_stc} \times \left[ 1 + \frac{\beta_{Voc}}{100} \times (T_{min} - 25) \right]$$
  *(với $\beta_{Voc} \approx -0.26\%/^\circ\text{C}$ là hệ số nhiệt điện áp âm, do đó khi $T < 25^\circ\text{C}$ thì $V_{oc}$ tăng lên).*
- **Điện áp điểm công suất cực đại khi cell nóng nhất ($V_{mpp\_hot}$):**
  $$V_{mpp\_hot} = V_{mpp\_stc} \times \left[ 1 + \frac{\gamma_{Vmpp}}{100} \times (T_{cell\_max} - 25) \right]$$
  *(với $\gamma_{Vmpp} \approx -0.30\%/^\circ\text{C}$, khi cell nóng $65^\circ\text{C}$ thì điện áp tụt giảm).*
- **Ràng buộc số tấm cực đại trong 1 chuỗi ($N_{series\_max}$):**
  $$N_{series\_max} = \left\lfloor \frac{V_{dc\_max\_inv}}{V_{oc\_cold}} \right\rfloor$$
  *Quy chuẩn an toàn tuyệt đối:* Điện áp tổng chuỗi hở mạch không được vượt quá điện áp đầu vào cực đại của Inverter ($600\text{ VDC}$ đối với Inverter 1 Pha hoặc $1000\text{ - }1100\text{ VDC}$ đối với Inverter 3 Pha).
- **Ràng buộc số tấm cực tiểu trong 1 chuỗi ($N_{series\_min}$):**
  $$N_{series\_min} = \left\lceil \frac{V_{mppt\_min\_inv}}{V_{mpp\_hot}} \right\rceil$$
  Đảm bảo khi thời tiết nắng nóng gắt, điện áp chuỗi vẫn nằm trên ngưỡng điện áp khởi động tối thiểu của bộ điều khiển MPPT.

#### 3. Bảng đối chiếu cấu hình Inverter mẫu 1 Pha & 3 Pha:

| Thông số kỹ thuật | Inverter 1 Pha (Ví dụ: 6kW - 10kW) | Inverter 3 Pha (Ví dụ: 10kW - 30kW) |
| :--- | :--- | :--- |
| **Điện áp DC tối đa ($V_{dc\_max}$)** | $550\text{ V} - 600\text{ VDC}$ | $1000\text{ V} - 1100\text{ VDC}$ |
| **Dải điện áp MPPT** | $80\text{ V} - 550\text{ VDC}$ | $160\text{ V} - 950\text{ VDC}$ |
| **Điện áp MPPT danh định tối ưu** | $360\text{ VDC}$ | $600\text{ VDC}$ |
| **Số tấm / chuỗi (String) khuyến nghị**| $7 - 11\text{ tấm/chuỗi}$ | $14 - 18\text{ tấm/chuỗi}$ |
| **Số ngõ MPPT độc lập** | 2 MPPT (mỗi MPPT 1 chuỗi) | 2 - 3 MPPT (mỗi MPPT 1 - 2 chuỗi song song) |
| **Dòng ngắn mạch cực đại MPPT ($I_{sc\_max}$)**| $16\text{A} - 20\text{A}$ | $30\text{A} - 40\text{A}$ |

---

### 3.2. Lựa chọn Pin lưu trữ Lithium (Battery ESS)

Chỉ áp dụng khi dự án chọn giải pháp **Hòa lưới có lưu trữ (Hybrid ESS)**.
- **Nhu cầu năng lượng ban đêm ($A_{\text{đêm}}$):**
  $$A_{\text{đêm}} = A_{\text{ngày}} \times (1 - K_{\text{daytime}}) = A_{\text{ngày}} \times 0.30 \quad (\text{kWh})$$
- **Độ xả sâu cho phép (DoD - Depth of Discharge):** Khuyến nghị $90\%$ để kéo dài tuổi thọ cell pin Lithium Iron Phosphate (LiFePO4) đạt trên 6.000 chu kỳ (tương đương 10 - 15 năm).
- **Hiệu suất nạp/xả khứ hồi ($\eta_{battery}$):** $95\%$.
- **Dung lượng pin lưu trữ danh định cần thiết ($C_{battery}$):**
  $$C_{battery} = \frac{A_{\text{đêm}}}{\text{DoD} \times \eta_{battery}} = \frac{A_{\text{đêm}}}{0.90 \times 0.95} \quad (\text{kWh})$$

#### Cấu hình pin lưu trữ chuẩn theo hệ 1 Pha và 3 Pha:
- **Hệ 1 Pha Hybrid:** Dùng Pin Lithium Áp Thấp (Low Voltage 51.2V).
  - Model tiêu chuẩn: **Pin Lithium 51.2V / 100Ah (5.12kWh)** hoặc **Pin 51.2V / 314Ah (16.08kWh)** (như mẫu W16-5A / Pylontech).
  - Tủ pin đứng gọn gàng, tích hợp BMS thông minh kết nối CAN bus / RS485 với Inverter.
- **Hệ 3 Pha Hybrid:** Dùng Pin Áp Thấp ghép song song (hệ 10kW - 15kW LV) hoặc Module Pin Áp Cao High Voltage (xếp chồng các pack 50V nối tiếp lên 200V - 500V đối với Inverter 3P HV).
  - Với cấu hình Hybrid 3P 15kW - 30kW mẫu: Trang bị **2 bộ Pin Lithium 16kWh** (tổng 32kWh) đáp ứng trọn vẹn phụ tải ban đêm của biệt thự hoặc văn phòng.

---

### 3.3. Tính chọn Cáp điện AC, DC & Tiếp địa (Cabling Engine)

Tính toán tuân thủ theo tiêu chuẩn **IEC 60364-5-52**, **IEC 60502-1** và tiêu chuẩn quốc gia **TCVN 9207:2012**.

#### 1. Dòng điện tính toán của phụ tải ($I_b$):
- **Đối với hệ thống 1 Pha ($220\text{V}$):**
  $$I_b = \frac{P_{AC} \times 1000}{U_1 \times \cos\varphi} = \frac{P_{AC} \times 1000}{220 \times 0.9} \quad (\text{A})$$
  *(Ví dụ: Inverter 1P 10kW $\rightarrow I_b = \frac{10000}{220 \times 0.9} = 50.5\text{A}$).*
- **Đối với hệ thống 3 Pha ($380\text{V}$):**
  $$I_b = \frac{P_{AC} \times 1000}{\sqrt{3} \times U_3 \times \cos\varphi} = \frac{P_{AC} \times 1000}{\sqrt{3} \times 380 \times 0.9} \quad (\text{A})$$
  *(Ví dụ: Inverter 3P 20kW $\rightarrow I_b = \frac{20000}{1.732 \times 380 \times 0.9} = 33.8\text{A}$).*

#### 2. Điều kiện chọn tiết diện cáp:
Tiết diện dây dẫn được chọn phải thỏa mãn đồng thời 2 điều kiện:
1. **Điều kiện phát nóng:** Dòng tải cho phép của cáp $I_z \ge I_b$.
2. **Điều kiện sụt áp:** Độ sụt áp $\Delta U \le 2.0\% - 2.5\%$.
   - Sụt áp mạng 1 Pha: $\Delta U = \frac{2 \times \rho \times L \times I_b \times \cos\varphi}{S} \quad (\text{V})$
   - Sụt áp mạng 3 Pha: $\Delta U = \frac{\sqrt{3} \times \rho \times L \times I_b \times \cos\varphi}{S} \quad (\text{V})$
   - Phần trăm sụt áp: $\Delta U\% = \frac{\Delta U}{U} \times 100 \le 2.5\%$
   *(với $\rho_{Cu} = 0.0175\ \Omega\cdot\text{mm}^2/\text{m}$ là điện trở suất của đồng).*

#### 3. Bảng quy cách cáp chuẩn Cadivi & Solar cho từng dải công suất:

| Công suất hệ thống | Loại lưới điện | Dòng $I_b$ | Dây AC Inverter (Cadivi CV) | Dây AC Tổng về Tủ MSB | Dây DC Solar (XLPO) | Dây Tiếp Địa (PE) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **5 kW** | 1 Pha 220V | $25.3\text{ A}$ | Cadivi CV $6.0\text{ mm}^2$ | Cadivi CV $10.0\text{ mm}^2$ | Cáp DC $4.0\text{ mm}^2$ | Cadivi CV $4.0\text{ mm}^2$ |
| **8 kW** | 1 Pha 220V | $40.4\text{ A}$ | Cadivi CV $10.0\text{ mm}^2$ | Cadivi CV $16.0\text{ mm}^2$ | Cáp DC $4.0\text{ mm}^2$ | Cadivi CV $6.0\text{ mm}^2$ |
| **10 kW (1P)** | 1 Pha 220V | $50.5\text{ A}$ | Cadivi CV $10.0\text{ mm}^2$ | Cadivi CV $16.0\text{ mm}^2$ | Cáp DC $4.0\text{ mm}^2$ | Cadivi CV $6.0\text{ mm}^2$ |
| **10 kW (3P)** | 3 Pha 380V | $16.9\text{ A}$ | Cadivi CV $4 \times 6.0\text{ mm}^2$ | Cadivi CV $4 \times 6.0\text{ mm}^2$ | Cáp DC $4.0\text{ mm}^2$ | Cadivi CV $6.0\text{ mm}^2$ |
| **15 kW** | 3 Pha 380V | $25.3\text{ A}$ | Cadivi CV $4 \times 6.0\text{ mm}^2$ | Cadivi CV $4 \times 10.0\text{ mm}^2$| Cáp DC $4.0\text{ mm}^2$ | Cadivi CV $6.0\text{ mm}^2$ |
| **20 kW** | 3 Pha 380V | $33.8\text{ A}$ | Cadivi CV $4 \times 10.0\text{ mm}^2$| Cadivi CV $4 \times 16.0\text{ mm}^2$| Cáp DC $4.0\text{ mm}^2$ | Cadivi CV $10.0\text{ mm}^2$|
| **30 kW** | 3 Pha 380V | $50.6\text{ A}$ | Cadivi CV $4 \times 16.0\text{ mm}^2$| Cadivi CV $4 \times 25.0\text{ mm}^2$| Cáp DC $4.0\text{ mm}^2$ | Cadivi CV $16.0\text{ mm}^2$|
| **50 kW** | 3 Pha 380V | $84.4\text{ A}$ | Cadivi CV $4 \times 25.0\text{ mm}^2$| Cadivi CV $4 \times 50.0\text{ mm}^2$| Cáp DC $6.0\text{ mm}^2$ | Cadivi CV $25.0\text{ mm}^2$|

---

### 3.4. Tính chọn Thiết bị đóng cắt bảo vệ (CB/MCCB, SPD, ATS, Smart Meter)

#### 1. Áptômát bảo vệ AC (MCB / MCCB):
- **Công thức dòng định mức:** $I_{n\_CB} \ge 1.25 \times I_b$ (hệ số an toàn $125\%$ theo NEC/IEC để tránh nhảy CB do quá nhiệt khi vận hành liên tục ở công suất cực đại).
- **Cấp định mức tiêu chuẩn:**
  - Hệ 1P 5kW: MCB 2P 32A
  - Hệ 1P 8kW: MCB 2P 50A
  - Hệ 1P 10kW: MCB/MCCB 2P 63A
  - Hệ 3P 10kW - 15kW: MCB 3P/4P 32A - 40A
  - Hệ 3P 20kW: MCB 3P/4P 50A
  - Hệ 3P 30kW: MCCB 3P/4P 75A - 100A
  - Hệ 3P 50kW: MCCB 3P/4P 125A - 160A

#### 2. Thiết bị chống sét lan truyền (SPD - Surge Protective Device):
- **SPD AC:**
  - Lắp đặt tại tủ điện AC Inverter và tủ điện tổng.
  - Chuẩn: Type 2, dòng xả định mức $I_n = 20\text{ kA}$, dòng xả cực đại $I_{max} = 40\text{ kA}$.
  - Điện áp làm việc liên tục cực đại ($U_c$):
    - Hệ 1 Pha: $U_c \ge 275\text{ VAC}$ (2P: L + N-PE).
    - Hệ 3 Pha: $U_c \ge 385\text{ - }440\text{ VAC}$ (4P: 3L + N-PE).
- **SPD DC:**
  - Lắp đặt trên từng kênh MPPT ngõ vào của Inverter.
  - Chuẩn: Type 2, điện áp làm việc $U_c \ge 600\text{ VDC}$ (hệ 1P) hoặc $U_c \ge 1000\text{ - }1500\text{ VDC}$ (hệ 3P).

#### 3. Bộ chuyển đổi nguồn tự động ATS (chỉ dùng cho hệ Hybrid):
- Chuyển mạch giữa Điện lưới EVN và Cổng cấp điện dự phòng Back-up/EPS của Inverter khi mất điện lưới.
- Cấu hình: ATS 2P 63A (hệ 1 Pha) hoặc ATS 4P 63A / 100A (hệ 3 Pha). Thời gian chuyển mạch $\le 20\text{ ms}$.

#### 4. Thiết bị chống phát ngược (Zero-Export Smart Meter):
- **Hệ 1 Pha:** Dùng Biến dòng kẹp CT 1 Pha đi kèm Inverter (tuyến cáp tín hiệu $< 10\text{m}$) hoặc Smart Meter 1P truyền thông RS485.
- **Hệ 3 Pha:** Dùng Smart Meter 3 Pha (như Chint DTSU666) kết hợp 3 cuộn biến dòng CT hở lõi kẹp vào 3 dây pha L1, L2, L3 ngay sau công tơ EVN, truyền tín hiệu về Inverter qua cáp mạng chống nhiễu xoắn đôi RS485 (cáp RS485 2x0.75mm² bọc kim).

---

### 3.5. Tính toán Phụ kiện kết cấu & Rail nhôm (Mounting Engine)

Áp dụng cho kết cấu mái tôn / mái ngói sử dụng thanh rail nhôm định hình chuyên dụng mác hợp kim **Al6005-T5** anode hóa độ dày lớp mạ $\ge 12\ \mu\text{m}$ và bu-lông Inox 304.

#### 1. Chiều dài thanh rail nhôm ($L_{rail}$):
Mỗi hàng pin cần 2 thanh ray song song đỡ dưới tấm pin:
$$L_{rail} = 2 \times \text{Số hàng} \times (\text{Số cột} \times W_{pin}) \times 1.05 \quad (\text{mét})$$
*(hệ số $1.05$ tính thêm $5\%$ phần dư dôi cắt gọt và đầu thừa).*

#### 2. Kẹp biên (End Clamp):
Gắn tại 2 đầu của mỗi thanh rail nhôm để giữ cố định tấm pin đầu tiên và cuối cùng:
$$\text{Số kẹp biên} = \text{Số hàng} \times 4 \quad (\text{Cái})$$

#### 3. Kẹp giữa (Mid Clamp):
Gắn giữa 2 tấm pin liền kề trên cùng 1 hàng:
$$\text{Số kẹp giữa} = (\text{Tổng số tấm pin} - \text{Số hàng}) \times 2 \quad (\text{Cái})$$

#### 4. Bát kẹp mái / Chân L (L-Feet) / Kẹp Seamlock:
Khoảng cách tiêu chuẩn giữa các điểm liên kết xà gồ là $1.1\text{m} - 1.2\text{m}$:
$$\text{Số chân L / Kẹp tôn} = \left\lceil \frac{L_{rail}}{1.1} \right\rceil \quad (\text{Bộ})$$

#### 5. Phụ kiện nối rail (Rail Splice):
Thanh nhôm ray tiêu chuẩn có chiều dài $4.2\text{m}$ (hoặc $2.1\text{m}$). Mỗi điểm nối 2 thanh ray cần 1 thanh nối rail nhôm kèm 2 bu-lông inox:
$$\text{Số nối rail} = \max\left(0, \left\lceil \frac{L_{rail}}{4.2} \right\rceil - \text{Số hàng}\right) \quad (\text{Bộ})$$

#### 6. Phụ kiện tiếp địa giàn khung:
- **Lá tiếp địa (Grounding Clip):** Kẹp giữa tấm pin và thanh rail để phá vỡ lớp cách điện anode, tạo liên kết dẫn điện liên tục giữa khung pin và rail. Số lượng = Số kẹp giữa.
- **Kẹp tiếp địa (Grounding Lug):** Bắt tại đầu mỗi dãy rail nhôm để đấu nối dây đồng trần hoặc dây cáp tiếp địa Cadivi CV PE về bãi cọc đất. Số lượng = $\text{Số hàng} \times 2$.

---

## PHẦN 4: LOGIC BÓC TÁCH VẬT TƯ (BOM) THEO MẪU BẢNG KÊ CHUẨN 4 NHÓM (A - B - C - D)

Toàn bộ hệ thống bóc tách vật tư tự động bám sát $100\%$ cấu trúc biểu mẫu **`Bảng kê vật tư mẫu.xlsx`** của công ty:

```
┌────────────────────────────────────────────────────────────────────────┐
│ PHẦN A: THIẾT BỊ CHÍNH (MAIN EQUIPMENT)                               │
│  ├─ 1. Biến tần năng lượng mặt trời (On-Grid / Hybrid 1P hoặc 3P)      │
│  ├─ 2. Tấm pin năng lượng mặt trời (620Wp - 630Wp Mono Half-cell)      │
│  ├─ 3. Pin lưu trữ Lithium (khi hệ Hybrid: 1P dùng 16kWh, 3P dùng 32kWh)│
│  ├─ 4. Biến dòng CT / Smart Meter đo bám tải Zero-Export               │
│  └─ 5. Tủ điện phân phối đóng cắt bảo vệ AC & DC tích hợp              │
├────────────────────────────────────────────────────────────────────────┤
│ PHẦN B: HỆ RAIL NHÔM / GIÀN KHUNG (MOUNTING & FRAMES)                 │
│  ├─ Phân mục 1: HỆ RAIL NHÔM (Nhôm Al6005-T5 Anodized)                 │
│  │   ├─ Thanh rail nhôm chuyên dụng 4.2m hoặc 2.1m                      │
│  │   ├─ Kẹp biên End Clamp 35mm / 30mm                                 │
│  │   ├─ Kẹp giữa Mid Clamp 35mm / 30mm                                 │
│  │   ├─ Nối rail nhôm kèm bu-lông                                      │
│  │   ├─ Chân L chống dột kèm đệm cao su EPDM / Kẹp Seamlock            │
│  │   ├─ Kẹp tiếp địa Lug đồng mạ thiếc                                 │
│  │   └─ Kẹp dây cáp Solar cố định thanh rail Inox 304                  │
│  └─ Phân mục 2: HỆ RAIL GIÀN KHUNG PHỤ TRỢ (Khung giàn sắt nếu có)     │
│      ├─ Thép hộp mạ kẽm nhúng nóng / xà gồ đỡ phụ                       │
│      ├─ Bản mã chân cột, bu-lông hóa chất Hilti                        │
│      └─ Sơn chống rỉ mối hàn mạ kẽm lạnh                               │
├────────────────────────────────────────────────────────────────────────┤
│ PHẦN C: THIẾT BỊ NGOẠI VI (PERIPHERAL & CABLING)                      │
│  ├─ 1. Cáp DC chuyên dụng Solar PV 1Cx4.0mm² (Ruột đồng mạ thiếc)       │
│  ├─ 2. Cáp DC chuyên dụng Solar PV 1Cx4.0mm² (Màu Đỏ & Đen)             │
│  ├─ 3. Dây cáp AC nguồn Inverter (Cadivi CV 1 lõi / 4 lõi)             │
│  ├─ 4. Cáp tiếp địa PE an toàn hệ thống (Cadivi CV Vàng/Xanh)          │
│  ├─ 5. Đầu nối MC4 chuyên dụng 1500V (Đực + Cái)                       │
│  ├─ 6. Cọc tiếp địa đồng D14 / D16 dài 2.4m                            │
│  ├─ 7. Mối hàn hóa nhiệt Goldweld / Kẹp tiếp địa đồng quả bàng          │
│  ├─ 8. Máng cáp Trunking mạ kẽm đục lỗ kèm nắp đậy                     │
│  ├─ 9. Ống ruột gà bọc nhựa PVC lõi thép luồn dây đi ngoài trời        │
│  └─ 10. Vật tư phụ: ốc vít Inox 304, đai xiết, băng keo, nhãn cảnh báo │
├────────────────────────────────────────────────────────────────────────┤
│ PHẦN D: CÁC CHI PHÍ KHÁC (LABOR & PERMITS)                             │
│  ├─ 1. Nhân công lắp đặt kết cấu cơ khí & tấm pin áp mái                │
│  ├─ 2. Nhân công đấu nối điện, kéo cáp, kiểm tra & cài đặt Inverter     │
│  ├─ 3. Chi phí hồ sơ thỏa thuận đấu nối & thủ tục điện lực EVN         │
│  └─ 4. Vận chuyển, bốc xếp, cẩu kéo thiết bị nặng lên mái              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## PHẦN 5: TOÀN BỘ CÔNG THỨC & LOGIC TÍNH TOÁN GIÁ, DÒNG TIỀN & HIỆU QUẢ KINH TẾ

### 5.1. Cơ cấu Đơn giá vốn, Giá bán, Chiết khấu & Thuế VAT

#### 1. Đơn giá vốn (Cost) và Đơn giá bán (Sell):
- Mỗi vật tư $i$ có đơn giá vốn $C_i$ (lấy từ cơ sở dữ liệu `materialsCatalog`).
- Tỷ lệ lợi nhuận định mức (Markup Margin %): $\text{Margin}\%$ (mặc định $20\% - 25\%$).
- Đơn giá bán của vật tư $i$:
  $$S_i = \text{Round}\left( C_i \times \left(1 + \frac{\text{Margin}\%}{100}\right) \right)$$
- Thành tiền vốn: $\text{TotalCost}_i = C_i \times \text{Qty}_i$
- Thành tiền bán: $\text{TotalSell}_i = S_i \times \text{Qty}_i$

#### 2. Tổng giá trị trước chiết khấu:
$$\text{RawCost} = \sum_{i} \text{TotalCost}_i$$
$$\text{RawSell} = \sum_{i} \text{TotalSell}_i$$

#### 3. Chiết khấu thương mại (Discount %):
Áp dụng chiết khấu $\text{Discount}\%$ trên tổng giá bán thương mại (ví dụ: $0\% - 5\%$):
$$\text{DiscountVnd} = \text{Round}\left( \frac{\text{RawSell} \times \text{Discount}\%}{100} \right)$$
$$\text{SubtotalAfterDiscount} = \text{RawSell} - \text{DiscountVnd}$$

#### 4. Thuế giá trị gia tăng (VAT %):
Áp dụng mức thuế suất VAT quy định (thường là $10\%$ hoặc $8\%$ tùy chính sách hiện hành):
$$\text{VatVnd} = \text{Round}\left( \frac{\text{SubtotalAfterDiscount} \times \text{Vat}\%}{100} \right)$$
$$\text{GrandTotalVnd} = \text{SubtotalAfterDiscount} + \text{VatVnd}$$

#### 5. Lợi nhuận gộp dự án (Gross Margin):
$$\text{GrossMarginVnd} = \text{SubtotalAfterDiscount} - \text{RawCost}$$
$$\text{GrossMargin}\% = \frac{\text{GrossMarginVnd}}{\text{SubtotalAfterDiscount}} \times 100$$

---

### 5.2. Công thức Suất đầu tư (Vnđ / kWp & Vnđ / Wp)

Suất đầu tư là chỉ số quan trọng hàng đầu để khách hàng và chủ đầu tư so sánh tính cạnh tranh trên thị trường:
- **Suất đầu tư chưa thuế (Pre-VAT) trên 1 kWp:**
  $$\text{Rate}_{\text{pre\_vat}} = \frac{\text{SubtotalAfterDiscount}}{P_{\text{installed\_kWp}}} \quad (\text{VNĐ / kWp})$$
- **Suất đầu tư trọn gói có thuế (Post-VAT) trên 1 kWp:**
  $$\text{Rate}_{\text{post\_vat}} = \frac{\text{GrandTotalVnd}}{P_{\text{installed\_kWp}}} \quad (\text{VNĐ / kWp})$$
- **Suất đầu tư tính trên 1 Wp:**
  $$\text{Rate}_{\text{per\_Wp}} = \frac{\text{Rate}_{\text{post\_vat}}}{1000} \quad (\text{VNĐ / Wp})$$

*Mức suất đầu tư tham chiếu thị trường:*
- Hệ On-Grid dân dụng & công nghiệp: $11.000.000 - 15.000.000\text{ đ/kWp}$ ($11.000 - 15.000\text{ đ/Wp}$).
- Hệ Hybrid ESS có lưu trữ Lithium: $18.000.000 - 26.000.000\text{ đ/kWp}$ (tùy dung lượng pin lưu trữ kWh).

---

### 5.3. Biểu giá điện EVN áp dụng

Hệ thống hỗ trợ 3 nhóm biểu giá điện chính của Tập đoàn Điện lực Việt Nam (EVN):

#### 1. Biểu giá điện sinh hoạt bậc thang (Quyết định số 2699/QĐ-BCT):
* Bậc 1 (0 - 50 kWh): $1.893\text{ đ/kWh}$
* Bậc 2 (51 - 100 kWh): $1.956\text{ đ/kWh}$
* Bậc 3 (101 - 200 kWh): $2.271\text{ đ/kWh}$
* Bậc 4 (201 - 300 kWh): $2.860\text{ đ/kWh}$
* Bậc 5 (301 - 400 kWh): $3.197\text{ đ/kWh}$
* Bậc 6 (Từ 401 kWh trở lên): $3.302\text{ đ/kWh}$  
*(Khi dùng điện mặt trời bám tải, toàn bộ lượng điện cắt giảm sẽ rơi vào các bậc giá cao nhất từ Bậc 4 đến Bậc 6 $\rightarrow$ Giá trị tiết kiệm thực tế đạt $2.900 - 3.300\text{ đ/kWh}$).*

#### 2. Biểu giá điện kinh doanh thương mại (Cấp điện áp dưới 6kV):
* Giờ bình thường: $2.870\text{ đ/kWh}$
* Giờ cao điểm (9h30 - 11h30 & 17h00 - 20h00): $4.937\text{ đ/kWh}$ *(Trùng giờ nắng đỉnh buổi sáng)*
* Giờ thấp điểm (22h00 - 04h00): $1.768\text{ đ/kWh}$

#### 3. Biểu giá điện sản xuất (Cấp điện áp dưới 6kV):
* Giờ bình thường: $1.826\text{ đ/kWh}$
* Giờ cao điểm: $3.383\text{ đ/kWh}$
* Giờ thấp điểm: $1.174\text{ đ/kWh}$

---

### 5.4. Mô hình Dòng tiền 20 năm có tính suy hao tấm pin 0.7%/năm

Cam kết bảo hành hiệu suất tuyến tính của các hãng pin Tier-1 (JA Solar, Longi, Jinko, Canadian Solar) là bảo hành hiệu suất 25 năm, suy hao năm đầu tối đa $2.0\%$ và các năm tiếp theo suy hao không quá $0.55\% - 0.70\%/\text{năm}$.

Trong mô hình tài chính của phần mềm:
- **Tỷ lệ suy hao công suất tấm pin hàng năm ($d$):** $0.70\%/\text{năm}$ ($d = 0.007$).
- **Hệ số suy hao công suất tại năm thứ $t$:**
  $$D_t = (1 - d)^{t - 1} = (1 - 0.007)^{t - 1}$$
  - Năm 1: $D_1 = 1.000$ ($100\%$)
  - Năm 5: $D_5 = (0.993)^4 \approx 0.972$ ($97.2\%$)
  - Năm 10: $D_{10} = (0.993)^9 \approx 0.939$ ($93.9\%$)
  - Năm 20: $D_{20} = (0.993)^{19} \approx 0.875$ ($87.5\%$)
- **Sản lượng điện phát ra tại năm thứ $t$ ($E_t$):**
  $$E_t = E_{\text{năm\_1}} \times D_t \quad (\text{kWh/năm})$$
- **Tỷ lệ tăng giá điện EVN dự kiến hàng năm ($g$):** Mặc định $1.0\%/\text{năm}$ ($g = 0.01$).
  $$\text{Tariff}_t = \text{Tariff}_1 \times (1 + g)^{t - 1} \quad (\text{VNĐ/kWh})$$
- **Số tiền điện tiết kiệm được trong năm thứ $t$ ($\text{Savings}_t$):**
  $$\text{Savings}_t = E_t \times K_{\text{daytime}} \times \text{Tariff}_t \quad (\text{VNĐ/năm})$$
- **Dòng tiền tiết kiệm tích lũy qua $t$ năm ($\text{CumulativeSavings}_t$):**
  $$\text{CumulativeSavings}_t = \sum_{k=1}^{t} \text{Savings}_k \quad (\text{VNĐ})$$
- **Dòng tiền ròng tích lũy ($\text{NetCashflow}_t$):**
  $$\text{NetCashflow}_t = \text{CumulativeSavings}_t - \text{GrandTotalVnd} \quad (\text{VNĐ})$$
  *(Khi $\text{NetCashflow}_t < 0$: Đang trong giai đoạn thu hồi vốn. Khi $\text{NetCashflow}_t \ge 0$: Đã hoàn vốn xong, toàn bộ là dòng tiền tự do).*

---

### 5.5. Công thức Thời gian hoàn vốn (Payback Period) & Tỷ suất nội hoàn (IRR)

#### 1. Thời gian hoàn vốn đầu tư giản đơn (Payback Period - Năm):
Thời điểm mà tổng tiền điện tiết kiệm tích lũy bắt đầu bù đắp hoàn toàn vốn đầu tư ban đầu:
$$\text{Tìm năm } T \text{ thỏa mãn: } \text{CumulativeSavings}_{T-1} < \text{GrandTotalVnd} \le \text{CumulativeSavings}_T$$
Thực hiện nội suy tuyến tính phần thập phân trong năm hoàn vốn $T$:
$$\text{PaybackYears} = (T - 1) + \frac{\text{GrandTotalVnd} - \text{CumulativeSavings}_{T-1}}{\text{Savings}_T}$$
*Kết quả:* Thông thường các hệ thống On-Grid có thời gian hoàn vốn đạt từ **3.5 đến 4.5 năm**; hệ Hybrid ESS đạt từ **4.8 đến 6.5 năm**. Toàn bộ 15 - 20 năm tuổi thọ còn lại của giàn pin là lợi nhuận ròng thuần túy.

#### 2. Tỷ suất sinh lời nội hoàn (IRR - Internal Rate of Return):
IRR là tỷ lệ chiết khấu $r$ làm cho Giá trị hiện tại thuần (NPV) của chuỗi dòng tiền 20 năm bằng 0:
$$\text{NPV}(r) = - \text{GrandTotalVnd} + \sum_{t=1}^{20} \frac{\text{Savings}_t}{(1 + r)^t} = 0$$
*Thuật toán giải trong tool:* Sử dụng phương pháp **Dò nhị phân (Binary Search)** với 40 bước lặp:
- Khởi tạo cận dưới $r_{low} = -10\%$ và cận trên $r_{high} = +60\%$.
- Tính điểm giữa $r_{mid} = \frac{r_{low} + r_{high}}{2}$.
- Nếu $\text{NPV}(r_{mid}) > 0 \rightarrow r_{low} = r_{mid}$; ngược lại $r_{high} = r_{mid}$.
- Sai số hội tụ $|\text{NPV}| < 1.000\text{ đ}$.
- Kết quả: $\text{IRR}\% = r_{mid} \times 100\%$ (thường đạt **$22\% - 32\%/\text{năm}$**, cao gấp 4 - 5 lần lãi suất tiền gửi ngân hàng).

---

### 5.6. Chỉ số Môi trường (Giảm phát thải CO2 & Cây xanh)

Tính toán giá trị tín chỉ xanh nhằm phục vụ hồ sơ ESG và quảng bá thương hiệu cho khách hàng doanh nghiệp:
- **Hệ số phát thải lưới điện Việt Nam:** $0.65\text{ kg CO}_2 / 1\text{ kWh}$ điện lưới sản xuất từ nhiên liệu hóa thạch.
- **Lượng phát thải khí nhà kính giảm được hàng năm:**
  $$\text{CO2Reduction} = \frac{E_{\text{năm\_1}} \times 0.65}{1000} \quad (\text{Tấn CO}_2 / \text{năm})$$
- **Số cây xanh tương đương trồng mới:**
  Mỗi cây xanh trưởng thành hấp thụ trung bình khoảng $22\text{ kg CO}_2/\text{năm}$ ($\approx 45\text{ cây / tấn CO}_2$):
  $$\text{TreesEquivalent} = \text{CO2Reduction} \times 45 \quad (\text{Cây xanh / năm})$$

---

## TỔNG KẾT BẢNG TRA CỨU CÔNG THỨC NHANH (CHEATSHEET KỸ SƯ)

| Bài toán | Công thức áp dụng | Đơn vị |
| :--- | :--- | :--- |
| **Công suất đề xuất** | $P_{\text{rec}} = \frac{A_{\text{tháng}} \times 0.7}{30 \times \text{GHI} \times K_{\text{hướng}} \times 0.85}$ | kWp |
| **Tỷ lệ DC/AC** | $\text{Ratio} = P_{DC} / P_{AC\_inv}$ (Chuẩn: $1.15 - 1.30$) | Tỷ số |
| **Dòng tải 1 Pha** | $I_b = \frac{P_{AC} \times 1000}{220 \times 0.9}$ | A |
| **Dòng tải 3 Pha** | $I_b = \frac{P_{AC} \times 1000}{\sqrt{3} \times 380 \times 0.9}$ | A |
| **Sụt áp 1 Pha** | $\Delta U\% = \frac{2 \times \rho \times L \times I_b \times \cos\varphi}{S \times 220} \times 100 \le 2.5\%$ | % |
| **Sụt áp 3 Pha** | $\Delta U\% = \frac{\sqrt{3} \times \rho \times L \times I_b \times \cos\varphi}{S \times 380} \times 100 \le 2.5\%$ | % |
| **Định mức CB** | $I_{n\_CB} \ge 1.25 \times I_b$ | A |
| **Dung lượng Pin Hybrid** | $C_{bat} = \frac{A_{\text{ngày}} \times 0.3}{0.9 \times 0.95}$ | kWh |
| **Chiều dài Rail nhôm** | $L_{rail} = 2 \times \text{Rows} \times (\text{Cols} \times W_{pin}) \times 1.05$ | m |
| **Số Kẹp biên** | $\text{EndClamp} = \text{Rows} \times 4$ | Cái |
| **Số Kẹp giữa** | $\text{MidClamp} = (\text{PanelQty} - \text{Rows}) \times 2$ | Cái |
| **Suất đầu tư có VAT** | $\text{Rate} = \frac{\text{GrandTotalVnd}}{P_{DC\_kWp}}$ | VNĐ/kWp |
| **Suy hao tấm pin năm $t$**| $E_t = E_1 \times (1 - 0.007)^{t - 1}$ | kWh |
| **Thời gian hoàn vốn** | $\text{Payback} = (T - 1) + \frac{\text{GrandTotal} - \text{Cumul}_{T-1}}{\text{Savings}_T}$ | Năm |
| **Tỷ suất hoàn vốn IRR** | Tìm $r$ sao cho $\sum_{t=1}^{20} \frac{\text{Savings}_t}{(1+r)^t} = \text{GrandTotal}$ | % |
