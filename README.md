# Trido — Smartboard AI untuk Ruang Kelas Inklusif

[![CI — Typecheck, Test & Build](https://github.com/Ardelyo/trido/actions/workflows/ci.yml/badge.svg)](https://github.com/Ardelyo/trido/actions/workflows/ci.yml)
[![Release v1.1.0](https://img.shields.io/badge/release-v1.1.0-1550aa?style=flat-square)](https://github.com/Ardelyo/trido/releases/latest)
[![Windows Desktop .exe](https://img.shields.io/badge/Windows_Desktop-.exe_Installer-ffcc00?style=flat-square&logo=windows&logoColor=0a1a3a)](https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe)
[![Tests](https://img.shields.io/badge/tests-126%20passing-10b981?style=flat-square)](#pengujian--verifikasi)
[![License: MIT](https://img.shields.io/badge/license-MIT-0a1a3a?style=flat-square)](./LICENSE)

> *"Teknologi itu banyak. Tapi orang yang beneran peduli sama inklusi — itu yang jarang."*

**Trido** (**Tri**: *Guru, Murid, Teknologi* + **Do**: *Bikin jalan, bikin bermanfaat*) adalah papan tulis digital (*smartboard*) berbasis suara dan AI spasial yang dirancang khusus buat pengajar — terutama guru penyandang disabilitas fisik yang selama ini kesulitan memakai software papan tulis yang mengandalkan klik-tahan-geser (*drag-and-drop*) mouse.

- **Web App Live:** [trido.vercel.app](https://trido.vercel.app)
- **Installer Windows Desktop (`.exe`, 168 MB):** [Trido-Setup-1.0.0.exe](https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe) *(Mandiri — tidak perlu install Node.js atau buka terminal)*
- **Indeks Dokumentasi:** [`docs/README.md`](./docs/README.md)
- **Pencapaian:** **Juara 2 Dunia (2nd Place Worldwide)** — *Gemma 4 Good Hackathon by Google*

---

## 1. Latar Belakang: Dibuat Bareng Pak Damar

Proyek ini nggak lahir dari *pitch deck*, tapi dari ngelihat langsung cara seorang guru mengajar di kelas.

**Pak Damar** (*Dadan Mochammad Ramdhan*) adalah guru Bahasa Indonesia di Bandung yang mengajar dengan keterbatasan fisik pada kedua tangan dan kakinya. Kebanyakan papan tulis digital mengasumsikan penggunanya bisa bebas klik, tahan, geser, dan mengetik cepat di tombol-tombol kecil. Pak Damar seharusnya nggak perlu menyesuaikan diri dengan software yang menyulitkan — software-nya yang harus menyesuaikan diri dengan cara beliau mengajar.

Beberapa prinsip utama yang kami pegang waktu merancang Trido bareng beliau:
- **Kontrol Suara Tanpa Sentuh (*Hands-Free*):** Cukup bicara natural (`"Trido, buat peta konsep tentang fotosintesis"`, `"Pasang timer sepuluh menit"`).
- **Edit Langsung di Tempat (*In-Place Mutation*):** Kalau minta `"Tambahkan cabang baru di peta konsep tadi"`, Trido memperbarui diagram yang sudah ada di kanvas, bukan menumpuk widget baru yang bikin papan berantakan.
- **Bisa Jalan 100% Offline:** Tetap jalan tanpa internet di sekolah menggunakan Ollama lokal (`trido-model:latest`, `trido-gemma:2b`, `gemma4:e2b`, `ornith-1.5:9b`) dan transkripsi suara offline Faster-Whisper.

---

## 2. Cara Menjalankan (3 Opsi)

### Opsi A — Installer Desktop Windows (`.exe`) *(Paling Praktis)*
1. Unduh **[Trido-Setup-1.0.0.exe](https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe)**.
2. Jalankan installer, lalu buka **Trido** dari shortcut Desktop.
3. Server lokal dan kanvas langsung berjalan otomatis tanpa perlu setting terminal.

### Opsi B — Launcher 1-Klik (`start.bat` di Windows)
1. Clone atau ekstrak repositori ini.
2. Klik 2x file **`start.bat`**.
3. Script akan mengecek Node.js, menginstal dependensi kalau belum ada, menyalakan server di `http://localhost:3000`, dan membuka Smartboard di browser.

### Opsi C — Terminal Developer (Windows / macOS / Linux)
```bash
git clone https://github.com/Ardelyo/trido.git
cd trido
npm install
cp .env.example .env
npm run dev
```
Buka **`http://localhost:3000/?app=true`** untuk langsung masuk ke Smartboard (atau **`http://localhost:3000`** untuk halaman depan).

---

## 3. Konfigurasi Model AI & RAM (Laptop 4GB–8GB vs GPU 8GB)

Pengaturan mode AI bisa diakses langsung dari tombol **Pengaturan (⚙️) → Kecerdasan AI**:

| Mode | Model | Kebutuhan RAM / VRAM | Catatan |
|------|-------|----------------------|---------|
| **Ollama Edge (Laptop 4GB–8GB RAM)** | `trido-gemma:2b` / `gemma4:e2b` | Bobot **1.6 GB** (~2.0 GB RAM total dgn `num_ctx=4096`) | **100% Gratis & Offline.** Paling pas buat laptop guru standar tanpa GPU diskrit. |
| **Ollama Flagship (GPU 8GB VRAM)** | `trido-model:latest` (`ornith-1.5:9b`) | Bobot **6.6 GB** (~7.0 GB VRAM total dgn `num_ctx=4096`) | **100% Gratis & Offline.** Akurasi tinggi untuk penurunan rumus STEM & multi-widget. |
| **Google Gemini Cloud** | `gemini-3.8-flash` | Cloud (via internet) | Menggunakan [Google AI Studio API Key](https://aistudio.google.com/apikey) pribadi (`GEMINI_API_KEY`). |
| **Vertex AI (Demo Evaluasi)** | `gemini-3.8-flash` | Cloud (`gemma4good`) | Disediakan untuk evaluasi juri. *Catatan: kuota demo ini tidak gratis selamanya; gunakan Ollama lokal atau API key pribadi untuk pemakaian rutin.* |

Untuk mengunduh model lokal lewat terminal (atau gunakan tombol unduh 1-klik di menu Pengaturan):
```bash
# Untuk laptop RAM 4GB-8GB (1.6 GB):
ollama pull gemma4:e2b
ollama create trido-gemma:2b -f scripts/Modelfile.trido-gemma

# Untuk laptop dengan GPU 8GB VRAM (6.6 GB):
ollama pull ornith-1.5:9b
ollama create trido-model:latest -f scripts/Modelfile.trido-model
```

---

## 4. Ringkasan Arsitektur

```text
Input Guru (Suara / Hands-Free / Chat / Upload Dokumen)
   │
   ├─► Normalisasi Angka Lisan ("lima belas menit" → "15 menit")
   │
   ├─► Jev-1 Reflex Engine (<15ms, Tanpa Panggil LLM)
   │     ├── Alat Kelas Instan (Timer + durasi, Kalkulator, Presensi, Spin Wheel, Papan Skor)
   │     ├── Kontrol Kanvas & Halaman (Zoom, Reset View, Tambah Halaman, Undo / Redo)
   │     └── Pengunci Target In-Place (mengunci ID diagram aktif saat guru minta revisi/tambah cabang)
   │
   └─► System 2 Agentic Brain (Ollama Lokal / Gemini Cloud / Vertex AI)
         ├── Klasifikasi Intent ('navigation' | 'modification' | 'question' | 'creation')
         ├── Validator & Auto-Fixer Tool Call (server/aiTools.ts + hooks/useGeminiBrain.ts)
         ├── Sanitizer AST Mermaid 5-Lapis & Self-Healing Renderer (utils/mermaidSanitizer.ts)
         ├── Spatial Occupancy Grid & Kursor Agen Bezier (services/spatialOccupancyGrid.ts)
         └── Broadcast Delta Socket.IO Real-Time (hooks/useSocketSync.ts → Layar Murid)
```

---

## 5. Struktur Folder Utama

```text
trido/
├── App.tsx                         # Shell utama Smartboard, navigasi kiri & drawer Asisten
├── store.ts                        # State global Zustand (sinkronisasi multi-halaman, widget DOM, status suara)
├── server.ts                       # Server Express + Socket.IO & middleware Vite
├── start.bat                       # Launcher 1-klik untuk Windows
├── components/                     # Kanvas Fabric.js, DomOverlay 120fps, MermaidTool, dan 11 alat kelas
├── hooks/                          # Otak AI (useGeminiBrain), ambient voice listener, socket sync
├── server/                         # Router AI, adapter Ollama/Gemini/Vertex, dan jembatan Faster-Whisper
├── utils/                          # mermaidSanitizer, mindmapLayout, smartExport, kamus 11 bahasa
├── electron/                       # Aplikasi desktop mandiri (main.ts, preload.ts, splash.html)
├── tests/                          # 17 file pengujian Vitest (126 test)
└── docs/                           # Dokumentasi teknis, panduan guru, dan laporan riset model
```

---

## 6. Pengujian & Verifikasi

Setiap commit dan pull request ke `main` dicek otomatis lewat [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):

```bash
npm run check               # Cek tipe TypeScript (tsc --noEmit)
npx vitest run              # Jalankan seluruh 17 file test Vitest (126 test)
npm run build               # Build bundle produksi ke folder dist/
npm run build:electron:win  # Paketkan installer Windows (dist-release/Trido Setup 1.0.0.exe)
```

---

## 7. Indeks Dokumentasi

Daftar lengkap dokumentasi ada di **[`docs/README.md`](./docs/README.md)**:

- **Panduan Juri & Instalasi Cepat:** [`JURY_INSTALL_GUIDE.md`](./JURY_INSTALL_GUIDE.md)
- **Panduan Guru di Kelas:** [`docs/TEACHER_GUIDE.md`](./docs/TEACHER_GUIDE.md) · [`docs/USAGE.md`](./docs/USAGE.md)
- **Manual Lengkap (ID & EN):** [`docs/TRIDO_COMPREHENSIVE_GUIDE_ID.md`](./docs/TRIDO_COMPREHENSIVE_GUIDE_ID.md) · [`EN`](./docs/TRIDO_COMPREHENSIVE_GUIDE_EN.md)
- **API & Deployment:** [`docs/API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md) · [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- **Riset Fine-Tuning & Benchmark Model Lokal:** [`docs/TRIDO_MODEL_FINE_TUNING_RESEARCH_REPORT.md`](./docs/TRIDO_MODEL_FINE_TUNING_RESEARCH_REPORT.md) · [`docs/RESEARCH_BENCHMARK_REPORT.md`](./docs/RESEARCH_BENCHMARK_REPORT.md)
- **Kontribusi, Keamanan & Riwayat Rilis:** [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`SECURITY.md`](./SECURITY.md) · [`CHANGELOG.md`](./CHANGELOG.md)

---

## 8. Lisensi & Hak Cipta

```text
TRIDO 2026
Hak Cipta Terdaftar Kementerian Hukum Republik Indonesia
(Ministry of Law, Republic of Indonesia)
Copyright (c) 2026 TRIDO by Ardellio Satria Anindito
```

- **Kode Sumber:** Lisensi [MIT](./LICENSE).
- **Dokumentasi & Riset:** Lisensi [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Model Gemma:** Mengikuti ketentuan [Gemma Terms of Use](https://ai.google.dev/gemma/terms).
