import { LayoutResult, RoofType, MountingResult } from '../types/solar';

export function calculateMounting(layout: LayoutResult, roofType: RoofType): MountingResult {
  const totalRows = layout.rows + (layout.extraRow ? 1 : 0);
  const rowWidthM = layout.cols * layout.pw;

  // 1. Chiều dài thanh rail nhôm (mỗi hàng pin cần 2 thanh ray song song)
  const railLengthM = Number((2 * totalRows * rowWidthM * 1.05).toFixed(1)); // 5% dư dôi

  // 2. Chân L / Kẹp tôn Cliplock: bước chân khoảng 1.1m
  const anchorSpacingM = 1.1;
  const lFeetQty = Math.ceil(railLengthM / anchorSpacingM);
  const clipLockQty = roofType === 'tole' ? lFeetQty : 0;

  // 3. Kẹp giữa (Mid clamp)
  const midClampQty = Math.max(0, (layout.panelQty - totalRows) * 2);

  // 4. Kẹp biên (End clamp): 2 đầu mỗi thanh ray -> 4 cái / hàng
  const endClampQty = totalRows * 4;

  // 5. Nối rail: thanh chuẩn 4.2m
  const standardBarM = 4.2;
  const railJoinerQty = Math.max(0, Math.ceil(railLengthM / standardBarM) - totalRows);

  // 6. Kẹp tiếp địa & lá tiếp địa
  const groundingLugQty = Math.max(totalRows * 2, Math.ceil(railLengthM / 10));

  return {
    supported: true,
    railLengthM,
    lFeetQty,
    clipLockQty,
    midClampQty,
    endClampQty,
    groundingLugQty,
    railJoinerQty,
    roofType,
  };
}
