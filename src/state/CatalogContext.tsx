import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { CatalogSnapshot, MaterialItem, PanelModel, InverterModel, PricingSettings } from '../types/solar';
import { fetchCatalog, fetchCatalogVersion } from '../services/catalogApi';
import { INITIAL_MATERIALS, INITIAL_PANELS, INITIAL_INVERTERS } from '../data/catalog';

const CACHE_KEY = 'hgc_catalog_cache_v2';

const DEFAULT_PRICING: PricingSettings = {
  defaultMarginPct: 18,
  defaultDiscountPct: 0,
  canopyUnitCostVnd: 450000,
  transportCostVnd: 3500000,
  installCostVndPerKwp: 550000,
};

interface CatalogContextType {
  catalog: CatalogSnapshot;
  loading: boolean;
  usingCache: boolean;
  cacheTime?: string;
  error: string | null;
  materials: MaterialItem[];
  panels: PanelModel[];
  inverters: InverterModel[];
  pricing: PricingSettings;
  version: number;
  reloadCatalog: () => Promise<void>;
}

const defaultSnapshot: CatalogSnapshot = {
  version: 1,
  materials: INITIAL_MATERIALS,
  panels: INITIAL_PANELS,
  inverters: INITIAL_INVERTERS,
  pricing: DEFAULT_PRICING,
};

const CatalogContext = createContext<CatalogContextType>({
  catalog: defaultSnapshot,
  loading: false,
  usingCache: false,
  error: null,
  materials: INITIAL_MATERIALS,
  panels: INITIAL_PANELS,
  inverters: INITIAL_INVERTERS,
  pricing: DEFAULT_PRICING,
  version: 1,
  reloadCatalog: async () => {},
});

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<CatalogSnapshot>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.snapshot) return parsed.snapshot;
      }
    } catch {}
    return defaultSnapshot;
  });

  const [loading, setLoading] = useState(true);
  const [usingCache, setUsingCache] = useState(false);
  const [cacheTime, setCacheTime] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [currentEtag, setCurrentEtag] = useState<string | undefined>(undefined);

  const loadFromServer = useCallback(async (forced = false) => {
    try {
      const res = await fetchCatalog(forced ? undefined : currentEtag);
      if (res && res.notModified) {
        // ETag matched, 304 Not Modified
        setLoading(false);
        setUsingCache(false);
        setError(null);
        return;
      }

      if (res && res.catalog) {
        setCatalog(res.catalog);
        setCurrentEtag(res.etag);
        setUsingCache(false);
        setError(null);
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              snapshot: res.catalog,
              savedAt: new Date().toISOString(),
              etag: res.etag,
            })
          );
        } catch {}
      } else {
        // Fallback to cache if available
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.snapshot) {
            setCatalog(parsed.snapshot);
            setUsingCache(true);
            setCacheTime(parsed.savedAt);
          }
        } else {
          setError('Không thể tải bảng giá từ máy chủ và không có dữ liệu lưu tạm.');
        }
      }
    } catch (err) {
      console.warn('[CatalogContext] Error loading catalog:', err);
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.snapshot) {
          setCatalog(parsed.snapshot);
          setUsingCache(true);
          setCacheTime(parsed.savedAt);
        }
      } else {
        setError('Lỗi kết nối khi tải bảng giá.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentEtag]);

  useEffect(() => {
    loadFromServer();
  }, []);

  // Periodic and on-focus version check (every 5 minutes)
  useEffect(() => {
    const checkVersion = async () => {
      const serverVer = await fetchCatalogVersion();
      if (serverVer !== null && serverVer !== catalog.version) {
        console.log(`[CatalogContext] Catalog version changed on server (${catalog.version} -> ${serverVer}), reloading...`);
        loadFromServer(true);
      }
    };

    const interval = setInterval(checkVersion, 5 * 60 * 1000);
    const handleFocus = () => {
      checkVersion();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [catalog.version, loadFromServer]);

  const value = useMemo(() => ({
    catalog,
    loading,
    usingCache,
    cacheTime,
    error,
    materials: catalog.materials || INITIAL_MATERIALS,
    panels: catalog.panels || INITIAL_PANELS,
    inverters: catalog.inverters || INITIAL_INVERTERS,
    pricing: catalog.pricing || DEFAULT_PRICING,
    version: catalog.version || 1,
    reloadCatalog: () => loadFromServer(true),
  }), [catalog, loading, usingCache, cacheTime, error, loadFromServer]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export function useCatalog() {
  return useContext(CatalogContext);
}
