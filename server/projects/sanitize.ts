import type { ServerUser, PricingSettings } from '../db.js';

export const PRICE_LOCKED_FIELDS = [
  'canopyUnitCostVnd',
  'transportCostVnd',
  'installCostVndPerKwp',
] as const;

export function sanitizeProjectWrite(
  existing: any | null,
  incoming: any,
  user: ServerUser,
  defaultPricing: PricingSettings
): any {
  const result = { ...(existing || {}), ...incoming };

  // 1. Ownership fields
  if (!existing || !existing.id) {
    result.createdByEmail = user.email.toLowerCase().trim();
    result.createdByName = user.fullName;
  } else {
    result.createdByEmail = existing.createdByEmail || user.email.toLowerCase().trim();
    result.createdByName = existing.createdByName || user.fullName;
  }

  // 2. Sharing fields: only owner or admin can change
  const isOwner = existing && existing.createdByEmail && existing.createdByEmail.toLowerCase().trim() === user.email.toLowerCase().trim();
  const isAdmin = user.role === 'admin';
  const canModifySharing = !existing || isOwner || isAdmin;

  if (!canModifySharing) {
    result.sharedWithEmails = existing ? existing.sharedWithEmails : [];
    result.sharedWithRoles = existing ? existing.sharedWithRoles : [];
    result.isPublic = existing ? existing.isPublic : false;
  } else {
    // Validate sharedWithRoles
    if (Array.isArray(result.sharedWithRoles)) {
      result.sharedWithRoles = result.sharedWithRoles.filter((r: string) => r === 'sales' || r === 'admin');
    }
    if (Array.isArray(result.sharedWithEmails)) {
      result.sharedWithEmails = result.sharedWithEmails.map((e: string) => String(e).toLowerCase().trim());
    }
  }

  // 3. Price fields locked for sales
  if (user.role === 'sales') {
    for (const field of PRICE_LOCKED_FIELDS) {
      const existingVal = existing ? existing[field] : undefined;
      const defaultVal = defaultPricing[field as keyof PricingSettings];
      const enforcedVal = existingVal !== undefined ? existingVal : defaultVal;

      if (incoming[field] !== undefined && incoming[field] !== enforcedVal) {
        console.warn(`[Security] Sales user ${user.email} attempted to alter price field ${field} (${incoming[field]} -> ${enforcedVal})`);
      }
      result[field] = enforcedVal;
    }
  } else {
    // Admin can set price fields; if omitted on new project, fall back to default
    for (const field of PRICE_LOCKED_FIELDS) {
      if (result[field] === undefined) {
        result[field] = defaultPricing[field as keyof PricingSettings];
      }
    }
  }

  // 4. Margin % (0-60) and Discount % (0-30) clamp
  const rawMargin = typeof result.marginPct === 'number' ? result.marginPct : defaultPricing.defaultMarginPct;
  result.marginPct = Math.min(60, Math.max(0, rawMargin));

  const rawDiscount = typeof result.discountPct === 'number' ? result.discountPct : defaultPricing.defaultDiscountPct;
  result.discountPct = Math.min(30, Math.max(0, rawDiscount));

  // 5. Clean deprecated SCADA and EVN docs fields
  delete result.includeEvnDocs;
  delete result.evnDocsCostVnd;
  delete result.includeScada;
  delete result.scadaCostVnd;

  return result;
}
