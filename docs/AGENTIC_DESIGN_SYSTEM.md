# 🏛️ TRIDO AGENTIK: AGENTIC-BASED DESIGN SYSTEM (AD-DS)
## Dokumentasi Resmi Arsitektur & Antarmuka Studio Agen Mandiri Produktivitas Pendidik
**Karya**: Ardellio Satria Anindito  
**Versi**: 2.0 (Teacher-Centric Production Standard)  
**Status**: Implementasi Aktif (`feat/smartboard-redesign-prototype`)

---

## 1. Prinsip Desain Agentic (Core Principles)

Trido Agentika dirancang bukan sebagai *chat wrapper*, melainkan sebagai **Autonomous Pedagogical Co-Worker** yang mengabstraksi beban administrasi guru ke dalam agen cerdas mandiri. Lima pilar utama yang mendasari setiap keputusan UX:

1. **Transparency First (Transparansi Penuh)**
   - Guru tidak pernah dibiarkan menatap layar hitam tanpa kabar (*black-box*).
   - Setiap proses menampilkan **Agentic Reasoning Trace**:
     * *Langkah 1: Menganalisis Kurikulum & TP*
     * *Langkah 2: Menyusun Skema Berkas*
     * *Langkah 3: Sintesis Materi & Asesmen*
     * *Langkah 4: Kompilasi Berkas Akhir*
   - Latensi ditampilkan secara nyata dalam stopwatch (`1.2s... 3.4s...`) bersama wawasan pedagogis yang berotasi.

2. **Human-in-the-Loop & Verifikasi Kelas**
   - Guru memegang kendali mutlak sebagai kurator pedagogis.
   - Setiap berkas yang dihasilkan disematkan **Pedagogy Trust Disclaimer**: guru diarahkan untuk memvalidasi kesesuaian materi sebelum masuk ke ruang kelas.

3. **Progressive Disclosure (Bahasa Ramah Guru)**
   - Kompleksitas teknis AI diabstraksikan menjadi istilah pengajaran yang intuitif:
     * `gemini-3.8-flash` ➔ **Mode Cepat** (untuk perancangan instan harian).
     * `vertex` ➔ **Mode Terpadu** (untuk kurikulum mendalam & analitik).
     * `ollama / gemma` ➔ **Mode Privat Offline** (data nilai siswa 100% diproses di laptop tanpa internet).

4. **Reversibility & Session History**
   - Seluruh dokumen yang berhasil disusun otomatis disimpan ke dalam **Riwayat Dokumen Sesi** (`trido_agentika_history`).
   - Guru dapat membuka kembali versi sebelumnya kapan saja tanpa takut data tertimpa.

5. **Physical / Tactile Brand Consistency & Voice-First DNA**
   - Mengusung estetika *Tactile IKEA Paper Warmth*:
     * Latar kanvas kertas hangat: `#E8E6E1` (krem hangat khas landing page Trido).
     * Kartu permukaan: Putih bersih `#FFFFFF` dengan radius `16px`.
     * Warna solid bebas gradien: **Bold Blue (`#1D4ED8` / `#1550aa`)** & **Amber Kuning (`#F5C518` / `#ffcc00`)**.
     * Identitas Suara (Voice-First): *"Teach out loud. The board listens."* 🎙️ Tombol mic tanda tangan hadir di bilah perintah.

---

## 2. Siklus Status Agen (Agent Lifecycle States)

Setiap agen di Agentika beroperasi melalui siklus status yang terdefinisi secara deterministik:

```
[IDLE] 
  │
  ├──► Guru memilih Template Card atau menginput di Dock Island
  │
[INPUT_RECEIVED]
  │
  ├──► Validasi prompt & injeksi Konteks Global (Jenjang, Kurikulum, Mapel, Kelas)
  │
[PLANNING (Langkah 1 & 2)]
  │
  ├──► Menganalisis Capaian Pembelajaran (CP) & Tujuan Pembelajaran (TP)
  ├──► Membentuk skema tabel / dokumen
  │
[EXECUTING (Langkah 3)]
  │
  ├──► Pemanggilan API Tool-Content (Gemini / Vertex / Ollama)
  ├──► Rotasi Wawasan Pedagogis & Stopwatch Latensi
  │
[COMPILING (Langkah 4)]
  │
  ├──► Kompilasi berkas OpenXML DOCX / CSV Excel / HTML Slide / Markdown
  │
[DELIVERABLE_READY]
  │
  ├──► Tampilan Halaman Dokumen A4 (ReactMarkdown + KaTeX)
  ├──► Unduh Berkas (.DOCX / .CSV / .HTML / .MD)
  ├──► Tempel ke Papan Tulis (Injeksi ke domElements Kanvas)
  │
[REVISION_LOOP / COMPLETE]
```

---

## 3. Komponen Antarmuka (Agentic Component Library)

### A. Teacher Context Setter Bar (Konteks Global)
- **Komponen**: `TeacherContextBar`
- **Fungsi**: Menyimpan preferensi jenjang (PAUD s/d SMA/SMK), kurikulum (Merdeka / K-13), mata pelajaran, dan kelas ke `localStorage`.
- **Perilaku**: Otomatis disuntikkan ke dalam instruksi agen sehingga guru tidak perlu mengetik ulang konteks kelas setiap kali menyusun dokumen.

### B. Template Cards & Interactive Sample Modal
- **Komponen**: `CapabilityPreviewCard` & `SampleResultModal`
- **Fungsi**: Memperlihatkan kemampuan agen dengan tombol **"Contoh Hasil"** dan **"Gunakan Template"**.
- **Perilaku**: Guru dapat mengintip format baku dokumen sebelum menekan tombol eksekusi.

