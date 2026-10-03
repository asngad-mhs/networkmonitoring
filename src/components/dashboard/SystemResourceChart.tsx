import React, { useState } from 'react';
import { Cpu, HardDrive, Thermometer, Wifi } from 'lucide-react';

interface MetricHistoryPoint {
  timestamp: number;
  cpu: number;
  ram: number;
  latency: number;
  temp: number;
}

interface SystemResourceChartProps {
  history: MetricHistoryPoint[];
  cpuUsage: number;
  ramUsedMb: number;
  ramTotalMb: number;
  temperatureCelsius: number;
  pingLatencyMs: number;
  packetLossPercent: number;
  loadAverage?: [number, number, number];
}

export const SystemResourceChart: React.FC<SystemResourceChartProps> = ({
  history,
  cpuUsage,
  ramUsedMb,
  ramTotalMb,
  temperatureCelsius,
  pingLatencyMs,
  packetLossPercent,
  loadAverage = [0.45, 0.40, 0.38],
}) => {
  const [activeTab, setActiveTab] = useState<'cpu' | 'ram' | 'temp' | 'latency'>('cpu');

  const ramPercent = Number(((ramUsedMb / ramTotalMb) * 100).toFixed(1));

  // Visual parameters for mini sparkline
  const width = 400;
  const height = 90;
  const padding = { top: 10, right: 10, bottom: 20, left: 35 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const getMetricData = () => {
    switch (activeTab) {
      case 'cpu':
        return {
          title: 'CPU Utilization',
          val: `${cpuUsage}%`,
          max: 100,
          unit: '%',
          color: cpuUsage > 80 ? '#ef4444' : cpuUsage > 60 ? '#f59e0b' : '#38bdf8',
          points: history.map(h => h.cpu),
        };
      case 'ram':
        return {
          title: 'Memory Consumption',
          val: `${ramPercent}% (${(ramUsedMb / 1024).toFixed(1)}GB / ${(ramTotalMb / 1024).toFixed(1)}GB)`,
          max: 100,
          unit: '%',
          color: ramPercent > 85 ? '#ef4444' : '#818cf8',
          points: history.map(h => h.ram),
        };
      case 'temp':
        return {
          title: 'Thermal Sensor',
          val: `${temperatureCelsius}°C`,
          max: 90,
          unit: '°C',
          color: temperatureCelsius > 65 ? '#ef4444' : temperatureCelsius > 50 ? '#f59e0b' : '#34d399',
          points: history.map(h => h.temp),
        };
      case 'latency':
        return {
          title: 'Ping Latency RTT',
          val: `${pingLatencyMs} ms (Loss: ${packetLossPercent}%)`,
          max: Math.max(...history.map(h => h.latency), 30),
          unit: 'ms',
          color: pingLatencyMs > 60 ? '#ef4444' : '#10b981',
          points: history.map(h => h.latency),
        };
    }
  };

  const currentMetric = getMetricData();

  const generatePath = () => {
    if (currentMetric.points.length < 2) return '';
    const step = innerWidth / (currentMetric.points.length - 1);
    const points = currentMetric.points.map((val, i) => {
      const x = padding.left + i * step;
      const y = padding.top + innerHeight - (Math.min(currentMetric.max, val) / currentMetric.max) * innerHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const generateArea = () => {
    if (currentMetric.points.length < 2) return '';
    const step = innerWidth / (currentMetric.points.length - 1);
    const points = currentMetric.points.map((val, i) => {
      const x = padding.left + i * step;
      const y = padding.top + innerHeight - (Math.min(currentMetric.max, val) / currentMetric.max) * innerHeight;
      return `${x},${y}`;
    });
    const firstX = padding.left;
    const lastX = padding.left + (currentMetric.points.length - 1) * step;
    const bottomY = padding.top + innerHeight;
    return `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 shadow-lg flex flex-col justify-between">
      {/* Tab Selectors */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
          <button
            onClick={() => setActiveTab('cpu')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors font-medium ${
              activeTab === 'cpu' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>CPU</span>
          </button>
          <button
            onClick={() => setActiveTab('ram')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors font-medium ${
              activeTab === 'ram' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>RAM</span>
          </button>
          <button
            onClick={() => setActiveTab('temp')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors font-medium ${
              activeTab === 'temp' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Suhu</span>
          </button>
          <button
            onClick={() => setActiveTab('latency')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors font-medium ${
              activeTab === 'latency' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Ping</span>
          </button>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-100 tabular-nums">
            {currentMetric.val}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="my-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible select-none">
          <defs>
            <linearGradient id={`spark-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentMetric.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={currentMetric.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="2 2"
          />
          <line
            x1={padding.left}
            y1={padding.top + innerHeight / 2}
            x2={width - padding.right}
            y2={padding.top + innerHeight / 2}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="2 2"
          />
          <line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={width - padding.right}
            y2={padding.top + innerHeight}
            stroke="rgba(255,255,255,0.1)"
          />

          <text x={padding.left - 4} y={padding.top + 3} textAnchor="end" className="text-[9px] font-mono fill-slate-500">
            {Math.round(currentMetric.max)}{currentMetric.unit}
          </text>
          <text x={padding.left - 4} y={padding.top + innerHeight} textAnchor="end" className="text-[9px] font-mono fill-slate-500">
            0{currentMetric.unit}
          </text>

          <path d={generateArea()} fill={`url(#spark-${activeTab})`} />
          <path d={generatePath()} fill="none" stroke={currentMetric.color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Footer Info: Load Average */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
        <span>Load Avg: [{loadAverage.map(l => l.toFixed(2)).join(', ')}]</span>
        <span className="text-slate-400">Live SNMP Poll 2s</span>
      </div>
    </div>
  );
};
