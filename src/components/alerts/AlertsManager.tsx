import React, { useState } from 'react';
import { IncidentAlert, AlertRule, NotificationSettings } from '../../types/network';
import { sendTelegramAlert, sendDiscordAlert, playAlertSound } from '../../services/notificationService';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Sliders, 
  Volume2, 
  MessageSquare, 
  Flame, 
  FileText,
  Clock,
  Plus,
  Trash2,
  Check
} from 'lucide-react';

interface AlertsManagerProps {
  incidents: IncidentAlert[];
  alertRules: AlertRule[];
  notificationSettings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
  onAcknowledgeIncident: (incidentId: string, notes: string) => void;
  onResolveIncident: (incidentId: string) => void;
  onAddAlertRule: (rule: AlertRule) => void;
  onToggleRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({
  incidents,
  alertRules,
  notificationSettings,
  onUpdateSettings,
  onAcknowledgeIncident,
  onResolveIncident,
  onAddAlertRule,
  onToggleRule,
  onDeleteRule,
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'rules' | 'channels'>('incidents');
  const [testStatus, setTestStatus] = useState<{ channel: string; msg: string; success?: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [ackModalId, setAckModalId] = useState<string | null>(null);
  const [ackNotes, setAckNotes] = useState<string>('');

  // New Rule form state
  const [showAddRule, setShowAddRule] = useState<boolean>(false);
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newMetricType, setNewMetricType] = useState<AlertRule['metricType']>('cpu');
  const [newThreshold, setNewThreshold] = useState<number>(80);
  const [newSeverity, setNewSeverity] = useState<AlertRule['severity']>('warning');

  const handleTestTelegram = async () => {
    setIsTesting(true);
    setTestStatus({ channel: 'telegram', msg: 'Mengirim notifikasi tes ke Telegram...' });
    
    const sampleAlert: IncidentAlert = {
      id: 'test-tg',
      deviceId: 'dev-test',
      deviceName: 'ROUTER-TEST-TELEGRAM',
      deviceIp: '192.168.1.1',
      severity: 'warning',
      title: 'Uji Coba Sistem Notifikasi Telegram',
      message: 'Ini adalah pesan verifikasi webhook notifikasi otomatis NetPulse NOC.',
      metricValue: 'CPU 88.5%',
      threshold: '> 85.0%',
      timestamp: Date.now(),
      status: 'active',
    };

    const res = await sendTelegramAlert(notificationSettings, sampleAlert);
    setIsTesting(false);
    setTestStatus({ channel: 'telegram', msg: res.message, success: res.success });
  };

  const handleTestDiscord = async () => {
    setIsTesting(true);
    setTestStatus({ channel: 'discord', msg: 'Mengirim notifikasi tes ke Discord...' });

    const sampleAlert: IncidentAlert = {
      id: 'test-dc',
      deviceId: 'dev-test',
      deviceName: 'SWITCH-TEST-DISCORD',
      deviceIp: '192.168.1.2',
      severity: 'critical',
      title: 'Uji Coba Sistem Notifikasi Discord Webhook',
      message: 'Integrasi Discord Webhook NetPulse beroperasi dengan normal.',
      metricValue: 'Loss 3.2%',
      threshold: '> 1.0%',
      timestamp: Date.now(),
      status: 'active',
    };

    const res = await sendDiscordAlert(notificationSettings, sampleAlert);
    setIsTesting(false);
    setTestStatus({ channel: 'discord', msg: res.message, success: res.success });
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName) return;
    const rule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      enabled: true,
      metricType: newMetricType,
      condition: '>',
      thresholdValue: Number(newThreshold),
      durationSec: 15,
      severity: newSeverity,
      targetDeviceIds: [],
      description: `Pemicu otomatis ketika nilai metrik ${newMetricType} melebihi ambang batas ${newThreshold}.`,
    };
    onAddAlertRule(rule);
    setShowAddRule(false);
    setNewRuleName('');
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Manajemen Insiden & Notifikasi Otomatis</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pantau gangguan jaringan secara real-time dan konfigurasikan broadcast notifikasi ke Telegram & Discord.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'incidents'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Insiden Aktif ({incidents.filter(i => i.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'rules'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Aturan Alert ({alertRules.length})
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'channels'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kanal Notifikasi
          </button>
        </div>
      </div>

      {/* 1. Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200">Daftar Insiden & Peringatan Terdeteksi</h3>
            <span className="text-xs font-mono text-slate-500">
              Total {incidents.length} Catatan Kejadian
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {incidents.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-300">Semua sistem dan perangkat beroperasi normal</p>
                <span className="text-[11px] text-slate-600">Tidak ada gangguan jaringan aktif</span>
              </div>
            ) : (
              incidents.map(inc => {
                const isResolved = inc.status === 'resolved';
                const isAck = inc.status === 'acknowledged';

                return (
                  <div
                    key={inc.id}
                    className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      isResolved ? 'bg-slate-950/40 opacity-60' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          inc.severity === 'critical'
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                            : inc.severity === 'warning'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                            : 'bg-blue-950/80 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {inc.severity === 'critical' ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-100">{inc.title}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-300">
                            {inc.deviceName} ({inc.deviceIp})
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded font-mono uppercase ${
                              isResolved
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : isAck
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                            }`}
                          >
                            {inc.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300">{inc.message}</p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                          {inc.metricValue && (
                            <span>Metrik: <strong className="text-slate-200">{inc.metricValue}</strong></span>
                          )}
                          <span>Waktu: {new Date(inc.timestamp).toLocaleTimeString('id-ID')} WIB</span>
                          {inc.acknowledgedBy && (
                            <span className="text-blue-300">Ack: {inc.acknowledgedBy}</span>
                          )}
                        </div>

                        {inc.notes && (
                          <div className="text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 font-sans mt-1">
                            <strong>Catatan NOC:</strong> {inc.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {!isResolved && !isAck && (
                        <button
                          onClick={() => {
                            setAckModalId(inc.id);
                            setAckNotes('');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      {!isResolved && (
                        <button
                          onClick={() => onResolveIncident(inc.id)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300">Daftar Ambang Batas Trigger Otomatis</h3>
            <button
              onClick={() => setShowAddRule(!showAddRule)}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Aturan Baru</span>
            </button>
          </div>

          {showAddRule && (
            <form onSubmit={handleCreateRule} className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-white">Konfigurasi Aturan Alert Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Nama Aturan</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. High RAM Consumption"
                    value={newRuleName}
                    onChange={e => setNewRuleName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Jenis Metrik</label>
                  <select
                    value={newMetricType}
                    onChange={e => setNewMetricType(e.target.value as AlertRule['metricType'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="cpu">CPU Usage (%)</option>
                    <option value="ram">RAM Usage (%)</option>
                    <option value="temperature">Temperatur (°C)</option>
                    <option value="latency">Ping Latency (ms)</option>
                    <option value="packet_loss">Packet Loss (%)</option>
                    <option value="bandwidth">Bandwidth (Mbps)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Ambang Batas Nilai (&gt;)</label>
                  <input
                    type="number"
                    required
                    value={newThreshold}
                    onChange={e => setNewThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tingkat Keparahan</label>
                  <select
                    value={newSeverity}
                    onChange={e => setNewSeverity(e.target.value as AlertRule['severity'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="warning">Warning (Peringatan)</option>
                    <option value="critical">Critical (Kritis)</option>
                    <option value="info">Info (Informasi)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRule(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                >
                  Simpan Aturan
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alertRules.map(rule => (
              <div
                key={rule.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-start justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rule.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                    />
                    <h4 className="text-xs font-bold text-slate-100">{rule.name}</h4>
                    <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
                      {rule.metricType.toUpperCase()} &gt; {rule.thresholdValue}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{rule.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onToggleRule(rule.id)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                      rule.enabled
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {rule.enabled ? 'ACTIVE' : 'MUTED'}
                  </button>
                  <button
                    onClick={() => onDeleteRule(rule.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Notification Channels Config Tab */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Telegram Settings */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Telegram Bot Gateway</h3>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.telegramEnabled}
                  onChange={e => onUpdateSettings({ ...notificationSettings, telegramEnabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Aktifkan</span>
              </label>
            </div>

            <p className="text-xs text-slate-400">
              Kirim peringatan outage langsung ke grup NOC Telegram atau akun administrator secara instan via API Telegram.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Telegram Bot Token</label>
                <input
                  type="password"
                  value={notificationSettings.telegramBotToken}
                  onChange={e => onUpdateSettings({ ...notificationSettings, telegramBotToken: e.target.value })}
                  placeholder="e.g. 123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Telegram Chat ID / Group ID</label>
                <input
                  type="text"
                  value={notificationSettings.telegramChatId}
                  onChange={e => onUpdateSettings({ ...notificationSettings, telegramChatId: e.target.value })}
                  placeholder="e.g. -1001234567890 atau @channel_noc"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleTestTelegram}
                  disabled={isTesting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Notifikasi Uji Coba Telegram</span>
                </button>
              </div>
            </div>
          </div>

          {/* Discord Webhook Settings */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Discord Webhook Gateway</h3>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.discordEnabled}
                  onChange={e => onUpdateSettings({ ...notificationSettings, discordEnabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Aktifkan</span>
              </label>
            </div>

            <p className="text-xs text-slate-400">
              Broadcast rich embed incident cards ke channel Discord server NOC Anda.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Discord Webhook URL</label>
                <input
                  type="password"
                  value={notificationSettings.discordWebhookUrl}
                  onChange={e => onUpdateSettings({ ...notificationSettings, discordWebhookUrl: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Ambang Batas Minimum Broadcast</label>
                <select
                  value={notificationSettings.minSeverityForAlert}
                  onChange={e => onUpdateSettings({ ...notificationSettings, minSeverityForAlert: e.target.value as 'info' | 'warning' | 'critical' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="critical">Hanya Insiden Kritis (Critical)</option>
                  <option value="warning">Peringatan & Kritis (Warning + Critical)</option>
                  <option value="info">Semua Notifikasi (Info, Warning, Critical)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleTestDiscord}
                  disabled={isTesting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Notifikasi Uji Coba Discord</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Status Toast / Alert Banner */}
      {testStatus && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            testStatus.success === true
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              : testStatus.success === false
              ? 'bg-rose-950/80 border-rose-800 text-rose-300'
              : 'bg-slate-900 border-slate-700 text-slate-300'
          }`}
        >
          <span>{testStatus.msg}</span>
          <button onClick={() => setTestStatus(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Acknowledge Incident Modal */}
      {ackModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 w-full max-w-md space-y-4">
            <h4 className="text-sm font-bold text-white">Acknowledge Insiden Gangguan</h4>
            <p className="text-xs text-slate-400">
              Masukkan catatan tindakan awal atau identitas engineer yang menangani gangguan ini:
            </p>
            <textarea
              rows={3}
              value={ackNotes}
              onChange={e => setAckNotes(e.target.value)}
              placeholder="Contoh: Sedang dilakukan pengecekan kabel patch SFP di Rak Distribution B02..."
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setAckModalId(null)}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onAcknowledgeIncident(ackModalId, ackNotes || 'Ditangani oleh Admin');
                  setAckModalId(null);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold"
              >
                Simpan & Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
