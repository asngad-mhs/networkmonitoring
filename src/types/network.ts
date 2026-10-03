export type DeviceVendor = 
  | 'mikrotik' 
  | 'cisco' 
  | 'huawei' 
  | 'ubiquiti' 
  | 'ruijie'
  | 'reyee'
  | 'openwrt'
  | 'linksys'
  | 'juniper' 
  | 'linux' 
  | 'generic';

export type DeviceType = 
  | 'router' 
  | 'switch' 
  | 'server' 
  | 'access_point' 
  | 'firewall' 
  | 'olt' 
  | 'gateway';

export type DeviceStatus = 'online' | 'warning' | 'critical' | 'offline';

export type SnmpVersion = 'v1' | 'v2c' | 'v3';

export type SnmpV3AuthProtocol = 'MD5' | 'SHA' | 'SHA256' | 'None';
export type SnmpV3PrivProtocol = 'DES' | 'AES' | 'AES128' | 'AES256' | 'None';
export type SnmpV3SecurityLevel = 'noAuthNoPriv' | 'authNoPriv' | 'authPriv';

export interface SnmpConfig {
  version: SnmpVersion;
  port: number;
  community: string;
  timeoutMs: number;
  retries: number;
  // SNMP v3 specific
  username?: string;
  securityLevel?: SnmpV3SecurityLevel;
  authProtocol?: SnmpV3AuthProtocol;
  authPassword?: string;
  privProtocol?: SnmpV3PrivProtocol;
  privPassword?: string;
  // LuCI JSON-RPC specific (OpenWrt / Linksys)
  rpcEnabled?: boolean;
  rpcPath?: string; // e.g. "/cgi-bin/luci/rpc/"
  rpcUsername?: string;
  rpcPassword?: string;
  rpcAuthToken?: string;
}

export interface OpenWrtWifiStation {
  mac: string;
  ip?: string;
  hostname?: string;
  signalDbm: number;
  noiseDbm: number;
  rxRateMbps: number;
  txRateMbps: number;
  connectedTimeSec: number;
  interfaceName: string; // e.g. "wlan0", "phy0-ap0"
}

export interface OpenWrtSqmStatus {
  enabled: boolean;
  interface: string;
  qdisc: 'cake' | 'fq_codel' | 'pie';
  downloadKbit: number;
  uploadKbit: number;
  droppedPackets: number;
  backlogBytes: number;
}

export interface OpenWrtNeighbor {
  ip: string;
  mac: string;
  device: string;
  state: string; // "REACHABLE", "STALE", "DELAY"
}

export interface NetworkInterface {
  id: string;
  name: string; // e.g., ether1, GigabitEthernet0/1, eth0
  alias?: string; // e.g., "UPLINK-ISP-INDOSAT", "TRUNK-TO-SW-CORE"
  type: 'ethernet' | 'sfp' | 'sfp_plus' | 'wireless' | 'bridge' | 'vlan' | 'bonding' | 'loopback';
  adminStatus: 'up' | 'down';
  operStatus: 'up' | 'down';
  macAddress: string;
  ipAddress?: string;
  speedMbps: number; // e.g., 1000 for 1Gbps, 10000 for 10Gbps
  duplex: 'full' | 'half' | 'auto';
  mtu: number;
  // Live Metrics
  currentRxMbps: number; // Download / Inbound
  currentTxMbps: number; // Upload / Outbound
  rxTotalBytes: number;
  txTotalBytes: number;
  rxErrors: number;
  txErrors: number;
  rxDrops: number;
  txDrops: number;
  utilizationPercent: number; // 0-100%
  history: {
    timestamp: number;
    rxMbps: number;
    txMbps: number;
  }[];
}

export interface SystemMetrics {
  cpuUsage: number; // 0-100%
  cpuCores: number[]; // Per-core CPU %
  ramUsedMb: number;
  ramTotalMb: number;
  storageUsedGb: number;
  storageTotalGb: number;
  temperatureCelsius: number;
  fanRpm?: number;
  voltageVolts?: number;
  uptimeSeconds: number;
  pingLatencyMs: number;
  packetLossPercent: number;
  jitterMs: number;
  activeConnections: number;
  loadAverage: [number, number, number]; // 1m, 5m, 15m
  history: {
    timestamp: number;
    cpu: number;
    ram: number;
    latency: number;
    temp: number;
  }[];
}

export interface NetworkDevice {
  id: string;
  name: string;
  ipAddress: string;
  vendor: DeviceVendor;
  type: DeviceType;
  model: string;
  osVersion: string;
  location: string;
  rackPosition?: string;
  status: DeviceStatus;
  lastSeen: number; // timestamp
  pollIntervalSec: number;
  snmp: SnmpConfig;
  sysContact?: string;
  sysLocation?: string;
  sysDescr?: string;
  interfaces: NetworkInterface[];
  metrics: SystemMetrics;
  // Node coordinates for topology
  topologyPosition?: {
    x: number;
    y: number;
  };
}

export interface TopologyLink {
  id: string;
  sourceDeviceId: string;
  sourceInterfaceId: string;
  targetDeviceId: string;
  targetInterfaceId: string;
  capacityMbps: number;
  status: 'active' | 'degraded' | 'down';
  label?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  metricType: 'cpu' | 'ram' | 'bandwidth' | 'latency' | 'packet_loss' | 'temperature' | 'interface_status';
  condition: '>' | '<' | '==';
  thresholdValue: number;
  durationSec: number;
  severity: 'critical' | 'warning' | 'info';
  targetDeviceIds: string[]; // empty means all devices
  targetInterfaceId?: string;
  description: string;
}

export interface IncidentAlert {
  id: string;
  ruleId?: string;
  deviceId: string;
  deviceName: string;
  deviceIp: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metricValue?: string;
  threshold?: string;
  timestamp: number;
  resolvedAt?: number;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  notes?: string;
}

export interface NotificationSettings {
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  discordEnabled: boolean;
  discordWebhookUrl: string;
  emailEnabled: boolean;
  emailRecipient: string;
  soundAlerts: boolean;
  browserNotifications: boolean;
  minSeverityForAlert: 'info' | 'warning' | 'critical';
}

export interface SnmpWalkResult {
  oid: string;
  name: string;
  type: 'Integer' | 'Counter32' | 'Counter64' | 'OctetString' | 'TimeTicks' | 'IpAddress' | 'Gauge32';
  value: string;
  description: string;
}

export interface SubnetScanResult {
  ip: string;
  hostname?: string;
  status: 'online' | 'offline' | 'snmp_ready';
  vendor?: DeviceVendor;
  model?: string;
  snmpVersion?: SnmpVersion;
  sysDescr?: string;
  responseTimeMs: number;
  openPorts: number[];
}
