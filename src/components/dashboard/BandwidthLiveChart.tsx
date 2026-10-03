import React, { useState, useMemo } from 'react';
import { formatBandwidth } from '../../services/snmpEngine';
import { ArrowDownLeft, ArrowUpRight, Activity, Maximize2 } from 'lucide-react';

interface DataPoint {
  timestamp: number;
  rxMbps: number;
  txMbps: number;
}

interface BandwidthLiveChartProps {
  title?: string;
  subtitle?: string;
  data: DataPoint[];
  height?: number;
  showControls?: boolean;
  linkSpeedMbps?: number;
}

export const BandwidthLiveChart: React.FC<BandwidthLiveChartProps> = ({
  title = 'Real-Time Bandwidth Throughput',
  subtitle = 'SNMP ifInOctets & ifOutOctets live delta streaming',
  data,
  height = 220,
  showControls = true,
  linkSpeedMbps,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'1m' | '5m' | '15m' | '1h'>('5m');
  const [viewMode, setViewMode] = useState<'both' | 'rx' | 'tx'>('both');

  // Compute peak and current
  const current = data[data.length - 1] || { rxMbps: 0, txMbps: 0, timestamp: Date.now() };
  const maxRx = useMemo(() => Math.max(...data.map(d => d.rxMbps), 1), [data]);
  const maxTx = useMemo(() => Math.max(...data.map(d => d.txMbps), 1), [data]);
  const peak = Math.max(maxRx, maxTx);
  // Add 15% headroom for clean visual
  const scaleMax = peak * 1.15;

  const width = 800;
  const chartHeight = height;
  const padding = { top: 20, right: 15, bottom: 25, left: 55 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Generate SVG path for series
  const generatePath = (type: 'rx' | 'tx', isArea = false) => {
    if (data.length < 2) return '';
    const step = innerWidth / (data.length - 1);
    
    const points = data.map((d, i) => {
      const val = type === 'rx' ? d.rxMbps : d.txMbps;
      const x = padding.left + i * step;
      const y = padding.top + innerHeight - (val / scaleMax) * innerHeight;
      return `${x},${y}`;
    });

    if (isArea) {
      const firstX = padding.left;
      const lastX = padding.left + (data.length - 1) * step;
      const bottomY = padding.top + innerHeight;
      return `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`;
    }

    return `M ${points.join(' L ')}`;
  };

  const rxLinePath = generatePath('rx', false);
  const rxAreaPath = generatePath('rx', true);
  const txLinePath = generatePath('tx', false);
  const txAreaPath = generatePath('tx', true);

  const hoverData = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-lg backdrop-blur-sm">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-100 tracking-tight">{title}</h3>
            {linkSpeedMbps && (
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Port Cap: {formatBandwidth(linkSpeedMbps)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Live Gauges & Controls */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Current In / Out pill */}
          <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-md">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-slate-400 flex items-center">
                <ArrowDownLeft className="w-3 h-3 text-emerald-400 mr-0.5" />
                Rx:
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                {formatBandwidth(hoverData ? hoverData.rxMbps : current.rxMbps)}
              </span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs text-slate-400 flex items-center">
                <ArrowUpRight className="w-3 h-3 text-cyan-400 mr-0.5" />
                Tx:
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
                {formatBandwidth(hoverData ? hoverData.txMbps : current.txMbps)}
              </span>
            </div>
          </div>

          {showControls && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs">
              {(['1m', '5m', '15m', '1h'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2 py-0.5 rounded transition-colors font-mono ${
                    timeRange === range
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SVG Vector Canvas Chart */}
      <div className="relative w-full overflow-hidden mt-3" style={{ height: chartHeight }}>
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full h-full overflow-visible select-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
          onTouchEnd={() => setHoverIndex(null)}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = touch.clientX - rect.left;
              const normalizedX = (mouseX / rect.width) * width;
              const relX = normalizedX - padding.left;
              if (relX >= 0 && relX <= innerWidth && data.length > 1) {
                const step = innerWidth / (data.length - 1);
                const idx = Math.min(data.length - 1, Math.max(0, Math.round(relX / step)));
                setHoverIndex(idx);
              }
            }
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const normalizedX = (mouseX / rect.width) * width;
            const relX = normalizedX - padding.left;
            if (relX >= 0 && relX <= innerWidth && data.length > 1) {
              const step = innerWidth / (data.length - 1);
              const idx = Math.min(data.length - 1, Math.max(0, Math.round(relX / step)));
              setHoverIndex(idx);
            }
          }}
        >
          <defs>
            <linearGradient id="rx-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="tx-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const val = scaleMax * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-slate-500 tabular-nums"
                >
                  {formatBandwidth(val)}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          {(viewMode === 'both' || viewMode === 'rx') && (
            <path d={rxAreaPath} fill="url(#rx-grad)" />
          )}
          {(viewMode === 'both' || viewMode === 'tx') && (
            <path d={txAreaPath} fill="url(#tx-grad)" />
          )}

          {/* Stroke Lines */}
          {(viewMode === 'both' || viewMode === 'rx') && (
            <path
              d={rxLinePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {(viewMode === 'both' || viewMode === 'tx') && (
            <path
              d={txLinePath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover Crosshair */}
          {hoverIndex !== null && data[hoverIndex] && (
            <g>
              {(() => {
                const step = innerWidth / (data.length - 1);
                const x = padding.left + hoverIndex * step;
                const item = data[hoverIndex];
                const rxY = padding.top + innerHeight - (item.rxMbps / scaleMax) * innerHeight;
                const txY = padding.top + innerHeight - (item.txMbps / scaleMax) * innerHeight;
                return (
                  <>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + innerHeight}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle cx={x} cy={rxY} r="4" fill="#10b981" stroke="#090d16" strokeWidth="2" />
                    <circle cx={x} cy={txY} r="4" fill="#06b6d4" stroke="#090d16" strokeWidth="2" />
                  </>
                );
              })()}
            </g>
          )}

          {/* X Axis Time Labels */}
          {data.length > 0 && (
            <>
              <text
                x={padding.left}
                y={chartHeight - 6}
                textAnchor="start"
                className="text-[10px] font-mono fill-slate-500"
              >
                {new Date(data[0].timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </text>
              <text
                x={width - padding.right}
                y={chartHeight - 6}
                textAnchor="end"
                className="text-[10px] font-mono fill-slate-500"
              >
                {new Date(data[data.length - 1].timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </text>
            </>
          )}
        </svg>

        {/* Floating tooltip */}
        {hoverData && hoverIndex !== null && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-slate-700 px-3 py-1.5 rounded shadow-xl text-xs flex items-center gap-3 pointer-events-none z-10 font-mono"
          >
            <span className="text-slate-400">
              {new Date(hoverData.timestamp).toLocaleTimeString('id-ID')}
            </span>
            <span className="text-emerald-400 font-semibold">
              ↓ {formatBandwidth(hoverData.rxMbps)}
            </span>
            <span className="text-cyan-400 font-semibold">
              ↑ {formatBandwidth(hoverData.txMbps)}
            </span>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode(viewMode === 'rx' ? 'both' : 'rx')}
            className={`flex items-center gap-1.5 transition-opacity ${viewMode === 'tx' ? 'opacity-40' : 'opacity-100'}`}
          >
            <span className="w-2.5 h-0.5 bg-emerald-500 inline-block rounded"></span>
            <span className="hover:text-slate-200">Inbound (Download / Rx)</span>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'tx' ? 'both' : 'tx')}
            className={`flex items-center gap-1.5 transition-opacity ${viewMode === 'rx' ? 'opacity-40' : 'opacity-100'}`}
          >
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block rounded"></span>
            <span className="hover:text-slate-200">Outbound (Upload / Tx)</span>
          </button>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Peak Rx: <strong className="text-slate-200">{formatBandwidth(maxRx)}</strong></span>
          <span>·</span>
          <span>Peak Tx: <strong className="text-slate-200">{formatBandwidth(maxTx)}</strong></span>
        </div>
      </div>
    </div>
  );
};
