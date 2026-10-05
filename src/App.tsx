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
import { UserProfile, UserRole } from './types/user';
import { getLocalStoredUser, removeLocalStoredUser } from './services/authApi';
import { AuthModal } from './components/auth/AuthModal';

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

// Khởi tạo đối tượng dự án mới hoàn chỉnh khi người dùng tạo dự án
function createInitialProject(name = 'Hồ sơ kỹ thuật mới'): Project {
  const panel = INITIAL_PANELS[0]; // Canadian Solar 585Wp
  const province = VIETNAM_PROVINCES[0]; // Hà Nội (GHI 4.12)
  const tariffVnd = getEffectiveTariffVnd('sinh_hoat', 450);

  const roofLengthM = 15;
  const roofWidthM = 8;

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
    totalAcKw: topInverter ? topInverter.inverter.acKw * topInverter.qtyNeeded : 10,
    inverterKw: topInverter ? topInverter.inverter.acKw : 10,
    phases: '3',
    routeLengthM: 25,
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
    roofType: 'tole',
    hasCanopyFrame: false,
    includeEvnDocs: false,
    includeTransport: true,
    includeScada: false, // Mặc định không có (ETEK ko cần)
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
    id: `proj-${Date.now()}`,
    name,
    customerName: name,
    phone: '',
    address: 'Hà Nội',
    status: 'draft',
    module: 'solar',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    custType: 'sinh_hoat',
    provinceCode: 'HAN',
    monthlyElectricityBillVnd: 5000000,
    monthlyConsumptionKwh: 1600,
    roofType: 'tole',
    roofDir: 's',
    roofShape: 'rect',
    roofLengthM,
    roofWidthM,
    roofHeightM: 10,
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
    includeEvnDocs: false,
    includeScada: false,
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
    const user = getLocalStoredUser();
    if (!user) return [];
    try {
      const saved = localStorage.getItem(`hgc_projects_${user.email.toLowerCase()}`);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((p: any) => p.id !== 'demo-hgc-01' && !p.name?.includes('Văn Phòng HGC'))
            .map(upgradeProjectIfNeeded);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => projects[0]?.id || '');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeView, setActiveView] = useState<'wizard' | 'projects' | 'admin'>('projects');
  const [userRole, setUserRole] = useState<UserRole>('ky_su');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getLocalStoredUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showQuickModal, setShowQuickModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role) {
      setUserRole(user.role);
    }
    // Nạp cache riêng của user hoặc reset để không lẫn lộn với tài khoản trước
    try {
      const cached = localStorage.getItem(`hgc_projects_${user.email.toLowerCase()}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const cleanCached = parsed.filter((p: any) => p.id !== 'demo-hgc-01' && !p.name?.includes('Văn Phòng HGC'));
          setProjects(cleanCached);
          setCurrentProjectId(cleanCached[0]?.id || '');
        }
      } else {
        setProjects([]);
        setCurrentProjectId('');
      }
    } catch {
      setProjects([]);
      setCurrentProjectId('');
    }

    // Tải mới từ PostgreSQL Backend theo đúng quyền của tài khoản này
    fetchProjectsFromServer(user.email, user.role).then((serverProjects) => {
      if (serverProjects !== null && Array.isArray(serverProjects)) {
        const cleanProjects = serverProjects.filter(
          (p: any) => p.id !== 'demo-hgc-01' && !p.name?.includes('Văn Phòng HGC')
        );
        setProjects(cleanProjects);
        if (cleanProjects.length > 0) {
          setCurrentProjectId(cleanProjects[0].id);
        } else {
          setCurrentProjectId('');
          setActiveView('projects');
        }
      }
    });

    showToast(`✓ Đăng nhập thành công: ${user.fullName}`);
  };

  const handleLogout = () => {
    removeLocalStoredUser();
    setCurrentUser(null);
    setProjects([]);
    setCurrentProjectId('');
    setActiveView('projects');
    showToast('✓ Đã đăng xuất tài khoản');
  };

  // Catalogs
  const [panels, setPanels] = useState<PanelModel[]>(INITIAL_PANELS);
  const [inverters, setInverters] = useState(INITIAL_INVERTERS);
  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const saved = localStorage.getItem('hgc_materials_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MATERIALS;
  });

  const handleUpdateMaterials = (newMats: MaterialItem[]) => {
    setMaterials(newMats);
    try {
      localStorage.setItem('hgc_materials_catalog', JSON.stringify(newMats));
    } catch (e) {
      console.error(e);
    }
    showToast('✓ Đã lưu bảng giá vật tư Catalog mới');
  };

  // Khởi tạo & Cập nhật khi tài khoản thay đổi: Đồng bộ dữ liệu dự án của riêng tài khoản từ Backend Server
  useEffect(() => {
    if (currentUser) {
      fetchProjectsFromServer(currentUser.email, currentUser.role).then((serverProjects) => {
        if (serverProjects !== null && Array.isArray(serverProjects)) {
          const cleanProjects = serverProjects.filter(
            (p: any) => p.id !== 'demo-hgc-01' && !p.name?.includes('Văn Phòng HGC')
          );
          setProjects(cleanProjects);
          if (cleanProjects.length > 0) {
            if (!cleanProjects.some((p) => p.id === currentProjectId)) {
              setCurrentProjectId(cleanProjects[0].id);
            }
          } else {
            setCurrentProjectId('');
            setActiveView('projects');
          }
        }
      });
    } else {
      setProjects([]);
      setCurrentProjectId('');
      setActiveView('projects');
    }
  }, [currentUser?.email, currentUser?.role]);

  // Đồng bộ LocalStorage theo từng tài khoản riêng biệt (tránh lộ dữ liệu trên cùng trình duyệt)
  useEffect(() => {
    if (currentUser && projects.length > 0) {
      try {
        const userStorageKey = `hgc_projects_${currentUser.email.toLowerCase()}`;
        localStorage.setItem(userStorageKey, JSON.stringify(projects));
      } catch (e) {
        console.error(e);
      }
    }
  }, [projects, currentUser?.email]);

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
          updates.targetLoadKw !== undefined ||
          updates.hasCanopyFrame !== undefined ||
          updates.canopyAreaM2 !== undefined ||
          updates.canopyUnitCostVnd !== undefined ||
          updates.includeEvnDocs !== undefined ||
          updates.evnDocsCostVnd !== undefined ||
          updates.includeTransport !== undefined ||
          updates.transportCostVnd !== undefined ||
          updates.installCostVndPerKwp !== undefined ||
          updates.includeScada !== undefined ||
          updates.scadaCostVnd !== undefined
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
            roofType: updated.roofType,
            hasCanopyFrame: updated.hasCanopyFrame,
            canopyAreaM2: updated.canopyAreaM2,
            canopyUnitCostVnd: updated.canopyUnitCostVnd,
            includeEvnDocs: updated.includeEvnDocs,
            evnDocsCostVnd: updated.evnDocsCostVnd,
            includeTransport: updated.includeTransport,
            transportCostVnd: updated.transportCostVnd,
            installCostVndPerKwp: updated.installCostVndPerKwp,
            includeScada: updated.includeScada,
            scadaCostVnd: updated.scadaCostVnd,
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
          saveProjectToServer(resultProject, currentUser?.email, currentUser?.role);
          return resultProject;
        }

        saveProjectToServer(updated, currentUser?.email, currentUser?.role);
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

  // Tạo dự án mới gắn quyền sở hữu cho người tạo
  const handleCreateNewProject = (name: string) => {
    const newProj = createInitialProject();
    newProj.id = `proj-${Date.now()}`;
    newProj.name = name;
    newProj.customerName = name;
    newProj.createdByEmail = currentUser?.email || 'admin@hgcvn.cloud';
    newProj.createdByName = currentUser?.fullName || 'Kỹ sư HGC';
    newProj.sharedWithEmails = [];
    newProj.sharedWithRoles = [];
    newProj.isPublic = false;
    newProj.createdAt = new Date().toISOString();
    newProj.updatedAt = new Date().toISOString();

    setProjects([newProj, ...projects]);
    saveProjectToServer(newProj, currentUser?.email, currentUser?.role);
    setCurrentProjectId(newProj.id);
    setActiveView('wizard');
    setActiveStep(1);
    showToast('✓ Đã tạo hồ sơ dự án mới cho tài khoản của bạn');
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    if (currentUser) {
      try {
        localStorage.setItem(`hgc_projects_${currentUser.email.toLowerCase()}`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    deleteProjectFromServer(id, currentUser?.email, currentUser?.role);
    showToast('✓ Đã xóa vĩnh viễn dự án thành công');

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
      customerName: `${proj.customerName} (Bản sao)`,
      createdByEmail: currentUser?.email || proj.createdByEmail,
      createdByName: currentUser?.fullName || proj.createdByName,
      sharedWithEmails: [],
      sharedWithRoles: [],
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects([duplicated, ...projects]);
    saveProjectToServer(duplicated, currentUser?.email, currentUser?.role);
    setCurrentProjectId(duplicated.id);
    setActiveView('wizard');
    setActiveStep(1);
    showToast('✓ Đã nhân bản hồ sơ dự án vào tài khoản của bạn');
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
      if (currentUser) {
        localStorage.removeItem(`hgc_projects_${currentUser.email.toLowerCase()}`);
      }
      setProjects([]);
      setCurrentProjectId('');
      setActiveView('projects');
      showToast('✓ Đã dọn sạch bộ nhớ cache thành công!');
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
        currentUser={currentUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 w-full">
        {!currentUser ? (
          /* GUEST / NOT LOGGED IN LANDING SCREEN - Yêu cầu đăng nhập trước khi xem dự án */
          <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8 animate-fadeIn">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-xs">
                <CheckCircle2 size={14} className="text-cyan-400" />
                <span>Hệ Thống Tính Toán Kỹ Thuật & Báo Giá HGC Solar</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F2A45] tracking-tight leading-tight">
                Phần Mềm Thiết Kế & Báo Giá Điện Mặt Trời Áp Mái
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Hệ thống chuyên dụng dành cho Kỹ sư, Đối tác và Khách hàng của Công Ty TNHH HGC. Vui lòng đăng nhập để xem thông tin dự án, tính toán diện tích lắp đặt tấm pin và xuất dự toán BOM.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#E4572E] to-[#f27449] hover:brightness-110 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sun size={16} />
                  <span>Đăng nhập hệ thống</span>
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0F2A45] hover:bg-[#153454] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 border border-[#1E4C7C] cursor-pointer"
                >
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Đăng ký tài khoản mới</span>
                </button>
              </div>
            </div>

            {/* 3 Highlights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#E4572E] flex items-center justify-center font-bold text-lg">
                  ☀
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Bố trí Panel 2D Tự Động</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tự động tối ưu số lượng tấm pin áp mái theo kích thước chiều dài, rộng hoặc công suất tiêu thụ điện hàng tháng.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Phối Ghép Inverter Chuẩn</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kiểm tra điện áp Voc cực tiểu, cực đại theo nhiệt độ Việt Nam và tỷ lệ DC/AC tối ưu từ 1.15 đến 1.35.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  📄
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Dự Toán BOM 8 Nhóm Vật Tư</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Xuất bảng vật tư chi tiết, tính toán dây cáp AC/DC, tủ điện phân phối và in PDF hồ sơ báo giá chuyên nghiệp.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500">
              Công Ty TNHH HGC · Trụ sở: B36 TT7 KĐT Văn Quán, Hà Đông, Hà Nội · Hotline: 0974 04 19 84
            </div>
          </div>
        ) : (
          <>
            {/* VIEW 1: PROJECTS LIST */}
        {activeView === 'projects' && (
          <ProjectList
            projects={projects}
            currentUser={currentUser}
            onSelectProject={(proj) => {
              setCurrentProjectId(proj.id);
              setActiveView('wizard');
            }}
            onCreateProject={handleCreateNewProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onUpdateProject={(updated) => {
              setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              saveProjectToServer(updated, currentUser?.email, currentUser?.role);
              showToast('✓ Đã cập nhật quyền chia sẻ dự án');
            }}
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
            onUpdateMaterials={handleUpdateMaterials}
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
          </>
        )}
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

      {/* 4. User Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
