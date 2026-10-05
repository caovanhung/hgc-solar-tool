import React, { useState } from 'react';
import { PanelModel, InverterModel, MaterialItem } from '../../types/solar';
import {
  Layers,
  Zap,
  Wrench,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  Download,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

interface AdminCatalogProps {
  panels: PanelModel[];
  inverters: InverterModel[];
  materials: MaterialItem[];
  onUpdatePanels: (panels: PanelModel[]) => void;
  onUpdateInverters: (inverters: InverterModel[]) => void;
  onUpdateMaterials: (materials: MaterialItem[]) => void;
  onBack: () => void;
}

export const AdminCatalog: React.FC<AdminCatalogProps> = ({
  panels,
  inverters,
  materials,
  onUpdatePanels,
  onUpdateInverters,
  onUpdateMaterials,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'panels' | 'inverters' | 'materials'>('materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MaterialItem>>({});
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newMatForm, setNewMatForm] = useState<Partial<MaterialItem>>({
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    unit: 'm²',
    costVnd: 450000,
    source: 'derived_from_demo_total',
  });

  const handleStartEdit = (m: MaterialItem) => {
    setEditingItemId(m.id);
    setEditForm({
      name: m.name,
      spec: m.spec,
      sku: m.sku,
      unit: m.unit,
      costVnd: m.costVnd,
    });
  };

  const handleSaveEdit = (id: string) => {
    const updated = materials.map((m) =>
      m.id === id ? { ...m, ...editForm, costVnd: Number(editForm.costVnd || m.costVnd) } : m
    );
    onUpdateMaterials(updated);
    setEditingItemId(null);
  };

  const handleDeleteMaterial = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vật tư "${name}" khỏi danh mục?`)) {
      const updated = materials.filter((m) => m.id !== id);
      onUpdateMaterials(updated);
    }
  };

  const handleAddMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatForm.name) return;

    const newItem: MaterialItem = {
      id: `custom-mat-${Date.now()}`,
      categoryCode: (newMatForm.categoryCode as any) || 'VII',
      categoryName: newMatForm.categoryName || 'Hạng mục xây dựng',
      name: newMatForm.name,
      spec: newMatForm.spec || '',
      sku: newMatForm.sku || `MAT-${Date.now().toString().slice(-4)}`,
      unit: newMatForm.unit || 'bộ',
      costVnd: Number(newMatForm.costVnd || 0),
      source: 'demo_ui_observed',
    };

    onUpdateMaterials([...materials, newItem]);
    setShowAddModal(false);
    setNewMatForm({
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      unit: 'm²',
      costVnd: 450000,
      source: 'derived_from_demo_total',
    });
  };

  // Export current catalog as JSON
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ panels, inverters, materials }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hgc_solar_catalog_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Top Banner */}
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
            <h2 className="text-xl font-extrabold text-[#0F2A45]">Quản Trị Danh Mục & Đơn Giá Vật Tư (Catalog)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật thông số kỹ thuật tấm pin, inverter và bảng giá vật tư mounting/điện lực
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
          >
            <Download size={14} />
            <span>Xuất file Catalog JSON</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Tấm pin | Inverter | Vật tư phụ trợ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('panels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'panels' ? 'bg-white shadow-2xs text-[#0F2A45]' : 'text-slate-600'
            }`}
          >
            <Layers size={14} />
            <span>Tấm Pin NLMT ({panels.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inverters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'inverters' ? 'bg-white shadow-2xs text-[#0F2A45]' : 'text-slate-600'
            }`}
          >
            <Zap size={14} />
            <span>Biến Tần Inverter ({inverters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'materials' ? 'bg-white shadow-2xs text-[#0F2A45]' : 'text-slate-600'
            }`}
          >
            <Wrench size={14} />
            <span>Vật Tư & Phụ Kiện ({materials.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên model, hãng, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#E4572E] w-full sm:w-64"
          />
        </div>
      </div>

      {/* Tab 1: Panels Table */}
      {activeTab === 'panels' && (
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
                <th className="px-3.5 py-3 text-right">Giá Gợi Ý (đ)</th>
                <th className="px-3.5 py-3 text-center">Nguồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {panels
                .filter((p) => p.model.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
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
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <ShieldCheck size={11} /> Verified
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Inverters Table */}
      {activeTab === 'inverters' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0F2A45] text-white text-[11px] uppercase font-bold font-mono">
              <tr>
                <th className="px-3.5 py-3">Hãng</th>
                <th className="px-3.5 py-3">Model</th>
                <th className="px-3.5 py-3">Pha</th>
                <th className="px-3.5 py-3">CS AC (kW)</th>
                <th className="px-3.5 py-3">Vdc Max (V)</th>
                <th className="px-3.5 py-3">MPPT Range</th>
                <th className="px-3.5 py-3">Isc Max (A)</th>
                <th className="px-3.5 py-3 text-right">Giá Gợi Ý (đ)</th>
                <th className="px-3.5 py-3 text-center">Zero-Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inverters
                .filter((inv) => inv.model.toLowerCase().includes(searchTerm.toLowerCase()) || inv.brand.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-slate-900">{inv.brand}</td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-800">{inv.model}</td>
                    <td className="px-3.5 py-2.5 font-mono">{inv.phases === '3' ? '3 Pha (380V)' : '1 Pha (220V)'}</td>
                    <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-600">{inv.acKw} kW</td>
                    <td className="px-3.5 py-2.5 font-mono">{inv.vdcMax} V</td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-600">{inv.mpptVmin} - {inv.mpptVmax}V</td>
                    <td className="px-3.5 py-2.5 font-mono">{inv.mpptMaxIsc} A</td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-800">
                      {inv.priceHintVnd.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                        Hỗ trợ
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Materials Table */}
      {activeTab === 'materials' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Nhấp vào biểu tượng bút chì để chỉnh sửa trực tiếp đơn giá vốn và quy cách vật tư.
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
                  <th className="px-3.5 py-3 text-center">Nguồn Giá</th>
                  <th className="px-3.5 py-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials
                  .filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((m) => {
                    const isEditing = editingItemId === m.id;
                    return (
                      <tr key={m.id} className={isEditing ? 'bg-orange-50/40' : 'hover:bg-slate-50 transition-colors'}>
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
                            m.name
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
                        <td className="px-3.5 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.sku ?? m.sku}
                              onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                              className="w-24 px-2 py-1 text-xs border border-orange-300 rounded font-mono bg-white"
                            />
                          ) : (
                            m.sku
                          )}
                        </td>
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
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            m.id === 'scada-logger' || m.id === 's-testing-evn'
                              ? 'bg-amber-100 text-amber-800 font-semibold'
                              : m.source === 'demo_ui_observed'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {m.id === 'scada-logger'
                              ? 'Mặc định không có (ETEK ko cần)'
                              : m.id === 's-testing-evn'
                              ? 'Mặc định không có (Tùy chọn)'
                              : m.source === 'demo_ui_observed'
                              ? 'Thực tế ETEK'
                              : 'Đơn giá mẫu'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveEdit(m.id)}
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
                                title="Chỉnh sửa đơn giá"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(m.id, m.name)}
                                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                                title="Xóa khỏi danh mục"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Thêm Vật Tư Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0F2A45]">Thêm Mới Vật Tư Vào Catalog</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
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
                      IV: 'Hệ thống điện',
                      V: 'Hệ thống máng cáp',
                      VI: 'Hệ thống phụ trợ',
                      VII: 'Hạng mục xây dựng',
                      VIII: 'Chi phí dịch vụ',
                      X: 'Hệ thống Scada',
                    };
                    setNewMatForm({
                      ...newMatForm,
                      categoryCode: code as any,
                      categoryName: nameMap[code] || 'Vật tư',
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#E4572E] font-medium"
                >
                  <option value="VII">VII - Hạng mục xây dựng (Khung giàn, Mái khung, Rail)</option>
                  <option value="VIII">VIII - Chi phí dịch vụ (Nhân công, Cẩu kéo, Hồ sơ EVN)</option>
                  <option value="IV">IV - Hệ thống điện (Tủ điện, Cáp, MC4)</option>
                  <option value="V">V - Hệ thống máng cáp (Trunking, Ống HDPE)</option>
                  <option value="VI">VI - Hệ thống phụ trợ (Tiếp địa, Chống sét)</option>
                  <option value="X">X - Hệ thống Scada (Datalogger, IoT)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Vật Tư / Thiết Bị *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Gia công khung giàn sắt hộp kẽm 50x100"
                  value={newMatForm.name || ''}
                  onChange={(e) => setNewMatForm({ ...newMatForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quy Cách & Thông Số Kỹ Thuật</label>
                <input
                  type="text"
                  placeholder="VD: Thép hộp mạ kẽm dày 1.8mm, bu lông mạ kẽm"
                  value={newMatForm.spec || ''}
                  onChange={(e) => setNewMatForm({ ...newMatForm, spec: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn Vị Tính (ĐVT)</label>
                  <input
                    type="text"
                    placeholder="m², cái, mét, gói, bộ..."
                    value={newMatForm.unit || ''}
                    onChange={(e) => setNewMatForm({ ...newMatForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn Giá Vốn (VND) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    placeholder="VD: 450000"
                    value={newMatForm.costVnd || ''}
                    onChange={(e) => setNewMatForm({ ...newMatForm, costVnd: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#E4572E] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E4572E] hover:bg-[#d04922] text-white rounded-lg font-bold shadow-sm"
                >
                  Thêm Vào Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
