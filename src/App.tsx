import React, { useState, useEffect } from 'react';
import { Project, PanelModel, InverterProposal } from './types/solar';
import { INITIAL_PANELS, INITIAL_INVERTERS, INITIAL_MATERIALS } from './data/catalog';
import { VIETNAM_PROVINCES } from './data/provinces';
import { getEffectiveTariffVnd } from './data/tariffs';
import { calculatePanelLayout } from './engine/layout';
import { selectInverters } from './engine/inverter';
import { calculateCablingAndBoard } from './engine/cabling';
import { calculateMounting } from './engine/mounting';
import { generateProjectBom } from './engine/bom';
import { calculateFinancials } from './engine/financial';
import {
  fetchProjectsFromServer,
  saveProjectToServer,
  deleteProjectFromServer,
} from './services/api';

import { Header } from './components/common/Header';
import { Step1CustomerRoof } from './components/wizard/Step1CustomerRoof';
import { Step2SystemConfig } from './components/wizard/Step2SystemConfig';
import { Step3PanelLayout } from './components/wizard/Step3PanelLayout';
import { Step4TechnicalResults } from './components/wizard/Step4TechnicalResults';
import { Step5QuotationBOM } from './components/wizard/Step5QuotationBOM';
import { ProjectList } from './components/projects/ProjectList';
import { AdminCatalog } from './components/admin/AdminCatalog';
import { QuickProposalModal } from './components/quick/QuickProposalModal';
import { Check, CheckCircle2, ChevronRight, Layers, Sun } from 'lucide-react';

const STORAGE_KEY = 'hgc_solar_projects_v1';

// Tạo dự án mẫu ban đầu
function createInitialProject(): Project {
  const panel = INITIAL_PANELS[0]; // Canadian Solar 585Wp
  const province = VIETNAM_PROVINCES[0]; // Hà Nội (GHI 4.12)
  const tariffVnd = getEffectiveTariffVnd('sinh_hoat', 450);

  const roofLengthM = 20;
  const roofWidthM = 12;

  const layout = calculatePanelLayout({
    roofLengthM,
    roofWidthM,
    roofShape: 'rect',
    panel,
    installMode: 'full_roof',
    irradianceKwhM2Day: province.dailyIrradianceKwhM2,
    roofDir: 's',
    tariffVnd,
  });

  const inverterProposals = selectInverters({
    installedKwp: layout.installedKwp,
    panelCount: layout.panelQty,
    panel,
    phases: '3',
    sysType: 'zero_export',
    tMinC: province.tMinC,
    tMaxC: province.tMaxC,
    availableInverters: INITIAL_INVERTERS,
  });

  const topInverter = inverterProposals[0];

  const { cables, board } = calculateCablingAndBoard({
    totalAcKw: topInverter ? topInverter.inverter.acKw * topInverter.qtyNeeded : 30,
    inverterKw: topInverter ? topInverter.inverter.acKw : 15,
    phases: '3',
    routeLengthM: 35,
    stringIsc: panel.isc,
  });

  const mounting = calculateMounting(layout, 'tole');

  const bomLines = generateProjectBom({
    panel,
    inverter: topInverter?.inverter,
    inverterQty: topInverter?.qtyNeeded || 1,
    layout,
    mounting,
    cables,
    board,
    materialsCatalog: INITIAL_MATERIALS,
    marginPct: 18,
  });

  const financial = calculateFinancials({
    bomLines,
    installedKwp: layout.installedKwp,
    dailyKwh: layout.dailyKwh,
    tariffVnd,
    discountPct: 0,
    vatPct: 10,
  });

  return {
    id: 'demo-hgc-01',
    name: 'Văn Phòng HGC Văn Quán - Solar 42kWp',
    customerName: 'CÔNG TY TNHH HGC',
    phone: '0974 04 19 84',
    address: 'B36 TT7 Khu đô thị Văn Quán, Hà Đông, Hà Nội',
    status: 'saved',
    module: 'solar',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    custType: 'sinh_hoat',
    provinceCode: 'HAN',
    monthlyElectricityBillVnd: 18500000,
    monthlyConsumptionKwh: 5800,
    roofType: 'tole',
    roofDir: 's',
    roofShape: 'rect',
    roofLengthM,
    roofWidthM,
    roofHeightM: 14,
    sysType: 'zero_export',
    phases: '3',
    installMode: 'full_roof',
    selectedPanelId: panel.id,
    layoutResult: layout,
    selectedInverterId: topInverter?.inverter.id,
    inverterProposals,
    cableResults: cables,
    distributionBoard: board,
    mountingResult: mounting,
    marginPct: 18,
    discountPct: 0,
    pricingTier: 'recommended',
    bomLines,
    financial,
  };
}

