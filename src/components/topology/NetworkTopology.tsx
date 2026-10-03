import React, { useState, useRef } from 'react';
import { NetworkDevice, TopologyLink } from '../../types/network';
import { VendorBadge } from '../dashboard/VendorBadge';
import { formatBandwidth } from '../../services/snmpEngine';
import { 
  Router, 
  Server, 
  Network, 
  Radio, 
  ShieldCheck, 
  Activity, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

interface NetworkTopologyProps {
  devices: NetworkDevice[];
  links: TopologyLink[];
  onSelectDevice: (device: NetworkDevice) => void;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  devices,
  links,
  onSelectDevice,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [positions, setPositions] = useState<{ [id: string]: { x: number; y: number } }>(() => {
    const map: { [id: string]: { x: number; y: number } } = {};
    devices.forEach((d, idx) => {
      map[d.id] = d.topologyPosition || { x: 150 + (idx % 3) * 280, y: 120 + Math.floor(idx / 3) * 180 };
    });
    return map;
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'router':
      case 'gateway':
        return Router;
      case 'switch':
        return Network;
      case 'server':
        return Server;
      case 'access_point':
        return Radio;
      default:
        return Activity;
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingId(id);
    const pos = positions[id] || { x: 0, y: 0 };
    dragOffsetRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    if (e.touches.length > 0) {
      setDraggingId(id);
      const pos = positions[id] || { x: 0, y: 0 };
      dragOffsetRef.current = {
        x: e.touches[0].clientX - pos.x,
        y: e.touches[0].clientY - pos.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const newX = Math.max(20, Math.min(1000, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(20, Math.min(700, e.clientY - dragOffsetRef.current.y));
    setPositions(prev => ({
      ...prev,
      [draggingId]: { x: newX, y: newY },
    }));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingId || e.touches.length === 0) return;
    const newX = Math.max(20, Math.min(1000, e.touches[0].clientX - dragOffsetRef.current.x));
    const newY = Math.max(20, Math.min(700, e.touches[0].clientY - dragOffsetRef.current.y));
    setPositions(prev => ({
      ...prev,
      [draggingId]: { x: newX, y: newY },
    }));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const resetLayout = () => {
    const map: { [id: string]: { x: number; y: number } } = {};
    devices.forEach((d) => {
      map[d.id] = d.topologyPosition || { x: 300, y: 300 };
    });
    setPositions(map);
    setZoom(1);
  };

  const selectedDevice = devices.find(d => d.id === selectedNodeId);

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[500px] lg:h-[calc(100vh-140px)]">
      {/* Topology Canvas Area */}
      <div
        className="flex-1 min-h-[480px] bg-slate-950 border border-slate-800 rounded-lg relative overflow-hidden noc-grid select-none flex flex-col justify-between"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Top Floating Controls */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-300">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Topologi Jaringan SNMP Live</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <button
            onClick={() => setZoom(prev => Math.min(1.6, prev + 0.1))}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetLayout}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Reset Posisi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2 py-0.5 text-xs rounded border transition-colors ${
              showLabels
                ? 'bg-cyan-950 border-cyan-800 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Label Link
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400">Normal (&lt;60%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-400">Warning (60-85%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-400">Critical (&gt;85%)</span>
          </div>
        </div>

        {/* SVG Links Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          <defs>
            <linearGradient id="link-grad-green" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="link-grad-amber" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {links.map((link) => {
            const srcPos = positions[link.sourceDeviceId];
            const tgtPos = positions[link.targetDeviceId];
            if (!srcPos || !tgtPos) return null;

            // Compute center of nodes (nodes are ~190x90)
            const sx = srcPos.x + 95;
            const sy = srcPos.y + 45;
            const tx = tgtPos.x + 95;
            const ty = tgtPos.y + 45;

            // Find source device interface traffic
            const srcDev = devices.find(d => d.id === link.sourceDeviceId);
            const iface = srcDev?.interfaces.find(i => i.id === link.sourceInterfaceId);
            const totalTraffic = (iface?.currentRxMbps || 0) + (iface?.currentTxMbps || 0);
            const util = link.capacityMbps > 0 ? (totalTraffic / link.capacityMbps) * 100 : 0;

            const strokeColor = util > 80 ? '#ef4444' : util > 40 ? '#f59e0b' : '#06b6d4';
            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;

            return (
              <g key={link.id} className="transition-all">
                {/* Back line glow */}
                <line
                  x1={sx}
                  y1={sy}
                  x2={tx}
                  y2={ty}
                  stroke={strokeColor}
                  strokeWidth="3"
                  strokeOpacity="0.25"
                />
                {/* Main link line */}
                <line
                  x1={sx}
                  y1={sy}
                  x2={tx}
                  y2={ty}
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray={util > 70 ? '6 3' : undefined}
                />
                
                {/* Animated packet pulse */}
                <circle r="3.5" fill="#ffffff" className="animate-pulse">
                  <animateMotion
                    path={`M ${sx} ${sy} L ${tx} ${ty}`}
                    dur={`${Math.max(0.8, 3 - (totalTraffic / 500))}s`}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Link Label Tag */}
                {showLabels && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-55"
                      y="-12"
                      width="110"
                      height="24"
                      rx="4"
                      fill="#090d16"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      y="4"
                      className="text-[10px] font-mono fill-slate-300 font-semibold tabular-nums"
                    >
                      {formatBandwidth(totalTraffic)} · {link.label || 'Link'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer (DOM draggable cards) */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {devices.map((device) => {
            const pos = positions[device.id] || { x: 100, y: 100 };
            const isSelected = selectedNodeId === device.id;
            const Icon = getDeviceIcon(device.type);

            const statusRing = {
              online: 'border-emerald-500/50 hover:border-emerald-400 shadow-emerald-950/30',
              warning: 'border-amber-500/80 hover:border-amber-400 shadow-amber-950/30 ring-2 ring-amber-500/20',
              critical: 'border-rose-500/80 hover:border-rose-400 shadow-rose-950/30 ring-2 ring-rose-500/20',
              offline: 'border-slate-700 opacity-60',
            }[device.status];

            const totalRx = device.interfaces.reduce((sum, i) => sum + i.currentRxMbps, 0);
            const totalTx = device.interfaces.reduce((sum, i) => sum + i.currentTxMbps, 0);

            return (
              <div
                key={device.id}
                onMouseDown={(e) => handleMouseDown(e, device.id)}
                onTouchStart={(e) => handleTouchStart(e, device.id)}
                onClick={() => setSelectedNodeId(device.id)}
                onDoubleClick={() => onSelectDevice(device)}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: '210px',
                }}
                className={`absolute cursor-move rounded-lg bg-slate-900/95 border ${statusRing} p-3 shadow-2xl transition-shadow backdrop-blur-md ${
                  isSelected ? 'ring-2 ring-cyan-400 border-cyan-400' : ''
                }`}
              >
                {/* Node Header */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-100 truncate leading-tight">
                        {device.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 block truncate">
                        {device.ipAddress}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      device.status === 'online'
                        ? 'bg-emerald-400'
                        : device.status === 'warning'
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-rose-500 animate-ping'
                    }`}
                  />
                </div>

                {/* Vendor & Live Metrics */}
                <div className="pt-2 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <VendorBadge vendor={device.vendor} size="sm" />
                    <span className="text-slate-400 font-mono text-[10px]">
                      CPU: <strong className={device.metrics.cpuUsage > 80 ? 'text-rose-400' : 'text-slate-200'}>{device.metrics.cpuUsage}%</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-[10px] bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block">↓ Rx:</span>
                      <span className="text-emerald-400 font-semibold">{formatBandwidth(totalRx)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">↑ Tx:</span>
                      <span className="text-cyan-400 font-semibold">{formatBandwidth(totalTx)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Telemetry Inspector Sidebar */}
      {selectedDevice ? (
        <div className="w-full lg:w-80 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Inspektur Perangkat</h3>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <h4 className="text-base font-bold text-slate-100">{selectedDevice.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{selectedDevice.ipAddress} · SNMP {selectedDevice.snmp.version}</p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Model:</span>
                  <span className="text-slate-200 font-sans font-semibold">{selectedDevice.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">OS:</span>
                  <span className="text-slate-300 truncate max-w-[150px]">{selectedDevice.osVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lokasi:</span>
                  <span className="text-slate-300">{selectedDevice.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uptime:</span>
                  <span className="text-emerald-400">{Math.floor(selectedDevice.metrics.uptimeSeconds / 3600)} Jam</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Temperatur:</span>
                  <span className="text-amber-300">{selectedDevice.metrics.temperatureCelsius}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ping ICMP:</span>
                  <span className="text-cyan-300">{selectedDevice.metrics.pingLatencyMs} ms</span>
                </div>
              </div>

              {/* Interfaces Mini List */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Interface Ports ({selectedDevice.interfaces.length})
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {selectedDevice.interfaces.map(iface => (
                    <div
                      key={iface.id}
                      className="p-2 bg-slate-950/80 rounded border border-slate-800/80 text-xs flex items-center justify-between"
                    >
                      <div className="overflow-hidden pr-2">
                        <span className="font-mono text-slate-200 block truncate font-medium">
                          {iface.name}
                        </span>
                        {iface.alias && (
                          <span className="text-[10px] text-slate-500 block truncate">
                            {iface.alias}
                          </span>
                        )}
                      </div>
                      <div className="text-right font-mono text-[10px] shrink-0">
                        <span className="text-emerald-400 block">↓ {formatBandwidth(iface.currentRxMbps)}</span>
                        <span className="text-cyan-400 block">↑ {formatBandwidth(iface.currentTxMbps)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectDevice(selectedDevice)}
            className="w-full mt-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950"
          >
            <span>Buka Panel Detail Lengkap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="hidden lg:flex w-80 bg-slate-900/50 border border-slate-800 rounded-lg p-6 flex-col items-center justify-center text-center text-slate-500">
          <Network className="w-10 h-10 mb-3 text-slate-600" />
          <p className="text-xs font-medium text-slate-400">Pilih salah satu node pada diagram untuk melihat data SNMP real-time</p>
          <span className="text-[11px] text-slate-600 mt-2">Double click node untuk membuka diagnostic console</span>
        </div>
      )}
    </div>
  );
};
