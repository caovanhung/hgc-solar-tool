import React, { useState } from 'react';
import { FinancialResult } from '../../types/solar';

interface CashflowChartProps {
  financial: FinancialResult;
}

export const CashflowChart: React.FC<CashflowChartProps> = ({ financial }) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const data = financial.cashflow20Years;
  if (!data || data.length === 0) return null;

  const width = 760;
  const height = 300;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Tìm min và max cho trục Y
  const maxCumulative = Math.max(...data.map((d) => d.cumulativeSavingsVnd));
  const minNet = -financial.grandTotalVnd;
  const maxNet = Math.max(...data.map((d) => d.netCashflowVnd));

  const yMin = Math.min(minNet * 1.05, 0);
  const yMax = Math.max(maxNet * 1.1, maxCumulative * 0.9);

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - yMin) / (yMax - yMin)) * chartHeight;
  };

  const getX = (yearIndex: number) => {
    return paddingLeft + (yearIndex / (data.length - 1)) * chartWidth;
  };

  const zeroY = getY(0);

  // Đường đa giác Net Cashflow Line
  const netLinePoints = data
    .map((d, i) => `${getX(i)},${getY(d.netCashflowVnd)}`)
    .join(' ');

  // Format tiền VND
  const formatMln = (val: number) => {
    const mln = val / 1000000;
    return `${mln >= 0 ? '+' : ''}${mln.toFixed(0)} tr`;
  };

  const activeData = hoveredYear !== null ? data.find((d) => d.year === hoveredYear) : null;

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-800 p-4 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Dòng tiền & Hiệu quả hoàn vốn 20 năm</span>
            <span className="text-xs font-normal text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
              Hoàn vốn: {financial.paybackYears} năm · IRR: {financial.irrPct}%
            </span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Dựa trên mô hình tự dùng 70% ban ngày · Suy hao tấm pin 0.7%/năm · Trượt giá điện 1%/năm
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-slate-300">Tiết kiệm hàng năm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-400"></span>
            <span className="text-slate-300">Dòng tiền ròng tích lũy</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[640px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
            {/* Lưới ngang Grid lines */}
            {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const val = yMin + pct * (yMax - yMin);
              const y = getY(val);
              return (
                <g key={`grid-${idx}`}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#334155"
                    strokeWidth={0.7}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#64748B"
                    className="font-mono"
                  >
                    {formatMln(val)}
                  </text>
                </g>
              );
            })}

            {/* Trục hoành 0 VND (Điểm hòa vốn) */}
            <line
              x1={paddingLeft}
              y1={zeroY}
              x2={width - paddingRight}
              y2={zeroY}
              stroke="#94A3B8"
              strokeWidth={1.5}
            />
            <text
              x={paddingLeft - 8}
              y={zeroY + 3}
              textAnchor="end"
              fontSize="10"
              fill="#F8FAFC"
              fontWeight="bold"
              className="font-mono"
            >
              0 đ
            </text>

            {/* Cột Tiết kiệm hàng năm (Annual Savings Bar) */}
            {data.map((d, i) => {
              const x = getX(i);
              const barWidth = 14;
              const barHeight = ((d.annualSavingsVnd) / (yMax - yMin)) * chartHeight;
              const barY = zeroY - barHeight;

              return (
                <g
                  key={`bar-${d.year}`}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredYear(d.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                >
                  <rect
                    x={x - barWidth / 2}
                    y={barY}
                    width={barWidth}
                    height={Math.max(2, barHeight)}
                    rx={2}
                    fill={hoveredYear === d.year ? '#34D399' : '#059669'}
                    opacity={hoveredYear !== null && hoveredYear !== d.year ? 0.4 : 0.85}
                  />
                  {/* Nhãn năm dưới trục X */}
                  <text
                    x={x}
                    y={height - paddingBottom + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill={hoveredYear === d.year ? '#F8FAFC' : '#94A3B8'}
                    fontWeight={hoveredYear === d.year ? 'bold' : 'normal'}
                    className="font-mono"
                  >
                    N{d.year}
                  </text>
                </g>
              );
            })}

            {/* Đường Dòng tiền ròng tích lũy (Cumulative Net Cashflow Line) */}
            <polyline
              points={netLinePoints}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Các điểm nút trên đường line */}
            {data.map((d, i) => {
              const cx = getX(i);
              const cy = getY(d.netCashflowVnd);
              const isHover = hoveredYear === d.year;
              return (
                <circle
                  key={`dot-${d.year}`}
                  cx={cx}
                  cy={cy}
                  r={isHover ? 5.5 : 3.5}
                  fill="#0F172A"
                  stroke="#F59E0B"
                  strokeWidth={isHover ? 3 : 2}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredYear(d.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                />
              );
            })}

            {/* Marker Điểm Hoàn Vốn (Breakeven Point) */}
            {financial.paybackYears <= 20 && (
              <g transform={`translate(${paddingLeft + (financial.paybackYears / 20) * chartWidth}, ${zeroY})`}>
                <line x1="0" y1="-25" x2="0" y2="25" stroke="#EF4444" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx="0" cy="0" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                <rect x="-42" y="-38" width="84" height="18" rx="4" fill="#EF4444" />
                <text x="0" y="-26" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">
                  ★ Hoàn vốn {financial.paybackYears} năm
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      <div className="mt-3 p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {activeData ? (
          <>
            <div>
              <span className="text-slate-400">Năm thứ:</span>{' '}
              <strong className="text-white font-mono text-sm">{activeData.year}</strong>{' '}
              <span className="text-slate-500">(Hiệu suất còn {(activeData.degradationFactor * 100).toFixed(1)}%)</span>
            </div>
            <div>
              <span className="text-slate-400">Sản lượng:</span>{' '}
              <strong className="text-emerald-400 font-mono">{activeData.generatedKwh.toLocaleString('vi-VN')} kWh</strong>
            </div>
            <div>
              <span className="text-slate-400">Tiết kiệm năm:</span>{' '}
              <strong className="text-emerald-400 font-mono">
                {activeData.annualSavingsVnd.toLocaleString('vi-VN')} đ
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Dòng tiền ròng:</span>{' '}
              <strong
                className={`font-mono font-bold ${
                  activeData.netCashflowVnd >= 0 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {activeData.netCashflowVnd.toLocaleString('vi-VN')} đ
              </strong>
            </div>
          </>
        ) : (
          <div className="w-full text-center text-slate-500 text-[11px] italic">
            Di chuột hoặc chạm vào các cột/điểm trên đồ thị để xem chi tiết tài chính từng năm
          </div>
        )}
      </div>
    </div>
  );
};
