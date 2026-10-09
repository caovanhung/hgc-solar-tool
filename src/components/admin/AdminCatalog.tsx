import React, { useState, useEffect } from 'react';
import {
  Layers,
  Zap,
  Wrench,
  Search,
  Plus,
  Edit2,
  Check,
  Download,
  ShieldCheck,
  ArrowLeft,
  FileSpreadsheet,
  Upload,
  History,
  Power,
  RotateCcw,
  Sliders,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { MaterialItem, PanelModel, InverterModel, PricingSettings } from '../../types/solar';
import { useCatalog } from '../../state/CatalogContext';
import {
  createCatalogItem,
  updateCatalogItem,
  toggleItemActiveStatus,
  updatePricingSettingsApi,
  importCatalogItems,
  fetchCatalogChanges,
} from '../../services/catalogApi';
import { parseCsv, toCsv } from '../../utils/csv';
import { AdminUsers } from './AdminUsers';

interface AdminCatalogProps {
  onBack: () => void;
  currentUserId?: string;
}

export const AdminCatalog: React.FC<AdminCatalogProps> = ({ onBack, currentUserId }) => {
  const { catalog, reloadCatalog } = useCatalog();
  const [activeTab, setActiveTab] = useState<'materials' | 'panels' | 'inverters' | 'pricing' | 'users'>('materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Status message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit / Add Item States
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newMatForm, setNewMatForm] = useState<Partial<MaterialItem>>({
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    unit: 'm²',
    costVnd: 450000,
    source: 'catalog',
  });

  // Add Panel Modal
  const [showAddPanelModal, setShowAddPanelModal] = useState(false);
  const [newPanelForm, setNewPanelForm] = useState<Partial<PanelModel>>({
    brand: '',
    model: '',
    wp: 580,
    voc: 51.5,
    vmpp: 42.8,
    isc: 14.2,
    impp: 13.55,
    tech: 'N-Type TOPCon',
    lengthMm: 2278,
    widthMm: 1134,
    warrantyYears: 25,
    priceHintVnd: 1850000,
    efficiencyPct: 22.5,
  });

  // Add Inverter Modal
  const [showAddInvModal, setShowAddInvModal] = useState(false);
  const [newInvForm, setNewInvForm] = useState<Partial<InverterModel>>({
    brand: '',
    model: '',
    type: 'on_grid',
    phases: '3',
    acKw: 15,
    vdcMax: 1100,
    mpptCount: 2,
    mpptChannelsPerMppt: 1,
    mpptVmin: 160,
    mpptVmax: 1000,
    mpptMaxIsc: 30,
    maxDcKwp: 22.5,
    maxEfficiencyPct: 98.4,
    priceHintVnd: 28000000,
    supportsZeroExport: true,
  });

  // Pricing settings state
  const [pricingForm, setPricingForm] = useState<PricingSettings>(catalog.pricing);

  // History Drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{ kind: string; itemId?: string; title: string } | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // CSV Import Modal & Preview
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importRawRows, setImportRawRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Legacy local catalog banner in browser
  const [legacyBanner, setLegacyBanner] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('hgc_materials_catalog_excel_v1')) {
        setLegacyBanner(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (catalog.pricing) {
      setPricingForm(catalog.pricing);
    }
  }, [catalog.pricing]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // ---------------------------------------------------------
  // MATERIAL EDIT & SAVE
  // ---------------------------------------------------------
  const handleStartEdit = (m: MaterialItem) => {
    setEditingItemId(m.id);
    setEditForm({
      ...m,
      name: m.name,
      spec: m.spec,
      sku: m.sku,
      unit: m.unit,
      costVnd: m.costVnd,
      brand: m.brand || '',
      origin: m.origin || '',
      technicalDescription: m.technicalDescription || '',
      costBreakdown: m.costBreakdown || '',
    });
  };

  const handleSaveMaterialEdit = async (m: MaterialItem) => {
    setIsSaving(true);
    const updatedData = {
      ...m,
      ...editForm,
      costVnd: Number(editForm.costVnd || m.costVnd),
    };

    const res = await updateCatalogItem('material', m.id, updatedData, (m as any).updatedAt);
    setIsSaving(false);

    if (res.stale) {
      showToast('error', 'Mục này đã được người khác chỉnh sửa. Đang tải lại dữ liệu mới...');
      await reloadCatalog();
      setEditingItemId(null);
      return;
    }

    if (res.success) {
      showToast('success', `Đã cập nhật vật tư "${updatedData.name}" thành công.`);
      await reloadCatalog();
      setEditingItemId(null);
    } else {
      showToast('error', res.error || 'Lỗi khi lưu vật tư.');
    }
  };

  const handleToggleActive = async (kind: 'material' | 'panel' | 'inverter', id: string, currentActive: boolean) => {
    const res = await toggleItemActiveStatus(kind, id, currentActive);
    if (res.success) {
      showToast('success', currentActive ? 'Đã ngừng sử dụng mục này.' : 'Đã kích hoạt sử dụng lại.');
      await reloadCatalog();
    } else {
      showToast('error', res.error || 'Thao tác không thành công.');
    }
  };

  const handleAddMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatForm.name || !newMatForm.sku) {
      showToast('error', 'Vui lòng điền tên và mã SKU.');
      return;
    }

    const id = `mat-${Date.now()}-${newMatForm.sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const itemData: MaterialItem = {
      id,
      categoryCode: (newMatForm.categoryCode as any) || 'VII',
      categoryName: newMatForm.categoryName || 'Hạng mục xây dựng',
      name: newMatForm.name,
      spec: newMatForm.spec || '',
      sku: newMatForm.sku,
      unit: newMatForm.unit || 'Bộ',
      costVnd: Number(newMatForm.costVnd || 0),
      source: 'catalog',
      brand: newMatForm.brand || 'VN',
      origin: newMatForm.origin || 'Việt Nam',
      technicalDescription: newMatForm.technicalDescription || '',
      costBreakdown: newMatForm.costBreakdown || '',
    };

    const res = await createCatalogItem('material', itemData);
    if (res.success) {
      showToast('success', 'Đã thêm vật tư mới vào Catalog server thành công.');
      await reloadCatalog();
      setShowAddModal(false);
      setNewMatForm({
        categoryCode: 'VII',
        categoryName: 'Hạng mục xây dựng',
        unit: 'm²',
        costVnd: 450000,
        source: 'catalog',
      });
    } else {
      showToast('error', res.error || 'Không thể tạo mới vật tư.');
    }
  };

  // ---------------------------------------------------------
  // PANEL ADD & SAVE
  // ---------------------------------------------------------
  const handleAddPanelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPanelForm.brand || !newPanelForm.model) {
      showToast('error', 'Vui lòng nhập hãng và model tấm pin.');
      return;
    }
    const id = `panel-${Date.now()}-${newPanelForm.model.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const panelData: PanelModel = {
      ...(newPanelForm as PanelModel),
      id,
      wp: Number(newPanelForm.wp),
      voc: Number(newPanelForm.voc),
      vmpp: Number(newPanelForm.vmpp),
      isc: Number(newPanelForm.isc),
      impp: Number(newPanelForm.impp),
      lengthMm: Number(newPanelForm.lengthMm),
      widthMm: Number(newPanelForm.widthMm),
      priceHintVnd: Number(newPanelForm.priceHintVnd),
      warrantyYears: Number(newPanelForm.warrantyYears || 25),
      efficiencyPct: Number(newPanelForm.efficiencyPct || 22),
      source: 'verified',
    };

    const res = await createCatalogItem('panel', panelData);
    if (res.success) {
      showToast('success', 'Đã thêm model tấm pin mới vào Catalog server.');
      await reloadCatalog();
      setShowAddPanelModal(false);
    } else {
      showToast('error', res.error || 'Lỗi khi tạo tấm pin.');
    }
  };

  // ---------------------------------------------------------
  // INVERTER ADD & SAVE
  // ---------------------------------------------------------
  const handleAddInvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvForm.brand || !newInvForm.model) {
      showToast('error', 'Vui lòng nhập hãng và model inverter.');
      return;
    }
    const id = `inv-${Date.now()}-${newInvForm.model.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const invData: InverterModel = {
      ...(newInvForm as InverterModel),
      id,
      acKw: Number(newInvForm.acKw),
      vdcMax: Number(newInvForm.vdcMax),
      mpptCount: Number(newInvForm.mpptCount),
      mpptVmin: Number(newInvForm.mpptVmin),
      mpptVmax: Number(newInvForm.mpptVmax),
      mpptMaxIsc: Number(newInvForm.mpptMaxIsc),
      priceHintVnd: Number(newInvForm.priceHintVnd),
      source: 'verified',
    };

    const res = await createCatalogItem('inverter', invData);
    if (res.success) {
      showToast('success', 'Đã thêm biến tần mới vào Catalog server.');
      await reloadCatalog();
      setShowAddInvModal(false);
    } else {
      showToast('error', res.error || 'Lỗi khi tạo biến tần.');
    }
  };

  // ---------------------------------------------------------
  // PRICING SETTINGS SAVE
  // ---------------------------------------------------------
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updatePricingSettingsApi(pricingForm);
    setIsSaving(false);

    if (res.success) {
      showToast('success', 'Đã cập nhật cài đặt giá mặc định thành công.');
      await reloadCatalog();
    } else {
      showToast('error', res.error || 'Không thể lưu cài đặt giá.');
    }
  };

  // ---------------------------------------------------------
  // HISTORY DRAWER
  // ---------------------------------------------------------
  const openHistory = async (kind: string, itemId?: string, title = '') => {
    setHistoryTarget({ kind, itemId, title });
    setHistoryDrawerOpen(true);
    setLoadingHistory(true);
    const list = await fetchCatalogChanges({ kind, itemId });
    setHistoryList(list);
    setLoadingHistory(false);
  };

  // ---------------------------------------------------------
  // CSV EXPORT (RFC 4180)
  // ---------------------------------------------------------
  const handleExportMaterialsCsv = () => {
    const headers = [
      'Loại (Hàng hóa/Dịch vụ)',
      'Có',
      'Nhóm vật tư',
      'Mã ID',
      'Tên vật tư thiết bị',
      'Thông số kỹ thuật',
      'Mã SKU',
      'ĐVT',
      'Đơn giá vốn (đ) (đã gồm VAT)',
      'Thương hiệu',
      'Xuất xứ',
    ];

    const rows = catalog.materials.map((m) => [
      m.categoryCode === 'VIII' ? 'Dịch vụ' : 'Hàng hóa',
      'Có',
      `${m.categoryCode} - ${m.categoryName}`,
      m.id,
      m.name,
      m.spec,
      m.sku,
      m.unit,
      m.costVnd,
      m.brand || '',
      m.origin || '',
    ]);

    const csvStr = toCsv([headers, ...rows]);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HGC_Catalog_Materials_v${catalog.version}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------
  // CSV IMPORT (RFC 4180 WITH PREVIEW)
  // ---------------------------------------------------------
  const handleFileSelectForImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedRows = parseCsv(text);
        if (parsedRows.length <= 1) {
          showToast('error', 'File CSV không có dữ liệu hợp lệ.');
          return;
        }

        // Map parsed CSV rows to Material items
        // Column indices based on export format:
        // 0: Loại, 1: Có, 2: Nhóm, 3: ID, 4: Tên, 5: Spec, 6: SKU, 7: ĐVT, 8: Cost, 9: Brand, 10: Origin
        const candidateItems: any[] = [];
        const nameMap: Record<string, string> = {
          I: 'Vật tư chính',
          II: 'Hệ bám tải',
          IV: 'Hệ thống điện',
          V: 'Hệ thống máng cáp',
          VI: 'Hệ thống phụ trợ',
          VII: 'Hạng mục xây dựng',
          VIII: 'Chi phí dịch vụ',
        };

        for (let i = 1; i < parsedRows.length; i++) {
          const r = parsedRows[i];
          if (!r || r.length < 5) continue;

          let groupCode = 'VII';
          if (r[2]) {
            const codeMatch = r[2].match(/^(I|II|IV|V|VI|VII|VIII)\b/);
            if (codeMatch) groupCode = codeMatch[1];
          }

          const id = r[3] || `mat-${Date.now()}-${i}`;
          const name = r[4] || '';
          const spec = r[5] || '';
          const sku = r[6] || id;
          const unit = r[7] || 'Cái';
          const costVnd = Number(String(r[8] || '0').replace(/[^0-9]/g, '')) || 0;
          const brand = r[9] || 'VN';
          const origin = r[10] || 'Việt Nam';

          candidateItems.push({
            id,
            categoryCode: groupCode,
            categoryName: nameMap[groupCode] || 'Vật tư',
            name,
            spec,
            sku,
            unit,
            costVnd,
            brand,
            origin,
            source: 'catalog',
          });
        }

        setImportRawRows(candidateItems);
        setIsImporting(true);
        // Dry-run preview
        const previewRes = await importCatalogItems(candidateItems, 'material', true);
        setIsImporting(false);

        if (previewRes.success) {
          setImportResult(previewRes);
          setImportModalOpen(true);
        } else {
          showToast('error', previewRes.error || 'Lỗi khi kiểm tra file CSV.');
        }
      } catch (err) {
        console.error('Import parse error:', err);
        showToast('error', 'Lỗi khi đọc file CSV.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importRawRows || importRawRows.length === 0) return;
    setIsImporting(true);
    const res = await importCatalogItems(importRawRows, 'material', false);
    setIsImporting(false);

    if (res.success) {
      showToast('success', `Đã nhập thành công ${res.createCount ?? 0} vật tư mới, cập nhật ${res.updateCount ?? 0} vật tư.`);
      setImportModalOpen(false);
      setImportResult(null);
      await reloadCatalog();
    } else {
      showToast('error', res.error || 'Nhập CSV thất bại.');
    }
  };

  // Filter items based on search and active status
  const filteredMaterials = catalog.materials.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchActive = showInactive ? true : m.isActive !== false;
    return matchSearch && matchActive;
  });

  const filteredPanels = catalog.panels.filter((p) => {
    const matchSearch =
      p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchActive = showInactive ? true : (p as any).isActive !== false;
    return matchSearch && matchActive;
  });

  const filteredInverters = catalog.inverters.filter((inv) => {
    const matchSearch =
      inv.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchActive = showInactive ? true : (inv as any).isActive !== false;
    return matchSearch && matchActive;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-fadeIn">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-fadeIn ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Legacy Local Catalog Warning Banner */}
      {legacyBanner && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={20} className="text-amber-600 shrink-0" />
            <div>
              <strong>Phát hiện bảng giá cục bộ cũ trên trình duyệt này!</strong>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Hệ thống hiện đã đồng bộ bảng giá chính thức từ PostgreSQL Database. Bạn có thể xuất bảng giá cũ để đối chiếu hoặc xóa bỏ.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                try {
                  const raw = localStorage.getItem('hgc_materials_catalog_excel_v1');
                  if (raw) {
                    const blob = new Blob([raw], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `backup_legacy_materials_${Date.now()}.json`;
                    link.click();
                  }
                } catch {}
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 font-semibold"
            >
              Sao lưu JSON cũ
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('hgc_materials_catalog_excel_v1');
                setLegacyBanner(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-800 text-white font-semibold hover:bg-amber-900"
            >
              Bỏ qua & Xóa
            </button>
          </div>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Quay lại dự án"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#0F2A45]">Quản Trị Bảng Giá & Danh Mục Hệ Thống</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                v{catalog.version}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn bộ thay đổi giá và thiết bị được lưu trực tiếp vào cơ sở dữ liệu PostgreSQL và áp dụng cho toàn công ty.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openHistory('material', undefined, 'Toàn bộ danh mục')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
          >
            <History size={14} className="text-indigo-600" />
            <span>Lịch Sử Thay Đổi</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-600 bg-teal-50/50 hover:bg-teal-100/60 text-teal-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
            <Upload size={14} className="text-teal-700" />
            <span>Nhập Excel (CSV)</span>
            <input type="file" accept=".csv" onChange={handleFileSelectForImport} className="hidden" />
          </label>

          <button
            onClick={handleExportMaterialsCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-semibold transition-colors shadow-2xs"
            title="Xuất bảng giá vật tư ra file Excel / CSV (đã bao gồm VAT)"
          >
            <FileSpreadsheet size={14} />
            <span>Xuất Excel Vật Tư</span>
          </button>
        </div>
      </div>

      {/* 5 Tabs Switcher: Vật tư | Tấm pin | Inverter | Cài đặt giá | Người dùng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold whitespace-nowrap transition-all ${
              activeTab === 'materials' ? 'bg-white shadow-2xs text-[#0F2A45]' : 'text-slate-600'
            }`}
          >
            <Wrench size={14} />
            <span>Vật Tư & Phụ Kiện ({catalog.materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('panels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold whitespace-nowrap transition-all ${
              activeTab === 'panels' ? 'bg-white shadow-2xs text-[#0F2A45]' : 'text-slate-600'
            }`}
          >
            <Layers size={14} />
            <span>Tấm Pin NLMT ({catalog.panels.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inverters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold whitespace-nowrap transition-all ${
              activeTab === 'inverters' ? 'bg-white shadow-2xs text-[#0F2A45]' : 'text-slate-600'
            }`}
          >
            <Zap size={14} />
            <span>Biến Tần Inverter ({catalog.inverters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold whitespace-nowrap transition-all ${
              activeTab === 'pricing' ? 'bg-white shadow-2xs text-[#0F2A45]' : 'text-slate-600'
            }`}
          >
            <Sliders size={14} />
            <span>Cài Đặt Giá Mặc Định</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold whitespace-nowrap transition-all ${
              activeTab === 'users' ? 'bg-white shadow-2xs text-[#0F2A45]' : 'text-slate-600'
            }`}
          >
            <Users size={14} />
            <span>Người Dùng</span>
          </button>
        </div>

        {/* Controls: Filter & Search */}
        {activeTab !== 'pricing' && activeTab !== 'users' && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded text-[#E4572E] accent-[#E4572E]"
              />
              <span>Hiện mục đã ngừng</span>
            </label>

            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, hãng, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#E4572E] w-full sm:w-56"
              />
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------- */}
      {/* TAB 1: MATERIALS TABLE */}
      {/* ----------------------------------------------------- */}
      {activeTab === 'materials' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Đơn giá vốn trong Catalog <strong>đã bao gồm VAT</strong>. Nhấp vào biểu tượng bút chì để chỉnh sửa trực tiếp.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>Thêm Vật Tư Mới</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0F2A45] text-white text-[11px] uppercase font-bold font-mono">
                <tr>
                  <th className="px-3.5 py-3">Nhóm</th>
                  <th className="px-3.5 py-3">Tên Vật Tư Thiết Bị</th>
                  <th className="px-3.5 py-3">Thông Số Kỹ Thuật</th>
                  <th className="px-3.5 py-3">Mã SKU</th>
                  <th className="px-3.5 py-3 text-center">ĐVT</th>
                  <th className="px-3.5 py-3 text-right">Đơn Giá Vốn (đ)</th>
                  <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                  <th className="px-3.5 py-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((m) => {
                  const isEditing = editingItemId === m.id;
                  const isItemInactive = m.isActive === false;

                  return (
                    <React.Fragment key={m.id}>
                      <tr
                        className={`${
                          isItemInactive ? 'bg-slate-50/70 opacity-60' : isEditing ? 'bg-orange-50/40' : 'hover:bg-slate-50'
                        } transition-colors`}
                      >
                        <td className="px-3.5 py-2.5 font-bold text-[#0F2A45] whitespace-nowrap">{m.categoryName}</td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.name ?? m.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-orange-300 rounded font-semibold bg-white"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {isItemInactive && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-normal">
                                  Đã ngừng
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 font-mono text-[11px]">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.spec ?? m.spec}
                              onChange={(e) => setEditForm({ ...editForm, spec: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-orange-300 rounded font-mono bg-white"
                            />
                          ) : (
                            m.spec
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-500 whitespace-nowrap">{m.sku}</td>
                        <td className="px-3.5 py-2.5 text-center text-slate-600 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.unit ?? m.unit}
                              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                              className="w-14 px-1.5 py-1 text-xs text-center border border-orange-300 rounded bg-white"
                            />
                          ) : (
                            m.unit
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editForm.costVnd ?? m.costVnd}
                              onChange={(e) => setEditForm({ ...editForm, costVnd: Number(e.target.value) })}
                              className="w-28 px-2 py-1 text-xs text-right border border-orange-400 rounded font-mono font-bold bg-white focus:ring-1 focus:ring-[#E4572E]"
                            />
                          ) : (
                            `${m.costVnd.toLocaleString('vi-VN')} đ`
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isItemInactive ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isItemInactive ? 'Ngừng dùng' : 'Đang dùng'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveMaterialEdit(m)}
                                disabled={isSaving}
                                className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                title="Lưu thay đổi"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                                title="Hủy"
                              >
                                <ArrowLeft size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEdit(m)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                                title="Chỉnh sửa đơn giá & thông số"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleToggleActive('material', m.id, !isItemInactive)}
                                className={`p-1 rounded transition-colors ${
                                  isItemInactive
                                    ? 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                                    : 'hover:bg-amber-50 text-slate-400 hover:text-amber-600'
                                }`}
                                title={isItemInactive ? 'Kích hoạt dùng lại' : 'Ngừng dùng'}
                              >
                                <Power size={14} />
                              </button>
                              <button
                                onClick={() => openHistory('material', m.id, m.name)}
                                className="p-1 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
                                title="Xem lịch sử thay đổi"
                              >
                                <History size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expandable row for technical description & cost breakdown */}
                      {isEditing && (
                        <tr className="bg-orange-50/40 border-b-2 border-orange-200 animate-fadeIn">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  📋 Mô Tả Kỹ Thuật Chi Tiết:
                                </label>
                                <textarea
                                  rows={3}
                                  value={editForm.technicalDescription ?? m.technicalDescription ?? ''}
                                  onChange={(e) => setEditForm({ ...editForm, technicalDescription: e.target.value })}
                                  placeholder="Nhập thông số, tiêu chuẩn kỹ thuật chi tiết của vật tư..."
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#E4572E] outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-[#E4572E] mb-1">
                                  💰 Chi Phí Cấu Thành & Nhân Công Lắp Đặt:
                                </label>
                                <textarea
                                  rows={3}
                                  value={editForm.costBreakdown ?? m.costBreakdown ?? ''}
                                  onChange={(e) => setEditForm({ ...editForm, costBreakdown: e.target.value })}
                                  placeholder="Ví dụ: Nhân công cơ khí (40%), Nhân công điện (35%), Vật tư phụ (25%)..."
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#E4572E] outline-none"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* TAB 2: PANELS TABLE */}
      {/* ----------------------------------------------------- */}
      {activeTab === 'panels' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Danh sách module tấm pin năng lượng mặt trời chính thức trong hệ thống.
            </p>
            <button
              onClick={() => setShowAddPanelModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white text-xs font-bold shadow-sm"
            >
              <Plus size={14} />
              <span>Thêm Model Tấm Pin</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0F2A45] text-white text-[11px] uppercase font-bold font-mono">
                <tr>
                  <th className="px-3.5 py-3">Hãng SX</th>
                  <th className="px-3.5 py-3">Model</th>
                  <th className="px-3.5 py-3">Công Suất (Wp)</th>
                  <th className="px-3.5 py-3">Voc (V)</th>
                  <th className="px-3.5 py-3">Vmpp (V)</th>
                  <th className="px-3.5 py-3">Isc (A)</th>
                  <th className="px-3.5 py-3">Kích Thước</th>
                  <th className="px-3.5 py-3 text-right">Đơn Giá Gợi Ý (đ)</th>
                  <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                  <th className="px-3.5 py-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPanels.map((p) => {
                  const isInactive = (p as any).isActive === false;
                  return (
                    <tr key={p.id} className={`${isInactive ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50'} transition-colors`}>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{p.brand}</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-800">{p.model}</td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-orange-600">{p.wp} Wp</td>
                      <td className="px-3.5 py-2.5 font-mono">{p.voc} V</td>
                      <td className="px-3.5 py-2.5 font-mono">{p.vmpp} V</td>
                      <td className="px-3.5 py-2.5 font-mono">{p.isc} A</td>
                      <td className="px-3.5 py-2.5 text-slate-500 font-mono text-[11px]">
                        {p.lengthMm} × {p.widthMm} mm
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-800">
                        {p.priceHintVnd.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isInactive ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isInactive ? 'Ngừng dùng' : 'Đang dùng'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggleActive('panel', p.id, !isInactive)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                            title={isInactive ? 'Kích hoạt lại' : 'Ngừng dùng'}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => openHistory('panel', p.id, `${p.brand} ${p.model}`)}
                            className="p-1 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
                            title="Lịch sử"
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* TAB 3: INVERTERS TABLE */}
      {/* ----------------------------------------------------- */}
      {activeTab === 'inverters' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Danh sách biến tần hòa lưới / Hybrid chính thức.
            </p>
            <button
              onClick={() => setShowAddInvModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white text-xs font-bold shadow-sm"
            >
              <Plus size={14} />
              <span>Thêm Model Inverter</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0F2A45] text-white text-[11px] uppercase font-bold font-mono">
                <tr>
                  <th className="px-3.5 py-3">Hãng</th>
                  <th className="px-3.5 py-3">Model</th>
                  <th className="px-3.5 py-3">Pha</th>
                  <th className="px-3.5 py-3">Kiểu</th>
                  <th className="px-3.5 py-3">CS AC (kW)</th>
                  <th className="px-3.5 py-3">Vdc Max (V)</th>
                  <th className="px-3.5 py-3">MPPT Range</th>
                  <th className="px-3.5 py-3 text-right">Đơn Giá Gợi Ý (đ)</th>
                  <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                  <th className="px-3.5 py-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInverters.map((inv) => {
                  const isInactive = (inv as any).isActive === false;
                  return (
                    <tr key={inv.id} className={`${isInactive ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50'} transition-colors`}>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{inv.brand}</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-800">{inv.model}</td>
                      <td className="px-3.5 py-2.5 font-mono">{inv.phases === '3' ? '3 Pha' : '1 Pha'}</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-600 uppercase text-[10px]">{inv.type}</td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-600">{inv.acKw} kW</td>
                      <td className="px-3.5 py-2.5 font-mono">{inv.vdcMax} V</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-600">{inv.mpptVmin} - {inv.mpptVmax}V</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-800">
                        {inv.priceHintVnd.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isInactive ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isInactive ? 'Ngừng dùng' : 'Đang dùng'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggleActive('inverter', inv.id, !isInactive)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                            title={isInactive ? 'Kích hoạt lại' : 'Ngừng dùng'}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => openHistory('inverter', inv.id, `${inv.brand} ${inv.model}`)}
                            className="p-1 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
                            title="Lịch sử"
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* TAB 4: PRICING SETTINGS */}
      {/* ----------------------------------------------------- */}
      {activeTab === 'pricing' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sliders size={18} className="text-[#0F2A45]" />
              <span>Cài Đặt Đơn Giá & Biên Lợi Nhuận Mặc Định</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Các giá trị này được áp dụng tự động cho các dự án mới do nhân viên kinh doanh tạo. Đơn giá đã bao gồm VAT.
            </p>
          </div>

          <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Margin Lợi Nhuận Gộp Mặc Định (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  value={pricingForm.defaultMarginPct}
                  onChange={(e) => setPricingForm({ ...pricingForm, defaultMarginPct: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chiết Khấu Mặc Định (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={pricingForm.defaultDiscountPct}
                  onChange={(e) => setPricingForm({ ...pricingForm, defaultDiscountPct: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đơn Giá Gia Công Khung Mái Canopy (Vnđ/m²):
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={pricingForm.canopyUnitCostVnd}
                  onChange={(e) => setPricingForm({ ...pricingForm, canopyUnitCostVnd: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đơn Giá Xe Cẩu Vận Chuyển Trọn Gói (Vnđ):
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={pricingForm.transportCostVnd}
                  onChange={(e) => setPricingForm({ ...pricingForm, transportCostVnd: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đơn Giá Nhân Công Lắp Đặt Tiêu Chuẩn (Vnđ/kWp):
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={pricingForm.installCostVndPerKwp}
                  onChange={(e) => setPricingForm({ ...pricingForm, installCostVndPerKwp: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#E4572E] hover:bg-[#d04922] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu Cài Đặt Giá'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* TAB 5: USERS MANAGEMENT */}
      {/* ----------------------------------------------------- */}
      {activeTab === 'users' && <AdminUsers currentUserId={currentUserId} />}

      {/* ----------------------------------------------------- */}
      {/* MODAL: ADD MATERIAL */}
      {/* ----------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0F2A45]">Thêm Mới Vật Tư Vào Catalog Server</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMaterialSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nhóm Hạng Mục</label>
                <select
                  value={newMatForm.categoryCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const nameMap: Record<string, string> = {
                      I: 'Vật tư chính',
                      II: 'Hệ bám tải',
                      IV: 'Hệ thống điện',
                      V: 'Hệ thống máng cáp',
                      VI: 'Hệ thống phụ trợ',
                      VII: 'Hạng mục xây dựng',
                      VIII: 'Chi phí dịch vụ',
                    };
                    setNewMatForm({
                      ...newMatForm,
                      categoryCode: code as any,
                      categoryName: nameMap[code] || 'Vật tư',
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-medium"
                >
                  <option value="I">I — Vật tư chính</option>
                  <option value="II">II — Hệ bám tải</option>
                  <option value="IV">IV — Hệ thống điện</option>
                  <option value="V">V — Hệ thống máng cáp</option>
                  <option value="VI">VI — Hệ thống phụ trợ</option>
                  <option value="VII">VII — Hạng mục xây dựng</option>
                  <option value="VIII">VIII — Chi phí dịch vụ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Vật Tư Thiết Bị</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cáp đồng DC 1x4mm² Leader"
                  value={newMatForm.name || ''}
                  onChange={(e) => setNewMatForm({ ...newMatForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CAB-DC-4MM"
                    value={newMatForm.sku || ''}
                    onChange={(e) => setNewMatForm({ ...newMatForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn Vị Tính (ĐVT)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Mét, Bộ, Cái..."
                    value={newMatForm.unit || ''}
                    onChange={(e) => setNewMatForm({ ...newMatForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thông Số Kỹ Thuật (Quy Cách)</label>
                <input
                  type="text"
                  placeholder="VD: Điện áp 1500VDC, tiêu chuẩn IEC 62930..."
                  value={newMatForm.spec || ''}
                  onChange={(e) => setNewMatForm({ ...newMatForm, spec: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Đơn Giá Vốn (Vnđ) (Đã gồm VAT)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newMatForm.costVnd || 0}
                  onChange={(e) => setNewMatForm({ ...newMatForm, costVnd: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono font-bold text-sm text-[#0F2A45]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E4572E] hover:bg-[#d04922] text-white font-bold rounded-lg shadow-sm"
                >
                  Lưu Vào Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* MODAL: ADD PANEL */}
      {/* ----------------------------------------------------- */}
      {showAddPanelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0F2A45]">Thêm Model Tấm Pin Vào Server</h3>
              <button onClick={() => setShowAddPanelModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPanelSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hãng Sản Xuất</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: JA Solar, Jinko..."
                    value={newPanelForm.brand || ''}
                    onChange={(e) => setNewPanelForm({ ...newPanelForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Model Tấm Pin</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: JAM72D42-630/LB"
                    value={newPanelForm.model || ''}
                    onChange={(e) => setNewPanelForm({ ...newPanelForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Công Suất Wp</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={newPanelForm.wp || 0}
                    onChange={(e) => setNewPanelForm({ ...newPanelForm, wp: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Voc (V)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPanelForm.voc || 0}
                    onChange={(e) => setNewPanelForm({ ...newPanelForm, voc: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vmpp (V)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPanelForm.vmpp || 0}
                    onChange={(e) => setNewPanelForm({ ...newPanelForm, vmpp: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kích Thước Dài x Rộng (mm)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Dài"
                      value={newPanelForm.lengthMm || 2278}
                      onChange={(e) => setNewPanelForm({ ...newPanelForm, lengthMm: Number(e.target.value) })}
                      className="w-1/2 px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Rộng"
                      value={newPanelForm.widthMm || 1134}
                      onChange={(e) => setNewPanelForm({ ...newPanelForm, widthMm: Number(e.target.value) })}
                      className="w-1/2 px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn Giá Gợi Ý (Vnđ)</label>
                  <input
                    type="number"
                    required
                    value={newPanelForm.priceHintVnd || 0}
                    onChange={(e) => setNewPanelForm({ ...newPanelForm, priceHintVnd: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-[#0F2A45]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPanelModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-[#E4572E] text-white font-bold rounded-lg shadow-sm">
                  Lưu Tấm Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* MODAL: ADD INVERTER */}
      {/* ----------------------------------------------------- */}
      {showAddInvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0F2A45]">Thêm Model Biến Tần Vào Server</h3>
              <button onClick={() => setShowAddInvModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddInvSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hãng Inverter</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Huawei, Deye, Solis..."
                    value={newInvForm.brand || ''}
                    onChange={(e) => setNewInvForm({ ...newInvForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Model Inverter</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SUN2000-15KTL-M5"
                    value={newInvForm.model || ''}
                    onChange={(e) => setNewInvForm({ ...newInvForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kiểu</label>
                  <select
                    value={newInvForm.type}
                    onChange={(e) => setNewInvForm({ ...newInvForm, type: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="on_grid">Hòa lưới (On-grid)</option>
                    <option value="hybrid">Hybrid ESS</option>
                    <option value="off_grid">Độc lập (Off-grid)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Pha</label>
                  <select
                    value={newInvForm.phases}
                    onChange={(e) => setNewInvForm({ ...newInvForm, phases: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="1">1 Pha (220V)</option>
                    <option value="3">3 Pha (380V)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CS AC (kW)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newInvForm.acKw || 0}
                    onChange={(e) => setNewInvForm({ ...newInvForm, acKw: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dải MPPT (Vmin - Vmax)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={newInvForm.mpptVmin || 160}
                      onChange={(e) => setNewInvForm({ ...newInvForm, mpptVmin: Number(e.target.value) })}
                      className="w-1/2 px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={newInvForm.mpptVmax || 1000}
                      onChange={(e) => setNewInvForm({ ...newInvForm, mpptVmax: Number(e.target.value) })}
                      className="w-1/2 px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn Giá Gợi Ý (Vnđ)</label>
                  <input
                    type="number"
                    required
                    value={newInvForm.priceHintVnd || 0}
                    onChange={(e) => setNewInvForm({ ...newInvForm, priceHintVnd: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-[#0F2A45]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddInvModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-[#E4572E] text-white font-bold rounded-lg shadow-sm">
                  Lưu Inverter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* DRAWER: LỊCH SỬ THAY ĐỔI */}
      {/* ----------------------------------------------------- */}
      {historyDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slideLeft">
            <div className="p-4 bg-[#0F2A45] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <History size={16} />
                  <span>Nhật Ký Thay Đổi Bảng Giá</span>
                </h4>
                {historyTarget?.title && (
                  <p className="text-[11px] text-cyan-200 mt-0.5 truncate">{historyTarget.title}</p>
                )}
              </div>
              <button
                onClick={() => setHistoryDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingHistory ? (
                <div className="text-center py-10 text-slate-400 text-xs">Đang nạp nhật ký thay đổi...</div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">Chưa có thay đổi nào được ghi lại.</div>
              ) : (
                historyList.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold uppercase text-[#0F2A45]">
                        #{c.id} · {c.action}
                      </span>
                      <span>{new Date(c.changedAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="text-slate-700">
                      Người sửa: <strong className="font-mono text-slate-900">{c.changedBy}</strong>
                    </div>

                    {c.before && c.after && c.before.costVnd !== undefined && c.after.costVnd !== undefined && (
                      <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px]">
                        Đơn giá: {c.before.costVnd.toLocaleString('vi-VN')} đ →{' '}
                        <strong className="text-emerald-700">{c.after.costVnd.toLocaleString('vi-VN')} đ</strong>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* MODAL: CSV IMPORT PREVIEW & CONFIRMATION */}
      {/* ----------------------------------------------------- */}
      {importModalOpen && importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#0F2A45]">Xem Trước Kết Quả Nhập CSV (Dry-Run)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Kiểm tra thay đổi trước khi xác nhận ghi vào Database</p>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[10px] text-emerald-700 font-semibold uppercase">Thêm mới</div>
                <div className="text-lg font-bold text-emerald-800">{importResult.createCount}</div>
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-[10px] text-blue-700 font-semibold uppercase">Cập nhật</div>
                <div className="text-lg font-bold text-blue-800">{importResult.updateCount}</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-600 font-semibold uppercase">Không đổi</div>
                <div className="text-lg font-bold text-slate-700">{importResult.unchangedCount}</div>
              </div>
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl">
                <div className="text-[10px] text-red-700 font-semibold uppercase">Lỗi dữ liệu</div>
                <div className="text-lg font-bold text-red-800">{importResult.errorCount}</div>
              </div>
            </div>

            {/* Error List if any */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1 max-h-36 overflow-y-auto">
                <strong className="text-red-700 block">Danh sách lỗi trong file CSV:</strong>
                {importResult.errors.map((err: any, idx: number) => (
                  <div key={idx} className="text-red-600 text-[11px]">
                    • Dòng {err.row} ({err.field}): {err.message}
                  </div>
                ))}
              </div>
            )}

            {/* Change List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-3 text-xs space-y-2">
              <strong className="block text-slate-700 text-[11px] uppercase">Chi tiết các mục cập nhật:</strong>
              {importResult.update && importResult.update.length > 0 ? (
                importResult.update.map((u: any, idx: number) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-[11px]">
                    <div>
                      <strong className="text-slate-800">{u.changes.name}</strong>
                      <span className="text-slate-400 font-mono ml-2">({u.id})</span>
                    </div>
                    <div className="font-mono">
                      {u.changes.costVnd.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center py-4">Không có mục nào thay đổi đơn giá.</div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importResult.errorCount > 0 || isImporting}
                className="px-5 py-2 bg-[#E4572E] hover:bg-[#d04922] text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {isImporting ? 'Đang nhập...' : 'Xác Nhận Nhập Vào Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
