import React from 'react';
import { InverterProposal, DistributionBoardResult, CableResult, PanelModel } from '../../types/solar';

interface SingleLineDiagramProps {
  inverterProposal?: InverterProposal;
  board: DistributionBoardResult;
  cables: CableResult[];
  panel: PanelModel;
  phases: '1' | '3';
}

export const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  inverterProposal,
  board,
  cables,
  panel,
  phases,
}) => {
  const is3Phase = phases === '3';
  const inv = inverterProposal?.inverter;

  return (
    <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Sơ đồ nguyên lý một sợi (Single Line Diagram - SLD)
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
          IEC 60364-7-712 · Zero-Export
        </span>
      </div>

      <div className="min-w-[620px] flex justify-center py-4">
        <svg viewBox="0 0 740 260" className="w-full max-w-3xl drop-shadow select-none">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38BDF8" />
            </marker>
          </defs>

          {/* 1. KHỐI GIÀN PIN PV */}
          <g transform="translate(30, 40)">
            <rect x="0" y="0" width="100" height="150" rx="6" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
            <text x="50" y="22" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="bold">
              GIÀN PIN PV
            </text>
            <text x="50" y="42" textAnchor="middle" fill="#CBD5E1" fontSize="9">
              {panel.brand}
            </text>
            <text x="50" y="58" textAnchor="middle" fill="#F59E0B" fontSize="10" fontWeight="bold">
              {panel.wp}Wp
            </text>

            <rect x="15" y="72" width="70" height="60" rx="3" fill="#1E293B" stroke="#475569" />
            <line x1="15" y1="92" x2="85" y2="92" stroke="#475569" />
            <line x1="15" y1="112" x2="85" y2="112" stroke="#475569" />
            <line x1="50" y1="72" x2="50" y2="132" stroke="#475569" />

            <text x="50" y="146" textAnchor="middle" fill="#94A3B8" fontSize="8" className="font-mono">
              Voc: {panel.voc}V · Isc: {panel.isc}A
            </text>
          </g>

          {/* Dây nối DC */}
          <line x1="130" y1="115" x2="195" y2="115" stroke="#F59E0B" strokeWidth="2.5" />
          <text x="162" y="105" textAnchor="middle" fill="#F59E0B" fontSize="8" className="font-mono">
            DC 1x4mm²
          </text>

          {/* 2. KHỐI BẢO VỆ DC (DC ISOLATOR + SPD DC) */}
          <g transform="translate(195, 75)">
            <rect x="0" y="0" width="85" height="80" rx="4" fill="#0F172A" stroke="#E2E8F0" strokeWidth="1.5" />
            <text x="42" y="18" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontWeight="bold">
              TỦ DC / SPD
            </text>
            <text x="42" y="34" textAnchor="middle" fill="#38BDF8" fontSize="8">
              Cầu chì 1000V
            </text>
            <rect x="15" y="44" width="55" height="24" rx="2" fill="#E11D48" />
            <text x="42" y="59" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
              SPD DC Type 2
            </text>
          </g>

          {/* Dây nối vào Inverter */}
          <line x1="280" y1="115" x2="335" y2="115" stroke="#F59E0B" strokeWidth="2.5" />

          {/* 3. KHỐI INVERTER BIẾN TẦN */}
          <g transform="translate(335, 45)">
            <rect x="0" y="0" width="115" height="140" rx="6" fill="#0F172A" stroke="#10B981" strokeWidth="2" />
            <text x="57" y="24" textAnchor="middle" fill="#10B981" fontSize="11" fontWeight="bold">
              INVERTER
            </text>
            <text x="57" y="42" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontWeight="medium">
              {inv ? `${inv.brand} ${inv.model}` : 'Biến tần hòa lưới'}
            </text>
            <text x="57" y="58" textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="bold">
              {inv ? `${inv.acKw} kW` : '10 kW'}
            </text>
            {/* Ký hiệu chuyển đổi DC -> AC */}
            <circle cx="57" cy="85" r="18" fill="#1E293B" stroke="#10B981" strokeWidth="1.2" />
            <text x="48" y="89" fill="#F59E0B" fontSize="10" fontWeight="bold">
              =
            </text>
            <text x="56" y="89" fill="#94A3B8" fontSize="10">
              /
            </text>
            <text x="62" y="89" fill="#38BDF8" fontSize="10" fontWeight="bold">
              ~
            </text>

            <text x="57" y="122" textAnchor="middle" fill="#94A3B8" fontSize="8">
              {is3Phase ? '3 Pha 380V · 50Hz' : '1 Pha 220V · 50Hz'}
            </text>
          </g>

          {/* Dây AC nối sang Tủ AC */}
          <line x1="450" y1="115" x2="505" y2="115" stroke="#38BDF8" strokeWidth="2.5" />
          <text x="477" y="105" textAnchor="middle" fill="#38BDF8" fontSize="8" className="font-mono">
            AC
          </text>

          {/* 4. KHỐI TỦ ĐIỆN AC & BẢO VỆ */}
          <g transform="translate(505, 55)">
            <rect x="0" y="0" width="105" height="120" rx="6" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.8" />
            <text x="52" y="20" textAnchor="middle" fill="#F59E0B" fontSize="10" fontWeight="bold">
              TỦ ĐIỆN TỔNG AC
            </text>

            {/* MCCB */}
            <rect x="15" y="32" width="75" height="26" rx="3" fill="#1E293B" stroke="#64748B" />
            <text x="52" y="49" textAnchor="middle" fill="#F8FAFC" fontSize="9" fontWeight="bold">
              MCCB {board.mccbRatedA}A
            </text>

            {/* SPD AC */}
            <rect x="15" y="66" width="75" height="24" rx="3" fill="#E11D48" />
            <text x="52" y="81" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
              SPD AC Type 2
            </text>

            {/* Smart Meter */}
            <rect x="15" y="96" width="75" height="16" rx="2" fill="#0284C7" />
            <text x="52" y="108" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">
              Smart Meter / CT
            </text>
          </g>

          {/* Dây nối sang Phụ tải / Lưới */}
          <line x1="610" y1="115" x2="665" y2="115" stroke="#38BDF8" strokeWidth="2.5" markerEnd="url(#arrow)" />

          {/* 5. PHỤ TẢI CÔNG TRÌNH / LƯỚI ĐIỆN EVN */}
          <g transform="translate(665, 75)">
            <rect x="0" y="0" width="65" height="80" rx="4" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
            <text x="32" y="24" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontWeight="bold">
              PHỤ TẢI
            </text>
            <text x="32" y="40" textAnchor="middle" fill="#38BDF8" fontSize="8">
              & LƯỚI EVN
            </text>
            <text x="32" y="60" textAnchor="middle" fill="#10B981" fontSize="7" fontWeight="bold">
              Bám tải 0W
            </text>
          </g>

          {/* Dây tiếp địa PE bên dưới */}
          <line x1="80" y1="215" x2="560" y2="215" stroke="#10B981" strokeWidth="2" strokeDasharray="6 3" />
          <text x="320" y="235" textAnchor="middle" fill="#10B981" fontSize="9" className="font-mono">
            HỆ THỐNG TIẾP ĐỊA AN TOÀN CHỐNG SÉT PE ≤ 4Ω (TCVN 9207)
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div>
          <span className="text-slate-500">Phía DC:</span>{' '}
          <strong className="text-slate-200">1500V DC Isolator + SPD Type 2</strong>
        </div>
        <div>
          <span className="text-slate-500">Phía AC:</span>{' '}
          <strong className="text-slate-200">MCCB {board.mccbRatedA}A + SPD Type 2</strong>
        </div>
        <div>
          <span className="text-slate-500">Dây AC chính:</span>{' '}
          <strong className="text-slate-200">
            Cu {cables[0]?.standardCsaMm2 || 16}mm² (ΔU: {cables[0]?.voltageDropPct || 1.2}%)
          </strong>
        </div>
        <div>
          <span className="text-slate-500">Chế độ vận hành:</span>{' '}
          <strong className="text-emerald-400">Zero-Export chống phát lưới</strong>
        </div>
      </div>
    </div>
  );
};
