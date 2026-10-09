import { Project, CatalogSnapshot } from '../types/solar';

export interface PriceDriftChange {
  lineId: string;
  name: string;
  sku: string;
  oldCost: number;
  newCost: number;
  qty: number;
  unit: string;
}

export interface PriceDriftResult {
  hasDrift: boolean;
  catalogVersionChanged: boolean;
  changedLines: PriceDriftChange[];
  inactiveLines: Array<{ lineId: string; name: string; sku: string }>;
  totalDeltaSellVnd: number;
}

export function detectPriceDrift(project: Project, catalog: CatalogSnapshot): PriceDriftResult {
  const result: PriceDriftResult = {
    hasDrift: false,
    catalogVersionChanged: false,
    changedLines: [],
    inactiveLines: [],
    totalDeltaSellVnd: 0,
  };

  if (!project || !project.bomLines || project.bomLines.length === 0) {
    return result;
  }

  const isVersionDiff = project.catalogVersion !== undefined && project.catalogVersion !== catalog.version;
  result.catalogVersionChanged = isVersionDiff;

  const matMap = new Map<string, any>();
  const skuMap = new Map<string, any>();
  for (const m of catalog.materials) {
    matMap.set(m.id, m);
    if (m.sku) skuMap.set(m.sku.toLowerCase().trim(), m);
  }

  const panelMap = new Map<string, any>();
  for (const p of catalog.panels) {
    panelMap.set(p.id, p);
  }

  const invMap = new Map<string, any>();
  for (const inv of catalog.inverters) {
    invMap.set(inv.id, inv);
  }

  let deltaCostSum = 0;

  for (const line of project.bomLines) {
    let catItem: any = null;

    if (line.materialId) {
      if (line.materialKind === 'panel') catItem = panelMap.get(line.materialId);
      else if (line.materialKind === 'inverter') catItem = invMap.get(line.materialId);
      else catItem = matMap.get(line.materialId);
    }

    if (!catItem && line.sku) {
      catItem = skuMap.get(line.sku.toLowerCase().trim());
    }

    if (!catItem) continue;

    if (catItem.isActive === false) {
      result.inactiveLines.push({
        lineId: line.id,
        name: line.name,
        sku: line.sku,
      });
    }

    const currentCost = typeof catItem.costVnd === 'number' ? catItem.costVnd : catItem.priceHintVnd;
    if (typeof currentCost === 'number' && currentCost !== line.unitCostVnd) {
      result.changedLines.push({
        lineId: line.id,
        name: line.name,
        sku: line.sku,
        oldCost: line.unitCostVnd,
        newCost: currentCost,
        qty: line.qty,
        unit: line.unit,
      });
      deltaCostSum += (currentCost - line.unitCostVnd) * line.qty;
    }
  }

  const marginMultiplier = 1 + (project.marginPct || 18) / 100;
  result.totalDeltaSellVnd = Math.round(deltaCostSum * marginMultiplier);
  result.hasDrift = result.changedLines.length > 0 || result.inactiveLines.length > 0 || isVersionDiff;

  return result;
}
