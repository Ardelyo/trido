# Indeks Dokumentasi Trido

Halaman ini merangkum seluruh dokumen yang ada di repositori **Trido** supaya lebih gampang dicari sesuai kebutuhan (guru, pengembang, peneliti AI, maupun juri).

---

## 1. Panduan Cepat & Rilis (Folder Utama)

| Dokumen | Target Pembaca | Isi Singkat |
|---------|----------------|-------------|
| [**`../README.md`**](../README.md) | Semua | Gambaran umum proyek, cerita Pak Damar, cara jalanin aplikasi, dan link unduh `.exe` |
| [**`../JURY_INSTALL_GUIDE.md`**](../JURY_INSTALL_GUIDE.md) | Juri & Penguji | Panduan instalasi `.exe` / `start.bat`, setting model lokal Ollama, dan daftar uji cepat |
| [**`../RELEASE_NOTES.md`**](../RELEASE_NOTES.md) | Pengguna & Juri | Ringkasan fitur baru di rilis `v1.1.0` |
| [**`../CHANGELOG.md`**](../CHANGELOG.md) | Developer | Catatan perubahan dari versi `1.0.0` sampai `1.1.0` |

---

## 2. Panduan Guru & Pemakaian di Kelas

| Dokumen | Bahasa | Isi Singkat |
|---------|--------|-------------|
| [**`TEACHER_GUIDE.md`**](./TEACHER_GUIDE.md) | Bahasa Indonesia | Panduan praktis mengajar pakai perintah suara & alat kelas |
| [**`USAGE.md`**](./USAGE.md) | English | Panduan fitur suara, mindmap, 4 tipe kuis, timer, dan mode layar murid |
| [**`TRIDO_COMPREHENSIVE_GUIDE_ID.md`**](./TRIDO_COMPREHENSIVE_GUIDE_ID.md) | Bahasa Indonesia | Manual lengkap seluruh fitur, shortcut, dan setup offline |
| [**`TRIDO_COMPREHENSIVE_GUIDE_EN.md`**](./TRIDO_COMPREHENSIVE_GUIDE_EN.md) | English | Manual lengkap dalam Bahasa Inggris |

---

## 3. Dokumentasi Teknis, API & Deployment

| Dokumen | Target Pembaca | Isi Singkat |
|---------|----------------|-------------|
| [**`API_DOCUMENTATION.md`**](./API_DOCUMENTATION.md) | Engineer | Referensi endpoint `/api/ai/*`, event Socket.IO (`canvas-delta`, `dom-elements-update`), dan skema tool AI |
| [**`DEPLOYMENT.md`**](./DEPLOYMENT.md) | Engineer / DevOps | Cara build installer `.exe` Windows, server lokal, Vercel, dan Docker Compose |
| [**`../CONTRIBUTING.md`**](../CONTRIBUTING.md) | Kontributor | Aturan kode, pengecekan `npm run check` & `npx vitest run`, serta standar UI tanpa gradien |
| [**`../SECURITY.md`**](../SECURITY.md) | Reviewer Keamanan | Proteksi SSRF, sandbox iframe, sanitasi DOMPurify, dan pelaporan celah keamanan |
| [**`../AGENTS.md`**](../AGENTS.md) | AI Coding Agent | Peta arsitektur repo untuk asisten koding |

---

## 4. Riset Model Lokal, Fine-Tuning & Benchmark

| Dokumen | Topik | Isi Singkat |
|---------|-------|-------------|
| [**`TRIDO_MODEL_FINE_TUNING_RESEARCH_REPORT.md`**](./TRIDO_MODEL_FINE_TUNING_RESEARCH_REPORT.md) | Distilasi & SFT | Pipeline distilasi `trido-model:latest` (9B) & `trido-gemma:2b` (2.3B) beserta kalibrasi RAM 4GB–8GB |
| [**`RESEARCH_BENCHMARK_REPORT.md`**](./RESEARCH_BENCHMARK_REPORT.md) | Benchmark Empiris | Perbandingan latensi, akurasi tool call, dan penggunaan memori model cloud vs lokal |
| [**`GEMMA4_INDEX.md`**](./GEMMA4_INDEX.md) | Gemma 4 E2B | Catatan teknis kuantisasi 4-bit dan optimasi inferensi lokal |
| [**`GEMMA4_QUICK_START.md`**](./GEMMA4_QUICK_START.md) | Setup Ollama | Langkah singkat menjalankan Gemma 4 di Ollama |
| [**`small-model-guide.md`**](./small-model-guide.md) | Optimasi SLM | Penyesuaian prompt dan skema untuk model ukuran kecil (1.5B–3B) |

---

## 5. Dokumen Kompetisi, WIPO & Bisnis

| Dokumen | Keperluan | Isi Singkat |
|---------|-----------|-------------|
| [**`KAGGLE_WRITEUP.md`**](./KAGGLE_WRITEUP.md) | Google Gemma 4 Good | Dokumen writeup kompetisi (**2nd Place Worldwide**) |
| [**`BUSINESS_MODEL_CANVAS_AND_BENCHMARK.md`**](./BUSINESS_MODEL_CANVAS_AND_BENCHMARK.md) | Dampak & Keberlanjutan | Business Model Canvas dan efisiensi biaya operasional sekolah |
| [**`NASKAH_PRESENTASI_WIPO_BALI_2026.md`**](./NASKAH_PRESENTASI_WIPO_BALI_2026.md) | WIPO Bali 2026 | Naskah presentasi seminar WIPO |
| [**`REVIEW_PRESENTASI_WIPO_BALI_2026.md`**](./REVIEW_PRESENTASI_WIPO_BALI_2026.md) | WIPO Bali 2026 | Catatan review teknis & HKI untuk presentasi WIPO |
| [**`ARCHIVED_ROADMAP_PLAN.md`**](./ARCHIVED_ROADMAP_PLAN.md) | Arsip Lama | Catatan rencana pengembangan awal (arsip historis) |
