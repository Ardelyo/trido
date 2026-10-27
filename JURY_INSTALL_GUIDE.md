# Panduan Instalasi & Evaluasi Juri — Trido

Panduan singkat untuk mencoba dan mengevaluasi **Trido** di Windows, macOS, atau Linux.

---

## Opsi 1: Aplikasi Desktop Windows Mandiri (`.exe`) *(Paling Cepat)*

Tidak perlu install Node.js, Python, atau membuka terminal:

1. **Unduh Installer:** [**Trido-Setup-1.0.0.exe (168 MB)**](https://github.com/Ardelyo/trido/releases/latest/download/Trido-Setup-1.0.0.exe) *(atau ambil dari `dist-release/Trido Setup 1.0.0.exe` jika sudah build di lokal)*.
2. **Install & Buka:** Klik 2x `Trido-Setup-1.0.0.exe`, lalu jalankan shortcut **Trido** di Desktop.
3. **Siap Dipakai:** Layar pembuka akan menyalakan server lokal di port `3030` dan langsung membuka kanvas Smartboard.

---

## Opsi 2: Launcher 1-Klik (`start.bat` di Windows)

Kalau membuka dari folder source code di Windows:

1. Klik 2x file **`start.bat`** di folder utama proyek.
2. Script otomatis mengecek Node.js, menginstal `node_modules` kalau belum ada, menyalakan server di `http://localhost:3000`, dan membuka browser ke `http://localhost:3000/?app=true`.

---

## Opsi 3: Jalankan Lewat Terminal (Windows / macOS / Linux)

```bash
npm install
npm run dev
```
Buka **`http://localhost:3000/?app=true`** di Chrome atau Edge.

---

## Pengaturan Model AI & API Key

Klik ikon **Pengaturan (⚙️)** di bilah navigasi kiri untuk memilih mode AI:

> **Catatan Evaluasi:** Saat ini mode Cloud Demo (`gemma4good`) masih diaktifkan supaya juri bisa langsung menguji fitur AI begitu aplikasi dibuka, **tetapi kuota demo ini tidak akan gratis selamanya**. Untuk pemakaian jangka panjang di kelas, gunakan salah satu dari dua opsi di bawah ini:

### Opsi A — Unduh Model Lokal Trido via Ollama (100% Gratis & Offline)
1. Install [Ollama](https://ollama.com).
2. Di Trido, buka **Pengaturan (⚙️) → Kecerdasan AI**, lalu pilih **Ollama Lokal**.
3. Pilih **`trido-gemma:2b`** (1.6 GB — kencang & ringan buat laptop RAM 4GB–8GB) atau **`trido-model:latest`** (6.6 GB — buat laptop dengan GPU 8GB VRAM), lalu klik tombol **"Unduh & Kalibrasi Model Lokal Otomatis (1-Klik)"**.

### Opsi B — Gunakan Google AI Studio API Key Pribadi
1. Buat API key gratis di [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Di Trido, buka **Pengaturan (⚙️) → Kecerdasan AI**, pilih **Gemini Cloud**, tempelkan key `AIzaSy...` Anda, lalu klik **Simpan**.

---

## Skenario Uji Cepat

1. **Respon Instan Jev-1 Reflex (<15ms):**
   - Buka panel **`Asisten`** (tombol kanan atas) atau klik mikrofon di bawah kanvas.
   - Ketik atau ucapkan: `"Halo Trido, tolong pasang timer sepuluh menit"` -> Widget timer 10:00 langsung muncul di papan.
2. **Pembuatan Mindmap Mermaid & Edit di Tempat (*In-Place Mutation*):**
   - Ketik atau ucapkan: `"Buatkan peta konsep tentang sistem peredaran darah manusia"`.
   - Lanjutkan dengan: `"Tambahkan cabang gangguan peredaran darah pada peta konsep tadi"` -> Perhatikan diagram yang sudah ada langsung diperbarui di tempat tanpa membuat widget ganda.
3. **Multi-Halaman & Pergeseran 120 FPS:**
   - Geser widget di kanvas, lalu klik tombol **`+`** di kiri bawah untuk menambah Halaman 2. Saat kembali ke Halaman 1, semua widget di Halaman 1 tetap utuh.
