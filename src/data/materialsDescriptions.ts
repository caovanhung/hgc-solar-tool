/**
 * Dữ liệu Mô Tả Kỹ Thuật & Cấu Thành Chi Phí Chuẩn Cho Từng Vật Tư & Thiết Bị
 * Lưu trữ trong Cơ Sở Dữ Liệu (PostgreSQL & JSON Storage)
 */

export interface ItemDescriptionMap {
  technicalDescription: string;
  costBreakdown: string;
}

export const STANDARD_MATERIALS_DESCRIPTIONS: Record<string, ItemDescriptionMap> = {
  // ==========================================
  // PHẦN A: THIẾT BỊ CHÍNH
  // ==========================================
  'inverter': {
    technicalDescription: 'Biến tần chuỗi (String Inverter) công nghệ Đức/Áo chuẩn công nghiệp, trang bị linh kiện bán dẫn công suất IGBT Infineon thế hệ mới, hiệu suất chuyển đổi cực đại lên tới 98.6%. Dải điện áp làm việc MPPT cực rộng, thuật toán bám điểm công suất cực đại MPPT đa kênh thích ứng bóng che. Tích hợp giám sát thời gian thực qua WiFi/4G/LAN đám mây 24/7. Cấp bảo vệ vỏ nhôm đúc nguyên khối đạt chuẩn IP65/IP66 ngoài trời chống tia UV, kháng bụi và chống nước ngập.',
    costBreakdown: 'Cấu thành chi phí gồm: Khối biến tần Inverter chính hãng nguyên thùng (82%), Card truyền thông Datalogger WiFi/4G thông minh (6%), Bộ phụ kiện giắc cắm AC/DC chống nước & giá treo tường chịu lực (5%), Chi phí dịch vụ bảo hành đổi mới 5 năm của nhà sản xuất (7%).',
  },
  'panel': {
    technicalDescription: 'Tấm pin quang điện thế hệ mới công nghệ tế bào N-Type TOPCon Mono Half-cell 16BB, hiệu suất quang năng vượt trội 22.8% - 23.3%. Kính cường lực quang học 3.2mm phủ lớp nano chống phản xạ ánh sáng (ARC) và tự làm sạch bề mặt khi trời mưa. Khung hợp kim nhôm Anodized Al6005-T5 chịu tải gió bão 2.400 Pa và tải tuyết/áp lực 5.400 Pa. Hộp đấu nối chống nước IP68 trang bị 3 diode bypass giảm thiểu hao hụt khi bị che bóng cục bộ. Tỷ lệ suy hao năm đầu <1.0%, suy hao các năm tiếp theo ≤0.4%/năm, cam kết bảo hành hiệu suất tuyến tính 25 - 30 năm.',
    costBreakdown: 'Cấu thành chi phí gồm: Tế bào quang điện Silicon N-Type TopCon loại A chính hãng (55%), Kính quang học cường lực chống phản quang & màng ép POE/EVA hai mặt chống lão hóa (16%), Khung nhôm Anodized gia cường góc & hộp đấu nối IP68 kèm cáp Solar (17%), Chi phí đóng kiện pallet chống rung vỡ tiêu chuẩn hàng hải & thử nghiệm Flash Test kiểm định quang học từng tấm (12%).',
  },
  'battery': {
    technicalDescription: 'Khối pin lưu trữ năng lượng Lithium Iron Phosphate (LiFePO4) cấp A dung lượng 16kWh - 32kWh, tuổi thọ trên 6.000 chu kỳ nạp/xả (tương đương 10 - 15 năm hoạt động bền bỉ). Tích hợp hệ thống quản lý pin thông minh BMS (Battery Management System) bảo vệ đa lớp: chống quá nạp, quá xả, quá dòng, ngắn mạch, kiểm soát nhiệt độ từng cell pin và cân bằng điện áp chủ động. Cổng giao tiếp CAN Bus / RS485 đồng bộ thời gian thực với Inverter Hybrid.',
    costBreakdown: 'Cấu thành chi phí gồm: Module Cell pin Lithium LiFePO4 dung lượng lớn cấp A nhập khẩu (68%), Mạch quản lý pin thông minh BMS và cảm biến nhiệt độ phân tán (15%), Vỏ tủ thép sơn tĩnh điện chống va đập, quạt tản nhiệt, thanh đồng dẫn dòng cao & aptomat DC an toàn (10%), Chi phí thử nghiệm kiểm định an toàn phòng cháy chữa cháy và bảo hiểm trách nhiệm sản phẩm (7%).',
  },
  'ct_meter': {
    technicalDescription: 'Thiết bị đo đếm điện năng hai chiều kỹ thuật số Class 0.5 kết hợp cảm biến biến dòng hở lõi CT. Cho phép kẹp trực tiếp vào dây pha tổng sau công tơ EVN mà không cần cắt điện nguồn. Tốc độ quét dòng điện <100ms, truyền dữ liệu qua giao thức RS485 Modbus RTU về Inverter để điều khiển phát công suất hòa lưới bám sát tải tiêu thụ thực tế (Zero-Export), ngăn chặn 100% dòng điện phát ngược lên lưới EVN.',
    costBreakdown: 'Cấu thành chi phí gồm: Cảm biến biến dòng đo đếm CT lõi hợp kim nano ferit chính xác cao (60%), Đồng hồ phân tích năng lượng điện thông minh hai chiều RS485 (25%), Cáp tín hiệu bọc kim chống nhiễu chuyên dụng & đầu nối vi sai (15%).',
  },
  'cabinet': {
    technicalDescription: 'Tủ điện điều khiển đóng cắt phân phối hợp bộ ngoài trời đạt cấp bảo vệ IP65 chống nước mưa và bụi bẩn. Vỏ tủ thép gia công CNC dày 1.2mm - 1.5mm sơn tĩnh điện 2 lớp ngoài trời chống ăn mòn. Tích hợp Aptomat MCB/MCCB bảo vệ quá tải và ngắn mạch tiêu chuẩn IEC 60947-2, chống sét lan truyền SPD Type 2 (In=20kA, Imax=40kA), đèn báo pha LED và cầu chì DC 1500V. Đối với hệ Hybrid trang bị thêm bộ chuyển nguồn tự động ATS thời gian chuyển mạch tức thời <20ms đảm bảo tải ưu tiên không bị mất điện gián đoạn.',
    costBreakdown: 'Cấu thành chi phí gồm: Vỏ tủ điện IP65 chống nước ngoài trời thép dày sơn tĩnh điện (20%), Thiết bị đóng cắt bảo vệ Aptomat MCB/MCCB Schneider/Chint (35%), Thiết bị chống sét lan truyền SPD AC & DC Type 2 (20%), Bộ chuyển mạch tự động ATS (hệ Hybrid) / phụ kiện thanh cái đồng nguyên chất & cầu chì (15%), Nhân công lắp ráp tủ, đi dây định hình cosse nhiệt và kiểm tra thí nghiệm xuất xưởng (10%).',
  },

  // ==========================================
  // PHẦN B: HỆ RAIL NHÔM & GIÀN KHUNG
  // ==========================================
  'rail': {
    technicalDescription: 'Thanh rail nhôm định hình chuyên dụng điện mặt trời mác hợp kim Al6005-T5 đạt độ cứng T6, bề mặt xử lý mạ Anodized chiều dày lớp mạ ≥12µm kháng ăn mòn axít, sương muối biển trên 25 năm. Thiết kế rãnh trượt chịu lực kép, tương thích với kẹp biên, kẹp giữa và bu-lông Inox 304 tiêu chuẩn. Khả năng chịu lực kéo nhổ và gió bão cấp 12 theo tiêu chuẩn kiểm định cơ lý TCVN.',
    costBreakdown: 'Cấu thành chi phí gồm: Phôi hợp kim nhôm Al6005-T5 nguyên chất nhập khẩu (60%), Chi phí đùn ép định hình khuôn kỹ thuật cao (15%), Quá trình mạ Anodized xử lý bề mặt chống oxy hóa muối biển (15%), Kiểm định tải trọng cơ lý, đóng gói bọc màng PE chống xước và vận chuyển kiện (10%).',
  },
  'joiner': {
    technicalDescription: 'Khớp nối thanh rail nhôm đúc định hình Al6005-T5 kèm bu-lông Inox 304 và tán trượt chuyên dụng. Dùng để nối liền 2 thanh rail 4.2m thành ray dài liên tục theo chiều dài mái, đảm bảo truyền lực uốn phẳng ổn định, không làm yếu kết cấu tại điểm nối.',
    costBreakdown: 'Cấu thành chi phí gồm: Phôi nhôm định hình gia công cắt CNC chuẩn xác (55%), Bộ 02 bu-lông lục giác và tán nhôm trượt Inox 304 chống kẹt rỉ (35%), Kiểm tra khớp nối dung sai đồng trục (10%).',
  },
  'mid_clamp': {
    technicalDescription: 'Kẹp giữa nhôm đúc mác Al6005-T5 mạ Anodized, đi kèm bu-lông lục giác chìm Inox 304 và con chạy định vị tự khóa. Ngàm kẹp giữ mép hai tấm pin liền kề trên thanh rail với lực siết định mức 12 - 15 Nm, tạo khe hở co giãn nhiệt chuẩn 20mm giữa các tấm pin.',
    costBreakdown: 'Cấu thành chi phí gồm: Thân kẹp nhôm đúc định hình chịu lực mạ Anodized (50%), Bu-lông lục giác chìm Inox 304 ren sâu không biến dạng (35%), Con chạy nhôm trượt tự định vị trong lòng rail (15%).',
  },
  'end_clamp': {
    technicalDescription: 'Kẹp biên khóa đầu dãy pin nhôm hợp kim Al6005-T5 kèm bu-lông Inox 304 và tán trượt. Giữ cố định tấm pin ngoài cùng của dãy áp sát thanh rail, chịu trực tiếp xung lực gió giật tại mép biên giàn pin.',
    costBreakdown: 'Cấu thành chi phí gồm: Thân kẹp biên nhôm đúc Anodized dày chịu lực uốn (52%), Bu-lông Inox 304 và đệm vênh chống tự nới lỏng (33%), Tán trượt khóa ray chuyên dụng (15%).',
  },
  'ground_disc': {
    technicalDescription: 'Lá tiếp địa (Grounding Clip) bằng thép không gỉ Inox 304 dập dập gai nhọn đa điểm. Được đặt giữa khung tấm pin và thanh rail tại vị trí kẹp giữa, gai dập sẽ xuyên thủng lớp cách điện Anodized để tạo liên kết dẫn điện đẳng thế liên tục cho toàn bộ giàn pin.',
    costBreakdown: 'Cấu thành chi phí gồm: Thép lá Inox 304 độ đàn hồi cao dập định hình gai nhọn (70%), Xử lý nhiệt thụ động hóa bề mặt chống ăn mòn điện hóa (20%), Đóng gói vỉ chống va đập bẹp gai dẫn điện (10%).',
  },
  'ground_clamp_set': {
    technicalDescription: 'Bộ kẹp tiếp địa an toàn (Grounding Lug) hợp kim đồng mạ thiếc kèm bu-lông Inox 304 và răng cắn rail. Bắt tại đầu mỗi dãy rail nhôm để đấu nối dây đồng trần hoặc dây cáp tiếp địa Cadivi CV PE thoát dòng rò và xung điện sét xuống bãi cọc tiếp địa.',
    costBreakdown: 'Cấu thành chi phí gồm: Thân kẹp đồng đúc mạ thiếc dẫn điện và chống oxy hóa (60%), Bu-lông Inox 304 siết giữ dây cáp tiếp địa chắc chắn (25%), Kiểm định điện trở tiếp xúc đạt chuẩn IEC 62561 (15%).',
  },
  'l_feet': {
    technicalDescription: 'Chân đế chữ L bằng nhôm đúc Al6005-T5 gia cường gân tăng cứng, đi kèm vít bắn xà gồ thép mạ kẽm nhúng nóng và đệm cao su EPDM đàn hồi chịu nhiệt ngoài trời. Liên kết thanh rail nhôm vững chắc vào xà gồ mái tôn sóng vuông mà không làm thấm dột nước mưa.',
    costBreakdown: 'Cấu thành chi phí gồm: Thân chân đế L nhôm đúc Al6005-T5 dày chịu lực uốn (50%), Vòng đệm cao su EPDM nguyên sinh kháng UV chống dột 25 năm (20%), Vít tự khoan mạ kẽm nhúng nóng bắn xà gồ & bu-lông bắt rail (30%).',
  },
  'steel_frame': {
    technicalDescription: 'Thép hộp mạ kẽm nhúng nóng tiêu chuẩn chất lượng cao Hòa Phát / Hoa Sen, độ dày 1.4mm - 1.8mm. Gia công kèo cột giàn khung nâng cao chịu tải trọng gió bão cấp 12. Mối hàn gia công được mài sạch xỉ và sơn phủ mạ kẽm lạnh Zinc bảo vệ chống gỉ sét tuyệt đối.',
    costBreakdown: 'Cấu thành chi phí gồm: Thép hộp mạ kẽm chính hãng theo quy cách kích thước (65%), Bản mã chân cột thép tấm đột lỗ & bu-lông nở sắt neo chịu lực (15%), Vật tư que hàn, sơn lót mạ kẽm lạnh, keo chống thấm chân cột (10%), Hao hụt gia công cắt mòi định hình và bảo hộ thi công cơ khí (10%).',
  },

  // ==========================================
  // PHẦN C: THIẾT BỊ NGOẠI VI & CÁP ĐIỆN
  // ==========================================
  'dc_cable': {
    technicalDescription: 'Dây cáp điện DC chuyên dụng năng lượng mặt trời 1Cx4.0mm² / 1Cx6.0mm² điện áp 1500V DC tiêu chuẩn Châu Âu EN 50618 / IEC 62930. Ruột dẫn bằng đồng nguyên chất mạ thiếc nhiều sợi mềm dẻo, 2 lớp vỏ bọc cách điện XLPO liên kết chéo chống tia cực tím UV, chống cháy lan, không sinh khí độc Halogen và chịu nhiệt độ làm việc từ -40°C đến +120°C.',
    costBreakdown: 'Cấu thành chi phí gồm: Lõi đồng 99.99% mạ thiếc chống oxy hóa ăn mòn (60%), Hợp chất bọc cách điện và vỏ ngoài XLPO chịu nhiệt ngoài trời 25 năm (25%), Kiểm định cách điện chịu áp 6.5kV AC trong nước & chứng nhận TUV Rheinland (15%).',
  },
  'ac_cable': {
    technicalDescription: 'Dây cáp điện lực hạ thế ruột đồng 0.6/1kV tiêu chuẩn TCVN 6610-3 / IEC 60502-1 chính hãng Cadivi (CV 1 lõi / 4 lõi). Ruột đồng tinh chất 99.99% ủ mềm dẫn điện cực tốt, hạn chế sụt áp (<2.0%), vỏ bọc cách điện PVC nguyên sinh chịu nhiệt chống rò rỉ điện.',
    costBreakdown: 'Cấu thành chi phí gồm: Khối lượng đồng nguyên chất Cadivi theo tiêu chuẩn nhà máy (70%), Nhựa PVC cách điện chống cháy chậm & dầu bôi trơn luồn cáp (18%), Đóng gói cuộn kiểm định thông mạch, đo điện trở suất ruột dẫn và hao hụt vận chuyển (12%).',
  },
  'pe_cable': {
    technicalDescription: 'Dây cáp tiếp địa an toàn Cadivi CV màu Vàng - Xanh (dây Te) chuyên dụng. Kết nối đẳng thế từ khung giàn tấm pin, vỏ Inverter, vỏ tủ điện về bãi cọc tiếp địa bảo vệ tiếp đất chống giật và chống tĩnh điện sét lan truyền.',
    costBreakdown: 'Cấu thành chi phí gồm: Ruột đồng tinh chất dẫn dòng sự cố nhanh xuống đất (72%), Lớp nhựa cách điện PVC màu Vàng-Xanh chuẩn quốc tế (18%), Đầu cốt đồng mạ thiếc bấm ép thủy lực và ống co nhiệt bảo vệ mối nối (10%).',
  },
  'mc4': {
    technicalDescription: 'Đầu nối MC4 1500V DC đực/cái chuẩn IP68 chống ngập nước, tiếp điểm bằng đồng hợp kim mạ bạc với điện trở tiếp xúc siêu thấp <0.25 mOhm, ngàm khóa tự giữ an toàn chịu lực kéo >300N, ngăn ngừa phát sinh hồ quang điện DC.',
    costBreakdown: 'Cấu thành chi phí gồm: Chốt tiếp xúc đồng mạ bạc dẫn dòng lớn 30A (45%), Vỏ nhựa kỹ thuật PPO chống cháy UL94-V0 kháng tia UV & ron cao su làm kín nước (40%), Kiểm tra lực bấm cosse và thử nghiệm kín nước ngập sâu (15%).',
  },
  'earth_rod': {
    technicalDescription: 'Cọc tiếp địa mạ đồng nguyên chất Ø16 dài 2.4m, lõi thép carbon cường lực cao bọc lớp đồng điện phân dày ≥254µm, chống ăn mòn trong môi trường đất ẩm trên 30 năm. Kết hợp kẹp quả bàng đồng vàng D16 siết bu-lông chắc chắn, đảm bảo trị số điện trở đất toàn hệ thống Rtd ≤ 4 Ohm.',
    costBreakdown: 'Cấu thành chi phí gồm: Thép carbon kéo nguội phủ đồng điện phân dày chống rỉ (70%), Kẹp cọc tiếp địa bằng đồng đúc vàng kèm bu-lông siết cáp (20%), Nhân công đóng cọc liên kết bãi tiếp địa và đo kiểm định bằng đồng hồ đo đất chuyên dụng (10%).',
  },
  'conduit_trunking': {
    technicalDescription: 'Hệ thống bảo vệ tuyến cáp: nẹp máng gen PVC chống cháy tự dập tắt và ống ruột gà bọc nhựa PVC lõi thép chịu lực. Bảo vệ đường dây đi ngoài trời chống chuột bọ cắn phá, ngăn nước mưa ngấm và hạn chế lão hóa do ánh nắng mặt trời.',
    costBreakdown: 'Cấu thành chi phí gồm: Máng gen nhựa PVC chống cháy & ống ruột gà lõi thép bọc nhựa chống va đập (65%), Đầu nối ren kín nước IP67, co vuông nối góc, cùm kẹp C cố định tường (25%), Vít nở tắc kê inox và băng keo cách điện chuyên dụng (10%).',
  },

  // ==========================================
  // PHẦN D: CÁC CHI PHÍ KHÁC & DỊCH VỤ EPC
  // ==========================================
  'labor_install': {
    technicalDescription: 'Đội ngũ kỹ sư & công nhân kỹ thuật chứng chỉ an toàn lao động cao trình, thợ điện bậc 4/7 chuyên ngành điện mặt trời. Thi công căn chỉnh khung rail chuẩn laser, kẹp pin đúng lực siết mô-men, bấm đầu cốt ép thủy lực, đi dây máng thẩm mỹ công nghiệp, cài đặt biến tần và thí nghiệm đóng điện nghiệm thu bàn giao.',
    costBreakdown: 'Cấu thành chi phí gồm: Nhân công cơ khí dựng khung rail và căn chỉnh gá kẹp tấm pin áp mái (40%), Nhân công điện kéo cáp DC/AC, luồn ống bảo vệ và đấu nối tủ điện (35%), Chi phí kỹ sư lập trình cài đặt Inverter, cân chỉnh pha và đóng điện vận hành thử (15%), Chi phí quản lý an toàn lao động, trang bị BHLĐ và bảo hiểm công trình (10%).',
  },
  'rent_equip': {
    technicalDescription: 'Bao gồm chi phí thuê xe cẩu tự hành đưa thiết bị lên mái cao, giàn giáo nhôm tiệp lắp đặt an toàn, máy đo điện trở cách điện Megohmmeter 1000V, máy đo bức xạ mặt trời Solar Power Meter, kẹp đo dòng True-RMS và máy cân laser chuyên dụng.',
    costBreakdown: 'Cấu thành chi phí gồm: Xe cẩu chuyên dùng bốc dỡ và nâng pallet tấm pin lên sàn mái (50%), Hệ thống giàn giáo an toàn và dây cứu sinh leo trèo cao trình (25%), Khấu hao bộ thiết bị đo kiểm định chuyên dụng Megger & Fluke (15%), Nhiên liệu vận hành máy móc thi công tại hiện trường (10%).',
  },
  'transport': {
    technicalDescription: 'Vận chuyển trọn gói thiết bị pin, biến tần, thanh nhôm 4.2m và phụ kiện từ tổng kho HGC đến tận chân công trình bằng xe tải bạt che chuyên dụng. Đảm bảo chống va đập, bảo quản nguyên đai nguyên kiện hàng hóa.',
    costBreakdown: 'Cấu thành chi phí gồm: Cước xe tải vận chuyển đường dài từ kho tổng đến địa chỉ công trình (65%), Bốc xếp hai đầu kho và công trình (20%), Chi phí bảo hiểm hàng hóa trên đường vận chuyển (15%).',
  },
  'evn_docs': {
    technicalDescription: 'Hồ sơ thỏa thuận kỹ thuật đấu nối với Công ty Điện lực EVN địa phương: Bản vẽ thiết kế kỹ thuật một sợi (SLD), chứng chỉ xuất xưởng CO/CQ, báo cáo thí nghiệm đo kiểm rơ-le bảo vệ, nghiệm thu hệ thống đo đếm và hỗ trợ thủ tục cấp phép phát điện Zero-Export.',
    costBreakdown: 'Cấu thành chi phí gồm: Chi phí lập hồ sơ thiết kế kỹ thuật thỏa thuận đấu nối EVN (45%), Chi phí trung tâm kiểm định độc lập thí nghiệm thiết bị đóng cắt & đo điện trở đất (35%), Chi phí thủ tục nghiệm thu hiện trường cùng cán bộ kỹ thuật Điện lực (20%).',
  },
  'scada': {
    technicalDescription: 'Hệ thống giám sát SCADA Datalogger công nghiệp đa cổng RS485/Ethernet/4G, thu thập dữ liệu bức xạ, nhiệt độ tấm pin, công suất phát tức thời, điện áp từng MPPT và sản lượng phát lũy kế đưa lên máy chủ đám mây, cảnh báo sự cố tức thời qua Email và ứng dụng di động.',
    costBreakdown: 'Cấu thành chi phí gồm: Thiết bị phần cứng Datalogger công nghiệp đa kênh (55%), Cáp truyền thông bọc kim chống sét cảm ứng & bộ nguồn DC chuyên dụng (25%), Chi phí bản quyền máy chủ Cloud giám sát và kích hoạt ứng dụng di động (20%).',
  },
};

