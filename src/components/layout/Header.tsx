import React from 'react';
import { Volume2, VolumeX, Plus, Radar, Activity, Zap } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'topology' | 'devices' | 'snmp' | 'speedtest' | 'alerts';
  setActiveTab: (tab: 'overview' | 'topology' | 'devices' | 'snmp' | 'speedtest' | 'alerts') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  activeAlertCount: number;
  onOpenAddDevice: () => void;
  onOpenSubnetScan: () => void;
  onOpenSpeedtest: () => void;
  totalBandwidthMbps: { rx: number; tx: number };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
  activeAlertCount,
  onOpenAddDevice,
  onOpenSubnetScan,
  onOpenSpeedtest,
  totalBandwidthMbps,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <button
            onClick={() => setActiveTab('overview')}
            className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 focus:outline-none"
          >
            <span>NetPulse</span>
            <span className="text-cyan-400 font-mono text-xs font-semibold px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-800/60 rounded">
              NOC
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-line, clean hover underline) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('topology')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'topology'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Topologi
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'devices'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Perangkat
          </button>

          <button
            onClick={() => setActiveTab('snmp')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'snmp'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            SNMP MIB
          </button>

          <button
            onClick={() => setActiveTab('speedtest')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'speedtest'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Speedtest
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>Peringatan</span>
            {activeAlertCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-mono font-bold">
                {activeAlertCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Matikan suara alarm' : 'Aktifkan suara alarm'}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              soundEnabled
                ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300 hover:bg-cyan-900/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Subnet Scan Discovery */}
          <button
            onClick={onOpenSubnetScan}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
          >
            <Radar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Scan Subnet</span>
          </button>

          {/* Add Device Button */}
          <button
            onClick={onOpenAddDevice}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shadow-cyan-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Perangkat</span>
          </button>
        </div>
      </div>

      {/* Mobile Submenu Navigation Bar */}
      <div className="md:hidden flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-800/80 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('topology')}
          className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
            activeTab === 'topology' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Topologi
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
            activeTab === 'devices' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Perangkat
        </button>
        <button
          onClick={() => setActiveTab('snmp')}
          className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
            activeTab === 'snmp' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          SNMP MIB
        </button>
        <button
          onClick={() => setActiveTab('speedtest')}
          className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
            activeTab === 'speedtest' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Speedtest
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'alerts' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <span>Peringatan</span>
          {activeAlertCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          )}
        </button>
      </div>
    </header>
  );
};
