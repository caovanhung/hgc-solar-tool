import { CatalogSnapshot, PricingSettings } from '../types/solar';
import { UserProfile } from '../types/user';

const API_BASE = '/api';

export async function fetchCatalog(etag?: string): Promise<{
  notModified?: boolean;
  catalog?: CatalogSnapshot;
  etag?: string;
} | null> {
  try {
    const headers: Record<string, string> = {};
    if (etag) headers['If-None-Match'] = etag;

    const res = await fetch(`${API_BASE}/catalog`, {
      headers,
      credentials: 'same-origin',
    });

    if (res.status === 304) {
      return { notModified: true, etag };
    }
    if (!res.ok) return null;

    const newEtag = res.headers.get('ETag') || undefined;
    const data = await res.json();
    return { catalog: data, etag: newEtag };
  } catch (err) {
    console.warn('[CatalogApi] Could not fetch catalog:', err);
    return null;
  }
}

export async function fetchCatalogVersion(): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/catalog/version`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.version === 'number' ? data.version : null;
  } catch (err) {
    return null;
  }
}

export async function createCatalogItem(kind: 'material' | 'panel' | 'inverter', data: any): Promise<{
  success: boolean;
  item?: any;
  version?: number;
  error?: string;
  errors?: any[];
}> {
  try {
    const res = await fetch(`${API_BASE}/catalog/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: resData.message || resData.error || 'Không thể tạo mới mục',
        errors: resData.errors,
      };
    }
    return { success: true, item: resData.item, version: resData.version };
  } catch (err) {
    return { success: false, error: 'Lỗi mạng khi kết nối máy chủ.' };
  }
}

export async function updateCatalogItem(
  kind: 'material' | 'panel' | 'inverter',
  id: string,
  data: any,
  expectedUpdatedAt?: string
): Promise<{
  success: boolean;
  item?: any;
  version?: number;
  stale?: boolean;
  latest?: any;
  error?: string;
  errors?: any[];
}> {
  try {
    const res = await fetch(`${API_BASE}/catalog/${kind}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ data, expectedUpdatedAt }),
    });
    const resData = await res.json();
    if (res.status === 409 && resData.error === 'STALE') {
      return {
        success: false,
        stale: true,
        latest: resData.latest,
        error: resData.message,
      };
    }
    if (!res.ok) {
      return {
        success: false,
        error: resData.message || resData.error || 'Không thể cập nhật mục',
        errors: resData.errors,
      };
    }
    return { success: true, item: resData.item, version: resData.version };
  } catch (err) {
    return { success: false, error: 'Lỗi mạng khi cập nhật.' };
  }
}

export async function toggleItemActiveStatus(
  kind: 'material' | 'panel' | 'inverter',
  id: string,
  currentActive: boolean
): Promise<{ success: boolean; version?: number; error?: string }> {
  try {
    const action = currentActive ? 'deactivate' : 'reactivate';
    const res = await fetch(`${API_BASE}/catalog/${kind}/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || data.error };
    return { success: true, version: data.version };
  } catch (err) {
    return { success: false, error: 'Lỗi mạng.' };
  }
}

export async function updatePricingSettingsApi(settings: PricingSettings): Promise<{
  success: boolean;
  pricing?: PricingSettings;
  version?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/catalog/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || data.error };
    return { success: true, pricing: data.pricing, version: data.version };
  } catch (err) {
    return { success: false, error: 'Lỗi kết nối khi cập nhật cài đặt giá.' };
  }
}

export async function importCatalogItems(rows: any[], kind: string, dryRun = false): Promise<{
  success: boolean;
  dryRun?: boolean;
  createCount?: number;
  updateCount?: number;
  unchangedCount?: number;
  errorCount?: number;
  errors?: any[];
  create?: any[];
  update?: any[];
  version?: number;
  error?: string;
}> {
  try {
    const url = `${API_BASE}/catalog/import${dryRun ? '?dryRun=1' : ''}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ rows, kind }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Import thất bại',
        errors: data.errors || [],
      };
    }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: 'Lỗi mạng khi import CSV.' };
  }
}

export async function fetchCatalogChanges(params: {
  kind?: string;
  itemId?: string;
  limit?: number;
  before?: number;
}): Promise<any[]> {
  try {
    const q = new URLSearchParams();
    if (params.kind) q.set('kind', params.kind);
    if (params.itemId) q.set('itemId', params.itemId);
    if (params.limit) q.set('limit', String(params.limit));
    if (params.before) q.set('before', String(params.before));

    const res = await fetch(`${API_BASE}/catalog/changes?${q.toString()}`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// User Management API for Admin
export async function fetchUsersList(): Promise<UserProfile[]> {
  try {
    const res = await fetch(`${API_BASE}/auth/users`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function updateUserRoleApi(id: string, role: 'admin' | 'sales'): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/auth/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || data.error };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Lỗi mạng.' };
  }
}

export async function deleteUserApi(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/auth/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || data.error };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Lỗi mạng.' };
  }
}
