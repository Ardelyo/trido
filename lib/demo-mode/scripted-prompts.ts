export interface ScriptedPrompt {
  id: string;
  // Multiple variations of the prompt yang bisa diucapkan guru
  triggers: string[]; 
  // Latency simulation in milliseconds (random between min-max)
  latency: { min: number; max: number };
  // Streaming speed (tokens per second)
  streamSpeed: number;
  // The actual response
  response: {
    type: 'markdown' | 'diagram' | 'worksheet' | 'quiz' | 'translation';
    content: string | object;
  };
  // Optional: trigger specific UI behavior
  uiAction?: 'highlight' | 'animate' | 'split-view';
}

export const SCRIPTED_PROMPTS: ScriptedPrompt[] = [
  // Demo 1: Analisis Chairil Anwar (Scene 4)
  {
    id: 'chairil-binatang-jalang',
    triggers: [
      "tampilkan analisis kata binatang jalang di puisi aku",
      "analisis frasa binatang jalang chairil anwar",
      "buatin analisis singkat tentang frasa binatang jalang",
      "kenapa chairil pilih kata binatang jalang",
    ],
    latency: { min: 12000, max: 18000 },
    streamSpeed: 40,
    response: {
      type: 'markdown',
      content: `# "Binatang Jalang" — Pilihan Diksi Chairil Anwar (1943)

## Konteks Historis
Era pendudukan Jepang di Indonesia. Kebebasan berekspresi sangat terbatas, sensor ketat terhadap karya yang dianggap melawan otoritas.

## Konotasi "Binatang"
- **Liar**: Tidak bisa dijinakkan oleh sistem
- **Di luar norma**: Menolak keteraturan yang dipaksakan  
- **Primal**: Kembali ke esensi sebelum diatur masyarakat

## Alternatif yang Chairil Tolak
| Pilihan | Mengapa Lemah |
|---------|---------------|
| "manusia bebas" | Terlalu sopan, masih dalam frame kemanusiaan |
| "jiwa merdeka" | Abstrak, tidak visceral |
| "pemberontak" | Klise, sudah politis |

## Mengapa "Binatang Jalang" Lebih Kuat
Chairil **menolak kemanusiaan yang dikekang**. Dengan menyebut diri "binatang", dia keluar dari sistem moral yang mengikat — bukan karena tidak bermoral, tapi karena moral itu sendiri sudah dikorupsi oleh penjajah.

> *"Aku ini binatang jalang / Dari kumpulannya terbuang"*

Frasa ini bukan menghina diri sendiri. Ini **deklarasi independensi spiritual**.`
    },
  },

  // Demo 2: Worksheet untuk Bagas (Scene 4)
  {
    id: 'puisi-aku-versi-sederhana',
    triggers: [
      "buatin versi puisi yang lebih sederhana plus tiga pertanyaan pemahaman",
      "versi sederhana puisi aku untuk siswa kesulitan baca",
      "untuk bagas buatin versi puisi yang lebih sederhana",
      "puisi aku versi mudah dengan pertanyaan dasar",
    ],
    latency: { min: 15000, max: 22000 },
    streamSpeed: 35,
    response: {
      type: 'worksheet',
      content: `# Puisi "Aku" — Versi Mudah Dipahami
*Untuk pemahaman dasar*

## Puisi Asli (Disederhanakan)

Aku ini seperti binatang liar
Yang dibuang dari kelompoknya
Walaupun terkena peluru,
Aku tetap akan terus maju
Aku ingin hidup seribu tahun lagi

---

## Apa Maksudnya?

Chairil Anwar menulis puisi ini untuk bilang:
- Dia tidak mau diatur oleh siapapun
- Dia tetap kuat walaupun banyak masalah
- Dia ingin terus berjuang dalam hidup

---

## 3 Pertanyaan Pemahaman

**1. Mengapa Chairil Anwar membandingkan dirinya dengan binatang liar?**

_Petunjuk: Pikirkan tentang bagaimana binatang liar tidak suka diatur._

**2. Apa yang penyair maksud dengan "ingin hidup seribu tahun lagi"?**

_Petunjuk: Ini bukan tentang umur, tapi tentang semangat._

**3. Coba ceritakan dengan kata-katamu sendiri: pesan apa yang ingin disampaikan Chairil Anwar?**

_Tidak ada jawaban salah — tulis apa yang kamu rasakan._

---

*✨ Tulis jawabanmu di buku tugas. Kamu bisa pakai bahasa yang santai.*`
    },
  },

  // Demo 3: Diagram Alur Sitti Nurbaya (Scene 5)
  {
    id: 'sitti-nurbaya-diagram',
    triggers: [
      "buatin diagram alur cerita sitti nurbaya",
      "dari halaman ini buat diagram alur cerita",
      "diagram karakter konflik klimaks sitti nurbaya",
    ],
    latency: { min: 18000, max: 25000 },
    streamSpeed: 30,
    response: {
      type: 'diagram',
      content: {
        title: 'Alur Cerita: Sitti Nurbaya (Marah Rusli, 1922)',
        nodes: [
          { id: 'pengenalan', label: 'Pengenalan', detail: 'Sitti Nurbaya & Samsulbahri saling mencintai. Hidup di Padang awal 1900-an.', position: { x: 100, y: 200 } },
          { id: 'konflik', label: 'Konflik Awal', detail: 'Ayah Nurbaya bangkrut karena ulah Datuk Maringgih.', position: { x: 300, y: 200 } },
          { id: 'pengorbanan', label: 'Pengorbanan', detail: 'Nurbaya menikah dengan Datuk Maringgih untuk menyelamatkan ayahnya.', position: { x: 500, y: 200 } },
          { id: 'klimaks', label: 'Klimaks', detail: 'Nurbaya diracun oleh Datuk Maringgih. Samsulbahri kembali sebagai tentara Belanda.', position: { x: 700, y: 200 } },
          { id: 'resolusi', label: 'Resolusi', detail: 'Samsulbahri & Datuk Maringgih saling membunuh. Tragedi kolonial selesai.', position: { x: 900, y: 200 } },
        ],
        edges: [
          { from: 'pengenalan', to: 'konflik', label: 'Masalah ekonomi muncul' },
          { from: 'konflik', to: 'pengorbanan', label: 'Tekanan keluarga' },
          { from: 'pengorbanan', to: 'klimaks', label: 'Kekerasan rumah tangga' },
          { from: 'klimaks', to: 'resolusi', label: 'Balas dendam' },
        ],
        themes: ['Kawin paksa', 'Kapitalisme kolonial', 'Perlawanan perempuan'],
      }
    },
  },

  // Demo 4: Terjemahan Bahasa Jawa (Scene 5)
  {
    id: 'terjemahan-bahasa-jawa',
    triggers: [
      "terjemahkan ringkasan ini ke bahasa jawa",
      "terjemahkan paragraf ini ke bahasa jawa untuk siswa",
      "translate ke bahasa jawa untuk siswa baru",
    ],
    latency: { min: 10000, max: 15000 },
    streamSpeed: 45,
    response: {
      type: 'translation',
      content: `# Ringkesan Crita "Sitti Nurbaya"
*Basa Jawa Ngoko Alus*

Sitti Nurbaya iku kenya saka Padang sing ayu lan pinter. Dheweke tresna marang Samsulbahri, kanca cilike. Nanging uripe owah amarga bapake bangkrut.

Kanggo nylametake bapake, Sitti Nurbaya kapeksa nikah karo Datuk Maringgih — wong sugih sing wis tuwa lan kejem. Dheweke ngorbanake katresnan kanggo kulawargane.

Crita iki ngandhakake babagan:
- **Kawin peksa** sing nyiksa wong wadon
- **Penjajahan** sing ngrusak ekonomi pribumi
- **Perlawanan** wong wadon marang sistem sing ora adil

---

*📝 Catetan kanggo guru: Terjemahan iki migunakake basa Jawa ngoko alus, cocok kanggo siswa SMA sing isih sinau basa formal.*`
    },
  },

  // Demo 5: Soal Pilihan Ganda Offline (Scene 6 — WIFI MOMENT!)
  {
    id: 'soal-pilihan-ganda-aku',
    triggers: [
      "buatin saya lima soal pilihan ganda tentang puisi aku",
      "buat 5 soal pilihan ganda puisi aku plus kunci jawaban",
      "soal pilihan ganda 5 tentang puisi aku chairil",
    ],
    latency: { min: 14000, max: 20000 },
    streamSpeed: 40,
    response: {
      type: 'quiz',
      content: `# Latihan Soal — Puisi "Aku" Karya Chairil Anwar

**Petunjuk:** Pilih jawaban yang paling tepat. Total 5 soal.

---

**1.** Puisi "Aku" ditulis Chairil Anwar pada tahun...
- A. 1942
- B. 1943
- C. 1945
- D. 1949

**2.** Frasa "binatang jalang" dalam puisi tersebut bermakna...
- A. Hewan yang sebenarnya
- B. Manusia yang kasar
- C. Pribadi yang menolak diatur sistem
- D. Orang yang tidak punya rumah

**3.** "Aku ingin hidup seribu tahun lagi" adalah ungkapan tentang...
- A. Keinginan umur panjang
- B. Semangat berkarya yang tidak pernah padam
- C. Ketakutan akan kematian
- D. Mimpi menjadi abadi

**4.** Puisi "Aku" termasuk angkatan sastra...
- A. Balai Pustaka
- B. Pujangga Baru
- C. Angkatan '45
- D. Angkatan '66

**5.** Tema utama puisi "Aku" adalah...
- A. Cinta tanah air
- B. Individualisme dan kebebasan diri
- C. Kerinduan pada kekasih
- D. Kekecewaan terhadap pemerintah

---

## 🔑 Kunci Jawaban

| No | Jawaban | Penjelasan Singkat |
|----|---------|---------------------|
| 1  | **B**   | Ditulis Maret 1943, era pendudukan Jepang |
| 2  | **C**   | Metafora untuk pribadi yang menolak konformitas |
| 3  | **B**   | Bukan tentang umur biologis, tapi semangat berkarya |
| 4  | **C**   | Chairil adalah pelopor Angkatan '45 |
| 5  | **B**   | Ekspresi individualisme khas Angkatan '45 |

---

*📋 Soal ini bisa langsung di-print atau dibagikan via WhatsApp grup kelas.*`
    },
  },
];

// Helper untuk fuzzy matching
export function findScriptedMatch(userInput: string): ScriptedPrompt | null {
  const normalized = userInput.toLowerCase().trim();
  
  for (const prompt of SCRIPTED_PROMPTS) {
    for (const trigger of prompt.triggers) {
      const similarity = calculateSimilarity(normalized, trigger.toLowerCase());
      if (similarity >= 0.70) { // 70% similarity threshold
        return prompt;
      }
    }
  }
  
  return null;
}

// Levenshtein-based similarity (atau gunakan library: string-similarity)
function calculateSimilarity(s1: string, s2: string): number {
  // Implementation: Jaccard similarity as suggested
  const tokens1 = new Set(s1.split(/\s+/));
  const tokens2 = new Set(s2.split(/\s+/));
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}
