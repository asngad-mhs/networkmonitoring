# NetPulse — Enterprise Multi-Vendor Network & System SNMP Monitor

**NetPulse** adalah platform pemantauan jaringan dan infrastruktur server berbasis web modern yang dirancang untuk kebutuhan **Network Operations Center (NOC)**, ISP, dan Network Administrator. NetPulse menyediakan pemantauan *real-time* multi-vendor dengan visualisasi diagram topologi interaktif, telemetri bandwidth 64-bit, konsol diagnostik fisik, integrasi LuCI JSON-RPC untuk OpenWrt/Linksys, serta sistem notifikasi otomatis ke **Telegram** dan **Discord**.

---

## 🌟 Fitur Utama

### 1. 🌐 Multi-Vendor Hardware & Protocol Engine
Mendukung berbagai vendor perangkat jaringan dan server:
- **MikroTik**: RouterOS v6 / v7 (CCR, Cloud Core, RB, hEX) — OID Enterprise `.1.3.6.1.4.1.14988.*` (Suhu CPU, Voltase, Kecepatan Kipas RPM).
- **Ruijie Reyee**: ReyeeOS & Ruijie Cloud (RG-EG Gateway, RG-NBS Switch, RG-EW) — OID Enterprise `.1.3.6.1.4.1.4881.*`.
- **OpenWrt & Linksys**: Linksys WRT series (WRT3200ACM, WRT1900ACS) & OpenWrt 23.05+ — UCD-SNMP `.1.3.6.1.4.1.2021.*` & protokol **LuCI JSON-RPC** `/cgi-bin/luci/rpc/`.
- **Cisco Systems**: Catalyst & ISR Series (IOS-XE) — OID Enterprise `.1.3.6.1.4.1.9.*` (5-second CPU, sensor suhu).
- **Huawei Technologies**: CloudEngine & NE40E Series (VRP Engine).
- **Ubiquiti Networks**: UniFi Dream Machine (UDM), EdgeRouter, UniFi AP.
- **Linux & Unix Server**: Host-Resources-MIB (`.1.3.6.1.2.1.25.*`) multi-core load & RAM.
- **GPON OLT**: ZTE C320/C300 & Huawei SmartAX.

### 2. ⚡ Streaming Bandwidth Real-Time (64-Bit High Capacity Counters)
- Kalkulasi akurat delta octets 64-bit `ifHCInOctets` (Download / Rx) dan `ifHCOutOctets` (Upload / Tx).
- Grafik vektor live throughput 60 FPS dengan penunjuk beban puncak (*peak*), indikator kapasitas link (*utilization rate %*), dan seleksi rentang waktu (1m, 5m, 15m, 1h).

### 3. 🗺️ Diagram Topologi Jaringan Interaktif
- Visualisasi topologi jaringan dengan **animasi aliran paket (packet pulses)**.
- Pewarnaan saturasi link otomatis:
  - 🟢 **Normal**: Utilisasi link < 60%
  - 🟡 **Warning**: Utilisasi link 60% – 85%
  - 🔴 **Critical**: Utilisasi link > 85%
- Node perangkat dapat dipindahkan (*draggable*) menggunakan mouse maupun layar sentuh (*touchscreen* pada tablet/HP).
- Inspektur telemetri instan saat node dipilih.

### 4. 🔌 Konsol Diagnostik Perangkat & Visualisasi Port Fisik
- **Matrix Faceplate Port**: Visualisasi port fisik RJ45 & SFP dengan lampu LED link aktif serta sakelar admin port (*enable / disable*).
- **Multi-Core CPU Inspector**: Monitor utilisasi per core prosesor secara independen (hingga 16/36 core).
- **ICMP Ping & Traceroute Probe**: Alat uji latensi RTT langsung dari antarmuka web.

### 5. 📡 OpenWrt & Linksys LuCI JSON-RPC Engine
- Pemanggilan prosedur RPC standar `/cgi-bin/luci/rpc/` (bukan ubus):
  - `sys.sysinfo`: Rincian RAM fisik, buffer, load averages, dan jumlah proses.
  - `network.get_wifi_status`: Menampilkan tabel stasiun klien Wi-Fi terhubung (Hostname, MAC, IP, RSSI Signal -dBm, Tx/Rx Mbps, frekuensi 5GHz/2.4GHz).
  - `uci.get_all("sqm")`: Parameter manajemen antrian anti-*bufferbloat* (*Cake / FQ_Codel QoS*).
  - `ip.neighbors`: Tabel ARP cache perangkat lokal.

### 6. 🚨 Manajemen Gangguan & Gateway Notifikasi Otomatis
- **Telegram Bot API**: Pengiriman peringatan insiden otomatis ke akun personal atau grup NOC Telegram.
- **Discord Webhook**: Siaran rich-embed incident card ke server Discord.
- **Audible Emergency Chimes**: Suara sirine alarm audio sintetis via Web Audio API saat terdeteksi status kritis.
- **Aturan Ambang Batas (Alert Rules)**: Konfigurasi pemicu otomatis untuk lonjakan CPU (>85%), suhu tinggi (>65°C), *latency spike*, atau *packet loss*.

### 7. 🔍 Subnet Auto-Discovery Scanner
- Pindai rentang IP CIDR (contoh: `192.168.1.0/24` atau `10.0.0.0/24`) untuk mendeteksi perangkat SNMP dan mengimpornya ke inventaris secara instan.

