import React from 'react';
import { DeviceVendor } from '../../types/network';
import { Server, Router, Network, Cpu, ShieldCheck, Radio } from 'lucide-react';

interface VendorBadgeProps {
  vendor: DeviceVendor;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const VendorBadge: React.FC<VendorBadgeProps> = ({ vendor, showIcon = true, size = 'sm' }) => {
  const getVendorInfo = () => {
    switch (vendor) {
      case 'mikrotik':
        return {
          label: 'MikroTik',
          sub: 'RouterOS',
          color: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
          dot: 'bg-amber-400',
          icon: Router,
        };
      case 'cisco':
        return {
          label: 'Cisco',
          sub: 'IOS-XE',
          color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50',
          dot: 'bg-cyan-400',
          icon: Network,
        };
      case 'huawei':
        return {
          label: 'Huawei',
          sub: 'VRP Engine',
          color: 'text-rose-400 bg-rose-950/40 border-rose-800/50',
          dot: 'bg-rose-400',
          icon: Router,
        };
      case 'ubiquiti':
        return {
          label: 'Ubiquiti',
          sub: 'UniFi OS',
          color: 'text-blue-400 bg-blue-950/40 border-blue-800/50',
          dot: 'bg-blue-400',
          icon: Radio,
        };
      case 'ruijie':
      case 'reyee':
        return {
          label: 'Ruijie Reyee',
          sub: 'ReyeeOS / Cloud',
          color: 'text-orange-400 bg-orange-950/40 border-orange-800/50',
          dot: 'bg-orange-400',
          icon: Router,
        };
      case 'openwrt':
      case 'linksys':
        return {
          label: 'OpenWrt / Linksys',
          sub: 'Linux net-snmp',
          color: 'text-teal-400 bg-teal-950/40 border-teal-800/50',
          dot: 'bg-teal-400',
          icon: Radio,
        };
      case 'linux':
        return {
          label: 'Linux / Unix',
          sub: 'Host-MIB',
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
          dot: 'bg-emerald-400',
          icon: Server,
        };
      case 'juniper':
        return {
          label: 'Juniper',
          sub: 'Junos OS',
          color: 'text-purple-400 bg-purple-950/40 border-purple-800/50',
          dot: 'bg-purple-400',
          icon: ShieldCheck,
        };
      default:
        return {
          label: 'SNMP Generic',
          sub: 'RFC1213',
          color: 'text-slate-300 bg-slate-800/50 border-slate-700/50',
          dot: 'bg-slate-400',
          icon: Cpu,
        };
    }
  };

  const info = getVendorInfo();
  const IconComp = info.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5',
  }[size];

  return (
    <span className={`inline-flex items-center font-medium border rounded ${info.color} ${sizeClasses}`}>
      {showIcon && <IconComp className="w-3.5 h-3.5 shrink-0" />}
      <span>{info.label}</span>
    </span>
  );
};
