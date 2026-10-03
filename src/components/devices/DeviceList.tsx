import React, { useState } from 'react';
import { NetworkDevice, DeviceVendor, DeviceStatus } from '../../types/network';
import { VendorBadge } from '../dashboard/VendorBadge';
import { formatBandwidth, formatUptime } from '../../services/snmpEngine';
import { 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  Activity, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Server,
  Network,
  Router,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Download
} from 'lucide-react';

interface DeviceListProps {
  devices: NetworkDevice[];
  onSelectDevice: (device: NetworkDevice) => void;
  onDeleteDevice: (deviceId: string) => void;
  onOpenAddDevice: () => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  onSelectDevice,
  onDeleteDevice,
  onOpenAddDevice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = devices.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = vendorFilter === 'all' || d.vendor === vendorFilter;
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesVendor && matchesStatus;
  });

  const handleExportFleet = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(devices, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `netpulse_fleet_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari hostname, IP address, model, atau lokasi rak..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={vendorFilter}
            onChange={e => setVendorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Vendor</option>
            <option value="mikrotik">MikroTik</option>
            <option value="ruijie">Ruijie Reyee</option>
            <option value="openwrt">OpenWrt / Linksys</option>
            <option value="cisco">Cisco</option>
            <option value="huawei">Huawei</option>
            <option value="ubiquiti">Ubiquiti</option>
            <option value="linux">Linux Server</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Status</option>
            <option value="online">Online / Nominal</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          <button
            onClick={handleExportFleet}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Fleet</span>
          </button>

          <button
            onClick={onOpenAddDevice}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-950"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Device Table Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Perangkat & IP</th>
                <th className="py-3 px-4 font-semibold">Vendor & Model</th>
                <th className="py-3 px-4 font-semibold">Status SNMP</th>
                <th className="py-3 px-4 font-semibold">CPU Load</th>
                <th className="py-3 px-4 font-semibold">RAM Usage</th>
                <th className="py-3 px-4 font-semibold">Total Traffic (Rx / Tx)</th>
                <th className="py-3 px-4 font-semibold">Suhu & Ping</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Tidak ada perangkat yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filtered.map(device => {
                  const totalRx = device.interfaces.reduce((sum, i) => sum + i.currentRxMbps, 0);
                  const totalTx = device.interfaces.reduce((sum, i) => sum + i.currentTxMbps, 0);
                  const ramPct = ((device.metrics.ramUsedMb / device.metrics.ramTotalMb) * 100).toFixed(0);

                  return (
                    <tr
                      key={device.id}
                      onClick={() => onSelectDevice(device)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Name & IP */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              device.status === 'online'
                                ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                                : device.status === 'warning'
                                ? 'bg-amber-400 animate-ping'
                                : 'bg-rose-500 animate-ping'
                            }`}
                          />
                          <div>
                            <span className="text-slate-100 font-bold font-sans block group-hover:text-cyan-400 transition-colors">
                              {device.name}
                            </span>
                            <span className="text-slate-400 text-[11px] block">
                              {device.ipAddress} · <span className="text-slate-500 font-sans">{device.location}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Vendor & Model */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <VendorBadge vendor={device.vendor} size="sm" />
                          <span className="text-[11px] text-slate-400 font-sans block truncate max-w-[160px]">
                            {device.model}
                          </span>
                        </div>
                      </td>

                      {/* SNMP Status */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="text-emerald-400 font-semibold block text-[11px]">
                            SNMP {device.snmp.version.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Up {formatUptime(device.metrics.uptimeSeconds)}
                          </span>
                        </div>
                      </td>

                      {/* CPU */}
                      <td className="py-3 px-4">
                        <div className="w-24">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className={device.metrics.cpuUsage > 80 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                              {device.metrics.cpuUsage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                device.metrics.cpuUsage > 80
                                  ? 'bg-rose-500'
                                  : device.metrics.cpuUsage > 60
                                  ? 'bg-amber-500'
                                  : 'bg-cyan-400'
                              }`}
                              style={{ width: `${device.metrics.cpuUsage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* RAM */}
                      <td className="py-3 px-4 text-[11px]">
                        <span className="text-slate-300 block">{ramPct}%</span>
                        <span className="text-slate-500 text-[10px]">
                          {(device.metrics.ramUsedMb / 1024).toFixed(1)}GB
                        </span>
                      </td>

                      {/* Traffic */}
                      <td className="py-3 px-4 text-[11px]">
                        <span className="text-emerald-400 font-semibold block">
                          ↓ {formatBandwidth(totalRx)}
                        </span>
                        <span className="text-cyan-400 font-semibold block">
                          ↑ {formatBandwidth(totalTx)}
                        </span>
                      </td>

                      {/* Temp & Ping */}
                      <td className="py-3 px-4 text-[11px]">
                        <span className="text-amber-300 block">
                          {device.metrics.temperatureCelsius}°C
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          Ping: {device.metrics.pingLatencyMs}ms
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectDevice(device)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                            title="Buka Diagnostic Panel"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDevice(device.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Hapus Perangkat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