function upgradeProjectIfNeeded(p: Project): Project {
  const hasOldBom = p.bomLines && p.bomLines.some((l: any) => l.categoryCode === 'III' || !l.categoryCode);
  const isMissingRates = !p.financial?.investmentRatePostVatVndPerKwp;

  if (hasOldBom || isMissingRates || !p.bomLines || p.bomLines.length === 0) {
    const panel = INITIAL_PANELS.find((item) => item.id === p.selectedPanelId) || INITIAL_PANELS[0];
    const topInv = p.inverterProposals?.[0];
    const inverter = topInv?.inverter || INITIAL_INVERTERS[0];
    const layout = p.layoutResult;
    if (layout) {
      const mounting = p.mountingResult || calculateMounting(layout, p.roofType);
      const cables = p.cableResults || [];
      const board = p.distributionBoard || {
        mccbRatedA: 80,
        iAcTotalDesignA: 60,
        spcDcType: 'Type 2',
        spdAcType: 'Type 2',
        smartMeter: 'Chint DTSU666',
        enclosureType: 'IP65',
        status: 'passed',
      };

      const newBom = generateProjectBom({
        panel,
        inverter,
        inverterQty: topInv?.qtyNeeded || 1,
        layout,
        mounting,
        cables,
        board: board as any,
        materialsCatalog: INITIAL_MATERIALS,
        marginPct: p.marginPct || 18,
      });

      const newFin = calculateFinancials({
        bomLines: newBom,
        installedKwp: layout.installedKwp,
        dailyKwh: layout.dailyKwh,
        tariffVnd: 2850,
        discountPct: p.discountPct || 0,
        vatPct: 10,
      });

      return {
        ...p,
        bomLines: newBom,
        financial: newFin,
      };
    }
  }
  return p;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(upgradeProjectIfNeeded);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [createInitialProject()];
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => projects[0]?.id || 'demo-hgc-01');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeView, setActiveView] = useState<'wizard' | 'projects' | 'admin'>('wizard');
  const [userRole, setUserRole] = useState<'ky_su' | 'sales' | 'admin'>('ky_su');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showQuickModal, setShowQuickModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Catalogs
  const [panels, setPanels] = useState<PanelModel[]>(INITIAL_PANELS);
  const [inverters, setInverters] = useState(INITIAL_INVERTERS);
  const [materials, setMaterials] = useState(INITIAL_MATERIALS);

  // Khởi tạo: Đồng bộ dữ liệu từ Backend Server (nếu có)
  useEffect(() => {
    fetchProjectsFromServer().then((serverProjects) => {
      if (serverProjects && serverProjects.length > 0) {
        setProjects(serverProjects);
        if (!serverProjects.some((p) => p.id === currentProjectId)) {
          setCurrentProjectId(serverProjects[0].id);
        }
      }
    });
  }, []);

  // Đồng bộ LocalStorage khi projects thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error(e);
    }
  }, [projects]);

  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  // Helper cập nhật dự án hiện tại và recalculate các chuỗi liên quan
  const handleUpdateProject = (updates: Partial<Project>) => {
    setSaveStatus('saving');
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== currentProjectId) return p;
        const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };

        // Nếu thay đổi panel, kích thước mái, hoặc margin thì tính lại toàn bộ
        if (
          updates.roofLengthM !== undefined ||
          updates.roofWidthM !== undefined ||
          updates.roofShape !== undefined ||
          updates.roofL1M !== undefined ||
          updates.roofW1M !== undefined ||
          updates.roofL2M !== undefined ||
          updates.roofW2M !== undefined ||
          updates.manualAreaM2 !== undefined ||
          updates.roofDir !== undefined ||
          updates.roofType !== undefined ||
          updates.selectedPanelId !== undefined ||
          updates.provinceCode !== undefined ||
          updates.monthlyElectricityBillVnd !== undefined ||
          updates.monthlyConsumptionKwh !== undefined ||
          updates.marginPct !== undefined ||
          updates.discountPct !== undefined ||
          updates.installMode !== undefined ||
          updates.manualPanelQty !== undefined ||
          updates.targetLoadKw !== undefined
        ) {
          const panel = panels.find((pan) => pan.id === (updates.selectedPanelId || updated.selectedPanelId)) || panels[0];
          const province = VIETNAM_PROVINCES.find((pv) => pv.code === (updates.provinceCode || updated.provinceCode)) || VIETNAM_PROVINCES[0];
          const tariff = getEffectiveTariffVnd(updated.custType, updated.monthlyConsumptionKwh);

          const layout = calculatePanelLayout({
            roofLengthM: updated.roofLengthM,
            roofWidthM: updated.roofWidthM,
            roofShape: updated.roofShape,
            manualAreaM2: updated.manualAreaM2,
            roofL1M: updated.roofL1M,
            roofW1M: updated.roofW1M,
            roofL2M: updated.roofL2M,
            roofW2M: updated.roofW2M,
            panel,
            installMode: updated.installMode,
            targetLoadKw: updated.targetLoadKw,
            manualPanelQty: updated.manualPanelQty,
            monthlyElectricityBillVnd: updated.monthlyElectricityBillVnd,
            monthlyConsumptionKwh: updated.monthlyConsumptionKwh,
            irradianceKwhM2Day: province.dailyIrradianceKwhM2,
            roofDir: updated.roofDir,
            tariffVnd: tariff,
          });

          const inverterProposals = selectInverters({
            installedKwp: layout.installedKwp,
            panelCount: layout.panelQty,
            panel,
            phases: updated.phases,
            sysType: updated.sysType,
            tMinC: province.tMinC,
            tMaxC: province.tMaxC,
            availableInverters: inverters,
          });

          const topInverter =
            inverterProposals.find((prop) => prop.inverter.id === updated.selectedInverterId) ||
            inverterProposals[0];

          const { cables, board } = calculateCablingAndBoard({
            totalAcKw: topInverter ? topInverter.inverter.acKw * topInverter.qtyNeeded : 30,
            inverterKw: topInverter ? topInverter.inverter.acKw : 15,
            phases: updated.phases,
            routeLengthM: 35,
            stringIsc: panel.isc,
          });

          const mounting = calculateMounting(layout, updated.roofType);

          const bomLines = generateProjectBom({
            panel,
            inverter: topInverter?.inverter,
            inverterQty: topInverter?.qtyNeeded || 1,
            layout,
            mounting,
            cables,
            board,
            materialsCatalog: materials,
            marginPct: updated.marginPct,
          });

          const financial = calculateFinancials({
            bomLines,
            installedKwp: layout.installedKwp,
            dailyKwh: layout.dailyKwh,
            tariffVnd: tariff,
            discountPct: updated.discountPct,
            vatPct: 10,
          });

          const resultProject = {
            ...updated,
            layoutResult: layout,
            inverterProposals,
            selectedInverterId: topInverter?.inverter.id,
            cableResults: cables,
            distributionBoard: board,
            mountingResult: mounting,
            bomLines,
            financial,
          };
          saveProjectToServer(resultProject);
          return resultProject;
        }

        saveProjectToServer(updated);
        return updated;
      })
    );

    setTimeout(() => {
      setSaveStatus('saved');
    }, 600);
  };

  const handleComputeLayout = (panel: PanelModel) => {
    handleUpdateProject({ selectedPanelId: panel.id });
  };

  const handleSelectInverterProposal = (prop: InverterProposal) => {
    handleUpdateProject({ selectedInverterId: prop.inverter.id });
  };

  // Tạo dự án mới
  const handleCreateNewProject = (name: string) => {
    const newProj = createInitialProject();
    newProj.id = `proj-${Date.now()}`;
    newProj.name = name;
    newProj.customerName = name;
    newProj.createdAt = new Date().toISOString();
    newProj.updatedAt = new Date().toISOString();
    setProjects([newProj, ...projects]);
    saveProjectToServer(newProj);
    setCurrentProjectId(newProj.id);
    setActiveView('wizard');
    setActiveStep(1);
    showToast('✓ Đã tạo hồ sơ dự án mới thành công');
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    deleteProjectFromServer(id);
    showToast('✓ Đã xóa dự án thành công');

    if (currentProjectId === id) {
      if (updated.length > 0) {
        setCurrentProjectId(updated[0].id);
      } else {
        setCurrentProjectId('');
        setActiveView('projects');
      }
    }
  };

  const handleDuplicateProject = (proj: Project) => {
    const duplicated: Project = {
      ...proj,
      id: `proj-${Date.now()}`,
      name: `${proj.name} (Bản sao)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects([duplicated, ...projects]);
    setCurrentProjectId(duplicated.id);
  };

  const handleApplyQuickProposal = (genProject: Project) => {
    setProjects([genProject, ...projects]);
    setCurrentProjectId(genProject.id);
    setActiveView('wizard');
    setActiveStep(3); // Chuyển thẳng tới bước Layout & Kết quả
  };

  const handlePrint = () => {
    if (activeView !== 'wizard' || activeStep !== 5) {
      setActiveView('wizard');
      setActiveStep(5);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      const freshProject = createInitialProject();
      setProjects([freshProject]);
      setCurrentProjectId(freshProject.id);
      setActiveView('wizard');
      setActiveStep(5);
      showToast('✓ Đã xóa cache thành công! Danh mục 8 nhóm BOM & Suất đầu tư đã được làm mới.');
    } catch (e) {
      console.error(e);
    }
  };

  const steps = [
    { num: 1, label: 'Khách hàng & Mái', desc: 'Thông tin & Nhu cầu' },
    { num: 2, label: 'Cấu hình hệ thống', desc: 'Pha điện & Chế độ' },
    { num: 3, label: 'Panel & Layout', desc: 'Chọn pin & Xếp mái' },
    { num: 4, label: 'Kết quả kỹ thuật', desc: 'Inverter, Cáp, Tủ điện' },
    { num: 5, label: 'Báo giá & BOM', desc: 'Dự toán & Tài chính' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 flex flex-col font-sans">
      {/* 1. Universal Top Header */}
      <Header
        currentProject={currentProject}
        onOpenProjects={() => setActiveView('projects')}
        onOpenAdmin={() => setActiveView('admin')}
        onOpenQuickProposal={() => setShowQuickModal(true)}
        onPrint={handlePrint}
        onClearCache={handleClearCache}
        activeView={activeView}
        userRole={userRole}
        setUserRole={setUserRole}
        saveStatus={saveStatus}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 w-full">
        {/* VIEW 1: PROJECTS LIST */}
        {activeView === 'projects' && (
          <ProjectList
            projects={projects}
            onSelectProject={(proj) => {
              setCurrentProjectId(proj.id);
              setActiveView('wizard');
            }}
            onCreateProject={handleCreateNewProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
          />
        )}

        {/* VIEW 2: ADMIN CATALOG */}
        {activeView === 'admin' && (
          <AdminCatalog
            panels={panels}
            inverters={inverters}
            materials={materials}
            onUpdatePanels={setPanels}
            onUpdateInverters={setInverters}
            onUpdateMaterials={setMaterials}
            onBack={() => setActiveView('wizard')}
          />
        )}

        {/* VIEW 3: UNIFIED WIZARD (5 STEPS) */}
        {activeView === 'wizard' && currentProject ? (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-5">
            {/* Horizontal Step Navigation Bar (Screen only) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-2 sm:p-2.5 shadow-xs print:hidden">
              <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-thin">
                {steps.map((st, idx) => {
                  const isCurrent = activeStep === st.num;
                  const isDone = activeStep > st.num;

                  return (
                    <React.Fragment key={st.num}>
                      <button
                        onClick={() => setActiveStep(st.num)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all shrink-0 ${
                          isCurrent
                            ? 'bg-[#0F2A45] text-white shadow-sm'
                            : isDone
                            ? 'bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100/70'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                            isCurrent
                              ? 'bg-[#E4572E] text-white'
                              : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isDone ? <Check size={13} strokeWidth={3} /> : st.num}
                        </div>

                        <div className="leading-tight">
                          <div className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                            {st.label}
                          </div>
                          <div className={`text-[10px] hidden md:block ${isCurrent ? 'text-slate-300' : 'text-slate-400'}`}>
                            {st.desc}
                          </div>
                        </div>
                      </button>

                      {idx < steps.length - 1 && (
                        <div className="hidden lg:block text-slate-300 shrink-0">
                          <ChevronRight size={16} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Step Content Components */}
            <div>
              {activeStep === 1 && (
                <Step1CustomerRoof
                  project={currentProject}
                  onUpdate={handleUpdateProject}
                  onNext={() => setActiveStep(2)}
                />
              )}

              {activeStep === 2 && (
                <Step2SystemConfig
                  project={currentProject}
                  onUpdate={handleUpdateProject}
                  onNext={() => setActiveStep(3)}
                  onBack={() => setActiveStep(1)}
                />
              )}

              {activeStep === 3 && (
                <Step3PanelLayout
                  project={currentProject}
                  onUpdate={handleUpdateProject}
                  onComputeLayout={handleComputeLayout}
                  onNext={() => setActiveStep(4)}
                  onBack={() => setActiveStep(2)}
                />
              )}

              {activeStep === 4 && (
                <Step4TechnicalResults
                  project={currentProject}
                  onUpdate={handleUpdateProject}
                  onSelectInverterProposal={handleSelectInverterProposal}
                  onNext={() => setActiveStep(5)}
                  onBack={() => setActiveStep(3)}
                  userRole={userRole}
                />
              )}

              {activeStep === 5 && (
                <Step5QuotationBOM
                  project={currentProject}
                  onUpdate={handleUpdateProject}
                  onBack={() => setActiveStep(4)}
                  onPrint={handlePrint}
                  userRole={userRole}
                />
              )}
            </div>
          </div>
        ) : activeView === 'wizard' ? (
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-[#E4572E] flex items-center justify-center mx-auto mb-3">
              <Sun size={24} />
            </div>
            <h3 className="text-base font-bold text-[#0F2A45] mb-1">Chưa có dự án nào được chọn</h3>
            <p className="text-xs text-slate-500 mb-5">
              Bạn có thể tạo một hồ sơ dự án mới hoặc mở từ danh sách dự án hiện có.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setActiveView('projects')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Xem danh sách
              </button>
              <button
                onClick={() => handleCreateNewProject('Dự án mới')}
                className="px-4 py-2 text-xs font-bold text-white bg-[#E4572E] hover:bg-[#d04922] rounded-lg transition-colors shadow"
              >
                Tạo dự án mới
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0F2A45] text-white px-4 py-3 rounded-xl shadow-2xl border border-cyan-400/40 flex items-center gap-2.5 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. Quick 3-Min Proposal Modal */}
      <QuickProposalModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        onApplyProposal={handleApplyQuickProposal}
      />
    </div>
  );
}
