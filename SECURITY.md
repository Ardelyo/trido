# Kebijakan Keamanan (Security Policy)

## Versi yang Didukung

| Versi | Status |
| ----- | ------ |
| 1.1.x | Didukung penuh |
| 1.0.x | Didukung (perbaikan keamanan kritis) |

## Batas Keamanan di Dalam Arsitektur Trido

Karena Trido dipakai di lingkungan sekolah dan kelas, beberapa pengaman utama dipasang langsung di sisi server maupun browser:

1. **Proteksi SSRF pada Endpoint Ollama Lokal (`server/aiRouter.ts`, `server/ollamaAdapter.ts`, `api/ai/*.ts`)**
   - Parameter `ollamaBaseUrl` dari client divalidasi dengan `new URL()` dan hanya diizinkan mengakses protokol `http:`/`https:` pada alamat *loopback* (`localhost`, `127.0.0.1`, `[::1]`) atau host yang sudah disetel di environment `OLLAMA_BASE_URL`.
   - Endpoint `/api/ai/pull-model` memfilter nama model menggunakan regex ketat (`/^[a-zA-Z0-9._:/-]+$/`), dan `server/whisperService.py` membatasi ukuran model sesuai daftar *allowlist*.

2. **Isolasi Sandbox pada Simulasi Interaktif (`components/AppBuilderTool.tsx`)**
   - Aplikasi mini HTML/CSS/JS yang dibuat AI dijalankan di dalam `<iframe srcDoc sandbox="allow-scripts allow-forms">` **tanpa** atribut `allow-same-origin`.
   - Skrip di dalam iframe tidak punya akses ke `window.parent.localStorage`, tidak bisa membaca API key pengguna, dan tidak bisa melepas atribut sandbox-nya sendiri.

3. **Sanitasi XSS pada Widget DOM & Ekspor Dokumen (`components/DomOverlay.tsx`, `components/MermaidTool.tsx`, `utils/smartExport.ts`)**
   - HTML widget yang dirender memakai `dangerouslySetInnerHTML` dibersihkan lebih dulu lewat `DOMPurify.sanitize()`.
   - Diagram Mermaid diinisialisasi dengan `securityLevel: 'antiscript'` dan melewati sanitizer AST (`utils/mermaidSanitizer.ts`).
   - Ekspor lembar kerja cetak (PDF/HTML) melakukan *escaping* (`escapeHtml()`) pada judul, soal, dan opsi jawaban.

4. **Validasi Room & Payload Socket.IO (`server.ts`)**
   - `roomId` divalidasi sebagai string non-kosong (`<= 128` karakter) dan struktur payload (`canvas-update`, `canvas-delta`, `dom-elements-update`, `viewport-update`) diperiksa sebelum di-broadcast ke peserta kelas.

5. **Penyimpanan API Key Lokal**
   - `GEMINI_API_KEY` pribadi pengguna disimpan di `localStorage` browser masing-masing atau di `%APPDATA%\Trido\.env` pada versi desktop `.exe`, tidak pernah disimpan di database server bersama.

## Cara Melaporkan Celah Keamanan

Jika menemukan celah keamanan di repositori ini:
1. Mohon **jangan** membuka *issue* publik yang memuat langkah eksploitasi mentah.
2. Kirim laporan melalui fitur GitHub Security Advisories di [github.com/Ardelyo/trido/security/advisories](https://github.com/Ardelyo/trido/security/advisories) atau hubungi langsung pengelola proyek (**Ardellio Satria Anindito** — `@Ardelyo`).
3. Sertakan langkah reproduksi beserta nama file dan baris kode terkait supaya bisa segera kami tambal.
