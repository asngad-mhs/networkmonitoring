import { IncidentAlert, NotificationSettings } from '../types/network';

/**
 * Audio Synthesizer for NOC Alert Chimes
 */
export function playAlertSound(severity: 'critical' | 'warning' | 'info' = 'warning') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (severity === 'critical') {
      // Urgent double beep (High pitch alarm)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else if (severity === 'warning') {
      // Warning chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Info subtle chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn('AudioContext alert chime suppressed or not allowed:', e);
  }
}

/**
 * Dispatch real Telegram message via Telegram Bot API
 */
export async function sendTelegramAlert(
  settings: NotificationSettings,
  alert: IncidentAlert
): Promise<{ success: boolean; message: string }> {
  if (!settings.telegramBotToken || !settings.telegramChatId) {
    return { success: false, message: 'Telegram Bot Token atau Chat ID belum diisi' };
  }

  const icon = alert.severity === 'critical' ? '🔴 [CRITICAL INCIDENT]' : alert.severity === 'warning' ? '⚠️ [WARNING ALERT]' : 'ℹ️ [INFO NOTICE]';
  const text = `${icon}
<b>NetPulse Network Monitoring</b>
━━━━━━━━━━━━━━━━━━
<b>Perangkat:</b> ${alert.deviceName} (${alert.deviceIp})
<b>Masalah:</b> ${alert.title}
<b>Detail:</b> ${alert.message}
${alert.metricValue ? `<b>Nilai Terkini:</b> <code>${alert.metricValue}</code> (Ambang Batas: ${alert.threshold || 'N/A'})` : ''}
<b>Waktu:</b> ${new Date(alert.timestamp).toLocaleTimeString('id-ID')} WIB
━━━━━━━━━━━━━━━━━━
<i>Segera lakukan mitigasi atau verifikasi pada portal NOC NetPulse.</i>`;

  try {
    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true, message: 'Notifikasi Telegram berhasil terkirim ke Chat ID ' + settings.telegramChatId };
    } else {
      return { success: false, message: data.description || 'Gagal mengirim notifikasi Telegram' };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Koneksi gagal: ${errorMsg}` };
  }
}

/**
 * Dispatch real Discord webhook message
 */
export async function sendDiscordAlert(
  settings: NotificationSettings,
  alert: IncidentAlert
): Promise<{ success: boolean; message: string }> {
  if (!settings.discordWebhookUrl) {
    return { success: false, message: 'Discord Webhook URL belum diisi' };
  }

  const color = alert.severity === 'critical' ? 0xDC2626 : alert.severity === 'warning' ? 0xD97706 : 0x2563EB;
  const payload = {
    username: 'NetPulse NOC Monitor',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/3655/3655581.png',
    embeds: [
      {
        title: `🚨 ${alert.title}`,
        description: alert.message,
        color: color,
        fields: [
          { name: 'Perangkat', value: `${alert.deviceName} (\`${alert.deviceIp}\`)`, inline: true },
          { name: 'Tingkat Keparahan', value: alert.severity.toUpperCase(), inline: true },
          { name: 'Metrik Terkini', value: alert.metricValue || 'N/A', inline: true },
          { name: 'Ambang Batas', value: alert.threshold || 'N/A', inline: true },
        ],
        footer: { text: 'NetPulse Real-time SNMP Enterprise Network Engine' },
        timestamp: new Date(alert.timestamp).toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(settings.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return { success: true, message: 'Notifikasi Discord Webhook berhasil dikirim' };
    } else {
      return { success: false, message: `Gagal mengirim ke Discord (Status: ${res.status})` };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Koneksi Discord gagal: ${errorMsg}` };
  }
}

/**
 * Trigger Browser Desktop Notification if allowed
 */
export function triggerBrowserNotification(alert: IncidentAlert) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(`NetPulse [${alert.severity.toUpperCase()}]: ${alert.deviceName}`, {
      body: `${alert.title} - ${alert.message}`,
      icon: '/favicon.ico',
    });
  }
}