### C. Collapsible Dock Island Command Bar
- **Komponen**: `DockIsland`
- **Fungsi**: Bilah perintah mengambang di bagian bawah dengan selektor format, input teks terarah, dan tombol eksekusi berdaya tinggi.
- **Pencegahan Overlap**: Halaman memiliki padding bawah `pb-96 md:pb-[340px]` serta tombol **Ciutkan/Buka (`ChevronUp`/`ChevronDown`)** sehingga tidak pernah menutupi kartu template atau lembar dokumen di bawahnya.

### D. Agentic Reasoning Trace Stepper
- **Komponen**: `AgenticTraceStepper`
- **Fungsi**: Memberikan visibilitas langkah agen secara real-time dengan ikon status centang (`CheckCircle2`), stopwatch latensi, dan tombol pembatalan instan (`[✕ Batalkan]`).

### E. Rich Deliverable Paper Viewer
- **Komponen**: `DocumentPaperViewer`
- **Fungsi**: Menampilkan hasil seperti lembar cetak A4 Microsoft Word dengan tipografi profesional, tabel terformat, dan rumus matematika KaTeX.
- **Dukungan Format**:
  * Native OpenXML Word: `.docx` (dibuat menggunakan `docx` Packer).
  * Spreadsheet: `.csv` (dengan UTF-8 BOM untuk Microsoft Excel & Google Sheets).
  * Slide Dek Presentasi: `.html` (rasio 16:9 ramah cetak PDF).
  * Sumber Murni: `.md` (Markdown).

---

## 4. Matriks Kemampuan Agen (Capability Matrix)

| Agen | Masukan Wajib | Masukan Opsional | Keluaran Baku | Batasan & Fallback |
|---|---|---|---|---|
| **Modul Ajar (DOCX)** | Mata pelajaran, Topik materi | Alokasi waktu, Model pembelajaran, Asesmen | Berkas `.docx` OpenXML & Markdown A4 dengan CP, TP, LKPD, Rubrik | Fallback ke Markdown jika kompilasi OpenXML ditolak browser |
| **Buku Nilai (XLSX)** | Mata pelajaran, Daftar nilai/nama | KKM/KKTP, Bobot tugas/UH | Berkas `.csv` dengan formula rata-rata, ranking, & status kelulusan | Maksimal 50 siswa per lembar rekapitulasi |
| **Slide Interaktif (PPTX)** | Topik pembahasan | Target kelas, jumlah slide | Dek 16:9 HTML dengan Speaker Notes guru | Fallback ke teks outline terstruktur |
| **Peta Konsep (Smartboard)** | Topik materi | Tingkat kedalaman cabang | Diagram Mermaid (`mindmap` / `flowchart TD`) | Otomatis ditempelkan ke `domElements` kanvas |

---

## 5. Pedoman Bahasa & Aksesibilitas (Tone of Voice & WCAG)

1. **Nada Bicara**: Hormat, suportif, memberdayakan guru (*empathic & pedagogical*).
2. **Kontras Warna**: Seluruh badge dan teks memenuhi standar **WCAG AA (kontras minimal 4.5:1)**:
   * Biru Dokumen: `#1550aa` pada putih (kontras 7.2:1).
   * Hijau Spreadsheet: `#047857` pada putih.
   * Amber Slide: `#b45309` pada putih.
   * Ungu Diagram: `#4338ca` pada putih.
3. **Penyimpanan Lokal & Privasi**: Tidak ada data murid atau dokumen yang dikirimkan ke server eksternal tanpa izin guru. Sesi dokumen tersimpan di penyimpanan peramban lokal.

---

## 6. Spesifikasi Khusus Komponen Tambahan (Revisi ke-2)

### A. Mode Selector Specification (`/mode-selector.md`)
- **Single Source of Truth Rule**:
  * Status read-only ringkas ditampilkan di top bar global (`Studio Agen Mandiri`).
  * **Satu-satunya titik kendali interaktif** adalah toggle di sub-header Agentika: `[ Otomatis ] [ Mode Cepat ] [ Mode Privat (Offline) ]`.
  * Di dalam bilah perintah bawah (dock bar), status ditampilkan secara **read-only non-interaktif** (`Berjalan di: Mode ...`) dengan dot hijau/biru untuk mencegah kebingungan dan redundansi visual.
- **Dukungan Model**:
  * *Otomatis (Rekomendasi)*: Evaluasi heuristik kuota awan vs server lokal.
  * *Mode Cepat (Gemini)*: Latensi rendah untuk penyusunan bahan ajar harian.
  * *Mode Terpadu (Vertex)*: Perhitungan kompleks dan analitik kurikulum.
  * *Mode Privat Offline (Lokal / Ollama)*: Berjalan 100% di GPU/CPU laptop tanpa koneksi internet; menjamin kerahasiaan nilai dan identitas siswa.

### B. Teacher Context Setter Bar (`/context-setter-bar.md`)
- **Struktur Field**:
  * *Field Primer*: Kurikulum (Merdeka / K-13 / Internasional), Jenjang (Fase A-F), Mata Pelajaran (Searchable Combobox 15+ mapel standar).
  * *Field Lanjutan (Expandable)*: Kelas spesifik (misal: Kelas X IPA 1), Jumlah Siswa (default: 25), Semester (Ganjil/Genap).
- **Perilaku & Persistensi**:
  * Tersimpan otomatis di `localStorage` (`trido_teacher_context`).
  * Disuntikkan secara otomatis ke setiap prompt template dan instruksi bebas agen tanpa membebani guru mengetik berulang.
- **Validasi Halus (Soft Validation)**:
  * Jika field tidak diisi lengkap, agen tetap berjalan menggunakan nilai default tanpa memblokir guru, disertai catatan informatif ramah.
