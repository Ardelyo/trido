# Panduan Kontribusi (Contributing)

Terima kasih sudah mampir dan ikut bantu ngembangin **Trido**. Proyek ini awalnya dibangun bareng **Pak Damar** (guru Bahasa Indonesia di Bandung) supaya pengajar penyandang disabilitas fisik bisa mengelola papan tulis kelas cukup lewat suara dan interaksi ringan.

---

## 1. Persiapan Lokal

- **Node.js:** v18 ke atas (disarankan Node 22 LTS)
- **Opsional (Transkripsi Suara Offline):** Python 3.10+ dengan paket `faster-whisper`
- **Opsional (AI Offline Lokal):** [Ollama](https://ollama.com) dengan `trido-gemma:2b` (laptop RAM 4–8GB) atau `trido-model:latest` (GPU 8GB VRAM)

```bash
git clone https://github.com/Ardelyo/trido.git
cd trido
npm install
cp .env.example .env
npm run dev
```
Server Express + Socket.IO + Vite bakal jalan di `http://localhost:3000` (buka `http://localhost:3000/?app=true` buat langsung masuk ke kanvas Smartboard).

---

## 2. Cek Wajib Sebelum Buka Pull Request

Semua PR otomatis dites lewat workflow [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). Pastikan 3 perintah ini lulus di lokal sebelum push:

```bash
# 1. Cek kompilasi TypeScript (harus 0 error)
npm run check

# 2. Jalankan suite unit & integration test (17 file / 126 test)
npx vitest run

# 3. Pastikan build produksi nggak pecah
npm run build
```

---

## 3. Aturan Kode & Desain yang Perlu Dijaga

1. **Desain Minimalis & Warna Solid (Tanpa Gradient):**
   - Palet warna utama: kertas hangat (`#e4e3e0`), biru Trido (`#1550aa`), tinta gelap (`#0a1a3a`), kuning (`#ffcc00`), dan putih/abu-abu netral.
   - Jangan pakai `bg-gradient-*` atau `radial-gradient` di logo maupun komponen UI.
   - Panel kanan AI dan tombol pemicunya dinamai **`Asisten`** (`t('assistant', 'Asisten')`).

2. **Kelancaran Drag/Resize 120 FPS:**
   - Jangan pasang class `transition-all` di elemen kanvas atau widget DOM yang bisa digeser.
   - Waktu `isDragging` atau `isResizing` aktif, paksa `transition: 'none'` dan pakai `translate3d(-50%, -50%, 0)` lewat `requestAnimationFrame`.

3. **Edit di Tempat (*In-Place Mutation*):**
   - Kalau pengguna minta nambah cabang mindmap atau ubah isi widget yang sudah ada di kanvas, gunakan `update_component` atau `modify_object` — jangan bikin widget duplikat baru.
   - Semua kode Mermaid wajib lewat `sanitizeMermaidCode()` (`utils/mermaidSanitizer.ts`).

4. **Keamanan & Kompatibilitas Offline:**
   - Alat kelas inti harus tetap bisa dipakai manual meskipun internet/AI mati.
   - Sanitasi HTML mentah pakai `DOMPurify`, pastikan `<iframe srcDoc>` tidak memakai `allow-same-origin`, dan validasi URL Ollama lewat `sanitizeOllamaUrl`.

5. **Terjemahan Multi-Bahasa (`utils/translations.ts`):**
   - Bungkus teks UI baru dengan `t('namaKey', 'Teks Default')` dan tambahkan minimal ke kamus `id` serta `en` di `utils/translations.ts`.
