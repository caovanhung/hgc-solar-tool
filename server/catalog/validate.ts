export interface ValidationError {
  field: string;
  message: string;
}

export function validateCatalogItem(
  kind: 'material' | 'panel' | 'inverter' | 'settings',
  data: any
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: [{ field: 'root', message: 'Dữ liệu không hợp lệ (phải là đối tượng JSON)' }] };
  }

  // ID validation for items
  if (kind !== 'settings') {
    if (!data.id || typeof data.id !== 'string') {
      errors.push({ field: 'id', message: 'Mã định danh (id) là bắt buộc' });
    } else if (!/^[a-z0-9_.-]+$/i.test(data.id.trim())) {
      errors.push({ field: 'id', message: 'id chỉ chứa chữ cái, số, gạch nối (-), gạch dưới (_) hoặc dấu chấm (.)' });
    }
  }

  if (kind === 'material') {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push({ field: 'name', message: 'Tên vật tư/thiết bị là bắt buộc' });
    }
    if (!data.sku || typeof data.sku !== 'string' || !data.sku.trim()) {
      errors.push({ field: 'sku', message: 'Mã SKU là bắt buộc' });
    }
    if (!data.unit || typeof data.unit !== 'string' || !data.unit.trim()) {
      errors.push({ field: 'unit', message: 'Đơn vị tính (ĐVT) là bắt buộc' });
    }
    if (typeof data.costVnd !== 'number' || isNaN(data.costVnd) || data.costVnd < 0) {
      errors.push({ field: 'costVnd', message: 'Đơn giá vốn (costVnd) phải là số nguyên ≥ 0' });
    }
    const validCategories = ['I', 'II', 'IV', 'V', 'VI', 'VII', 'VIII'];
    if (!validCategories.includes(data.categoryCode)) {
      errors.push({ field: 'categoryCode', message: `Nhóm vật tư phải thuộc một trong các nhóm: ${validCategories.join(', ')}` });
    }
  } else if (kind === 'panel') {
    if (!data.brand || !String(data.brand).trim()) errors.push({ field: 'brand', message: 'Thương hiệu tấm pin là bắt buộc' });
    if (!data.model || !String(data.model).trim()) errors.push({ field: 'model', message: 'Model tấm pin là bắt buộc' });

    const numFields = ['wp', 'voc', 'vmpp', 'isc', 'impp', 'lengthMm', 'widthMm', 'priceHintVnd'];
    for (const f of numFields) {
      if (typeof data[f] !== 'number' || isNaN(data[f]) || data[f] <= 0) {
        errors.push({ field: f, message: `${f} phải là số dương (> 0)` });
      }
    }

    if (data.vmpp >= data.voc) {
      errors.push({ field: 'vmpp', message: `Điện áp cực đại Vmpp (${data.vmpp}V) phải nhỏ hơn điện áp hở mạch Voc (${data.voc}V)` });
    }
    if (data.impp >= data.isc) {
      errors.push({ field: 'impp', message: `Dòng điện cực đại Impp (${data.impp}A) phải nhỏ hơn dòng ngắn mạch Isc (${data.isc}A)` });
    }
  } else if (kind === 'inverter') {
    if (!data.brand || !String(data.brand).trim()) errors.push({ field: 'brand', message: 'Thương hiệu inverter là bắt buộc' });
    if (!data.model || !String(data.model).trim()) errors.push({ field: 'model', message: 'Model inverter là bắt buộc' });

    if (!['on_grid', 'hybrid', 'off_grid'].includes(data.type)) {
      errors.push({ field: 'type', message: 'Kiểu biến tần phải là on_grid, hybrid hoặc off_grid' });
    }
    if (!['1', '3'].includes(String(data.phases))) {
      errors.push({ field: 'phases', message: 'Số pha phải là 1 hoặc 3' });
    }

    const numFields = ['acKw', 'vdcMax', 'mpptCount', 'mpptVmin', 'mpptVmax', 'priceHintVnd'];
    for (const f of numFields) {
      if (typeof data[f] !== 'number' || isNaN(data[f]) || data[f] <= 0) {
        errors.push({ field: f, message: `${f} phải là số dương (> 0)` });
      }
    }

    if (data.mpptVmin >= data.mpptVmax) {
      errors.push({ field: 'mpptVmin', message: `mpptVmin (${data.mpptVmin}V) phải nhỏ hơn mpptVmax (${data.mpptVmax}V)` });
    }
    if (data.mpptVmax > data.vdcMax) {
      errors.push({ field: 'mpptVmax', message: `mpptVmax (${data.mpptVmax}V) không được vượt quá vdcMax (${data.vdcMax}V)` });
    }
  } else if (kind === 'settings') {
    if (typeof data.defaultMarginPct !== 'number' || data.defaultMarginPct < 0 || data.defaultMarginPct > 100) {
      errors.push({ field: 'defaultMarginPct', message: 'defaultMarginPct phải trong khoảng [0, 100]' });
    }
    if (typeof data.defaultDiscountPct !== 'number' || data.defaultDiscountPct < 0 || data.defaultDiscountPct > 100) {
      errors.push({ field: 'defaultDiscountPct', message: 'defaultDiscountPct phải trong khoảng [0, 100]' });
    }
    if (typeof data.canopyUnitCostVnd !== 'number' || data.canopyUnitCostVnd < 0) {
      errors.push({ field: 'canopyUnitCostVnd', message: 'canopyUnitCostVnd phải là số tiền ≥ 0' });
    }
    if (typeof data.transportCostVnd !== 'number' || data.transportCostVnd < 0) {
      errors.push({ field: 'transportCostVnd', message: 'transportCostVnd phải là số tiền ≥ 0' });
    }
    if (typeof data.installCostVndPerKwp !== 'number' || data.installCostVndPerKwp < 0) {
      errors.push({ field: 'installCostVndPerKwp', message: 'installCostVndPerKwp phải là số tiền ≥ 0' });
    }
  }

  return { valid: errors.length === 0, errors };
}
