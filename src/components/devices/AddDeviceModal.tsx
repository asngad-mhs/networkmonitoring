import React, { useState } from 'react';
import { NetworkDevice, DeviceVendor, DeviceType, SnmpVersion, SnmpV3AuthProtocol, SnmpV3PrivProtocol, SnmpV3SecurityLevel } from '../../types/network';
import { generateHistory, generateSystemHistory } from '../../data/mockDevices';
import { X, Plus, Server, Network, Router, Radio, Shield, Check, Activity } from 'lucide-react';

interface AddDeviceModalProps {
  onClose: () => void;
  onAddDevice: (device: NetworkDevice) => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ onClose, onAddDevice }) => {
  const [name, setName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [vendor, setVendor] = useState<DeviceVendor>('mikrotik');
  const [type, setType] = useState<DeviceType>('router');
  const [model, setModel] = useState('CCR2004-16G-2S+');
  const [location, setLocation] = useState('Server Room HQ');
  const [pollIntervalSec, setPollIntervalSec] = useState(3);
  
  // SNMP configs
  const [snmpVersion, setSnmpVersion] = useState<SnmpVersion>('v2c');
  const [snmpPort, setSnmpPort] = useState(161);
  const [community, setCommunity] = useState('public');
  
  // SNMP v3 configs
  const [username, setUsername] = useState('snmpuser');
  const [securityLevel, setSecurityLevel] = useState<SnmpV3SecurityLevel>('authPriv');
  const [authProtocol, setAuthProtocol] = useState<SnmpV3AuthProtocol>('SHA');
  const [authPassword, setAuthPassword] = useState('');
  const [privProtocol, setPrivProtocol] = useState<SnmpV3PrivProtocol>('AES');
  const [privPassword, setPrivPassword] = useState('');

  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = () => {
    if (!ipAddress) {
      setTestResult('Harap masukkan IP Address perangkat');
      return;
    }
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(`Berhasil terhubung via SNMP ${snmpVersion} ke ${ipAddress}:${snmpPort}. System OID terdeteksi.`);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ipAddress) return;

    const newDevice: NetworkDevice = {
      id: `dev-${Date.now()}`,
      name: name.toUpperCase(),
      ipAddress,
      vendor,
      type,
      model: model || `${vendor.toUpperCase()} Generic Device`,
      osVersion: vendor === 'mikrotik'
        ? 'RouterOS v7.14'
        : vendor === 'ruijie' || vendor === 'reyee'
        ? 'ReyeeOS v2.260 (Ruijie Cloud)'
        : vendor === 'openwrt' || vendor === 'linksys'
        ? 'OpenWrt 23.05.3 / LuCI (Linux)'
        : vendor === 'cisco'
        ? 'Cisco IOS-XE 17.6'
        : 'Custom Firmware',
      location: location || 'Data Center',
      status: 'online',
      lastSeen: Date.now(),
      pollIntervalSec,
      snmp: {
        version: snmpVersion,
        port: snmpPort,
        community: snmpVersion !== 'v3' ? community : '',
        timeoutMs: 2000,
        retries: 2,
        ...(snmpVersion === 'v3' ? {
          username,
          securityLevel,
          authProtocol,
          authPassword,
          privProtocol,
          privPassword,
        } : {}),
      },
      sysDescr: `${vendor.toUpperCase()} ${model} SNMP Agent Managed Node`,
      topologyPosition: {
        x: 200 + Math.floor(Math.random() * 400),
        y: 150 + Math.floor(Math.random() * 300),
      },
      metrics: {
        cpuUsage: 18.5,
        cpuCores: [20, 16, 22, 18],
        ramUsedMb: 1024,
        ramTotalMb: 2048,
        storageUsedGb: 0.5,
        storageTotalGb: 2.0,
        temperatureCelsius: 42.0,
        fanRpm: 3200,
        voltageVolts: 24.0,
        uptimeSeconds: 86400,
        pingLatencyMs: 1.5,
        packetLossPercent: 0,
        jitterMs: 0.3,
        activeConnections: 1200,
        loadAverage: [0.25, 0.20, 0.18],
        history: generateSystemHistory(18, 50, 1.5, 42.0),
      },
      interfaces: [
        {
          id: `if-${Date.now()}-1`,
          name: 'ether1-wan',
          alias: 'PRIMARY-UPLINK',
          type: 'ethernet',
          adminStatus: 'up',
          operStatus: 'up',
          macAddress: 'DC:2C:6E:AA:BB:01',
          ipAddress: `${ipAddress}/24`,
          speedMbps: 1000,
          duplex: 'full',
          mtu: 1500,
          currentRxMbps: 45.2,
          currentTxMbps: 12.8,
          rxTotalBytes: 1024000000,
          txTotalBytes: 512000000,
          rxErrors: 0,
          txErrors: 0,
          rxDrops: 0,
          txDrops: 0,
          utilizationPercent: 4.5,
          history: generateHistory(45, 12),
        },
        {
          id: `if-${Date.now()}-2`,
          name: 'ether2-lan',
          alias: 'LAN-LOCAL-BRIDGE',
          type: 'ethernet',
          adminStatus: 'up',
          operStatus: 'up',
          macAddress: 'DC:2C:6E:AA:BB:02',
          ipAddress: '192.168.88.1/24',
          speedMbps: 1000,
          duplex: 'full',
          mtu: 1500,
          currentRxMbps: 12.8,
          currentTxMbps: 45.2,
          rxTotalBytes: 512000000,
          txTotalBytes: 1024000000,
          rxErrors: 0,
          txErrors: 0,
          rxDrops: 0,
          txDrops: 0,
          utilizationPercent: 4.5,
          history: generateHistory(12, 45),
        },
      ],
    };

    onAddDevice(newDevice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Tambah Perangkat SNMP Baru</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Section 1: General Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Nama Perangkat (Hostname) *</label>
              <input
                type="text"
                required
                placeholder="e.g. MIKROTIK-CORE-RB5009"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">IP Address / Host Target *</label>
              <input
                type="text"
                required
                placeholder="e.g. 192.168.1.1 atau 10.10.0.1"
                value={ipAddress}
                onChange={e => setIpAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Vendor Pabrikan</label>
              <select
                value={vendor}
                onChange={e => {
                  const val = e.target.value as DeviceVendor;
                  setVendor(val);
                  if (val === 'ruijie' || val === 'reyee') {
                    setModel('Reyee RG-EG310G-E');
                    setType('gateway');
                  } else if (val === 'openwrt' || val === 'linksys') {
                    setModel('Linksys WRT3200ACM (OpenWrt)');
                    setType('router');
                  } else if (val === 'mikrotik') {
                    setModel('CCR2004-16G-2S+');
                    setType('router');
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="mikrotik">MikroTik (RouterOS)</option>
                <option value="ruijie">Ruijie Reyee (ReyeeOS / Cloud)</option>
                <option value="openwrt">OpenWrt (Linux net-snmp)</option>
                <option value="linksys">Linksys (WRT / OpenWrt)</option>
                <option value="cisco">Cisco Systems (IOS-XE)</option>
                <option value="huawei">Huawei Technologies</option>
                <option value="ubiquiti">Ubiquiti / UniFi</option>
                <option value="juniper">Juniper Networks</option>
                <option value="linux">Linux / Windows Server</option>
                <option value="generic">Generic SNMP Agent</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Tipe Perangkat</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as DeviceType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="router">Router Gateway</option>
                <option value="switch">Managed Switch / Core SW</option>
                <option value="server">Application / Database Server</option>
                <option value="access_point">Wireless Access Point (AP)</option>
                <option value="olt">Optical Line Terminal (OLT)</option>
                <option value="firewall">Firewall UTM</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Model / Hardware</label>
              <input
                type="text"
                placeholder="e.g. CCR2004-1G-12S+2XS"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Lokasi Rak / Gedung</label>
              <input
                type="text"
                placeholder="e.g. Rack A02 Server Room Lt. 2"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Section 2: SNMP Configuration */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold text-cyan-400">Konfigurasi Protokol SNMP</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">SNMP Version</label>
                <select
                  value={snmpVersion}
                  onChange={e => setSnmpVersion(e.target.value as SnmpVersion)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="v1">SNMP v1</option>
                  <option value="v2c">SNMP v2c (Recommended)</option>
                  <option value="v3">SNMP v3 (USM Security)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">SNMP Port</label>
                <input
                  type="number"
                  value={snmpPort}
                  onChange={e => setSnmpPort(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {snmpVersion !== 'v3' ? (
                <div>
                  <label className="text-slate-400 block mb-1">Community String</label>
                  <input
                    type="text"
                    value={community}
                    onChange={e => setCommunity(e.target.value)}
                    placeholder="public"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-slate-400 block mb-1">v3 Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Test Connection Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
              >
                {testing ? 'Menguji SNMP...' : 'Test SNMP Probe'}
              </button>

              {testResult && (
                <span className="text-[11px] font-mono text-emerald-400">
                  {testResult}
                </span>
              )}
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-lg shadow-cyan-950 transition-colors"
            >
              Simpan & Mulai Monitor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
