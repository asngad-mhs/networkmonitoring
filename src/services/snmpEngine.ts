import { NetworkDevice, SnmpWalkResult, SnmpVersion } from '../types/network';

// Built-in MIB dictionary for queries and walks
export const MIB_DEFINITIONS: { [key: string]: { name: string; type: SnmpWalkResult['type']; desc: string } } = {
  // RFC1213 / SNMPv2-MIB
  '.1.3.6.1.2.1.1.1.0': { name: 'sysDescr.0', type: 'OctetString', desc: 'Hardware & OS release info' },
  '.1.3.6.1.2.1.1.2.0': { name: 'sysObjectID.0', type: 'OctetString', desc: 'Enterprise registration OID' },
  '.1.3.6.1.2.1.1.3.0': { name: 'sysUpTime.0', type: 'TimeTicks', desc: 'Time since device initialized' },
  '.1.3.6.1.2.1.1.4.0': { name: 'sysContact.0', type: 'OctetString', desc: 'Administrator contact string' },
  '.1.3.6.1.2.1.1.5.0': { name: 'sysName.0', type: 'OctetString', desc: 'Device FQDN hostname' },
  '.1.3.6.1.2.1.1.6.0': { name: 'sysLocation.0', type: 'OctetString', desc: 'Physical rack / room location' },
  
  // HOST-RESOURCES-MIB / CPU
  '.1.3.6.1.2.1.25.3.3.1.2.1': { name: 'hrProcessorLoad.1', type: 'Gauge32', desc: 'CPU Core #1 Load percentage' },
  '.1.3.6.1.2.1.25.3.3.1.2.2': { name: 'hrProcessorLoad.2', type: 'Gauge32', desc: 'CPU Core #2 Load percentage' },
  '.1.3.6.1.2.1.25.2.2.0': { name: 'hrMemorySize.0', type: 'Integer', desc: 'Total physical RAM in KBytes' },
  
  // MikroTik Enterprise OIDs
  '.1.3.6.1.4.1.14988.1.1.3.10.0': { name: 'mtxHlProcessorTemperature.0', type: 'Gauge32', desc: 'MikroTik CPU Temp in °C' },
  '.1.3.6.1.4.1.14988.1.1.3.8.0': { name: 'mtxHlVoltage.0', type: 'Gauge32', desc: 'Power supply voltage (V*10)' },
  '.1.3.6.1.4.1.14988.1.1.3.14.0': { name: 'mtxHlActiveFanSpeed.0', type: 'Gauge32', desc: 'Cooling Fan RPM speed' },
  
  // Cisco Enterprise OIDs
  '.1.3.6.1.4.1.9.9.109.1.1.1.1.3.1': { name: 'cpmCPUTotal5secRev.1', type: 'Gauge32', desc: 'Cisco 5-second CPU utilization %' },
  '.1.3.6.1.4.1.9.9.13.1.3.1.3.1': { name: 'ciscoEnvMonTemperatureStatusValue.1', type: 'Gauge32', desc: 'Cisco Thermal Sensor °C' },

  // Ruijie Reyee Enterprise OIDs (.1.3.6.1.4.1.4881)
  '.1.3.6.1.4.1.4881.1.1.10.2.1.1.1.0': { name: 'ruijieSystemCpuRate.0', type: 'Gauge32', desc: 'Ruijie Reyee CPU load percentage' },
  '.1.3.6.1.4.1.4881.1.1.10.2.1.1.2.0': { name: 'ruijieSystemMemoryRate.0', type: 'Gauge32', desc: 'Ruijie Reyee RAM utilization %' },
  '.1.3.6.1.4.1.4881.1.1.10.2.1.1.3.0': { name: 'ruijieSystemTemperature.0', type: 'Gauge32', desc: 'Ruijie Reyee Chassis Thermal °C' },
  '.1.3.6.1.4.1.4881.1.1.10.2.1.1.4.0': { name: 'ruijieReyeeCloudTunnelState.0', type: 'OctetString', desc: 'Ruijie Reyee Cloud Managed Status' },
  '.1.3.6.1.4.1.4881.1.1.10.2.1.1.5.0': { name: 'ruijieReyeePoEPowerOutputWatts.0', type: 'Gauge32', desc: 'Ruijie Switch Total PoE Power Output (Watts)' },

  // OpenWrt / Linksys UCD-SNMP (.1.3.6.1.4.1.2021)
  '.1.3.6.1.4.1.2021.10.1.3.1': { name: 'laLoad.1', type: 'OctetString', desc: 'OpenWrt 1-minute load average' },
  '.1.3.6.1.4.1.2021.11.9.0': { name: 'ssCpuUser.0', type: 'Gauge32', desc: 'OpenWrt user CPU time percentage' },
  '.1.3.6.1.4.1.2021.4.6.0': { name: 'memAvailReal.0', type: 'Integer', desc: 'OpenWrt available physical memory in KB' },
  '.1.3.6.1.4.1.2021.13.15.1.1.2.1': { name: 'openwrtWirelessStationsConnected.1', type: 'Gauge32', desc: 'OpenWrt active Wi-Fi clients (station count)' },
  '.1.3.6.1.4.1.2021.13.15.1.1.3.1': { name: 'openwrtWirelessNoiseFloorDbm.1', type: 'Integer', desc: 'OpenWrt Wi-Fi RF Noise floor in dBm' },

  // Interface Table IF-MIB
  '.1.3.6.1.2.1.2.2.1.2.1': { name: 'ifDescr.1', type: 'OctetString', desc: 'Interface 1 name & type' },
  '.1.3.6.1.2.1.2.2.1.5.1': { name: 'ifSpeed.1', type: 'Gauge32', desc: 'Interface 1 link speed in bps' },
  '.1.3.6.1.2.1.2.2.1.7.1': { name: 'ifAdminStatus.1', type: 'Integer', desc: 'Interface 1 admin status (1=up)' },
  '.1.3.6.1.2.1.2.2.1.8.1': { name: 'ifOperStatus.1', type: 'Integer', desc: 'Interface 1 operational status (1=up)' },
  '.1.3.6.1.2.1.31.1.1.1.6.1': { name: 'ifHCInOctets.1', type: 'Counter64', desc: 'High capacity 64-bit Inbound Octets' },
  '.1.3.6.1.2.1.31.1.1.1.10.1': { name: 'ifHCOutOctets.1', type: 'Counter64', desc: 'High capacity 64-bit Outbound Octets' },
};