### 8. 🚀 Internet Speedtest & Jitter Meter
- Pengujian kecepatan throughput multi-stream dengan speedometer dua jarum, pengukur jitter, dan skor kualitas *bufferbloat*.

---

## 📱 Kompatibilitas Layar (Responsive Viewports)

NetPulse dioptimalkan untuk seluruh ukuran layar:
- 🖥️ **Desktop & NOC Video Wall** (1080p, 2K, 4K)
- 💻 **Laptop** (13" – 16")
- 📱 **Tablet & iPad** (Landscape & Portrait dengan touch drag topologi)
- 📲 **Smartphone / Mobile** (Touch scrubber grafik, adaptive drawer modal, menu ramah sentuhan)

---

## 🚀 Panduan Memulai (Quick Start)

### Prasyarat
- **Node.js**: Versi 18.x atau lebih baru
- **npm** atau **yarn**

### Instalasi & Menjalankan Aplikasi
```bash
# 1. Clone repository atau buka direktori proyek
cd netpulse-snmp-monitor

# 2. Install dependencies
npm install

# 3. Jalankan server pengembangan lokal
npm run dev
```
Buka browser Anda di `http://localhost:3000` (atau port yang ditentukan).

### Membangun Versi Produksi (Production Build)
```bash
npm run build
```

---

## 📂 Struktur Direktori Proyek

```
src/
├── components/
│   ├── alerts/          # Manajemen Insiden & Konfigurasi Webhook Telegram/Discord
│   ├── dashboard/       # Dashboard Utama NOC, Grafik Bandwidth & Sensor Metrik
│   ├── devices/         # Daftar Inventaris Fleet, Form Tambah Node, & Modal Diagnostik
│   ├── discovery/       # Subnet CIDR Auto-Discovery Scanner
│   ├── layout/          # Header & Navigasi Responsif
│   ├── snmp/            # SNMP MIB Walker & OID Explorer
│   ├── speedtest/       # Speedtest Gauge & Analyzer
│   └── topology/        # Diagram Topologi Jaringan Interaktif
├── data/
│   └── mockDevices.ts   # Data armada awal multi-vendor & topologi link
├── services/
│   ├── luciRpcEngine.ts # Implementasi OpenWrt LuCI JSON-RPC Engine
│   ├── notificationService.ts # API Telegram Bot, Discord Webhook, & Audio Chimes
│   └── snmpEngine.ts    # Kamus MIB OID & Mesin Polling Bandwidth
└── types/
    └── network.ts       # Definisi TypeScript interface & tipe data
```

---

## 📋 Kamus MIB OID Bawaan (Built-in MIB Reference)

| OID | Nama MIB | Deskripsi | Vendor / Standar |
| :--- | :--- | :--- | :--- |
| `.1.3.6.1.2.1.1.1.0` | `sysDescr.0` | Informasi OS, Firmware & Tipe Hardware | RFC1213 / SNMPv2 |
| `.1.3.6.1.2.1.1.3.0` | `sysUpTime.0` | Durasi waktu aktif perangkat (*uptime*) | RFC1213 / SNMPv2 |
| `.1.3.6.1.2.1.31.1.1.1.6.x` | `ifHCInOctets.x` | Counter 64-bit Total Download (Rx Bytes) | IF-MIB (RFC 2863) |
| `.1.3.6.1.2.1.31.1.1.1.10.x` | `ifHCOutOctets.x` | Counter 64-bit Total Upload (Tx Bytes) | IF-MIB (RFC 2863) |
| `.1.3.6.1.4.1.14988.1.1.3.10.0` | `mtxHlProcessorTemperature.0` | Sensor Suhu CPU MikroTik (°C) | MikroTik |
| `.1.3.6.1.4.1.14988.1.1.3.8.0` | `mtxHlVoltage.0` | Tegangan Input Motherboard | MikroTik |
| `.1.3.6.1.4.1.4881.1.1.10.2.1.1.1.0` | `ruijieSystemCpuRate.0` | Utilisasi Beban CPU Ruijie Reyee (%) | Ruijie Reyee |
| `.1.3.6.1.4.1.4881.1.1.10.2.1.1.4.0` | `ruijieReyeeCloudTunnelState.0` | Status Koneksi Ruijie Cloud Tunnel | Ruijie Reyee |
| `.1.3.6.1.4.1.2021.10.1.3.1` | `laLoad.1` | 1-Minute Load Average OpenWrt | OpenWrt / Linksys |
| `.1.3.6.1.4.1.2021.13.15.1.1.2.1` | `openwrtWirelessStationsConnected.1` | Jumlah Klien Wi-Fi Terhubung (Station) | OpenWrt / Linksys |
| `.1.3.6.1.4.1.9.9.109.1.1.1.1.3.1` | `cpmCPUTotal5secRev.1` | Beban CPU Cisco 5-Detik (%) | Cisco IOS-XE |

---

## 🔒 Keamanan & Privasi
- Pengaturan konfigurasi, webhook, token bot, dan armada node disimpan secara lokal pada browser pengguna (*LocalStorage*) dan tidak dikirimkan ke pihak ketiga tanpa instruksi eksplisit.
- Mendukung protokol otentikasi aman **SNMP v3 (USM Security authPriv)** dan **LuCI Tokenized JSON-RPC**.

---

## 📄 Lisensi
Hak Cipta © 2026 NetPulse Network Operations Center Engine. Dilindungi undang-undang.
