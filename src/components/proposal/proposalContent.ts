import { Project } from '../../types/solar';

/**
 * Nội dung chữ dùng chung cho Hồ Sơ Đề Xuất Giá Trị & Báo Giá:
 * - Bản in PDF (CustomerValueProposalPrint)
 * - Bản xuất Excel (engine/proposalExcel)
 * Sửa nội dung tại đây để hai bản luôn giống hệt nhau.
 */

/** Một đoạn chữ, `bold` tương ứng thẻ <strong> trên bản PDF */
export interface TextSegment {
  text: string;
  bold?: boolean;
}

export const PROPOSAL_TITLES = {
  badge: 'HỒ SƠ ĐỀ XUẤT ĐẦU TƯ & BÁO GIÁ THƯƠNG MẠI',
  title: 'HỆ THỐNG ĐIỆN MẶT TRỜI ÁP MÁI TỰ DÙNG (ZERO-EXPORT)',
  subtitle: 'Giải pháp cắt giảm chi phí điện, chống nóng công trình & nâng cao chỉ số phát triển bền vững ESG',
  values: '4 Giá Trị & Lợi Ích Cốt Lõi Dự Án Mang Lại Cho Khách Hàng:',
  financial: 'Hiệu Quả Kinh Tế & Phân Tích Dòng Tiền Đầu Tư:',
  chart: 'BIỂU ĐỒ RECHARTS DỰ PHÓNG TIẾT KIỆM TÍCH LŨY & HOÀN VỐN ĐẦU TƯ (20 NĂM)',
  chartDegradeNote: '(Đã tính tỷ lệ suy hao tấm pin 0.7%/năm)',
  chartFootnote:
    '* Dự toán tính toán chính xác có trừ suy hao công suất tấm pin 0.7%/năm theo cam kết hiệu suất 25 năm của hãng sản xuất.',
  cashflowTable: 'BẢNG DỰ PHÓNG DÒNG TIỀN TIẾT KIỆM (TÍNH TỶ LỆ SUY HAO TẤM PIN 0.7%/NĂM):',
  quote: 'Bảng Dự Toán Báo Giá Theo Mẫu Bảng Kê Vật Tư Thiết Bị (Phần A - B - C - D):',
  quoteHint: '(Bản tóm tắt · Chi tiết từng mã hàng xem tại Bảng Kê Vật Tư đính kèm)',
  ratePreVat: 'TỈ SUẤT ĐẦU TƯ (CHƯA VAT) / kWp:',
  warranty: 'Cam Kết Chất Lượng & Chính Sách Bảo Hành Chính Hãng:',
  customerSign: 'ĐẠI DIỆN KHÁCH HÀNG',
  companySign: 'ĐẠI DIỆN CÔNG TY TNHH HGC',
  signHint: '(Ký, ghi rõ họ tên & đóng dấu)',
} as const;

export const PROPOSAL_COMPANY = {
  name: 'CÔNG TY TNHH HGC',
  address: 'B36 TT7 Khu đô thị Văn Quán Hà Đông Hà Nội',
  web: 'https://hgcvn.com',
  email: 'hgc.vn2026@gmail.com',
  hotline: '0974 04 19 84 - 0989 09 97 35',
} as const;

export const PROPOSAL_QUOTE_NOTE =
  '* Báo giá đã bao gồm toàn bộ thiết bị chính hãng, phụ kiện mounting nhôm Anodized Al6005-T5, cáp điện Cadivi, tủ điện bám tải Zero-Export, nhân công lắp đặt và hồ sơ thỏa thuận Điện lực EVN.';

export const PROPOSAL_WARRANTIES: Array<{ label: string; text: string }> = [
  { label: 'Tấm pin quang điện:', text: 'Bảo hành hiệu suất 25 - 30 năm (>80% công suất danh định).' },
  { label: 'Biến tần Inverter:', text: 'Bảo hành tiêu chuẩn 5 năm chính hãng (hỗ trợ kỹ thuật 24/7).' },
  { label: 'Khung giàn ray nhôm Al6005-T5:', text: 'Bảo hành 12 năm chống ăn mòn, chịu gió bão cấp 12.' },
  { label: 'Hồ sơ pháp lý:', text: 'Đồng hành nghiệm thu kỹ thuật đấu nối và ký thỏa thuận với Điện lực EVN.' },
];

export type ProposalValueTheme = 'emerald' | 'amber' | 'teal' | 'blue';

export function getProposalValues(
  project: Project
): Array<{ theme: ProposalValueTheme; title: string; segments: TextSegment[] }> {
  const fin = project.financial;
  return [
    {
      theme: 'emerald',
      title: 'Cắt Giảm Tiền Điện & Tự Chủ Chi Phí',
      segments: [
        { text: 'Tự sản xuất điện sạch vào khung giờ làm việc ban ngày. Ước tính tiết kiệm ngay ' },
        {
          text: `${fin ? Math.round(fin.year1SavingsVnd / 1000000).toLocaleString('vi-VN') : 0} triệu đồng`,
          bold: true,
        },
        {
          text: ` trong năm đầu tiên (~${
            fin ? Math.round(fin.year1SavingsVnd / 12 / 1000000).toFixed(1) : 0
          } tr/tháng), phòng ngừa rủi ro giá điện EVN tăng lũy tiến hàng năm.`,
        },
      ],
    },
    {
      theme: 'amber',
      title: 'Hạ Nhiệt Mái Nhà & Bảo Vệ Tài Sản',
      segments: [
        { text: 'Hệ thống tấm pin hoạt động như một lớp mái kép cản xạ 85% ánh nắng trực tiếp, giúp ' },
        { text: 'hạ nhiệt độ mái tôn từ 3°C - 5°C', bold: true },
        {
          text: '. Không gian nhà xưởng mát hơn, giảm 15-25% điện năng tiêu thụ cho điều hòa/quạt hút và kéo dài tuổi thọ tôn mái.',
        },
      ],
    },
    {
      theme: 'teal',
      title: 'Tiêu Chuẩn Xanh ESG & Tín Chỉ I-REC',
      segments: [
        { text: 'Giảm phát thải ' },
        { text: `${fin?.co2ReductionTonsYear} tấn CO₂/năm`, bold: true },
        {
          text: ` (tương đương trồng ${fin?.treesEquivalentYear} cây xanh). Đủ điều kiện đăng ký chứng chỉ năng lượng tái tạo I-REC quốc tế, tạo lợi thế cạnh tranh xuất khẩu sang EU (thuế carbon CBAM) và Mỹ.`,
        },
      ],
    },
    {
      theme: 'blue',
      title: 'Vận Hành Bám Tải & An Toàn Tuyệt Đối',
      segments: [
        { text: 'Thiết bị Smart Meter thông minh kiểm soát công suất phát tức thời trong <0.2 giây, ' },
        { text: 'triệt tiêu phát ngược lên lưới điện 100%', bold: true },
        { text: '. Tủ điện AC phân phối tích hợp bảo vệ chống sét lan truyền Type 1+2 và ngắt sự cố hồ quang AFCI.' },
      ],
    },
  ];
}

export const roofTypeLabel = (roofType: Project['roofType']) =>
  roofType === 'tole' ? 'Tôn' : roofType === 'tile' ? 'Ngói' : 'Bê tông';

/** Các năm tiêu biểu hiển thị trong bảng dòng tiền của hồ sơ */
export const PROPOSAL_KEY_CASHFLOW_YEARS = [1, 2, 3, 4, 5, 10, 15, 20];
