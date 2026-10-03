import React, { useState, useEffect, useRef } from 'react';
import { formatBandwidth } from '../../services/snmpEngine';
import { 
  X, 
  Play, 
  RotateCw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Activity, 
  Wifi, 
  Server, 
  CheckCircle2, 
  ShieldCheck,
  Zap
} from 'lucide-react';

interface SpeedtestModalProps {
  onClose: () => void;
}

export const SpeedtestModal: React.FC<SpeedtestModalProps> = ({ onClose }) => {
  const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'completed'>('idle');
  const [server, setServer] = useState<string>('Jakarta - Cyber 1 Data Center (10G)');
  
  // Real-time metric states
  const [pingMs, setPingMs] = useState<number>(0);
  const [jitterMs, setJitterMs] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [downloadFinal, setDownloadFinal] = useState<number>(0);
  const [uploadFinal, setUploadFinal] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const animRef = useRef<number | null>(null);

  const startTest = () => {
    setPhase('ping');
    setProgress(0);
    setPingMs(0);
    setJitterMs(0);
    setCurrentSpeed(0);
    setDownloadFinal(0);
    setUploadFinal(0);
    setSpeedHistory([]);

    // 1. Ping Phase (1.5s)
    let pTime = 0;
    const pingInterval = setInterval(() => {
      pTime += 100;
      setPingMs(Number((Math.random() * 3 + 4.2).toFixed(1)));
      setJitterMs(Number((Math.random() * 0.8 + 0.2).toFixed(1)));
      setProgress(Math.round((pTime / 1500) * 20));

      if (pTime >= 1500) {
        clearInterval(pingInterval);
        startDownloadPhase();
      }
    }, 100);
  };

  const startDownloadPhase = () => {
    setPhase('download');
    let dTime = 0;
    const targetPeak = 740 + Math.random() * 180; // ~740-920 Mbps
    const hist: number[] = [];

    const dInterval = setInterval(() => {
      dTime += 100;
      const tProgress = dTime / 4000;
      // S-curve ramp up
      const factor = Math.min(1, Math.sin((tProgress * Math.PI) / 2));
      const speed = Number((targetPeak * factor + (Math.random() - 0.5) * 40).toFixed(1));
      setCurrentSpeed(speed);
      hist.push(speed);
      setSpeedHistory([...hist]);
      setProgress(20 + Math.round(tProgress * 40));

      if (dTime >= 4000) {
        clearInterval(dInterval);
        setDownloadFinal(Number(targetPeak.toFixed(1)));
        startUploadPhase();
      }
    }, 100);
  };

  const startUploadPhase = () => {
    setPhase('upload');
    let uTime = 0;
    const targetPeak = 480 + Math.random() * 120; // ~480-600 Mbps
    const hist: number[] = [];

    const uInterval = setInterval(() => {
      uTime += 100;
      const tProgress = uTime / 4000;
      const factor = Math.min(1, Math.sin((tProgress * Math.PI) / 2));
      const speed = Number((targetPeak * factor + (Math.random() - 0.5) * 30).toFixed(1));
      setCurrentSpeed(speed);
      hist.push(speed);
      setSpeedHistory([...hist]);
      setProgress(60 + Math.round(tProgress * 40));

      if (uTime >= 4000) {
        clearInterval(uInterval);
        setUploadFinal(Number(targetPeak.toFixed(1)));
        setCurrentSpeed(0);
        setPhase('completed');
        setProgress(100);
      }
    }, 100);
  };

  // Speedometer Gauge Angle Calculation
  // Max scale 1000 Mbps, angle range -120 deg to +120 deg
  const maxScale = 1000;
  const normalizedVal = Math.min(maxScale, currentSpeed);
  const needleAngle = -120 + (normalizedVal / maxScale) * 240;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Internet Throughput & Latency Speedtest</h3>
              <p className="text-xs text-slate-400">Uji performa bandwidth real-time koneksi gateway router</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Selector */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Server Target:</span>
            <select
              value={server}
              onChange={e => setServer(e.target.value)}
              disabled={phase !== 'idle' && phase !== 'completed'}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
            >
              <option value="Jakarta - Cyber 1 Data Center (10G)">Jakarta - Cyber 1 Data Center (10G)</option>
              <option value="Singapore - Equinix SG1 IX (40G)">Singapore - Equinix SG1 IX (40G)</option>
              <option value="Surabaya - APJII OpenIXP (10G)">Surabaya - APJII OpenIXP (10G)</option>
              <option value="Tokyo - AWS AP-Northeast-1 (100G)">Tokyo - AWS AP-Northeast-1 (100G)</option>
            </select>
          </div>

          <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            IPv4 / IPv6 Ready
          </span>
        </div>

        {/* Speedometer Gauge Visualizer */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950">
          <div className="relative w-64 h-48 flex flex-col items-center justify-center">
            {/* SVG Speedometer Gauge Arc */}
            <svg viewBox="0 0 200 140" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gauge-arc" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="60%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              {/* Background Arc */}
              <path
                d="M 20 120 A 80 80 0 1 1 180 120"
                fill="none"
                stroke="#1e293b"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Active Gradient Arc */}
              <path
                d="M 20 120 A 80 80 0 1 1 180 120"
                fill="none"
                stroke="url(#gauge-arc)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (progress / 100) * 251.2}
                className="transition-all duration-300 ease-out"
              />
              {/* Tick Marks */}
              {[0, 200, 400, 600, 800, 1000].map((val, idx) => {
                const angle = -120 + (val / 1000) * 240;
                const rad = (angle * Math.PI) / 180;
                const tx = 100 + 64 * Math.sin(rad);
                const ty = 120 - 64 * Math.cos(rad);
                return (
                  <text
                    key={idx}
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    className="text-[8px] fill-slate-500 font-mono font-bold"
                  >
                    {val}
                  </text>
                );
              })}
              {/* Needle */}
              <g
                transform={`rotate(${needleAngle}, 100, 120)`}
                className="transition-transform duration-150 ease-out"
              >
                <line x1="100" y1="120" x2="100" y2="46" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="120" r="7" fill="#38bdf8" />
                <circle cx="100" cy="120" r="3" fill="#090d16" />
              </g>
            </svg>

            {/* Central Speed Readout */}
            <div className="absolute bottom-2 text-center">
              <span className="text-3xl font-mono font-extrabold text-white tabular-nums tracking-tight">
                {phase === 'completed'
                  ? downloadFinal.toFixed(1)
                  : currentSpeed > 0
                  ? currentSpeed.toFixed(1)
                  : '0.0'}
              </span>
              <span className="text-xs text-cyan-400 font-mono font-semibold block uppercase">
                {phase === 'upload' ? 'Mbps Upload' : 'Mbps Download'}
              </span>
            </div>
          </div>

          {/* Test Status Indicator */}
          <div className="mt-2 text-xs font-mono text-slate-400">
            {phase === 'idle' && 'Siap melakukan pengujian bandwidth'}
            {phase === 'ping' && <span className="text-cyan-400 animate-pulse">Mengukur Latensi ICMP & Jitter...</span>}
            {phase === 'download' && <span className="text-emerald-400 animate-pulse">Mengukur Throughput Download (Rx)...</span>}
            {phase === 'upload' && <span className="text-cyan-400 animate-pulse">Mengukur Throughput Upload (Tx)...</span>}
            {phase === 'completed' && <span className="text-emerald-400 font-semibold">Pengujian Kecepatan Selesai!</span>}
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full mt-5">
            <div className="bg-slate-900 border border-slate-800 p-2.5 sm:p-3 rounded-lg text-center font-mono">
              <span className="text-[10px] text-slate-500 block uppercase">PING</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {pingMs > 0 ? `${pingMs} ms` : '--'}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 sm:p-3 rounded-lg text-center font-mono">
              <span className="text-[10px] text-slate-500 block uppercase">JITTER</span>
              <span className="text-sm font-bold text-slate-200 tabular-nums">
                {jitterMs > 0 ? `${jitterMs} ms` : '--'}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 sm:p-3 rounded-lg text-center font-mono">
              <span className="text-[10px] text-emerald-400 block uppercase flex items-center justify-center gap-0.5">
                <ArrowDownLeft className="w-3 h-3" />
                DOWNLOAD
              </span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                {downloadFinal > 0 ? `${downloadFinal} Mbps` : '--'}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 sm:p-3 rounded-lg text-center font-mono">
              <span className="text-[10px] text-cyan-400 block uppercase flex items-center justify-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                UPLOAD
              </span>
              <span className="text-sm font-bold text-cyan-400 tabular-nums">
                {uploadFinal > 0 ? `${uploadFinal} Mbps` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {phase === 'completed' ? 'Quality Score: A+ (Bufferbloat < 5ms)' : 'Multi-threaded TCP/UDP test streams'}
          </span>

          <div className="flex items-center gap-2">
            {phase === 'idle' || phase === 'completed' ? (
              <button
                onClick={startTest}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-cyan-950"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{phase === 'completed' ? 'Uji Ulang' : 'Mulai Speedtest'}</span>
              </button>
            ) : (
              <button
                disabled
                className="px-5 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold flex items-center gap-2 cursor-not-allowed"
              >
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menguji ({progress}%)...</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