/**
 * Hàm lấy mô tả kỹ thuật và cấu thành chi phí chuẩn theo ID/mã vật tư/loại
 */
export function getItemDescriptionAndCostBreakdown(
  keyOrSku: string,
  categoryCode?: string,
  name?: string
): ItemDescriptionMap {
  const lower = (keyOrSku + ' ' + (name || '')).toLowerCase();

  if (lower.includes('inverter') || lower.includes('biến tần')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['inverter'];
  }
  if (lower.includes('pin') && (lower.includes('tấm') || lower.includes('panel') || lower.includes('620') || lower.includes('630'))) {
    return STANDARD_MATERIALS_DESCRIPTIONS['panel'];
  }
  if (lower.includes('lưu trữ') || lower.includes('lithium') || lower.includes('battery') || lower.includes('w16') || lower.includes('pylon')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['battery'];
  }
  if (lower.includes('biến dòng') || lower.includes('ct') || lower.includes('meter') || lower.includes('b-ct')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['ct_meter'];
  }
  if (lower.includes('tủ điện') || lower.includes('cabinet') || lower.includes('td-')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['cabinet'];
  }
  if (lower.includes('rail') || lower.includes('ray')) {
    if (lower.includes('nối') || lower.includes('joiner') || lower.includes('khớp')) {
      return STANDARD_MATERIALS_DESCRIPTIONS['joiner'];
    }
    return STANDARD_MATERIALS_DESCRIPTIONS['rail'];
  }
  if (lower.includes('kẹp giữa') || lower.includes('mid clamp') || lower.includes('mid-fravi')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['mid_clamp'];
  }
  if (lower.includes('kẹp biên') || lower.includes('end clamp') || lower.includes('end-fravi')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['end_clamp'];
  }
  if (lower.includes('lá tiếp địa') || lower.includes('ground-disc') || lower.includes('disc')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['ground_disc'];
  }
  if (lower.includes('kẹp tiếp địa') || lower.includes('lug') || lower.includes('ground-clamp')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['ground_clamp_set'];
  }
  if (lower.includes('chân l') || lower.includes('chân đế l') || lower.includes('lfeet') || lower.includes('l-feet')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['l_feet'];
  }
  if (lower.includes('thép hộp') || lower.includes('bản mã') || lower.includes('bulong,chống thấm') || lower.includes('giàn khung')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['steel_frame'];
  }
  if (lower.includes('dc') && (lower.includes('cáp') || lower.includes('dây') || lower.includes('solar') || lower.includes('helukabel'))) {
    return STANDARD_MATERIALS_DESCRIPTIONS['dc_cable'];
  }
  if (lower.includes('te') || lower.includes('vàng') || lower.includes('xanh') || lower.includes('pe')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['pe_cable'];
  }
  if ((lower.includes('ac') || lower.includes('nguồn') || lower.includes('cv')) && (lower.includes('cadivi') || lower.includes('cáp') || lower.includes('dây'))) {
    return STANDARD_MATERIALS_DESCRIPTIONS['ac_cable'];
  }
  if (lower.includes('mc4')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['mc4'];
  }
  if (lower.includes('cọc') || lower.includes('earth-rod')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['earth_rod'];
  }
  if (lower.includes('máng') || lower.includes('ống') || lower.includes('ruột gà') || lower.includes('tắc kê') || lower.includes('vít bắt')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['conduit_trunking'];
  }
  if (lower.includes('nhân công') || lower.includes('labor')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['labor_install'];
  }
  if (lower.includes('thuê thiết bị') || lower.includes('rent')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['rent_equip'];
  }
  if (lower.includes('vận chuyển') || lower.includes('transport')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['transport'];
  }
  if (lower.includes('hồ sơ evn') || lower.includes('thí nghiệm') || lower.includes('evn-docs')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['evn_docs'];
  }
  if (lower.includes('scada') || lower.includes('logger')) {
    return STANDARD_MATERIALS_DESCRIPTIONS['scada'];
  }

  // Default fallback
  return {
    technicalDescription: 'Vật tư linh kiện đạt chuẩn an toàn điện mặt trời theo tiêu chuẩn TCVN và IEC, kiểm định xuất xưởng chính hãng đầy đủ CO/CQ.',
    costBreakdown: 'Cấu thành chi phí gồm: Đơn giá phôi vật liệu chế tạo tại nhà máy (70%), Quy trình gia công hoàn thiện bề mặt và phụ kiện đồng bộ (20%), Chi phí bao gói bảo quản và kiểm định kỹ thuật (10%).',
  };
}

