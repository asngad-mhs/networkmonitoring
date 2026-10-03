import React from 'react';
import { NetworkDevice, IncidentAlert } from '../../types/network';
import { BandwidthLiveChart } from './BandwidthLiveChart';
import { SystemResourceChart } from './SystemResourceChart';
import { VendorBadge } from './VendorBadge';
import { formatBandwidth, formatUptime } from '../../services/snmpEngine';
import { 
  Activity, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Server, 
  ShieldAlert, 
  Wifi, 
  Radio, 
  Cpu, 
  Thermometer, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Zap
} from 'lucide-react';

interface NocOverviewProps {
  devices: NetworkDevice[];
  incidents: IncidentAlert[];
  onSelectDevice: (device: NetworkDevice) => void;
  onNavigateToAlerts: () => void;
  onNavigateToTopology: () => void;
  onNavigateToSpeedtest: () => void;
}

export const NocOverview: React.FC<NocOverviewProps> = ({
  devices,
  incidents,
  onSelectDevice,
  onNavigateToAlerts,
  onNavigateToTopology,
  onNavigateToSpeedtest,
}) => {
  // Aggregate Metrics Calculations
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const warningCount = devices.filter(d => d.status === 'warning').length;
  const criticalCount = devices.filter(d => d.status === 'critical').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  const totalRx = devices.reduce((sum, d) => sum + d.interfaces.reduce((iSum, i) => iSum + i.currentRxMbps, 0), 0);
  const totalTx = devices.reduce((sum, d) => sum + d.interfaces.reduce((iSum, i) => iSum + i.currentTxMbps, 0), 0);

  const avgCpu = devices.length > 0
    ? Number((devices.reduce((sum, d) => sum + d.metrics.cpuUsage, 0) / devices.length).toFixed(1))
    : 0;

  const avgLatency = devices.length > 0
    ? Number((devices.reduce((sum, d) => sum + d.metrics.pingLatencyMs, 0) / devices.length).toFixed(1))
    : 0;

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');

  // Aggregated history points (sum of all device interface histories)
  const aggregatedHistory = (() => {
    if (devices.length === 0 || devices[0].interfaces.length === 0) return [];
    const pointsCount = devices[0].interfaces[0].history.length;
    const list = [];
    for (let i = 0; i < pointsCount; i++) {
      let sumRx = 0;
      let sumTx = 0;
      let ts = Date.now();
      devices.forEach(d => {
        d.interfaces.forEach(iface => {
          if (iface.history[i]) {
            sumRx += iface.history[i].rxMbps;
            sumTx += iface.history[i].txMbps;
            ts = iface.history[i].timestamp;
          }
        });
      });
      list.push({
        timestamp: ts,
        rxMbps: Number(sumRx.toFixed(1)),
        txMbps: Number(sumTx.toFixed(1)),
      });
    }
    return list;
  })();

  // Aggregated System history
  const aggregatedSysHistory = (() => {
    if (devices.length === 0) return [];
    const count = devices[0].metrics.history.length;
    const list = [];
    for (let i = 0; i < count; i++) {
      let sumCpu = 0;
      let sumRam = 0;
      let sumLatency = 0;
      let sumTemp = 0;
      let ts = Date.now();
      devices.forEach(d => {
        if (d.metrics.history[i]) {
          sumCpu += d.metrics.history[i].cpu;
          sumRam += d.metrics.history[i].ram;
          sumLatency += d.metrics.history[i].latency;
          sumTemp += d.metrics.history[i].temp;
          ts = d.metrics.history[i].timestamp;
        }
      });
      list.push({
        timestamp: ts,
        cpu: Number((sumCpu / devices.length).toFixed(1)),
        ram: Number((sumRam / devices.length).toFixed(1)),
        latency: Number((sumLatency / devices.length).toFixed(1)),
        temp: Number((sumTemp / devices.length).toFixed(1)),
      });
    }
    return list;
  })();

  const totalRamUsed = devices.reduce((sum, d) => sum + d.metrics.ramUsedMb, 0);
  const totalRamCap = devices.reduce((sum, d) => sum + d.metrics.ramTotalMb, 0);
  const avgTemp = Number((devices.reduce((sum, d) => sum + d.metrics.temperatureCelsius, 0) / (devices.length || 1)).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Active Incident Warning Ticker Banner */}
      {activeIncidents.length > 0 && (
        <div
          onClick={onNavigateToAlerts}
          className="cursor-pointer bg-rose-950/70 border border-rose-800/80 hover:border-rose-700 p-3 rounded-lg flex items-center justify-between gap-3 shadow-lg shadow-rose-950/20 transition-colors group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-xs font-bold text-rose-200 uppercase tracking-wide font-mono shrink-0">
              {activeIncidents.length} Insiden Aktif:
            </span>
            <span className="text-xs text-rose-100 font-medium truncate">
              {activeIncidents[0].deviceName} - {activeIncidents[0].title} ({activeIncidents[0].message})
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-rose-300 group-hover:text-white shrink-0 font-mono">
            <span>Tinjau Gangguan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Fleet Health & Device Count */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Status Armada Node
            </span>
            <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-cyan-400">
              <Server className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {devices.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">Perangkat Dimonitor</span>
            </div>

            <div className="flex items-center gap-2 mt-2 text-[11px] font-mono">
              <span className="text-emerald-400 font-semibold">{onlineCount} Online</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400 font-semibold">{warningCount} Warning</span>
              {criticalCount > 0 && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-rose-400 font-semibold">{criticalCount} Critical</span>
                </>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Health SLA Index</span>
            <strong className="text-emerald-400 font-mono">98.4% Nominal</strong>
          </div>
        </div>

        {/* KPI 2: Total Aggregate Throughput */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Traffic Jaringan
            </span>
            <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {formatBandwidth(totalRx)}
              </span>
              <span className="text-xs text-slate-400 font-mono">Rx Total</span>
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-cyan-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Tx Outbound: <strong>{formatBandwidth(totalTx)}</strong></span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Aggregated Link Capacity</span>
            <strong className="text-slate-200 font-mono">140 Gbps Backhaul</strong>
          </div>
        </div>

        {/* KPI 3: Fleet Average CPU Utilization */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Rata-rata Beban CPU
            </span>
            <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-cyan-400">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono tabular-nums ${avgCpu > 75 ? 'text-rose-400' : 'text-slate-100'}`}>
                {avgCpu}%
              </span>
              <span className="text-xs text-slate-400">Fleet Average</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${avgCpu > 75 ? 'bg-rose-500' : avgCpu > 50 ? 'bg-amber-500' : 'bg-cyan-400'}`}
                style={{ width: `${avgCpu}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Suhu Rata-rata Chassis</span>
            <strong className="text-amber-300 font-mono">{avgTemp}°C</strong>
          </div>
        </div>

        {/* KPI 4: Ping Latency & Quality */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Latensi Backbone ICMP
            </span>
            <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-indigo-400">
              <Wifi className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">
                {avgLatency} ms
              </span>
              <span className="text-xs text-emerald-400 font-mono font-semibold">0% Loss</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              Jitter RTT: <strong className="text-slate-200 font-mono">0.4 ms</strong> (Sangat Stabil)
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <button onClick={onNavigateToSpeedtest} className="text-cyan-400 hover:underline flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Jalankan Speedtest</span>
            </button>
            <span className="text-slate-500 font-mono">Tier-1 POP</span>
          </div>
        </div>
      </div>

      {/* Main Real-Time Charts (2 Columns: Fleet Bandwidth + Fleet System Resources) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <BandwidthLiveChart
            title="Total Real-Time Internet Bandwidth (Aggregated Fleet)"
            subtitle="Agregasi real-time seluruh interface uplink ISP & transit backbone via SNMP 64-bit counter"
            data={aggregatedHistory}
            height={230}
          />
        </div>

        <div className="lg:col-span-1">
          <SystemResourceChart
            history={aggregatedSysHistory}
            cpuUsage={avgCpu}
            ramUsedMb={totalRamUsed}
            ramTotalMb={totalRamCap}
            temperatureCelsius={avgTemp}
            pingLatencyMs={avgLatency}
            packetLossPercent={0}
          />
        </div>
      </div>

      {/* Real-time Multi-Vendor Device Monitoring Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 tracking-tight">
              Status Perangkat & Live Interface Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Klik kartu perangkat untuk membuka konsol diagnostik detail dan statistik port fisik
            </p>
          </div>

          <button
            onClick={onNavigateToTopology}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Buka Diagram Topologi Visual</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => {
            const devRx = device.interfaces.reduce((sum, i) => sum + i.currentRxMbps, 0);
            const devTx = device.interfaces.reduce((sum, i) => sum + i.currentTxMbps, 0);

            return (
              <div
                key={device.id}
                onClick={() => onSelectDevice(device)}
                className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/20 group flex flex-col justify-between"
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            device.status === 'online'
                              ? 'bg-emerald-400'
                              : device.status === 'warning'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-rose-500 animate-pulse'
                          }`}
                        />
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors truncate max-w-[160px]">
                          {device.name}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        {device.ipAddress} · <span className="text-slate-500 font-sans">{device.location}</span>
                      </span>
                    </div>

                    <VendorBadge vendor={device.vendor} size="sm" />
                  </div>

                  {/* Device Specs & Metrics */}
                  <div className="grid grid-cols-3 gap-2 my-3 text-[11px] font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px]">CPU LOAD</span>
                      <strong className={device.metrics.cpuUsage > 80 ? 'text-rose-400' : 'text-slate-200'}>
                        {device.metrics.cpuUsage}%
                      </strong>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px]">TEMPERATUR</span>
                      <strong className="text-amber-300">
                        {device.metrics.temperatureCelsius}°C
                      </strong>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px]">PING RTT</span>
                      <strong className="text-cyan-300">
                        {device.metrics.pingLatencyMs}ms
                      </strong>
                    </div>
                  </div>

                  {/* Interfaces Active Stream */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Live Traffic ({device.interfaces.length} Ports)</span>
                      <span>SNMP {device.snmp.version}</span>
                    </div>

                    <div className="p-2 bg-slate-950/70 rounded border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>{formatBandwidth(devRx)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-cyan-400 font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>{formatBandwidth(devTx)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Up: {formatUptime(device.metrics.uptimeSeconds)}</span>
                  <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
                    Inspect <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
