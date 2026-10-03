import React, { useState } from 'react';
import { SubnetScanResult, NetworkDevice, DeviceVendor } from '../../types/network';
import { generateHistory, generateSystemHistory } from '../../data/mockDevices';
import { Radar, X, Play, Plus, CheckCircle2, Shield, RotateCw, ArrowRight } from 'lucide-react';
import { VendorBadge } from '../dashboard/VendorBadge';

interface SubnetScannerModalProps {
  onClose: () => void;
  onImportDevice: (device: NetworkDevice) => void;
}

export const SubnetScannerModal: React.FC<SubnetScannerModalProps> = ({
  onClose,
  onImportDevice,
}) => {
  const [subnet, setSubnet] = useState<string>('192.168.1.0/24');
  const [community, setCommunity] = useState<string>('public');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentIp, setCurrentIp] = useState<string>('');
  const [results, setResults] = useState<SubnetScanResult[]>([]);
  const [importedIps, setImportedIps] = useState<Set<string>>(new Set());

  const startScan = () => {
    setIsScanning(true);
    setProgress(0);
    setResults([]);
    setImportedIps(new Set());

    const basePrefix = subnet.split('/')[0].split('.').slice(0, 3).join('.');
    const totalHosts = 30; // Scan sample of 30 addresses
    let currentIdx = 1;

    const sampleDiscovered: SubnetScanResult[] = [
      {
        ip: `${basePrefix}.1`,
        hostname: 'ROUTER-GW-CORE',
        status: 'snmp_ready',
        vendor: 'mikrotik',
        model: 'CCR1036-12G-4S',
        snmpVersion: 'v2c',
        sysDescr: 'RouterOS CCR1036-12G-4S Tile-Gx36 36-Core 4GB RAM',
        responseTimeMs: 1.2,
        openPorts: [161, 80, 443, 8291, 22],
      },
      {
        ip: `${basePrefix}.2`,
        hostname: 'SW-DIST-CATALYST',
        status: 'snmp_ready',
        vendor: 'cisco',
        model: 'Catalyst 2960X-48TD-L',
        snmpVersion: 'v2c',
        sysDescr: 'Cisco IOS Software C2960X-UNIVERSALK9-M 15.2',
        responseTimeMs: 2.1,
        openPorts: [161, 22, 80],
      },
      {
        ip: `${basePrefix}.15`,
        hostname: 'AP-UNIFI-WIFI6-OUTDOOR',
        status: 'snmp_ready',
        vendor: 'ubiquiti',
        model: 'UniFi U6-Mesh',
        snmpVersion: 'v2c',
        sysDescr: 'Ubiquiti UniFi Access Point v6.5.64',
        responseTimeMs: 4.8,
        openPorts: [161, 80, 443, 8080],
      },
      {
        ip: `${basePrefix}.50`,
        hostname: 'SRV-NOC-CENTOS-DB',
        status: 'snmp_ready',
        vendor: 'linux',
        model: 'Supermicro Xeon Silver (Rocky Linux 9)',
        snmpVersion: 'v2c',
        sysDescr: 'Linux srv-noc-db 5.14.0-362.el9_3.x86_64',
        responseTimeMs: 0.8,
        openPorts: [161, 22, 5432, 3306],
      },
      {
        ip: `${basePrefix}.88`,
        hostname: 'HUAWEI-S5720-SWITCH',
        status: 'snmp_ready',
        vendor: 'huawei',
        model: 'CloudEngine S5720-28X-SI',
        snmpVersion: 'v2c',
        sysDescr: 'Huawei Versatile Routing Platform S5720 V200R019',
        responseTimeMs: 3.4,
        openPorts: [161, 22, 80],
      },
      {
        ip: `${basePrefix}.110`,
        hostname: 'RUIJIE-REYEE-EG-GW',
        status: 'snmp_ready',
        vendor: 'ruijie',
        model: 'Reyee RG-EG210G-P Cloud Router',
        snmpVersion: 'v2c',
        sysDescr: 'Ruijie Reyee RG-EG210G-P 10-Port Gigabit PoE Security Gateway ReyeeOS',
        responseTimeMs: 2.3,
        openPorts: [161, 80, 443, 8080],
      },
      {
        ip: `${basePrefix}.125`,
        hostname: 'OPENWRT-LINKSYS-ROUTER',
        status: 'snmp_ready',
        vendor: 'openwrt',
        model: 'Linksys WRT1900ACS (OpenWrt 23.05)',
        snmpVersion: 'v2c',
        sysDescr: 'OpenWrt 23.05.3 Linksys WRT1900ACS Linux 5.15.150 net-snmp',
        responseTimeMs: 1.5,
        openPorts: [161, 22, 80, 443],
      },
    ];

    const interval = setInterval(() => {
      currentIdx += 2;
      const pct = Math.min(100, Math.round((currentIdx / totalHosts) * 100));
      setProgress(pct);
      setCurrentIp(`${basePrefix}.${currentIdx}`);

      // Inject discovered items progressively
      if (currentIdx === 2) setResults(prev => [...prev, sampleDiscovered[0]]);
      if (currentIdx === 6) setResults(prev => [...prev, sampleDiscovered[1]]);
      if (currentIdx === 12) setResults(prev => [...prev, sampleDiscovered[2]]);
      if (currentIdx === 18) setResults(prev => [...prev, sampleDiscovered[3]]);
      if (currentIdx === 22) setResults(prev => [...prev, sampleDiscovered[4]]);
      if (currentIdx === 26) setResults(prev => [...prev, sampleDiscovered[5]]);
      if (currentIdx === 30) setResults(prev => [...prev, sampleDiscovered[6]]);

      if (currentIdx >= totalHosts) {
        clearInterval(interval);
        setIsScanning(false);
      }
    }, 100);
  };

  const handleImport = (item: SubnetScanResult) => {
    const newDev: NetworkDevice = {
      id: `dev-scan-${Date.now()}-${item.ip.replace(/\./g, '-')}`,
      name: item.hostname || `DEVICE-${item.ip}`,
      ipAddress: item.ip,
      vendor: item.vendor || 'generic',
      type: item.vendor === 'ruijie' || item.vendor === 'reyee'
        ? 'gateway'
        : item.vendor === 'openwrt' || item.vendor === 'linksys'
        ? 'router'
        : item.vendor === 'mikrotik'
        ? 'router'
        : item.vendor === 'cisco'
        ? 'switch'
        : item.vendor === 'linux'
        ? 'server'
        : 'access_point',
      model: item.model || 'Auto-Discovered SNMP Node',
      osVersion: item.vendor === 'ruijie' || item.vendor === 'reyee'
        ? 'ReyeeOS (Ruijie Cloud)'
        : item.vendor === 'openwrt' || item.vendor === 'linksys'
        ? 'OpenWrt 23.05 (Linux net-snmp)'
        : 'Discovered Firmware',
      location: 'Subnet Discovery Pool',
      status: 'online',
      lastSeen: Date.now(),
      pollIntervalSec: 5,
      snmp: {
        version: item.snmpVersion || 'v2c',
        port: 161,
        community: community || 'public',
        timeoutMs: 2000,
        retries: 2,
      },
      sysDescr: item.sysDescr,
      metrics: {
        cpuUsage: 22.5,
        cpuCores: [24, 21],
        ramUsedMb: 1024,
        ramTotalMb: 2048,
        storageUsedGb: 0.5,
        storageTotalGb: 2.0,
        temperatureCelsius: 41.5,
        uptimeSeconds: 120400,
        pingLatencyMs: item.responseTimeMs,
        packetLossPercent: 0,
        jitterMs: 0.4,
        activeConnections: 350,
        loadAverage: [0.3, 0.25, 0.2],
        history: generateSystemHistory(22, 50, item.responseTimeMs, 41.5),
      },
      interfaces: [
        {
          id: `if-scan-${Date.now()}-1`,
          name: 'port1-uplink',
          alias: 'DISCOVERED-TRUNK',
          type: 'ethernet',
          adminStatus: 'up',
          operStatus: 'up',
          macAddress: 'E4:8D:8C:11:22:33',
          speedMbps: 1000,
          duplex: 'full',
          mtu: 1500,
          currentRxMbps: 35.4,
          currentTxMbps: 18.2,
          rxTotalBytes: 500000000,
          txTotalBytes: 250000000,
          rxErrors: 0,
          txErrors: 0,
          rxDrops: 0,
          txDrops: 0,
          utilizationPercent: 3.5,
          history: generateHistory(35, 18),
        },
      ],
    };

    onImportDevice(newDev);
    setImportedIps(prev => new Set(prev).add(item.ip));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Radar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">SNMP Subnet Auto-Discovery Scanner</h3>
              <p className="text-xs text-slate-400">Pindai rentang IP jaringan untuk mendeteksi perangkat SNMP multi-vendor otomatis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Input Controls */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Target CIDR Subnet Range</label>
              <input
                type="text"
                value={subnet}
                onChange={e => setSubnet(e.target.value)}
                placeholder="192.168.1.0/24"
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">SNMP Community Probe</label>
              <input
                type="text"
                value={community}
                onChange={e => setCommunity(e.target.value)}
                placeholder="public"
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={startScan}
                disabled={isScanning}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-950"
              >
                {isScanning ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mulai Pindai Subnet</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {isScanning && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Memeriksa host: <strong className="text-cyan-400">{currentIp}</strong></span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Discovered Hosts Table */}
        <div className="p-6 overflow-y-auto max-h-[360px] space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Perangkat Terdeteksi: <strong className="text-white">{results.length} Nodes</strong></span>
            <span>Port 161 (SNMP) Ready</span>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
            {results.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                {isScanning ? 'Sedang melakukan probing SNMP ke seluruh host...' : 'Klik "Mulai Pindai Subnet" untuk menemukan perangkat jaringan.'}
              </div>
            ) : (
              results.map((item, idx) => {
                const isImported = importedIps.has(item.ip);

                return (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-100 font-bold">{item.hostname}</strong>
                        <span className="font-mono text-cyan-400 font-medium">({item.ip})</span>
                        {item.vendor && <VendorBadge vendor={item.vendor} size="sm" />}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {item.model} · Respon: <span className="text-emerald-400">{item.responseTimeMs}ms</span> · Ports: {item.openPorts.join(', ')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleImport(item)}
                      disabled={isImported}
                      className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                        isImported
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                      }`}
                    >
                      {isImported ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Sudah Ditambahkan</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Import ke Fleet</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
