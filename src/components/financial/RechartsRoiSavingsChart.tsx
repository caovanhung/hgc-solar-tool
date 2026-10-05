import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { FinancialResult } from '../../types/solar';
import { TrendingUp, DollarSign, Calendar, Target, Award } from 'lucide-react';

interface RechartsRoiSavingsChartProps {
  financial: FinancialResult;
}

export const RechartsRoiSavingsChart: React.FC<RechartsRoiSavingsChartProps> = ({ financial }) => {
  const [yearHorizon, setYearHorizon] = useState<10 | 15 | 20>(20);

  const initialCapex = financial.grandTotalVnd;
  const initialCapexMillion = Number((initialCapex / 1000000).toFixed(1));

  // Chuẩn bị dữ liệu hiển thị theo horizon 10, 15, hoặc 20 năm
  const rawData = financial.cashflow20Years.slice(0, yearHorizon);

  const chartData = rawData.map((d) => {
    const annualSavingsMln = Number((d.annualSavingsVnd / 1000000).toFixed(1));
    const cumulativeSavingsMln = Number((d.cumulativeSavingsVnd / 1000000).toFixed(1));
    const netCashflowMln = Number((d.netCashflowVnd / 1000000).toFixed(1));
    // ROI % = (Tổng tiết kiệm tích lũy / Vốn ban đầu - 1) * 100
    // Khi cumulativeSavings = initialCapex -> ROI = 0% (Hòa vốn), sau đó dương
    const roiPct = initialCapex > 0 ? Number((((d.cumulativeSavingsVnd - initialCapex) / initialCapex) * 100).toFixed(1)) : 0;
    // Hoặc tổng tỷ suất hoàn vốn (%)
    const capitalRecoveryPct = initialCapex > 0 ? Number(((d.cumulativeSavingsVnd / initialCapex) * 100).toFixed(1)) : 0;

    return {
      yearLabel: `Năm ${d.year}`,
      year: d.year,
      annualSavingsMln,
      cumulativeSavingsMln,
      netCashflowMln,
      roiPct,
      capitalRecoveryPct,
      breakEven: d.netCashflowVnd >= 0,
    };
  });

  // Số liệu tổng quan tại mốc chọn
  const endPoint = chartData[chartData.length - 1];
  const roiAtHorizon = endPoint ? endPoint.roiPct : 0;
  const totalSavingsAtHorizon = endPoint ? endPoint.cumulativeSavingsMln : 0;

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs text-slate-200 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 font-bold">
            <span className="text-white text-sm">{label}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                data.roiPct >= 0
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {data.roiPct >= 0 ? `Lãi +${data.roiPct}% ROI` : `Đang thu hồi (${data.capitalRecoveryPct}%)`}
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Tiết kiệm trong năm:</span>
              <strong className="text-emerald-400">+{data.annualSavingsMln} tr đ</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Tiết kiệm tích lũy:</span>
              <strong className="text-cyan-300">{data.cumulativeSavingsMln} tr đ</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Dòng tiền ròng:</span>
              <strong className={data.netCashflowMln >= 0 ? 'text-amber-400' : 'text-rose-400'}>
                {data.netCashflowMln >= 0 ? `+${data.netCashflowMln}` : data.netCashflowMln} tr đ
              </strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 text-xs">
              <span className="text-slate-300 font-sans font-bold">Tỷ suất ROI ròng:</span>
              <strong className={`font-bold ${data.roiPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.roiPct >= 0 ? `+${data.roiPct}%` : `${data.roiPct}%`}
              </strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5 text-slate-200">
      {/* Header and Horizon Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <h4 className="text-sm font-bold text-white">
              Phân Tích Tỷ Suất Hoàn Vốn (ROI) & Tiết Kiệm Hàng Năm (Recharts)
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Biểu đồ kết hợp (Composed Chart) thể hiện số tiền tiết kiệm hàng năm (Cột) và Tỷ suất ROI ròng tích lũy (Đường)
          </p>
        </div>

        {/* Time Horizon Selector (10, 15, 20 Years) */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] px-2 flex items-center gap-1">
            <Calendar size={12} /> Kỳ hạn:
          </span>
          {([10, 15, 20] as const).map((years) => (
            <button
              key={years}
              onClick={() => setYearHorizon(years)}
              className={`px-3 py-1 rounded-md font-bold transition-all text-xs ${
                yearHorizon === years
                  ? 'bg-[#E4572E] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {years} Năm
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Vốn Đầu Tư Ban Đầu</span>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-200 mt-0.5">
            {initialCapexMillion} <span className="text-xs font-normal text-slate-400">tr đ</span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide block">
            Tổng Tiết Kiệm ({yearHorizon} Năm)
          </span>
          <div className="text-base sm:text-lg font-bold font-mono text-cyan-400 mt-0.5">
            {totalSavingsAtHorizon.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">tr đ</span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide block">
            ROI Tại Năm Thứ {yearHorizon}
          </span>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5">
            +{roiAtHorizon}% <span className="text-xs font-normal text-emerald-500">lãi ròng</span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Điểm Hòa Vốn Chuẩn</span>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-400 mt-0.5">
            {financial.paybackYears} <span className="text-xs font-normal text-slate-400">năm</span>
          </div>
        </div>
      </div>

      {/* Recharts Responsive Composed Chart */}
      <div className="w-full h-72 sm:h-80 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 15, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />

            {/* Trục X: Năm */}
            <XAxis
              dataKey="yearLabel"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
            />

            {/* Trục Y trái: Tiền tiết kiệm hàng năm (triệu VNĐ) */}
            <YAxis
              yAxisId="left"
              stroke="#10B981"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(v) => `${v} tr`}
              domain={[0, 'auto']}
            />

            {/* Trục Y phải: Tỷ suất hoàn vốn ROI (%) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#F59E0B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: '11px', color: '#CBD5E1' }}
              formatter={(value) => {
                if (value === 'annualSavingsMln') return 'Tiết kiệm hàng năm (triệu VNĐ)';
                if (value === 'roiPct') return 'Tỷ suất ROI ròng tích lũy (%)';
                return value;
              }}
            />

            {/* Đường tham chiếu Hòa Vốn (0% ROI) */}
            <ReferenceLine
              y={0}
              yAxisId="right"
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: '★ Hòa vốn (0% ROI)',
                fill: '#F87171',
                fontSize: 10,
                position: 'insideBottomRight',
              }}
            />

            {/* Bar: Tiết kiệm hàng năm */}
            <Bar
              yAxisId="left"
              dataKey="annualSavingsMln"
              name="annualSavingsMln"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />

            {/* Line: Tỷ suất ROI (%) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roiPct"
              name="roiPct"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ r: 3.5, fill: '#0F172A', stroke: '#F59E0B', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#F59E0B', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Notes */}
      <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Cột xanh: Tiền điện tiết kiệm từng năm (đã tính suy giảm 0.7%/năm & trượt giá 1%/năm).
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Đường cam: Tỷ suất lợi nhuận ròng ROI trên tổng vốn đầu tư ban đầu ({initialCapexMillion} triệu đ).
        </span>
      </div>
    </div>
  );
};
