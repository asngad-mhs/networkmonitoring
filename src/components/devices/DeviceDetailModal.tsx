import React, { useState } from 'react';
import { NetworkDevice, NetworkInterface, OpenWrtWifiStation } from '../../types/network';
import { VendorBadge } from '../dashboard/VendorBadge';
import { BandwidthLiveChart } from '../dashboard/BandwidthLiveChart';
import { formatBandwidth, formatBytes, formatUptime } from '../../services/snmpEngine';
import { executeLuciRpcCall, getMockWifiStations, LuciRpcResponse } from '../../services/luciRpcEngine';
import { 
  X, 
  Cpu, 
  HardDrive, 
  Thermometer, 
  Activity, 
  Radio, 
  Power, 
  RotateCw, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Terminal,
  ShieldAlert,
  Code,
  Wifi,
  Sliders,
  Send
} from 'lucide-react';

interface DeviceDetailModalProps {
  device: NetworkDevice;
  onClose: () => void;
  onUpdateDevice: (updated: NetworkDevice) => void;
  onOpenSnmpWalk: (device: NetworkDevice) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  onClose,
  onUpdateDevice,
  onOpenSnmpWalk,
}) => {
  const [selectedIfaceId, setSelectedIfaceId] = useState<string>(device.interfaces[0]?.id || '');
  const isOpenWrt = device.vendor === 'openwrt' || device.vendor === 'linksys';
  const [activeTab, setActiveTab] = useState<'interfaces' | 'system' | 'ping_probe' | 'luci_rpc'>(
    isOpenWrt ? 'luci_rpc' : 'interfaces'
  );
  
  // Ping simulator state
  const [pingTarget, setPingTarget] = useState<string>('8.8.8.8');
  const [pingCount, setPingCount] = useState<number>(4);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingOutput, setPingOutput] = useState<string[]>([]);

  // LuCI RPC State
  const [rpcModule, setRpcModule] = useState<'sys' | 'network' | 'ip' | 'uci'>('sys');
  const [rpcMethod, setRpcMethod] = useState<string>('sysinfo');
  const [rpcParams, setRpcParams] = useState<string>('[]');
  const [rpcLoading, setRpcLoading] = useState<boolean>(false);
  const [rpcResult, setRpcResult] = useState<LuciRpcResponse | null>(null);
  const [wifiStations] = useState<OpenWrtWifiStation[]>(() => getMockWifiStations(device));

  const selectedIface = device.interfaces.find(i => i.id === selectedIfaceId) || device.interfaces[0];

  const handleToggleInterface = (ifaceId: string) => {
    const updated = {
      ...device,
      interfaces: device.interfaces.map(i => {
        if (i.id === ifaceId) {
          const newStatus = i.adminStatus === 'up' ? 'down' : 'up';
          return {
            ...i,
            adminStatus: newStatus as 'up' | 'down',
            operStatus: newStatus as 'up' | 'down',
          };
        }
        return i;
      }),
    };
    onUpdateDevice(updated);
  };

  const handleExecuteLuciRpc = async () => {
    setRpcLoading(true);
    let parsedParams: unknown[] = [];
    try {
      parsedParams = JSON.parse(rpcParams);
    } catch {
      parsedParams = rpcParams ? [rpcParams] : [];
    }

    const response = await executeLuciRpcCall(
      device,
      rpcModule,
      rpcMethod,
      parsedParams,
      device.snmp.rpcAuthToken || 'd89f2a7e18b4461c9201a0bc39e1428f'
    );
    setRpcResult(response);
    setRpcLoading(false);
  };

  const runPingProbe = () => {
    setIsPinging(true);
    setPingOutput([`PING ${pingTarget} (56 data bytes) via ${device.name}...`]);

    let seq = 1;
    const interval = setInterval(() => {
      const rtt = (Math.random() * 8 + 1.2).toFixed(2);
      const ttl = 57;
      setPingOutput(prev => [
        ...prev,
        `64 bytes from ${pingTarget}: icmp_seq=${seq} ttl=${ttl} time=${rtt} ms`,
      ]);
      seq++;

      if (seq > pingCount) {
        clearInterval(interval);
        setIsPinging(false);
        setPingOutput(prev => [
          ...prev,
          `--- ${pingTarget} ping statistics ---`,
          `${pingCount} packets transmitted, ${pingCount} received, 0% packet loss, time ${pingCount * 1000}ms`,
          `rtt min/avg/max/mdev = 1.20/3.45/8.12/1.82 ms`,
        ]);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 lg:p-6 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{device.name}</h2>
                <VendorBadge vendor={device.vendor} size="sm" />
                <span
                  className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                    device.status === 'online'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : device.status === 'warning'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                  }`}
                >
                  {device.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                IP: {device.ipAddress} · {isOpenWrt ? 'LuCI JSON-RPC / SNMP Ready' : `Port SNMP: ${device.snmp.port}`} · {device.model} · {device.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenSnmpWalk(device)}
              className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-200 text-xs rounded-lg font-medium transition-colors"
            >
              SNMP Walk MIB
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Physical Faceplate Port Matrix Simulation */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Physical Interface Ports Faceplate Matrix
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Klik port untuk melihat live traffic streaming
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {device.interfaces.map((iface) => {
              const isSelected = iface.id === selectedIfaceId;
              const isUp = iface.operStatus === 'up';

              return (
                <button
                  key={iface.id}
                  onClick={() => setSelectedIfaceId(iface.id)}
                  className={`px-3 py-2 rounded-lg border text-left flex flex-col justify-between transition-all shrink-0 min-w-[120px] ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-500 ring-1 ring-cyan-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {iface.type}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isUp ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                      title={isUp ? 'Link Active' : 'Link Down'}
                    />
                  </div>
                  <div className="my-1">
                    <strong className="text-xs text-slate-200 block truncate font-mono">
                      {iface.name}
                    </strong>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {iface.alias || `${iface.speedMbps} Mbps`}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 tabular-nums">
                    ↓ {formatBandwidth(iface.currentRxMbps)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 flex items-center gap-4 bg-slate-950 text-xs font-medium">
          {isOpenWrt && (
            <button
              onClick={() => setActiveTab('luci_rpc')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'luci_rpc'
                  ? 'border-teal-400 text-teal-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-teal-400" />
              <span>LuCI JSON-RPC Engine (OpenWrt)</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('interfaces')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'interfaces'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Interface Bandwidth ({selectedIface?.name})
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'system'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            System Hardware & Multi-Core CPU
          </button>
          <button
            onClick={() => setActiveTab('ping_probe')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'ping_probe'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ICMP Diagnostic & Traceroute Probe
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* LuCI JSON-RPC Interactive View for OpenWrt / Linksys */}
          {activeTab === 'luci_rpc' && isOpenWrt && (
            <div className="space-y-6">
              {/* Top Banner: LuCI JSON-RPC Info */}
              <div className="bg-teal-950/40 border border-teal-800/80 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-bold text-teal-200 uppercase tracking-wide font-mono">
                      OpenWrt LuCI JSON-RPC Remote Interface
                    </h4>
                  </div>
                  <p className="text-xs text-teal-300/80 mt-1">
                    Menggunakan antarmuka standar <strong>/cgi-bin/luci/rpc/</strong> (bukan ubus) untuk membaca status Wi-Fi, SQM QoS Cake, load average, dan konfigurasi UCI langsung via JSON-RPC HTTP.
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-slate-950 rounded border border-teal-800 font-mono text-[11px] text-teal-300 shrink-0">
                  Auth Token: Active (0x{device.id.slice(-6)})
                </div>
              </div>

              {/* Wi-Fi Associated Stations Table from LuCI network.get_wifi_status */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-bold text-white">
                      Klien Wi-Fi Terhubung (network.get_wifi_status via LuCI RPC)
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-teal-400 font-semibold">
                    {wifiStations.length} Active Stations
                  </span>
                </div>

                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Hostname & MAC</th>
                        <th className="py-2 px-3">IP Address</th>
                        <th className="py-2 px-3">Signal (RSSI)</th>
                        <th className="py-2 px-3">Throughput Rate</th>
                        <th className="py-2 px-3">Durasi Koneksi</th>
                        <th className="py-2 px-3">Interface Band</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {wifiStations.map((sta, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <span className="text-slate-100 font-bold block">{sta.hostname}</span>
                            <span className="text-[10px] text-slate-500">{sta.mac}</span>
                          </td>
                          <td className="py-2.5 px-3 text-cyan-300">{sta.ip}</td>
                          <td className="py-2.5 px-3">
                            <span className={`font-semibold ${sta.signalDbm > -60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {sta.signalDbm} dBm
                            </span>
                            <span className="text-[10px] text-slate-500 block">Noise: {sta.noiseDbm} dBm</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-emerald-400">↓ {sta.rxRateMbps}M</span> / <span className="text-cyan-400">↑ {sta.txRateMbps}M</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {formatUptime(sta.connectedTimeSec)}
                          </td>
                          <td className="py-2.5 px-3 text-teal-400 text-[11px]">
                            {sta.interfaceName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive LuCI JSON-RPC Query Console */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-bold text-white">
                      Konsol Eksekusi LuCI JSON-RPC Langsung
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Endpoint: /cgi-bin/luci/rpc/{rpcModule}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">RPC Module</label>
                    <select
                      value={rpcModule}
                      onChange={e => {
                        const mod = e.target.value as 'sys' | 'network' | 'ip' | 'uci';
                        setRpcModule(mod);
                        if (mod === 'sys') setRpcMethod('sysinfo');
                        if (mod === 'network') setRpcMethod('get_status');
                        if (mod === 'ip') setRpcMethod('neighbors');
                        if (mod === 'uci') {
                          setRpcMethod('get_all');
                          setRpcParams('["sqm"]');
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                    >
                      <option value="sys">sys (/rpc/sys)</option>
                      <option value="network">network (/rpc/network)</option>
                      <option value="ip">ip (/rpc/ip)</option>
                      <option value="uci">uci (/rpc/uci)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">RPC Method</label>
                    <input
                      type="text"
                      value={rpcMethod}
                      onChange={e => setRpcMethod(e.target.value)}
                      placeholder="e.g. sysinfo, dmesg, get_wifi_status"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Params (JSON Array)</label>
                    <input
                      type="text"
                      value={rpcParams}
                      onChange={e => setRpcParams(e.target.value)}
                      placeholder='e.g. ["sqm"] atau []'
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleExecuteLuciRpc}
                      disabled={rpcLoading}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-teal-950"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{rpcLoading ? 'Executing...' : 'Panggil RPC'}</span>
                    </button>
                  </div>
                </div>

                {/* Preset quick buttons */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1 font-mono">
                  <span className="text-slate-500">Quick Call:</span>
                  <button
                    onClick={() => {
                      setRpcModule('sys');
                      setRpcMethod('sysinfo');
                      setRpcParams('[]');
                      handleExecuteLuciRpc();
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-teal-300"
                  >
                    sys.sysinfo()
                  </button>
                  <button
                    onClick={() => {
                      setRpcModule('network');
                      setRpcMethod('get_wifi_status');
                      setRpcParams('[]');
                      handleExecuteLuciRpc();
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-teal-300"
                  >
                    network.get_wifi_status()
                  </button>
                  <button
                    onClick={() => {
                      setRpcModule('uci');
                      setRpcMethod('get_all');
                      setRpcParams('["sqm"]');
                      handleExecuteLuciRpc();
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-amber-300"
                  >
                    uci.get_all("sqm")
                  </button>
                  <button
                    onClick={() => {
                      setRpcModule('ip');
                      setRpcMethod('neighbors');
                      setRpcParams('[]');
                      handleExecuteLuciRpc();
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-cyan-300"
                  >
                    ip.neighbors()
                  </button>
                  <button
                    onClick={() => {
                      setRpcModule('sys');
                      setRpcMethod('dmesg');
                      setRpcParams('[]');
                      handleExecuteLuciRpc();
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300"
                  >
                    sys.dmesg()
                  </button>
                </div>

                {/* RPC Response Viewer */}
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 font-mono text-xs text-slate-300 overflow-x-auto max-h-[300px]">
                  {rpcResult ? (
                    <pre className="text-emerald-300 whitespace-pre-wrap">
                      {JSON.stringify(rpcResult, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-slate-600">
                      Pilih method atau klik salah satu Quick Call di atas untuk melihat respon JSON dari LuCI RPC endpoint...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interfaces' && selectedIface && (
            <div className="space-y-4">
              {/* Main Selected Interface Chart */}
              <BandwidthLiveChart
                title={`Live Bandwidth Stream: ${selectedIface.name} ${selectedIface.alias ? `(${selectedIface.alias})` : ''}`}
                subtitle={`SNMP 64-bit ifHCInOctets/ifHCOutOctets polling interval ${device.pollIntervalSec}s`}
                data={selectedIface.history}
                height={230}
                linkSpeedMbps={selectedIface.speedMbps}
              />

              {/* Interface Detailed Parameters Table */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-200">
                    Spesifikasi & Statistik Akumulatif Port
                  </h4>
                  <button
                    onClick={() => handleToggleInterface(selectedIface.id)}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      selectedIface.adminStatus === 'up'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{selectedIface.adminStatus === 'up' ? 'Disable Port' : 'Enable Port'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs font-mono">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">MAC ADDRESS</span>
                    <strong className="text-slate-200">{selectedIface.macAddress}</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">IP / SUBNET</span>
                    <strong className="text-slate-200">{selectedIface.ipAddress || 'Layer 2 Switchport'}</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">TOTAL RX DOWNLOAD</span>
                    <strong className="text-emerald-400">{formatBytes(selectedIface.rxTotalBytes)}</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">TOTAL TX UPLOAD</span>
                    <strong className="text-cyan-400">{formatBytes(selectedIface.txTotalBytes)}</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">MTU / DUPLEX</span>
                    <strong className="text-slate-200">{selectedIface.mtu} / {selectedIface.duplex.toUpperCase()}</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">UTILIZATION RATE</span>
                    <strong className="text-slate-200">{selectedIface.utilizationPercent}%</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">RX/TX ERRORS</span>
                    <strong className={selectedIface.rxErrors > 0 ? 'text-rose-400' : 'text-slate-400'}>
                      {selectedIface.rxErrors} / {selectedIface.txErrors}
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">PACKET DROPS</span>
                    <strong className={selectedIface.rxDrops > 0 ? 'text-amber-400' : 'text-slate-400'}>
                      {selectedIface.rxDrops} / {selectedIface.txDrops}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* Multi-Core CPU Visualizer */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-200">
                      Multi-Core CPU Load Distribution ({device.metrics.cpuCores.length} Cores)
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    Avg Load: {device.metrics.cpuUsage}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4">
                  {device.metrics.cpuCores.map((load, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-mono block">Core #{idx}</span>
                      <div className="w-full bg-slate-800 rounded-full h-2 my-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            load > 85 ? 'bg-rose-500' : load > 60 ? 'bg-amber-500' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${load}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
                        {load}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware Sensors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Thermometer className="w-4 h-4 text-amber-400" />
                    <span>Suhu Sensor Chassis</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-amber-300">
                    {device.metrics.temperatureCelsius}°C
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">Normal operating threshold: &lt; 70°C</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <HardDrive className="w-4 h-4 text-indigo-400" />
                    <span>Memory RAM</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-indigo-300">
                    {(device.metrics.ramUsedMb / 1024).toFixed(1)} / {(device.metrics.ramTotalMb / 1024).toFixed(1)} GB
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {((device.metrics.ramUsedMb / device.metrics.ramTotalMb) * 100).toFixed(0)}% terpakai
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Power Supply & Fan</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-emerald-300">
                    {device.metrics.fanRpm ? `${device.metrics.fanRpm} RPM` : 'Fanless Pasif'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tegangan: {device.metrics.voltageVolts ? `${device.metrics.voltageVolts}V` : '220V AC PSU'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ping_probe' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-200">
                      SNMP Remote ICMP Ping & Latency Probe
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pingTarget}
                      onChange={e => setPingTarget(e.target.value)}
                      placeholder="IP Target / Hostname"
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono w-40 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={runPingProbe}
                      disabled={isPinging}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isPinging ? 'Pinging...' : 'Start Ping'}</span>
                    </button>
                  </div>
                </div>

                {/* Terminal Console Output */}
                <div className="bg-slate-950 rounded border border-slate-800/80 p-3 mt-3 font-mono text-xs text-slate-300 min-h-[160px] max-h-[260px] overflow-y-auto space-y-1">
                  {pingOutput.length === 0 ? (
                    <span className="text-slate-600">Tekan 'Start Ping' untuk menguji respon latensi jaringan dari perangkat {device.name}...</span>
                  ) : (
                    pingOutput.map((line, idx) => (
                      <div key={idx} className={line.startsWith('---') ? 'text-cyan-400 font-bold' : ''}>
                        {line}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            System Uptime: {formatUptime(device.metrics.uptimeSeconds)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
