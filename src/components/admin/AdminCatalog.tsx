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
  const [activeTab, setActiveTab] = useState<'panels' | 'inverters' | 'materials'>('panels');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials
                .filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-[#0F2A45]">{m.categoryName}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-slate-900">{m.name}</td>
                    <td className="px-3.5 py-2.5 text-slate-600 font-mono text-[11px]">{m.spec}</td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-500">{m.sku}</td>
                    <td className="px-3.5 py-2.5 text-center text-slate-600">{m.unit}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                      {m.costVnd.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {m.source === 'demo_ui_observed' ? 'Thực tế ETEK' : 'Đơn giá mẫu'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
