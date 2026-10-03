import React, { useState, useEffect, useRef } from 'react';
import { 
  NetworkDevice, 
  TopologyLink, 
  AlertRule, 
  IncidentAlert, 
  NotificationSettings 
} from './types/network';
import { 
  INITIAL_DEVICES, 
  INITIAL_TOPOLOGY_LINKS, 
  INITIAL_ALERT_RULES, 
  INITIAL_INCIDENTS, 
  INITIAL_NOTIFICATION_SETTINGS 
} from './data/mockDevices';
import { tickDeviceMetrics } from './services/snmpEngine';
import { playAlertSound, triggerBrowserNotification, sendTelegramAlert, sendDiscordAlert } from './services/notificationService';

// Layout & Views
import { Header } from './components/layout/Header';
import { NocOverview } from './components/dashboard/NocOverview';
import { NetworkTopology } from './components/topology/NetworkTopology';
import { DeviceList } from './components/devices/DeviceList';
import { SnmpExplorer } from './components/snmp/SnmpExplorer';
import { AlertsManager } from './components/alerts/AlertsManager';
import { SpeedtestModal } from './components/speedtest/SpeedtestModal';
import { DeviceDetailModal } from './components/devices/DeviceDetailModal';
import { AddDeviceModal } from './components/devices/AddDeviceModal';
import { SubnetScannerModal } from './components/discovery/SubnetScannerModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'topology' | 'devices' | 'snmp' | 'speedtest' | 'alerts'>('overview');
  
  // Fleet State
  const [devices, setDevices] = useState<NetworkDevice[]>(() => {
    const saved = localStorage.getItem('netpulse_devices');
    if (!saved) return INITIAL_DEVICES;
    try {
      const parsed = JSON.parse(saved);
      // If parsed doesn't include ruijie or openwrt, merge initial ones
      const hasRuijie = parsed.some((d: NetworkDevice) => d.vendor === 'ruijie' || d.vendor === 'reyee');
      const hasOpenwrt = parsed.some((d: NetworkDevice) => d.vendor === 'openwrt' || d.vendor === 'linksys');
      if (!hasRuijie || !hasOpenwrt) {
        return INITIAL_DEVICES;
      }
      return parsed;
    } catch {
      return INITIAL_DEVICES;
    }
  });

  const [links, setLinks] = useState<TopologyLink[]>(() => {
    const saved = localStorage.getItem('netpulse_links');
    if (!saved) return INITIAL_TOPOLOGY_LINKS;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.length < INITIAL_TOPOLOGY_LINKS.length) return INITIAL_TOPOLOGY_LINKS;
      return parsed;
    } catch {
      return INITIAL_TOPOLOGY_LINKS;
    }
  });

  const [alertRules, setAlertRules] = useState<AlertRule[]>(() => {
    const saved = localStorage.getItem('netpulse_rules');
    return saved ? JSON.parse(saved) : INITIAL_ALERT_RULES;
  });

  const [incidents, setIncidents] = useState<IncidentAlert[]>(() => {
    const saved = localStorage.getItem('netpulse_incidents');
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('netpulse_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATION_SETTINGS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [selectedDeviceModal, setSelectedDeviceModal] = useState<NetworkDevice | null>(null);
  const [selectedDeviceForSnmp, setSelectedDeviceForSnmp] = useState<NetworkDevice | null>(null);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState<boolean>(false);
  const [showSubnetScanModal, setShowSubnetScanModal] = useState<boolean>(false);
  const [showSpeedtestModal, setShowSpeedtestModal] = useState<boolean>(false);

  // Keep a ref to notificationSettings and soundEnabled for ticker access
  const notifRef = useRef(notificationSettings);
  notifRef.current = notificationSettings;
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('netpulse_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('netpulse_rules', JSON.stringify(alertRules));
  }, [alertRules]);

  useEffect(() => {
    localStorage.setItem('netpulse_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('netpulse_notifications', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Real-Time Polling Engine (Ticks every 2.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prevDevices => {
        const updated = prevDevices.map(dev => tickDeviceMetrics(dev));
        
        // Update selected device modal if open
        if (selectedDeviceModal) {
          const match = updated.find(d => d.id === selectedDeviceModal.id);
          if (match) setSelectedDeviceModal(match);
        }

        return updated;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedDeviceModal]);

  // Total Fleet Bandwidth
  const totalBandwidth = {
    rx: devices.reduce((sum, d) => sum + d.interfaces.reduce((iSum, i) => iSum + i.currentRxMbps, 0), 0),
    tx: devices.reduce((sum, d) => sum + d.interfaces.reduce((iSum, i) => iSum + i.currentTxMbps, 0), 0),
  };

  // Device Handlers
  const handleUpdateDevice = (updated: NetworkDevice) => {
    setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
    if (selectedDeviceModal?.id === updated.id) {
      setSelectedDeviceModal(updated);
    }
  };

  const handleAddDevice = (newDevice: NetworkDevice) => {
    setDevices(prev => [newDevice, ...prev]);
    // Also create a sample link to the core router if core router exists
    const core = devices.find(d => d.vendor === 'mikrotik' || d.vendor === 'cisco');
    if (core && newDevice.interfaces[0] && core.interfaces[0]) {
      setLinks(prev => [
        ...prev,
        {
          id: `link-${Date.now()}`,
          sourceDeviceId: core.id,
          sourceInterfaceId: core.interfaces[0].id,
          targetDeviceId: newDevice.id,
          targetInterfaceId: newDevice.interfaces[0].id,
          capacityMbps: 1000,
          status: 'active',
          label: 'SNMP Trunk',
        },
      ]);
    }
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus perangkat ini dari pemantauan?')) {
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      setLinks(prev => prev.filter(l => l.sourceDeviceId !== deviceId && l.targetDeviceId !== deviceId));
    }
  };

  // Incident Handlers
  const handleAcknowledgeIncident = (incidentId: string, notes: string) => {
    setIncidents(prev =>
      prev.map(inc =>
        inc.id === incidentId
          ? {
              ...inc,
              status: 'acknowledged',
              acknowledgedBy: 'NOC Administrator',
              notes,
            }
          : inc
      )
    );
  };

  const handleResolveIncident = (incidentId: string) => {
    setIncidents(prev =>
      prev.map(inc =>
        inc.id === incidentId
          ? {
              ...inc,
              status: 'resolved',
              resolvedAt: Date.now(),
            }
          : inc
      )
    );
  };

  const handleAddAlertRule = (rule: AlertRule) => {
    setAlertRules(prev => [...prev, rule]);
  };

  const handleToggleRule = (ruleId: string) => {
    setAlertRules(prev =>
      prev.map(r => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    setAlertRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const handleOpenSnmpWalk = (dev: NetworkDevice) => {
    setSelectedDeviceForSnmp(dev);
    setSelectedDeviceModal(null);
    setActiveTab('snmp');
  };

  const activeAlertCount = incidents.filter(i => i.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        activeAlertCount={activeAlertCount}
        onOpenAddDevice={() => setShowAddDeviceModal(true)}
        onOpenSubnetScan={() => setShowSubnetScanModal(true)}
        onOpenSpeedtest={() => setShowSpeedtestModal(true)}
        totalBandwidthMbps={totalBandwidth}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <NocOverview
            devices={devices}
            incidents={incidents}
            onSelectDevice={dev => setSelectedDeviceModal(dev)}
            onNavigateToAlerts={() => setActiveTab('alerts')}
            onNavigateToTopology={() => setActiveTab('topology')}
            onNavigateToSpeedtest={() => setShowSpeedtestModal(true)}
          />
        )}

        {activeTab === 'topology' && (
          <NetworkTopology
            devices={devices}
            links={links}
            onSelectDevice={dev => setSelectedDeviceModal(dev)}
          />
        )}

        {activeTab === 'devices' && (
          <DeviceList
            devices={devices}
            onSelectDevice={dev => setSelectedDeviceModal(dev)}
            onDeleteDevice={handleDeleteDevice}
            onOpenAddDevice={() => setShowAddDeviceModal(true)}
          />
        )}

        {activeTab === 'snmp' && (
          <SnmpExplorer
            devices={devices}
            initialSelectedDevice={selectedDeviceForSnmp || devices[0]}
          />
        )}

        {activeTab === 'speedtest' && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-2">Uji Kecepatan Jaringan Gateway</h2>
            <p className="text-xs text-slate-400 mb-4">
              Jalankan tes bandwidth multi-stream untuk mengukur performa throughput upload/download dan stabilitas latensi RTT.
            </p>
            <button
              onClick={() => setShowSpeedtestModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Buka Speedtest Console
            </button>
          </div>
        )}

        {activeTab === 'alerts' && (
          <AlertsManager
            incidents={incidents}
            alertRules={alertRules}
            notificationSettings={notificationSettings}
            onUpdateSettings={setNotificationSettings}
            onAcknowledgeIncident={handleAcknowledgeIncident}
            onResolveIncident={handleResolveIncident}
            onAddAlertRule={handleAddAlertRule}
            onToggleRule={handleToggleRule}
            onDeleteRule={handleDeleteRule}
          />
        )}
      </main>

      {/* Modals */}
      {selectedDeviceModal && (
        <DeviceDetailModal
          device={selectedDeviceModal}
          onClose={() => setSelectedDeviceModal(null)}
          onUpdateDevice={handleUpdateDevice}
          onOpenSnmpWalk={handleOpenSnmpWalk}
        />
      )}

      {showAddDeviceModal && (
        <AddDeviceModal
          onClose={() => setShowAddDeviceModal(false)}
          onAddDevice={handleAddDevice}
        />
      )}

      {showSubnetScanModal && (
        <SubnetScannerModal
          onClose={() => setShowSubnetScanModal(false)}
          onImportDevice={handleAddDevice}
        />
      )}

      {showSpeedtestModal && (
        <SpeedtestModal
          onClose={() => setShowSpeedtestModal(false)}
        />
      )}
    </div>
  );
}
