import React, { useState } from 'react';
import { LayoutResult, PanelModel, RoofDirection, RoofType, RoofShape } from '../../types/solar';
import { Compass, ZoomIn, ZoomOut, RotateCcw, Info, Sun } from 'lucide-react';

interface RoofCanvasProps {
  layout: LayoutResult;
  panel: PanelModel;
  roofLengthM: number;
  roofWidthM: number;
  roofDir: RoofDirection;
  roofType: RoofType;
  roofShape?: RoofShape;
  roofL1M?: number;
  roofW1M?: number;
  roofL2M?: number;
  roofW2M?: number;
}

export const RoofCanvas: React.FC<RoofCanvasProps> = ({
  layout,
  panel,
  roofLengthM,
  roofWidthM,
  roofDir,
  roofType,
  roofShape = 'rect',
  roofL1M,
  roofW1M,
  roofL2M,
  roofW2M,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredPanel, setHoveredPanel] = useState<{ row: number; col: number } | null>(null);

  // Kích thước vẽ SVG (đơn vị ảo px, tỷ lệ theo m)
  const scale = 24; // 1m = 24px
  const roofW = Math.max(120, roofWidthM * scale);
  const roofH = Math.max(120, roofLengthM * scale);
  const padding = 55;

  const svgWidth = roofW + padding * 2;
  const svgHeight = roofH + padding * 2;

  const pwPx = layout.pw * scale;
  const phPx = layout.ph * scale;
  const gapPx = 0.025 * scale; // 25mm

  // Góc la bàn theo hướng mái
  const dirAngles: Record<RoofDirection, number> = {
    s: 0, // Nam 180°
    se: -45, // Đông Nam 135°
    sw: 45, // Tây Nam 225°
    e: -90, // Đông 90°
    w: 90, // Tây 270°
  };

  const dirDegrees: Record<RoofDirection, string> = {
    s: '180°',
    se: '135°',
    sw: '225°',
    e: '90°',
    w: '270°',
  };

  // Textures mái nhà
  const getRoofBackground = () => {
    switch (roofType) {
      case 'tole':
        return '#CBD5E1'; // Mái tôn màu xám sáng
      case 'concrete':
        return '#94A3B8'; // Mái bê tông xám đậm
      case 'tile':
        return '#DC2626'; // Mái ngói đỏ đất
      default:
        return '#E2E8F0';
    }
  };

  // Render các tấm pin
  const renderPanels = () => {
    const panels = [];
    const usableW = layout.cols * (pwPx + gapPx) - gapPx;
    const usableH = layout.rows * (phPx + gapPx) - gapPx;

    const startX = padding + (roofW - usableW) / 2;
    const startY = padding + (roofH - usableH) / 2;

    let panelIndex = 1;

    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        const x = startX + c * (pwPx + gapPx);
        const y = startY + r * (phPx + gapPx);

        if (panelIndex > layout.panelQty) {
          panels.push(
            <g key={`empty-${r}-${c}`} className="select-none opacity-45 pointer-events-none">
              <rect
                x={x}
                y={y}
                width={pwPx}
                height={phPx}
                rx={1.5}
                fill="none"
                stroke="#94A3B8"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {pwPx > 18 && phPx > 22 && (
                <text
                  x={x + pwPx / 2}
                  y={y + phPx / 2 + 3}
                  textAnchor="middle"
                  fontSize={Math.min(8, pwPx / 3.5)}
                  fill="#94A3B8"
                  className="font-mono"
                >
                  +{panelIndex}
                </text>
              )}
            </g>
          );
          panelIndex++;
          continue;
        }

        const isHovered = hoveredPanel?.row === r && hoveredPanel?.col === c;

        panels.push(
          <g
            key={`p-${r}-${c}`}
            onMouseEnter={() => setHoveredPanel({ row: r, col: c })}
            onMouseLeave={() => setHoveredPanel(null)}
            className="cursor-pointer transition-all duration-150"
          >
            {/* Khung tấm pin nhôm bạc */}
            <rect
              x={x}
              y={y}
              width={pwPx}
              height={phPx}
              rx={1.5}
              fill={isHovered ? '#1E3A8A' : '#0F172A'}
              stroke={isHovered ? '#38BDF8' : '#64748B'}
              strokeWidth={isHovered ? 2 : 1}
            />

            {/* Mặt kính tế bào quang điện (Cell lines) */}
            <line
              x1={x + pwPx / 2}
              y1={y + 1}
              x2={x + pwPx / 2}
              y2={y + phPx - 1}
              stroke="#334155"
              strokeWidth={0.8}
            />
            <line
              x1={x + 1}
              y1={y + phPx / 3}
              x2={x + pwPx - 1}
              y2={y + phPx / 3}
              stroke="#334155"
              strokeWidth={0.6}
            />
            <line
              x1={x + 1}
              y1={y + (2 * phPx) / 3}
              x2={x + pwPx - 1}
              y2={y + (2 * phPx) / 3}
              stroke="#334155"
              strokeWidth={0.6}
            />

            {/* Số thứ tự tấm pin nhỏ mờ */}
            {pwPx > 18 && phPx > 22 && (
              <text
                x={x + pwPx / 2}
                y={y + phPx / 2 + 3}
                textAnchor="middle"
                fontSize={Math.min(9, pwPx / 3)}
                fill={isHovered ? '#F8FAFC' : '#64748B'}
                className="font-mono select-none"
              >
                {panelIndex}
              </text>
            )}
          </g>
        );
        panelIndex++;
      }
    }

    return panels;
  };

  return (
    <div className="relative w-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex flex-col">
      {/* Top Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-white">{layout.panelQty} tấm pin</span>
          <span className="text-slate-400">·</span>
          <span className="text-orange-400 font-bold">{layout.installedKwp} kWp</span>
          <span className="hidden sm:inline text-slate-400">
            {roofShape === 'l' ? '(Mái chữ L)' : `(${layout.cols} cột × ${layout.rows} hàng)`}
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700 pointer-events-auto">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors text-[11px] font-mono px-1.5"
            title="Tỷ lệ 1:1"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors"
            title="Phóng to"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors ml-1"
            title="Mặc định"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="w-full h-80 sm:h-96 md:h-[420px] overflow-auto flex items-center justify-center p-4 bg-slate-950/70 select-none">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          className="transition-transform duration-200"
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="drop-shadow-2xl"
          >
            <defs>
              {/* Pattern gân mái tôn */}
              <pattern id="tole-stripes" width="12" height="12" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.35" />
              </pattern>
            </defs>

            {/* Mái nhà chính: Phân biệt Hình Chữ Nhật vs Hình Chữ L */}
            {roofShape === 'l' ? (
              // Vẽ đa giác mái chữ L
              <g>
                <path
                  d={`
                    M ${padding} ${padding}
                    L ${padding + (roofW1M ? roofW1M * scale : roofW * 0.6)} ${padding}
                    L ${padding + (roofW1M ? roofW1M * scale : roofW * 0.6)} ${padding + (roofL2M ? roofL2M * scale : roofH * 0.5)}
                    L ${padding + roofW} ${padding + (roofL2M ? roofL2M * scale : roofH * 0.5)}
                    L ${padding + roofW} ${padding + roofH}
                    L ${padding} ${padding + roofH}
                    Z
                  `}
                  fill={getRoofBackground()}
                  stroke="#475569"
                  strokeWidth="2"
                />
                {roofType === 'tole' && (
                  <path
                    d={`
                      M ${padding} ${padding}
                      L ${padding + (roofW1M ? roofW1M * scale : roofW * 0.6)} ${padding}
                      L ${padding + (roofW1M ? roofW1M * scale : roofW * 0.6)} ${padding + (roofL2M ? roofL2M * scale : roofH * 0.5)}
                      L ${padding + roofW} ${padding + (roofL2M ? roofL2M * scale : roofH * 0.5)}
                      L ${padding + roofW} ${padding + roofH}
                      L ${padding} ${padding + roofH}
                      Z
                    `}
                    fill="url(#tole-stripes)"
                  />
                )}
              </g>
            ) : (
              // Mái chữ nhật chuẩn
              <g>
                <rect
                  x={padding}
                  y={padding}
                  width={roofW}
                  height={roofH}
                  rx={6}
                  fill={getRoofBackground()}
                  stroke="#475569"
                  strokeWidth="2"
                />
                {roofType === 'tole' && (
                  <rect
                    x={padding}
                    y={padding}
                    width={roofW}
                    height={roofH}
                    rx={6}
                    fill="url(#tole-stripes)"
                  />
                )}
              </g>
            )}

            {/* Đường lùi an toàn kỹ thuật (Dashed line 0.5m) */}
            <rect
              x={padding + 0.5 * scale}
              y={padding + 0.5 * scale}
              width={Math.max(10, roofW - 1 * scale)}
              height={Math.max(10, roofH - 1 * scale)}
              rx={4}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              strokeOpacity="0.4"
            />

            {/* Kích thước Rộng (Width) trên mái */}
            <line
              x1={padding}
              y1={padding - 14}
              x2={padding + roofW}
              y2={padding - 14}
              stroke="#94A3B8"
              strokeWidth="1"
            />
            <line x1={padding} y1={padding - 20} x2={padding} y2={padding - 8} stroke="#94A3B8" strokeWidth="1" />
            <line x1={padding + roofW} y1={padding - 20} x2={padding + roofW} y2={padding - 8} stroke="#94A3B8" strokeWidth="1" />
            <text
              x={padding + roofW / 2}
              y={padding - 18}
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
              className="font-mono font-medium"
            >
              ↔ Rộng: {roofWidthM}m
            </text>

            {/* Kích thước Dài (Length) bên trái */}
            <line
              x1={padding - 14}
              y1={padding}
              x2={padding - 14}
              y2={padding + roofH}
              stroke="#94A3B8"
              strokeWidth="1"
            />
            <line x1={padding - 20} y1={padding} x2={padding - 8} y2={padding} stroke="#94A3B8" strokeWidth="1" />
            <line x1={padding - 20} y1={padding + roofH} x2={padding - 8} y2={padding + roofH} stroke="#94A3B8" strokeWidth="1" />
            <text
              x={padding - 18}
              y={padding + roofH / 2}
              textAnchor="middle"
              transform={`rotate(-90, ${padding - 18}, ${padding + roofH / 2})`}
              fill="#CBD5E1"
              fontSize="11"
              className="font-mono font-medium"
            >
              ↕ Dài: {roofLengthM}m
            </text>

            {/* Render các tấm pin Solar */}
            {renderPanels()}

            {/* La Bàn Hướng Mái Chi Tiết (Có góc độ Azimuth) */}
            <g transform={`translate(${padding + roofW - 42}, ${padding + roofH - 42})`}>
              <circle r="28" fill="#0F172A" stroke="#334155" strokeWidth="2" />
              <circle r="26" fill="none" stroke="#475569" strokeWidth="0.8" strokeDasharray="2 2" />

              {/* 4 Điểm phương hướng N - E - S - W */}
              <text x="0" y="-17" textAnchor="middle" fontSize="7.5" fill="#EF4444" fontWeight="bold">
                N
              </text>
              <text x="19" y="3" textAnchor="middle" fontSize="7" fill="#94A3B8">
                E
              </text>
              <text x="0" y="22" textAnchor="middle" fontSize="7.5" fill="#10B981" fontWeight="bold">
                S
              </text>
              <text x="-19" y="3" textAnchor="middle" fontSize="7" fill="#94A3B8">
                W
              </text>

              {/* Kim la bàn chỉ hướng dốc mái */}
              <g transform={`rotate(${dirAngles[roofDir]})`}>
                <polygon points="0,-16 4,0 -4,0" fill="#E53924" />
                <polygon points="0,16 4,0 -4,0" fill="#64748B" />
                <circle r="3.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
              </g>

              {/* Nhãn góc độ Azimuth */}
              <rect x="-24" y="32" width="48" height="15" rx="3" fill="#0F172A" stroke="#475569" />
              <text x="0" y="42" textAnchor="middle" fontSize="8" fill="#F8FAFC" className="font-mono font-bold">
                {roofDir.toUpperCase()} {dirDegrees[roofDir]}
              </text>
            </g>
          </svg>
        </div>

        {/* Chú giải trạng thái phân bổ pin và ô trống */}
        {layout.panelQty < (layout.maxRoofPanels || layout.cols * layout.rows) && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 flex items-center gap-3 shadow-md pointer-events-none z-10">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#0F172A] border border-[#38BDF8] inline-block" />
              <span>Đang lắp ({layout.panelQty} tấm)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-dashed border-slate-400 inline-block" />
              <span>Vị trí mái dự phòng ({(layout.maxRoofPanels || layout.cols * layout.rows) - layout.panelQty} ô trống)</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status & Info Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-orange-400 shrink-0" />
          <span>
            Model:{' '}
            <strong className="text-white font-medium">
              {panel.brand} {panel.model} ({panel.wp}Wp)
            </strong>
          </span>
          <span className="hidden md:inline text-slate-500">·</span>
          <span className="hidden md:inline text-slate-400">
            Kích thước: {panel.lengthMm} × {panel.widthMm} mm
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
          <span>
            Diện tích: <strong className="text-slate-200">{layout.totalRoofAreaM2} m²</strong>
          </span>
          <span>
            Hữu dụng: <strong className="text-slate-200">{layout.usableAreaM2} m²</strong>
          </span>
          <span className="hidden sm:inline">
            Hướng dốc đón nắng:{' '}
            <strong className="text-orange-400 font-semibold uppercase">
              {roofDir === 's'
                ? 'Chính Nam 180° (100% Bức xạ)'
                : roofDir === 'se'
                ? 'Đông Nam 135° (95%)'
                : roofDir === 'sw'
                ? 'Tây Nam 225° (95%)'
                : roofDir === 'e'
                ? 'Chính Đông 90° (85%)'
                : 'Chính Tây 270° (85%)'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
