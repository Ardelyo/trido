# PANDUAN LENGKAP & BUKU PETUNJUK RESMI TRIDO SMARTBOARD
**Hak Cipta © 2026 TRIDO by Ardellio Satria Anindito**  
*Hak Cipta Terdaftar Kementerian Hukum Republik Indonesia*  
*Juara 2 Dunia · Gemma 4 Good Hackathon by Google*

---

## DAFTAR ISI
1. [Filosofi, Identitas Brand & Standar Desain](#1-filosofi-identitas-brand--standar-desain)
2. [Sistem Peluncuran Pintar (Smart Launch & Routing)](#2-sistem-peluncuran-pintar-smart-launch--routing)
3. [Kanvas Digital & Alat Menggambar Presisi](#3-kanvas-digital--alat-menggambar-presisi)
4. [Mode Bebas Genggam (Hands-Free Voice) & Standar Inklusif Pak Damar](#4-mode-bebas-genggam-hands-free-voice--standar-inklusif-pak-damar)
5. [Ekosistem 12 Widget Pembelajaran Interaktif & Simulasi STEM](#5-ekosistem-12-widget-pembelajaran-interaktif--simulasi-stem)
6. [Manipulasi Widget, Zero-Lag Dragging & Fitur "Tempel ke Papan"](#6-manipulasi-widget-zero-lag-dragging--fitur-tempel-ke-papan)
7. [Mesin Kecerdasan AI: Multi-Model Routing & Mutasi Kontinu (In-Place Mutation)](#7-mesin-kecerdasan-ai-multi-model-routing--mutasi-kontinu-in-place-mutation)
8. [Kolaborasi Real-Time, Manajemen Sesi & Ekspor Cerdas](#8-kolaborasi-real-time-manajemen-sesi--ekspor-cerdas)
9. [Panduan Praktik Mengajar 45 Menit Langkah demi Langkah](#9-panduan-praktik-mengajar-45-menit-langkah-demi-langkah)
10. [Daftar Pintasan Keyboard (Cheat Sheet) & Pemecahan Masalah](#10-daftar-pintasan-keyboard-cheat-sheet--pemecahan-masalah)

---

## 1. FILOSOFI, IDENTITAS BRAND & STANDAR DESAIN

TRIDO dirancang berdasarkan realitas ruang kelas: **guru mengajar siswa, bukan menatap layar laptop.**

### 1.1 Estetika IKEA & Desain Taktil Bersih
- **Warna Kertas Alami (`#e4e3e0`)**: Bingkai luar aplikasi menggunakan warna kertas hangat yang ramah di mata, terinspirasi dari buku catatan fisik dan instruksi perakitan Skandinavia.
- **Kanvas Putih Bersih (`#ffffff`)**: Permukaan kanvas utama berwarna putih murni dengan sudut melengkung sirkular (`rounded-[2.8rem]`) dan aksen garis tepi halus (`border-2 border-[#1550aa]/15`).
- **Biru Trido Solid (`#1550aa`)**: Warna primer berkarakter tegas, percaya diri, dan mudah dibaca dalam segala pencahayaan proyektor kelas.
- **Kuning Matahari (`#ffcc00`)**: Aksen taktil untuk penanda aktif, cincin mikrofon, dan status interaksi penting.
- **Tinta Gelap Pekat (`#0a1a3a`)**: Tipografi tajam berkontras tinggi dengan font display `Inter Tight` dan teks isi `Work Sans` / `Inter`.
- **Standar Nol Gradien (Zero Gradient Rule)**: Dilarang menggunakan gradien warna-warni pada logo dan antarmuka kontrol. Semua tombol dan elemen menggunakan warna solid atau pastel lembut bergaris tegas demi keterbacaan proyektor dan layar sentuh kelas.

---

## 2. SISTEM PELUNCURAN PINTAR (SMART LAUNCH & ROUTING)

TRIDO memiliki arsitektur perutean adaptif (`RootRouter.tsx`) yang mengenali konteks peluncuran:

### 2.1 Mode Ruang Kelas / Lokal / Desktop Launch
- **Alamat URL**: `http://localhost:3030` (atau port dev `3000`/`3001`/`5173`) atau saat dijalankan lewat aplikasi desktop Electron.
- **Perilaku**: **Bebas Hambatan (Zero Barrier)**. Sistem langsung membuka Kanvas Papan Tulis interaktif (`<App />`) dalam hitungan milidetik tanpa menampilkan halaman arahan (landing page), sehingga guru dapat langsung memulai pelajaran.

### 2.2 Mode Web Publik (`trido.vercel.app`)
- **Akses Rute Utama (`/`)**: Menampilkan Showcase Landing Page resmi TRIDO yang memuat demo suara interaktif, prestasi Juara 2 Dunia Google Hackathon, fitur unggulan, dan pemilih bahasa (ID/EN).
- **Transisi Sinematik ("Tirai Papan Digital")**: Ketika tombol **"Buka Smartboard"** diklik, sistem menjalankan animasi tirai sinematik:
  1. Halaman promosi meredup dan mengecil lembut (`scale: 0.985, filter: blur(6px)`).
  2. Tirai biru solid TRIDO tampil dengan logo berdenyut dan pesan *"Mempersiapkan Digital Classroom..."*.
  3. Rute berganti ke `/app` dan kanvas mengembang masuk secara mulus tanpa pemuatan ulang halaman (no full reload).
- **Rute Langsung**: Mengakses tautan kolaborasi seperti `/app` atau `?room=kelas7b` langsung membuka kanvas secara otomatis.
- **Navigasi Balik**: Di mode web publik, logo TRIDO di header dan menu *"Beranda / Info"* di bilah sisi dapat diklik untuk kembali ke landing page kapan saja.

---

## 3. KANVAS DIGITAL & ALAT MENGGAMBAR PRESISI

Kanvas TRIDO dibangun di atas mesin Fabric.js teroptimasi dengan akselerasi perangkat keras.

### 3.1 Bilah Alat Menggambar (Floating Tool Capsule)
Bilah alat vertikal mengambang di sisi kiri kanvas dengan bentuk kapsul melingkar penuh (`rounded-full`):
- **Pilih Elemen (`SELECT`, Pintasan: `V`)**: Memilih objek, memindahkan catatan, dan mengatur tata letak.
- **Pena Digital (`PENCIL`, Pintasan: `P`)**: Menulis bebas dengan algoritma *perfect-freehand* yang halus dan presisi.
- **Penghapus (`ERASER`, Pintasan: `E`)**: Menghapus goresan tulisan tangan atau bentuk geometris.
- **Teks & Rumus (`TEXT`, Pintasan: `T`)**: Mengetik penjelasan dengan dukungan font akademik (`Inter`, `JetBrains Mono`, `Source Serif 4`).
- **Bentuk Geometri (`SHAPES`)**: Kotak, Lingkaran, Segitiga, Bintang, Poligon, Garis, Panah, Belah Ketupat, dan Balon Percakapan.
- **Pilihan Warna & Ketebalan**: Flyout menu berbentuk kartu lengkung 1.75rem memuat 8 warna kontras tinggi dan pengatur ketebalan kuas dari 2px hingga 32px.

### 3.2 Hitbox Taktil & Pegangan Sudut 28px
- Objek kanvas yang dipilih memiliki titik kontrol sirkular putih dengan garis tepi biru Trido (`cornerSize: 12px`).
- Dilengkapi **area sentuh tak kasat mata 28px (`touchCornerSize: 28px`)**, sehingga jari guru atau pena stylus dapat menarik, memutar, dan mengubah ukuran objek dengan mudah tanpa meleset.

---

## 4. MODE BEBAS GENGGAM (HANDS-FREE VOICE) & STANDAR INKLUSIF PAK DAMAR

Fitur ini didedikasikan untuk guru inklusif dan pengajar yang memiliki keterbatasan motorik atau sedang berdiri jauh dari laptop.

### 4.1 Cara Mengaktifkan Mode Bebas Genggam
1. Di pojok kanan bawah kanvas, periksa bilah **Assistive Dock (Mode Inklusif)**.
2. Klik tombol bundar **"Suara"** (ikon mikrofon).
3. Tombol akan berdenyut kuning keemasan (`#ffcc00`) dan berganti label menjadi **"Dengar"**.
4. Balon status mengambang akan muncul di atas dock: *"Bebas Genggam: 'Trido, ...'"*.

### 4.2 Daftar Perintah Suara Spontan (Voice Intent List)
Ucapkan kalimat berikut secara alami dalam Bahasa Indonesia:
- **Timer Otomatis**:  
  *“Trido, pasang timer 5 menit”* atau *“Trido, buka timer 10 menit”*  
  ➜ Sistem membuat widget countdown timer sesuai durasi dan membunyikan nada konfirmasi.
- **Presensi / Absensi Siswa**:  
  *“Trido, buka presensi siswa”* atau *“Trido, absensi”*  
  ➜ Lembar presensi siswa langsung terbuka.
- **Roda Acak Giliran Siswa**:  
  *“Trido, acak giliran siswa”* atau *“Trido, putar roda”*  
  ➜ Roda putar interaktif muncul di tengah papan dan siap diputar.
- **Kalkulator Sains**:  
  *“Trido, tolong buka kalkulator sains”* atau *“Trido, hitung”*  
  ➜ Widget kalkulator langsung terbuka di samping catatan.
- **Kuis Interaktif**:  
  *“Trido, mulai kuis interaktif”* atau *“Trido, buat kuis”*  
  ➜ Suite kuis interaktif kelas langsung aktif.
- **Pusatkan Tampilan Layar**:  
  *“Trido, pusatkan layar”* atau *“Trido, reset kamera”*  
  ➜ Tampilan kanvas yang tergeser otomatis kembali ke titik tengah (zoom 100%).
- **Bersihkan Kanvas**:  
  *“Trido, bersihkan papan”* atau *“Trido, hapus coretan”*  
  ➜ Menghapus goresan papan tulis seketika.
- **Peta Konsep & Asisten AI**:  
  *“Trido, buat peta konsep fotosintesis”* atau *“Trido, jelaskan siklus air”*  
  ➜ Perintah diteruskan ke Asisten AI untuk menggambar diagram Mermaid langsung di papan.

---

## 5. EKOSISTEM 12 WIDGET PEMBELAJARAN INTERAKTIF & SIMULASI STEM

TRIDO menyediakan modul interaktif mandiri yang dapat diletakkan di kanvas:

1. **⏱️ Timer & Countdown Tool**: Pengatur waktu belajar dengan visualisasi lingkaran waktu, tombol jeda/mulai, dan bunyi bel di akhir sesi.
2. **🧮 Scientific Calculator**: Papan hitung matematika presisi dengan riwayat perhitungan real-time.
3. **📝 Document Block / Catatan Akademik**: Penampil dokumen Markdown elegan dengan rumus matematika KaTeX (`$$E = mc^2$$`) dan penyorot sintaks kode pemrograman.
4. **❓ Interactive Quiz Suite**:
   - Pilihan Ganda (Multiple Choice)
   - Pertanyaan Esai (Essay)
   - Benar / Salah (True/False)
   - Cocokkan Tarik & Lepas (Drag & Drop Match)
5. **⚗️ Tabel Periodik Kimia**: Peta unsur kimia interaktif dengan nomor atom, golongan, massa atom, dan konfigurasi elektron.
6. **⇄ Konverter Satuan**: Pengonversi instan panjang, massa, suhu, waktu, volume, dan data digital.
7. **👥 Lembar Presensi Siswa**: Daftar kehadiran kelas dengan status Hadir, Izin, Sakit, atau Alpa serta rekapitulasi otomatis.
8. **☑️ Daftar Tugas Kelas (Todo List)**: Pencatat agenda belajar harian dengan kotak centang interaktif.
9. **🎲 Roda Acak Giliran (Spin Wheel)**: Memilih nama siswa secara adil untuk menjawab pertanyaan di depan kelas.
10. **🏆 Papan Skor Kelompok (Scoreboard)**: Penghitung poin kompetisi cerdas cermat antar tim dengan animasi selebrasi.
11. **📈 Grafik Matematika (Math Graph Tool)**: Plot kurva fungsi linear, kuadrat ($y = ax^2 + bx + c$), sinus, dan kosinus secara visual dan interaktif.
12. **🌳 Peta Konsep Cerdas (Mermaid / Markmap Mindmap)**: Diagram cabang materi pelajaran yang dapat disunting langsung di kanvas.
13. **🔬 Laboratorium Simulasi STEM**:
    - Simulasi Titrasi Asam-Basa Kimia (perubahan warna indikator pH).
    - Simulasi Fisika Gerak Parabola (sudut elevasi meriam dan jarak lintasan).
    - Kotak Punnett Genetika Biologi (diagram persilangan genotipe).

---

## 6. MANIPULASI WIDGET, ZERO-LAG DRAGGING & FITUR "TEMPEL KE PAPAN"

### 6.1 Menggeser Widget Bebas Lag (Zero-Lag 120 FPS Dragging)
- Arahkan kursor atau sentuh judul widget (bagian atas bertanda pegangan titik).
- Saat ditahan dan digeser, kartu widget akan terangkat halus (`scale: 1.018` dengan bayangan taktil dalam).
- Gerakan mengikuti kursor seketika tanpa jeda waktu (zero delay) berkat eliminasi transition delay dan sinkronisasi `requestAnimationFrame`.

### 6.2 Mengubah Ukuran Kartu (Tactile Corner Resize Handle)
- Di pojok kanan bawah setiap widget, terdapat pegangan sudut minimalis berwarna biru Trido.
- Tarik sudut tersebut ke luar atau ke dalam untuk mengubah ukuran kartu.
- Lencana ukuran dinamis (`[lebar] × [tinggi]`) akan muncul di atas kursor untuk menunjukkan dimensi persis dalam piksel.

### 6.3 Menempel Hasil Jawaban AI ke Papan ("Tempel ke Papan")
1. Ajukan pertanyaan di bilah samping Asisten AI (misalnya: *"Buatkan rangkuman 3 hukum Newton"*).
2. Setelah AI selesai menjawab, klik tombol **"📌 Tempel ke Papan"** pada pesan jawaban tersebut.
3. Jawaban AI akan seketika ditempel ke kanvas utama sebagai kartu catatan dokumen mandiri.
4. Guru dapat langsung menggeser kartu tersebut ke samping diagram, mengubah ukurannya, atau menambahkan coretan pena di sekelilingnya.

---

## 7. MESIN KECERDASAN AI: MULTI-MODEL ROUTING & MUTASI KONTINU

TRIDO mendukung fleksibilitas kecerdasan tanpa mengorbankan privasi kelas:

### 7.1 Tiga Mode Sumber AI
- **Google AI Studio (Gemini Cloud)**: Menggunakan `gemini-3.8-flash` dengan kecepatan generasi tinggi.
- **Google Cloud Vertex AI**: Terintegrasi pada region `gemma4good-494311` untuk lingkungan institusi resmi.
- **Ollama Lokal (100% Offline & Privat)**: Menjalankan model `gemma4:e2b` atau `ornith-1.5:9b` langsung di GPU laptop guru tanpa membutuhkan koneksi internet sama sekali.

### 7.2 Standar Mutasi Kontinu (Continuous In-Place Mutation)
Berbeda dengan asisten obrolan biasa yang membuat widget baru terus-menerus, TRIDO cerdas bermutasi di tempat:
- Jika guru berkata: *"Tambahkan satu cabang lagi tentang Fotosintesis Gelap ke peta konsep tadi"*, TRIDO **tidak membuat diagram baru**, melainkan mencari ID diagram yang sudah ada di kanvas dan memodifikasi simpul diagram tersebut secara langsung.

---

## 8. KOLABORASI REAL-TIME, MANAJEMEN SESI & EKSPOR CERDAS

### 8.1 Berbagi Layar Siswa (QR Code & Kode Sesi)
1. Klik tombol **"Bagikan"** di header atas.
2. Siswa dapat memindai **Kode QR** menggunakan kamera ponsel/tablet mereka atau membuka tautan dengan kode sesi (misal: `trido.id/?room=IPA-8B`).
3. Mode Penonton (Viewer Mode) menyajikan kanvas bersih dalam format sinematik tanpa bilah alat guru yang membingungkan.

### 8.2 Penyimpanan Otomatis & Riwayat Sesi
- Setiap coretan, dokumen, dan tata letak tersimpan otomatis ke IndexedDB peramban lokal secara berkala.
- Buka menu **"Riwayat Sesi"** di bilah sisi kiri untuk membuka kembali materi pertemuan minggu lalu.

### 8.3 Ekspor Cerdas Multi-Format
Klik menu **"Simpan / Ekspor"**:
- **Gambar HD (PNG/SVG)**: Mengekspor gambar jernih 2x Retina tanpa elemen antarmuka website.
- **Lembar Kerja Cetak (PDF)**: Mengisolasi dokumen materi untuk dicetak rapi di kertas A4 tanpa header website.
- **Cadangan Papan (`.trido`)**: Berkas arsip JSON lengkap yang dapat dipindahkan ke laptop lain.

---

## 9. PANDUAN PRAKTIK MENGAJAR 45 MENIT LANGKAH DEMI LANGKAH

Berikut alur ideal mengajar menggunakan TRIDO di depan kelas:

### Menit 00–05: Pembukaan & Presensi Tanpa Menyentuh Laptop
1. Berdiri di depan layar smartboard, aktifkan **Mode Bebas Genggam**.
2. Ucapkan: *“Trido, buka presensi siswa.”*
3. Cek kehadiran siswa dengan mencentang nama pada widget absensi yang muncul.
4. Ucapkan: *“Trido, pusatkan layar.”*

### Menit 05–20: Penjelasan Materi & Pembuatan Peta Konsep Cerdas
1. Ucapkan atau ketik di asisten: *“Trido, buat peta konsep Struktur Sel Hewan dan Tumbuhan.”*
2. Peta konsep interaktif langsung terbit di tengah kanvas.
3. Ambil Pena Digital (`P`), jelaskan bagian nukleus dan mitokondria dengan memberi lingkaran merah.
4. Bila ingin penjelasan tambahan, klik tombol **"Tempel ke Papan"** dari jawaban asisten.

### Menit 20–35: Diskusi Kelompok & Praktik Hitung
1. Ucapkan: *“Trido, acak giliran siswa.”*
2. Putar roda acak untuk menentukan perwakilan kelompok yang maju ke depan.
3. Ucapkan: *“Trido, pasang timer 10 menit.”*
4. Siswa mengerjakan soal latihan di papan sambil memantau hitungan mundur timer.

### Menit 35–42: Evaluasi Cepat dengan Kuis Interaktif
1. Buka widget Kuis (`QuizTool`).
2. Tampilkan 3 soal pilihan ganda di layar sentuh untuk dijawab serentak oleh siswa.
3. Tampilkan skor akhir untuk apresiasi kelas.

### Menit 42–45: Penutupan & Penyimpanan Materi
1. Buka menu **"Ekspor & Impor"**.
2. Pilih **Ekspor Gambar PNG** untuk dibagikan ke grup WhatsApp orang tua / Google Classroom.
3. Kanvas otomatis tersimpan aman di Riwayat Sesi.

---

## 10. DAFTAR PINTASAN KEYBOARD (CHEAT SHEET) & PEMECAHAN MASALAH

| Pintasan Keyboard | Aksi / Fungsi |
| :--- | :--- |
| **`V`** | Memilih Objek / Alat Pointer (`SELECT`) |
| **`P`** | Mode Pena Digital / Coretan (`PENCIL`) |
| **`E`** | Mode Penghapus Coretan (`ERASER`) |
| **`T`** | Tambah Kotak Teks Baru (`TEXT`) |
| **`Space + Geser Mouse`** | Menggeser Seluruh Kanvas (Pan Canvas) |
| **`Ctrl + Z` / `Cmd + Z`** | Batalkan Perubahan (Undo) |
| **`Ctrl + Y` / `Cmd + Shift + Z`** | Ulangi Perubahan (Redo) |
| **`Escape`** | Menutup menu pop-up atau keluar dari Layar Penuh |
| **`Delete` / `Backspace`** | Menghapus objek kanvas yang sedang dipilih |

### Pemecahan Masalah Cepat (FAQ)
1. **Mikrofon Bebas Genggam Tidak Mendengar?**  
   Pastikan izin peramban untuk mikrofon telah diizinkan (`Allow`). Pada peramban Chrome, cek ikon gembok di bilah alamat URL.
2. **Menjalankan Tanpa Internet Sama Sekali?**  
   Buka Pengaturan (`Settings`), pilih tab **AI**, lalu alihkan preferensi ke **Ollama (Lokal)**. Pastikan aplikasi Ollama aktif di laptop.
3. **Papan Sentuh Mengalami Salah Sentuh (Ghost Touch)?**  
   Aktifkan tombol pengunci viewport di pojok bawah untuk mencegah layar bergeser saat tangan bersandar di papan.

---
*Dokumen ini diterbitkan sebagai standar operasional resmi TRIDO Smartboard (Revisi 2026).*
