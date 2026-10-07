import { LayoutResult, RoofType, MountingResult } from '../types/solar';

export function calculateMounting(layout: LayoutResult, roofType: RoofType): MountingResult {
  const totalRows = layout.rows + (layout.extraRow ? 1 : 0);
  const rowWidthM = layout.cols * layout.pw;

  if (layout.panelQty <= 0 || totalRows <= 0) {
    return {
      supported: false,
      railLengthM: 0,
      lFeetQty: 0,
      clipLockQty: 0,
      midClampQty: 0,
      endClampQty: 0,
      groundingLugQty: 0,
      railJoinerQty: 0,
      roofType,
    };
  }

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

  // 6. Kẹp tiếp địa (2 đầu mỗi dãy rail nhôm nối dây tiếp địa = Số hàng * 2)
  const groundingLugQty = totalRows * 2;

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