export interface SeedMaterialItem {
  id: string;
  categoryCode: string;
  categoryName: string;
  name: string;
  spec: string;
  sku: string;
  unit: string;
  costVnd: number;
  brand: string;
  origin: string;
  technicalDescription: string;
  costBreakdown: string;
}

export function getSeedCatalogMaterials(): SeedMaterialItem[] {
  const seeds: SeedMaterialItem[] = [
    // Phần A
    {
      id: 'bat-lv-16k',
      categoryCode: 'I',
      categoryName: 'Vật tư chính',
      name: 'Pin lưu trữ 16kWh Lithium Valley',
      spec: 'Điện áp thấp 51.2V, dung lượng 16kWh x 2 = 32kWh lưu trữ, BMS thông minh',
      sku: 'W16-5A',
      unit: 'Bộ',
      costVnd: 38292734,
      brand: 'LITHIUM VALLEY',
      origin: 'Chính hãng',
      ...STANDARD_MATERIALS_DESCRIPTIONS['battery'],
    },
    {
      id: 'bat-pylon-16k',
      categoryCode: 'I',
      categoryName: 'Vật tư chính',
      name: 'Bộ pin lưu trữ điện 16kWh Pylontech',
      spec: 'Điện áp thấp 51.2V, 16.38kWh, cable kit và chống cháy nổ an toàn',
      sku: 'FB-L-16',
      unit: 'Bộ',
      costVnd: 43000200,
      brand: 'PYLONTECH',
      origin: 'Chính hãng',
      ...STANDARD_MATERIALS_DESCRIPTIONS['battery'],
    },
    {
      id: 'b-ct-sensor',
      categoryCode: 'II',
      categoryName: 'Hệ bám tải',
      name: 'Biến dòng đo lường & Smart Meter',
      spec: 'Cảm biến biến dòng đo đếm phụ tải bám tải Zero-Export Class 0.5',
      sku: 'CT-MEASURE-ZERO',
      unit: 'Bộ',
      costVnd: 1800000,
      brand: 'Chint / VN',
      origin: 'Chính hãng',
      ...STANDARD_MATERIALS_DESCRIPTIONS['ct_meter'],
    },
    {
      id: 'td-hb-3p-1015',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Tủ điện Hybrid 10KW-15KW, 3 Pha tích hợp ATS',
      spec: 'Tích hợp ATS 4P 40A, MCB AC/DC, SPD chống sét Type 2 385V',
      sku: 'TD-HB3P1015K3S-ATS',
      unit: 'Bộ',
      costVnd: 5286600,
      brand: 'HGC / Schneider',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['cabinet'],
    },
    {
      id: 'td-hb-3p-20',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Tủ điện Hybrid 20KW, 3 Pha tích hợp ATS',
      spec: 'Tích hợp ATS 4P 63A, MCB AC/DC, SPD chống sét Type 2',
      sku: 'TD-HB3P20K4S-ATS',
      unit: 'Bộ',
      costVnd: 6252120,
      brand: 'HGC / Schneider',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['cabinet'],
    },
    {
      id: 'td-hb-3p-30',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Tủ điện Hybrid 30KW, 3 Pha tích hợp ATS',
      spec: 'Tích hợp ATS 4P 100A, MCCB 100A, CB AC/DC, SPD chống sét Type 2',
      sku: 'TD-HB3P30K-ATS',
      unit: 'Bộ',
      costVnd: 8800000,
      brand: 'HGC / Schneider',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['cabinet'],
    },
    {
      id: 'td-gt-15k3p',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'TỦ ĐIỆN HÒA LƯỚI 10KW-15KW 3PHA',
      spec: 'Kèm MCB/MCCB 40A 3P + SPD Type 2 385V + Đèn báo pha, cầu chì DC',
      sku: 'TD-GT-15K3P-2S2M',
      unit: 'Bộ',
      costVnd: 4500000,
      brand: 'HGC / Chint',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['cabinet'],
    },
    {
      id: 'td-gt-20k3p',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'TỦ ĐIỆN HÒA LƯỚI 20KW 3PHA',
      spec: 'Kèm MCCB 80A 3P + SPD Type 2 385V + Đèn báo pha, cầu chì DC',
      sku: 'TD-GT-20K3P-2S2M',
      unit: 'Bộ',
      costVnd: 5800000,
      brand: 'HGC / Chint',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['cabinet'],
    },
    {
      id: 'td-gt-10k1p',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'TỦ ĐIỆN HÒA LƯỚI 10KW 1PHA',
      spec: 'Kèm MCCB 63A 2P + SPD Chống sét Type 2 275V + Đèn báo pha',
      sku: 'TD-GT-10K1P-2S2M-SPD-E',
      unit: 'Bộ',
      costVnd: 3200000,
      brand: 'HGC / Chint',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['cabinet'],
    },

    // Phần B: Hệ Rail & Giàn Khung
    {
      id: 'm-rail',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Thanh rail nhôm Anodized Al6005-T5 chuyên dụng NLMT',
      spec: 'Kích thước 28x50mm, dài 4.2m, kháng ăn mòn muối biển',
      sku: 'HLC-RAIL-AL42',
      unit: 'm',
      costVnd: 85000,
      brand: 'HLC',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['rail'],
    },
    {
      id: 'm-joiner-hopergy',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Nối rail nhôm kèm bu lông M8 Inox 304',
      spec: 'Khớp nối thanh rail kèm bu lông Inox 304',
      sku: 'SK-SSC',
      unit: 'Cái',
      costVnd: 22000,
      brand: 'Hopergy',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['joiner'],
    },
    {
      id: 'm-mid-fravi',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Kẹp giữa 30/35mm nhôm đúc kèm bu lông Inox 304',
      spec: 'Kẹp giữa Al6005-T5 cho pin dày 30/35mm',
      sku: 'KEPGIUA-FSL-MC40',
      unit: 'Cái',
      costVnd: 12000,
      brand: 'Fravi',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['mid_clamp'],
    },
    {
      id: 'm-end-fravi',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Kẹp biên 30/35mm nhôm đúc kèm bu lông Inox 304',
      spec: 'Kẹp biên Al6005-T5 cho pin dày 30/35mm chốt đầu dãy pin',
      sku: 'KEPBIEN-FSL-EC30',
      unit: 'Cái',
      costVnd: 12000,
      brand: 'Fravi',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['end_clamp'],
    },
    {
      id: 'g-ground-disc',
      categoryCode: 'VI',
      categoryName: 'Hệ thống phụ trợ',
      name: 'Lá tiếp địa Inox 304 đâm thủng Anode',
      spec: 'Inox 304 tạo liên kết đẳng thế giữa khung pin và rail nhôm',
      sku: 'AC-EPL01',
      unit: 'Cái',
      costVnd: 6000,
      brand: 'Hopergy',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['ground_disc'],
    },
    {
      id: 'g-ground-clamp-set',
      categoryCode: 'VI',
      categoryName: 'Hệ thống phụ trợ',
      name: 'Kẹp tiếp địa + lá kẹp tiếp địa Lug đồng mạ thiếc',
      spec: 'Bộ kẹp tiếp địa an toàn liên kết dây đồng trần vào hệ rail',
      sku: 'AC-ELG01-NS1',
      unit: 'Cái',
      costVnd: 22000,
      brand: 'Hopergy',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['ground_clamp_set'],
    },
    {
      id: 'm-lfeet-hopergy',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Chân đế chữ L kèm đệm cao su EPDM & vít bắn tôn',
      spec: 'Chân đế L nhôm đúc chống bão kèm bulong inox và đệm cao su EPDM',
      sku: 'TRB-F01-NS1',
      unit: 'Cái',
      costVnd: 28000,
      brand: 'Hopergy',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['l_feet'],
    },
    {
      id: 'm-steel-30x60',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Thép hộp 30x60x1.4mm mạ kẽm nhúng nóng',
      spec: 'Thép hộp mạ kẽm cây dài 6m chống ăn mòn xà gồ phụ',
      sku: 'THEP-HOP-30X60',
      unit: 'Cây',
      costVnd: 280000,
      brand: 'Hòa Phát',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['steel_frame'],
    },
    {
      id: 'm-steel-40x80',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Thép hộp 40x80x1.4mm mạ kẽm nhúng nóng',
      spec: 'Thép hộp mạ kẽm cây dài 6m làm xà gồ đỡ thanh rail',
      sku: 'THEP-HOP-40X80',
      unit: 'Cây',
      costVnd: 380000,
      brand: 'Hòa Phát',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['steel_frame'],
    },
    {
      id: 'm-steel-50x100',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Thép hộp 50x100x1.8mm mạ kẽm nhúng nóng',
      spec: 'Thép hộp mạ kẽm dày 1.8mm làm kèo chịu lực chính',
      sku: 'THEP-HOP-50X100',
      unit: 'Cây',
      costVnd: 650000,
      brand: 'Hòa Phát',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['steel_frame'],
    },

    // Phần C: Ngoại vi & Cáp điện
    {
      id: 'e-dc-helukabel-red',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Dây cáp DC chuyên dụng solar 1x4mm² (Đỏ)',
      spec: '1500V DC, đồng mạ thiếc, vỏ bọc kép XLPO chống tia UV Helukabel',
      sku: 'RT-RED-4MM2-HELU',
      unit: 'Mét',
      costVnd: 16500,
      brand: 'Helukabel',
      origin: 'Đức',
      ...STANDARD_MATERIALS_DESCRIPTIONS['dc_cable'],
    },
    {
      id: 'e-dc-helukabel-black',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Dây cáp DC chuyên dụng solar 1x4mm² (Đen)',
      spec: '1500V DC, đồng mạ thiếc, vỏ bọc kép XLPO chống tia UV Helukabel',
      sku: 'SW-BLACK-4MM2-HELU',
      unit: 'Mét',
      costVnd: 16500,
      brand: 'Helukabel',
      origin: 'Đức',
      ...STANDARD_MATERIALS_DESCRIPTIONS['dc_cable'],
    },
    {
      id: 'e-cv-8mm2',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Dây cáp động lực 1Cx8 mm² (Cadivi CV)',
      spec: '0.6/1kV ruột đồng cách điện PVC Cadivi (4 sợi 3P+N)',
      sku: 'CV-8mm2',
      unit: 'Mét',
      costVnd: 52000,
      brand: 'Cadivi',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['ac_cable'],
    },
    {
      id: 'e-cv-10mm2',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Dây cáp động lực 1Cx10 mm² (Cadivi CV)',
      spec: '0.6/1kV ruột đồng cách điện PVC Cadivi',
      sku: 'CV-10mm2',
      unit: 'Mét',
      costVnd: 68000,
      brand: 'Cadivi',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['ac_cable'],
    },
    {
      id: 'e-pe-6mm2',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Dây cáp động lực PE 6 mm² (Màu Te / Vàng -Xanh)',
      spec: 'Dây đồng đơn bọc cách điện màu Te tiếp địa bảo vệ Inverter & vỏ tủ điện',
      sku: 'CV-6mm2-PE',
      unit: 'Mét',
      costVnd: 38000,
      brand: 'Cadivi',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['pe_cable'],
    },
    {
      id: 'e-mc4-leader',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Bộ nối của tấm pin quang điện mặt trời MC4',
      spec: 'Đầu nối giắc MC4 đực/cái 1500V DC, chân đồng mạ bạc IP68',
      sku: 'Solar-Connector-MC4',
      unit: 'Bộ',
      costVnd: 25000,
      brand: 'Leader',
      origin: 'Chính hãng',
      ...STANDARD_MATERIALS_DESCRIPTIONS['mc4'],
    },
    {
      id: 'g-earth-rod-16',
      categoryCode: 'VI',
      categoryName: 'Hệ thống phụ trợ',
      name: 'Cọc nối đất mạ đồng Ø16 dài 2.4m',
      spec: 'Cọc thép mạ đồng nguyên chất D16 dài 2.4 mét đạt chuẩn tiếp địa',
      sku: 'COC16X2M4',
      unit: 'Cây',
      costVnd: 280000,
      brand: 'VN',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['earth_rod'],
    },
    {
      id: 't-trunking-40x60',
      categoryCode: 'V',
      categoryName: 'Hệ thống máng cáp',
      name: 'Máng gen luồn dây điện: 40x60mm, dài 2m',
      spec: 'Nẹp máng gen luồn dây điện PVC chống cháy 40x60mm cây 2 mét',
      sku: 'GA60/02',
      unit: 'Thanh',
      costVnd: 65000,
      brand: 'VN',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['conduit_trunking'],
    },
    {
      id: 't-flex-conduit-34',
      categoryCode: 'V',
      categoryName: 'Hệ thống máng cáp',
      name: 'Ống ruột gà lõi thép bọc nhựa Φ34',
      spec: 'Ống mềm ruột gà lõi thép bọc nhựa PVC chống thấm nước IP67 CVL',
      sku: 'OMB34VCL',
      unit: 'Mét',
      costVnd: 58000,
      brand: 'CVL',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['conduit_trunking'],
    },

    // Phần D: Dịch vụ & Chi phí khác
    {
      id: 'bom-labor-install',
      categoryCode: 'VIII',
      categoryName: 'Chi phí dịch vụ',
      name: 'Chi phí nhân công lắp đặt',
      spec: 'Nhân công cơ khí khung rail, lắp đặt tấm pin, đấu nối tủ điện & đóng điện trọn gói',
      sku: 'LABOR-EPC-KWP',
      unit: 'Hệ',
      costVnd: 550000,
      brand: 'HGC',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['labor_install'],
    },
    {
      id: 's-rent-equip',
      categoryCode: 'VIII',
      categoryName: 'Chi phí dịch vụ',
      name: 'Chi phí thuê thiết bị',
      spec: 'Xe cẩu chuyên dùng, giàn giáo nhôm tiệp, máy đo kiểm định chuyên dụng',
      sku: 'EQUIP-RENT-SITE',
      unit: 'Hệ',
      costVnd: 2500000,
      brand: 'VN',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['rent_equip'],
    },
    {
      id: 'bom-transport-cost',
      categoryCode: 'VIII',
      categoryName: 'Chi phí dịch vụ',
      name: 'Chi phí vận chuyển & cẩu kéo vật tư',
      spec: 'Vận chuyển thiết bị, cẩu kéo tấm pin & vật tư đến chân công trình',
      sku: 'TRANS-CRANE-SITE',
      unit: 'Hệ',
      costVnd: 3500000,
      brand: 'VN',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['transport'],
    },
    {
      id: 'bom-evn-docs',
      categoryCode: 'VIII',
      categoryName: 'Chi phí dịch vụ',
      name: 'Thí nghiệm đo kiểm định điện & Lập hồ sơ kỹ thuật thỏa thuận EVN',
      spec: 'Hồ sơ pháp lý nghiệm thu kỹ thuật đấu nối với Điện lực EVN',
      sku: 'SERVICE-EVN-DOCS',
      unit: 'Hệ',
      costVnd: 4500000,
      brand: 'HGC',
      origin: 'Việt Nam',
      ...STANDARD_MATERIALS_DESCRIPTIONS['evn_docs'],
    },
    {
      id: 'bom-scada-logger',
      categoryCode: 'X',
      categoryName: 'Hệ thống Scada',
      name: 'Datalogger thông minh & Thiết bị truyền thông đám mây 24/7',
      spec: 'Cổng RS485/WiFi/4G giám sát thời gian thực qua App/Web',
      sku: 'SCADA-LOGGER-IOT',
      unit: 'Bộ',
      costVnd: 3200000,
      brand: 'VN',
      origin: 'Chính hãng',
      ...STANDARD_MATERIALS_DESCRIPTIONS['scada'],
    },
  ];

  return seeds;
}