/**
 * Format raw bytes into human readable format (Kbps, Mbps, Gbps)
 */
export function formatBandwidth(mbps: number): string {
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(2)} Gbps`;
  }
  if (mbps < 1) {
    return `${(mbps * 1000).toFixed(0)} Kbps`;
  }
  return `${mbps.toFixed(1)} Mbps`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
  }
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}

/**
 * Perform simulated live SNMP walk against a target device
 */
export function performSnmpWalk(device: NetworkDevice, rootOid = '.1.3.6.1'): SnmpWalkResult[] {
  const results: SnmpWalkResult[] = [];
  
  // Standard RFC1213
  results.push(
    {
      oid: '.1.3.6.1.2.1.1.1.0',
      name: 'sysDescr.0',
      type: 'OctetString',
      value: device.sysDescr || `${device.vendor.toUpperCase()} ${device.model} ${device.osVersion}`,
      description: 'System Description and Firmware build',
    },
    {
      oid: '.1.3.6.1.2.1.1.2.0',
      name: 'sysObjectID.0',
      type: 'OctetString',
      value: `.1.3.6.1.4.1.${device.vendor === 'mikrotik' ? '14988' : device.vendor === 'cisco' ? '9' : device.vendor === 'huawei' ? '2011' : '41112'}.1`,
      description: 'Vendor Enterprise Object Identifier',
    },
    {
      oid: '.1.3.6.1.2.1.1.3.0',
      name: 'sysUpTime.0',
      type: 'TimeTicks',
      value: `${device.metrics.uptimeSeconds * 100} timeticks (${formatUptime(device.metrics.uptimeSeconds)})`,
      description: 'System Uptime in hundredths of a second',
    },
    {
      oid: '.1.3.6.1.2.1.1.4.0',
      name: 'sysContact.0',
      type: 'OctetString',
      value: device.sysContact || 'admin@network.local',
      description: 'Administrative contact email/name',
    },
    {
      oid: '.1.3.6.1.2.1.1.5.0',
      name: 'sysName.0',
      type: 'OctetString',
      value: device.name,
      description: 'System Hostname',
    },
    {
      oid: '.1.3.6.1.2.1.1.6.0',
      name: 'sysLocation.0',
      type: 'OctetString',
      value: device.location || 'Server Rack Room',
      description: 'Physical location of device',
    }
  );

  // Interfaces
  device.interfaces.forEach((iface, index) => {
    const idx = index + 1;
    results.push(
      {
        oid: `.1.3.6.1.2.1.2.2.1.1.${idx}`,
        name: `ifIndex.${idx}`,
        type: 'Integer',
        value: `${idx}`,
        description: `Interface index identifier for ${iface.name}`,
      },
      {
        oid: `.1.3.6.1.2.1.2.2.1.2.${idx}`,
        name: `ifDescr.${idx}`,
        type: 'OctetString',
        value: iface.name + (iface.alias ? ` (${iface.alias})` : ''),
        description: `Interface description`,
      },
      {
        oid: `.1.3.6.1.2.1.2.2.1.5.${idx}`,
        name: `ifSpeed.${idx}`,
        type: 'Gauge32',
        value: `${iface.speedMbps * 1000000} bps (${iface.speedMbps >= 1000 ? `${iface.speedMbps / 1000}Gbps` : `${iface.speedMbps}Mbps`})`,
        description: `Physical link maximum bandwidth`,
      },
      {
        oid: `.1.3.6.1.2.1.2.2.1.6.${idx}`,
        name: `ifPhysAddress.${idx}`,
        type: 'OctetString',
        value: iface.macAddress,
        description: `Physical Hardware MAC address`,
      },
      {
        oid: `.1.3.6.1.2.1.2.2.1.7.${idx}`,
        name: `ifAdminStatus.${idx}`,
        type: 'Integer',
        value: iface.adminStatus === 'up' ? '1 (up)' : '2 (down)',
        description: `Administrative desired state`,
      },
      {
        oid: `.1.3.6.1.2.1.2.2.1.8.${idx}`,
        name: `ifOperStatus.${idx}`,
        type: 'Integer',
        value: iface.operStatus === 'up' ? '1 (up)' : '2 (down)',
        description: `Current operational physical link state`,
      },
      {
        oid: `.1.3.6.1.2.1.31.1.1.1.6.${idx}`,
        name: `ifHCInOctets.${idx}`,
        type: 'Counter64',
        value: `${iface.rxTotalBytes} Bytes (${formatBytes(iface.rxTotalBytes)})`,
        description: `High-capacity 64-bit Inbound (Rx) byte counter`,
      },
      {
        oid: `.1.3.6.1.2.1.31.1.1.1.10.${idx}`,
        name: `ifHCOutOctets.${idx}`,
        type: 'Counter64',
        value: `${iface.txTotalBytes} Bytes (${formatBytes(iface.txTotalBytes)})`,
        description: `High-capacity 64-bit Outbound (Tx) byte counter`,
      }
    );
  });

  // Vendor Enterprise OIDs
  if (device.vendor === 'mikrotik') {
    results.push(
      {
        oid: '.1.3.6.1.4.1.14988.1.1.3.10.0',
        name: 'mtxHlProcessorTemperature.0',
        type: 'Gauge32',
        value: `${Math.round(device.metrics.temperatureCelsius * 10)} (${device.metrics.temperatureCelsius}°C)`,
        description: 'MikroTik CPU Sensor Temperature in Celsius * 10',
      },
      {
        oid: '.1.3.6.1.4.1.14988.1.1.3.8.0',
        name: 'mtxHlVoltage.0',
        type: 'Gauge32',
        value: `${Math.round((device.metrics.voltageVolts || 24) * 10)} (${device.metrics.voltageVolts || 24} V)`,
        description: 'MikroTik Motherboard Input Voltage',
      },
      {
        oid: '.1.3.6.1.4.1.14988.1.1.3.14.0',
        name: 'mtxHlActiveFanSpeed.0',
        type: 'Gauge32',
        value: `${device.metrics.fanRpm || 3200} RPM`,
        description: 'Chassis Cooling Fan speed in RPM',
      }
    );
  } else if (device.vendor === 'cisco') {
    results.push(
      {
        oid: '.1.3.6.1.4.1.9.9.109.1.1.1.1.3.1',
        name: 'cpmCPUTotal5secRev.1',
        type: 'Gauge32',
        value: `${Math.round(device.metrics.cpuUsage)}%`,
        description: 'Cisco 5-second average CPU load %',
      },
      {
        oid: '.1.3.6.1.4.1.9.9.13.1.3.1.3.1',
        name: 'ciscoEnvMonTemperatureStatusValue.1',
        type: 'Gauge32',
        value: `${device.metrics.temperatureCelsius}°C`,
        description: 'Cisco Environmental Monitor Temperature',
      }
    );
  } else if (device.vendor === 'ruijie' || device.vendor === 'reyee') {
    results.push(
      {
        oid: '.1.3.6.1.4.1.4881.1.1.10.2.1.1.1.0',
        name: 'ruijieSystemCpuRate.0',
        type: 'Gauge32',
        value: `${Math.round(device.metrics.cpuUsage)}%`,
        description: 'Ruijie Reyee CPU Core load percentage',
      },
      {
        oid: '.1.3.6.1.4.1.4881.1.1.10.2.1.1.2.0',
        name: 'ruijieSystemMemoryRate.0',
        type: 'Gauge32',
        value: `${Math.round((device.metrics.ramUsedMb / device.metrics.ramTotalMb) * 100)}%`,
        description: 'Ruijie Reyee RAM Memory rate percentage',
      },
      {
        oid: '.1.3.6.1.4.1.4881.1.1.10.2.1.1.3.0',
        name: 'ruijieSystemTemperature.0',
        type: 'Gauge32',
        value: `${device.metrics.temperatureCelsius}°C`,
        description: 'Ruijie Reyee Chassis Thermal Sensor',
      },
      {
        oid: '.1.3.6.1.4.1.4881.1.1.10.2.1.1.4.0',
        name: 'ruijieReyeeCloudTunnelState.0',
        type: 'OctetString',
        value: 'Ruijie Cloud Connected (Tunnel Active)',
        description: 'Ruijie Cloud platform sync state',
      }
    );
  } else if (device.vendor === 'openwrt' || device.vendor === 'linksys') {
    results.push(
      {
        oid: '.1.3.6.1.4.1.2021.10.1.3.1',
        name: 'laLoad.1',
        type: 'OctetString',
        value: `${device.metrics.loadAverage[0].toFixed(2)}`,
        description: 'OpenWrt 1-minute load average (Linux net-snmp)',
      },
      {
        oid: '.1.3.6.1.4.1.2021.11.9.0',
        name: 'ssCpuUser.0',
        type: 'Gauge32',
        value: `${Math.round(device.metrics.cpuUsage)}%`,
        description: 'OpenWrt user space CPU percentage',
      },
      {
        oid: '.1.3.6.1.4.1.2021.4.6.0',
        name: 'memAvailReal.0',
        type: 'Integer',
        value: `${(device.metrics.ramTotalMb - device.metrics.ramUsedMb) * 1024} KB`,
        description: 'OpenWrt available real RAM memory',
      },
      {
        oid: '.1.3.6.1.4.1.2021.13.15.1.1.2.1',
        name: 'openwrtWirelessStationsConnected.1',
        type: 'Gauge32',
        value: `${device.metrics.activeConnections > 50 ? Math.round(device.metrics.activeConnections / 15) : 28} Wi-Fi Clients`,
        description: 'OpenWrt active associated wireless stations (hostapd)',
      },
      {
        oid: '.1.3.6.1.4.1.2021.13.15.1.1.3.1',
        name: 'openwrtWirelessNoiseFloorDbm.1',
        type: 'Integer',
        value: '-95 dBm',
        description: 'OpenWrt Wireless RF Noise floor',
      }
    );
  }

  // Host Resources CPU
  device.metrics.cpuCores.forEach((core, i) => {
    results.push({
      oid: `.1.3.6.1.2.1.25.3.3.1.2.${i + 1}`,
      name: `hrProcessorLoad.${i + 1}`,
      type: 'Gauge32',
      value: `${core}%`,
      description: `Host Resources Processor Core #${i + 1} Utilization`,
    });
  });

  return results.filter(r => r.oid.startsWith(rootOid) || rootOid === '.1.3.6.1' || rootOid === '.1.3.6.1.2.1');
}

