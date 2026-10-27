# Catatan Rilis Trido v1.1.0

Rilis `v1.1.0` fokus ke tiga hal praktis buat pemakaian nyata di kelas: installer desktop Windows `.exe` yg langsung jalan tanpa setup rumit, perbaikan *parse error* di diagram Mermaid, sama optimasi memori buat model AI lokal di laptop spesifikasi rendah (RAM 4GB–8GB).

---

## Unduhan Langsung

| Platform | File | Keterangan |
|----------|------|------------|
| **Windows Desktop (`.exe`)** | [**`Trido-Setup-1.0.0.exe`**](https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe) | Installer mandiri (~168 MB). Ga butuh Node.js atau terminal. Aman buat Windows 11 Smart App Control. |
| **Localhost (Source)** | `start.bat` | Klik 2x dari folder repo buat nyalain server lokal di `http://localhost:3000/?app=true`. |

---

## Ringkasan Pembaruan v1.1.0

1. **Perbaikan Sintaks Mermaid Mindmap & Flowchart (`utils/mermaidSanitizer.ts`)**
   - Bersihin otomatis tanda kurung `()`, titik dua `:`, dan bullet Markdown di dalem teks cabang mindmap yg sering bikin Mermaid v11 gagal render, lengkap sama *self-healing fallback* di `MermaidTool.tsx`.
2. **Optimasi RAM/VRAM Model Lokal Ollama (`trido-gemma:2b` & `trido-model:latest`)**
   - Kalibrasi konteks ke `4096` token dan pemangkasan prompt JSON buat model kecil supaya `trido-gemma:2b` (1.6 GB) cuma makan ~2.0 GB RAM total (aman buat laptop guru RAM 4GB–8GB).
3. **Sinkronisasi Multi-Halaman, Mode Suara & Panel `Asisten`**
   - Widget DOM ga lagi ke-reset waktu pindah halaman kanvas, dan input suara di bawah layar nyambung langsung sama drawer **Asisten**.
4. **Pengingat Penggunaan Model Lokal & API Key Pribadi**
   - Cloud demo bawaan (`gemma4good`) tetep aktif buat keperluan uji coba/evaluasi juri, tapi buat pemakaian harian jangka panjang disaranin unduh model lokal lewat menu **Pengaturan -> Kecerdasan AI** atau pake `GEMINI_API_KEY` pribadi.

Detail perubahan teknis lainnya ada di [`CHANGELOG.md`](./CHANGELOG.md).
