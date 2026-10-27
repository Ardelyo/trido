# Catatan Perubahan (Changelog)

Catatan perkembangan **Trido** dari awal dikerjain bareng Pak Damar sampe rilis desktop `.exe` yang sekarang.

---

## [1.1.0] — 2026-10-14

### Yang Baru
- **Sanitizer & Self-Healing Mermaid Mindmap (`utils/mermaidSanitizer.ts`, `components/MermaidTool.tsx`)**:
  - Model AI (apalagi model lokal ukuran kecil) kadang suka nyelipin tanda kurung `()` atau titik dua `:` di dalem teks cabang mindmap yg bikin Mermaid v11 langsung *parse error*. Sekarang udah dibersihin otomatis sebelom dirender.
  - Nambahin jaring pengaman (*fallback* `buildSafeMindmapFromRawText`) kalo `mermaid.render` masih ngambek gara-gara indentasi loncat atau root ganda (`There can be only one root`).
- **Installer Desktop Windows Mandiri (`Trido-Setup-1.0.0.exe`)**:
  - Paket aplikasi Electron + server lokal Express + Faster-Whisper supaya guru tinggal klik 2x tanpa perlu pusing install Node.js atau buka terminal.
  - Setel `"asar": false` dan `"signAndEditExecutable": false` di konfigurasi build supaya file `.exe` ga kena blokir sepihak sama *Smart App Control* di Windows 11 24H2.
  - Layar loading/splash awal pake gaya minimalis ala buku manual IKEA.
- **Perbaikan Pemahaman Angka Lisan & Mode Suara (`hooks/useGeminiBrain.ts`, `hooks/useAmbientListener.ts`)**:
  - Konversi angka lisan Bahasa Indonesia & Inggris (`"lima belas menit"` -> `15 menit`) biar perintah suara ke timer langsung jalan lewat Jev-1 Reflex (`<15ms`).
  - Sinkronisasi penuh antara tombol mikrofon di bawah kanvas (*Voice Island*) sama panel sidebar **Asisten** di kanan.
- **Kalibrasi Memori Model Lokal Ollama (`constants.ts`, `server/ollamaAdapter.ts`, `scripts/Modelfile.*`)**:
  - Turunin `num_ctx` dari `32768`/`16384` ke `4096` supaya *KV cache* ga makan RAM sampe 3 GB sendiri. Sekarang `trido-gemma:2b` (1.6 GB) enteng jalan di laptop RAM 4GB–8GB, dan `trido-model:latest` (6.6 GB) muat 100% di VRAM 8GB tanpa tumpah ke CPU.
  - Matiin *hidden thinking tokens* (`think: false`) secara default di `ollamaAdapter.ts` buat model berbasis Qwen/Ornith biar ga nunggu 40 detik cuma buat bikin 1 diagram.

### Diperbaiki
- **Audit Keamanan & Bug Internal**:
  - Tutup celah SSRF di parameter `ollamaBaseUrl` (cuma bolehin *loopback* `localhost`/`127.0.0.1` atau host dari env).
  - Cabut `allow-same-origin` dari `<iframe srcDoc>` di `AppBuilderTool.tsx` biar skrip simulasi buatan AI ga bisa ngintip `localStorage`.
  - Benerin bug di mana widget DOM (kuis, timer, mindmap) sempet ilang pas pindah dari Halaman 1 ke Halaman 2 terus balik lagi.
  - Benerin script `start.bat` yg tadinya error `'NODE_ENV' is not recognized` di `cmd.exe` Windows.
  - Rapihin *line-height* dan jarak kanan judul Bahasa Indonesia di Landing Page yg tadinya agak numpuk sama badge putar.

### Catatan / Masalah yang Masih Diketahui
- Transkripsi suara *offline* pake Faster-Whisper pertama kali tetep butuh jeda ~1–2 detik buat muat model Python ke memori.
- Kalo maksa jalanin model 9B (`trido-model:latest`) di laptop tanpa GPU diskrit (CPU-only), responsnya bakal lumayan berat; buat laptop tipis RAM 4–8GB jauh lebih disaranin pake `trido-gemma:2b`.

---

## [1.0.0] — 2026-05-17

- Rilis awal **Trido** hasil diskusi & uji coba bareng **Pak Damar** di Bandung.
- Papan tulis kanvas tak terbatas berbasis Fabric.js + kontrol suara Bahasa Indonesia & Inggris.
- Widget kelas dasar: Mindmap, Kuis (4 tipe), Dokumen/Catatan Markdown + KaTeX, Timer, Kalkulator, Tabel Periodik, dan Presensi.
- Dukungan awal mode *hybrid* (Google Gemini Cloud & Ollama lokal).
