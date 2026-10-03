import React, { useState } from 'react';
import { NetworkDevice, SnmpWalkResult } from '../../types/network';
import { performSnmpWalk, MIB_DEFINITIONS } from '../../services/snmpEngine';
import { VendorBadge } from '../dashboard/VendorBadge';
import { Search, Play, Download, Copy, Check, Terminal, FileText, Database, CornerDownRight } from 'lucide-react';

interface SnmpExplorerProps {
  devices: NetworkDevice[];
  initialSelectedDevice?: NetworkDevice;
}

export const SnmpExplorer: React.FC<SnmpExplorerProps> = ({
  devices,
  initialSelectedDevice,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    initialSelectedDevice?.id || devices[0]?.id || ''
  );
  const [oidQuery, setOidQuery] = useState<string>('.1.3.6.1.2.1');
  const [filterText, setFilterText] = useState<string>('');
  const [results, setResults] = useState<SnmpWalkResult[]>(() => {
    const dev = initialSelectedDevice || devices[0];
    return dev ? performSnmpWalk(dev, '.1.3.6.1.2.1') : [];
  });
  const [copied, setCopied] = useState<boolean>(false);

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  const handleExecuteWalk = () => {
    if (!selectedDevice) return;
    const walkResults = performSnmpWalk(selectedDevice, oidQuery || '.1.3.6.1');
    setResults(walkResults);
  };

  const handlePresetSelect = (oid: string) => {
    setOidQuery(oid);
    if (selectedDevice) {
      const walkResults = performSnmpWalk(selectedDevice, oid);
      setResults(walkResults);
    }
  };

  const filteredResults = results.filter(
    r =>
      r.oid.toLowerCase().includes(filterText.toLowerCase()) ||
      r.name.toLowerCase().includes(filterText.toLowerCase()) ||
      r.value.toLowerCase().includes(filterText.toLowerCase()) ||
      r.description.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `snmp_walk_${selectedDevice?.name || 'device'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyClipboard = () => {
    const text = results.map(r => `${r.oid} = ${r.type}: ${r.value}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header & Device Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-tight">SNMP MIB Walker & OID Explorer</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Jalankan kueri SNMP v1/v2c/v3 langsung ke OID Tree multi-vendor (RFC1213, IF-MIB, MikroTik, Cisco, Host-Resources).
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                const dev = devices.find(d => d.id === e.target.value);
                if (dev) setResults(performSnmpWalk(dev, oidQuery));
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 min-w-[220px]"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.ipAddress}) - {d.vendor.toUpperCase()}
                </option>
              ))}
            </select>

            {selectedDevice && <VendorBadge vendor={selectedDevice.vendor} size="md" />}
          </div>
        </div>

        {/* OID Query Input & Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={oidQuery}
                onChange={e => setOidQuery(e.target.value)}
                placeholder="Masukkan Root OID (e.g. .1.3.6.1.2.1 atau .1.3.6.1.4.1.14988)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-24 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 shadow-inner"
              />
              <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-500">
                SNMP {selectedDevice?.snmp.version}
              </span>
            </div>

            <button
              onClick={handleExecuteWalk}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-950 shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>SNMP Walk</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 text-[11px] mr-1">Preset OID:</span>
            <button
              onClick={() => handlePresetSelect('.1.3.6.1.2.1.1')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 font-mono text-[11px]"
            >
              System (.1.3.6.1.2.1.1)
            </button>
            <button
              onClick={() => handlePresetSelect('.1.3.6.1.2.1.2')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 font-mono text-[11px]"
            >
              Interfaces (.1.3.6.1.2.1.2)
            </button>
            <button
              onClick={() => handlePresetSelect('.1.3.6.1.4.1.14988')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-amber-400 font-mono text-[11px]"
            >
              MikroTik (.14988)
            </button>
            <button
              onClick={() => handlePresetSelect('.1.3.6.1.4.1.4881')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-orange-400 font-mono text-[11px]"
            >
              Ruijie Reyee (.4881)
            </button>
            <button
              onClick={() => handlePresetSelect('.1.3.6.1.4.1.2021')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-teal-400 font-mono text-[11px]"
            >
              OpenWrt/Linksys (.2021)
            </button>
            <button
              onClick={() => handlePresetSelect('.1.3.6.1.4.1.9')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-cyan-400 font-mono text-[11px]"
            >
              Cisco MIB (.9)
            </button>
            <button
              onClick={() => handlePresetSelect('.1.3.6.1.2.1.25')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-emerald-400 font-mono text-[11px]"
            >
              Host CPU (.25)
            </button>
          </div>
        </div>
      </div>

      {/* Walk Output Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
        {/* Table Top Toolbar */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Cari OID, MIB variable name, atau value..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              Hasil: <strong className="text-white">{filteredResults.length}</strong> OID records
            </span>
            <div className="h-3 w-px bg-slate-800" />
            <button
              onClick={handleCopyClipboard}
              className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Copy'}</span>
            </button>
            <button
              onClick={handleExportJson}
              className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] sticky top-0 border-b border-slate-800 z-10">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-1/4">Object Identifier (OID)</th>
                <th className="py-2.5 px-4 font-semibold w-1/5">MIB Variable</th>
                <th className="py-2.5 px-4 font-semibold w-24">Type</th>
                <th className="py-2.5 px-4 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Tidak ada data OID yang sesuai dengan query walk '{oidQuery}'.
                  </td>
                </tr>
              ) : (
                filteredResults.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-4 text-cyan-400 font-medium whitespace-nowrap">
                      {row.oid}
                    </td>
                    <td className="py-2 px-4 text-slate-200">
                      <span className="font-semibold block">{row.name}</span>
                      <span className="text-[10px] text-slate-500 font-sans block truncate max-w-xs">
                        {row.description}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-emerald-300 font-semibold break-all">
                      {row.value}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