/**
 * Real-time dynamic polling tick generator
 * Simulates real SNMP delta fluctuations on devices
 */
export function tickDeviceMetrics(device: NetworkDevice): NetworkDevice {
  const now = Date.now();
  const jitter = (Math.random() - 0.48); // slight drift
  
  // CPU fluctuation
  let newCpu = Math.min(99, Math.max(2, device.metrics.cpuUsage + jitter * 4));
  // If device is in warning state, keep it higher
  if (device.status === 'warning' && device.id === 'dev-gpon-olt-zte') {
    newCpu = Math.min(96, Math.max(82, newCpu));
  }
  newCpu = Number(newCpu.toFixed(1));

  // Cores
  const newCores = device.metrics.cpuCores.map(core => {
    const cJitter = (Math.random() - 0.5) * 6;
    return Math.min(100, Math.max(1, Math.round(newCpu + cJitter)));
  });

  // RAM
  const ramDelta = (Math.random() - 0.5) * 8;
  const newRamUsed = Math.min(device.metrics.ramTotalMb, Math.max(50, Math.round(device.metrics.ramUsedMb + ramDelta)));

  // Ping Latency
  const newLatency = Number(Math.max(0.4, device.metrics.pingLatencyMs + (Math.random() - 0.5) * 0.8).toFixed(1));
  const newTemp = Number((device.metrics.temperatureCelsius + (Math.random() - 0.5) * 0.3).toFixed(1));

  // Update Interfaces Traffic & History
  const updatedInterfaces = device.interfaces.map(iface => {
    if (iface.operStatus === 'down') {
      return {
        ...iface,
        currentRxMbps: 0,
        currentTxMbps: 0,
        utilizationPercent: 0,
        history: [...iface.history.slice(1), { timestamp: now, rxMbps: 0, txMbps: 0 }],
      };
    }

    const trafficFluctuation = (Math.random() - 0.49) * 0.12;
    const newRx = Number(Math.max(0.1, iface.currentRxMbps * (1 + trafficFluctuation)).toFixed(1));
    const newTx = Number(Math.max(0.1, iface.currentTxMbps * (1 + trafficFluctuation)).toFixed(1));
    const maxThroughput = Math.max(newRx, newTx);
    const util = Number(Math.min(100, (maxThroughput / iface.speedMbps) * 100).toFixed(1));

    // Octets accumulation (5 seconds of data)
    const rxBytesDelta = Math.round((newRx * 1024 * 1024 / 8) * (device.pollIntervalSec || 3));
    const txBytesDelta = Math.round((newTx * 1024 * 1024 / 8) * (device.pollIntervalSec || 3));

    const newHistory = [
      ...iface.history.slice(1),
      { timestamp: now, rxMbps: newRx, txMbps: newTx },
    ];

    return {
      ...iface,
      currentRxMbps: newRx,
      currentTxMbps: newTx,
      rxTotalBytes: iface.rxTotalBytes + rxBytesDelta,
      txTotalBytes: iface.txTotalBytes + txBytesDelta,
      utilizationPercent: util,
      history: newHistory,
    };
  });

  const newSysHistory = [
    ...device.metrics.history.slice(1),
    {
      timestamp: now,
      cpu: newCpu,
      ram: Number(((newRamUsed / device.metrics.ramTotalMb) * 100).toFixed(1)),
      latency: newLatency,
      temp: newTemp,
    },
  ];

  return {
    ...device,
    lastSeen: now,
    metrics: {
      ...device.metrics,
      cpuUsage: newCpu,
      cpuCores: newCores,
      ramUsedMb: newRamUsed,
      temperatureCelsius: newTemp,
      pingLatencyMs: newLatency,
      uptimeSeconds: device.metrics.uptimeSeconds + (device.pollIntervalSec || 3),
      history: newSysHistory,
    },
    interfaces: updatedInterfaces,
  };
}
