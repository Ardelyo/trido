import fs from 'fs';
import path from 'path';
import { generateAgentActionsVertex } from '../server/vertexAdapter';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const OUTPUT_FILE = path.join(DATA_DIR, 'trido_sft_master_v2.jsonl');

interface CurriculumItem {
  id: string;
  pillar: string;
  category: string;
  prompt: string;
  canvasObjects: any[];
  domElements: Record<string, any>;
  intent: 'creation' | 'modification' | 'question';
  forceTools: boolean;
}

const CURRICULUM: CurriculumItem[] = [
  // ─── PILLAR 1: PURE MERMAID MINDMAPS & IN-PLACE MUTATION ─────────
  {
    id: "p1_bio_photosynthesis",
    pillar: "Pillar 1: Mindmaps & In-Place",
    category: "STEM_BIOLOGY",
    prompt: "Buatkan mindmap komprehensif tentang Fotosintesis pada tumbuhan: jelaskan Reaksi Terang (tilakoid, fotolisis air, ATP/NADPH) dan Reaksi Gelap / Siklus Calvin (stroma, fiksasi CO2, glukosa). Letakkan di CENTER.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p1_chem_periodic_trends",
    pillar: "Pillar 1: Mindmaps & In-Place",
    category: "STEM_CHEMISTRY",
    prompt: "Buatkan peta konsep Sifat Keperiodikan Unsur (Jari-jari Atom, Energi Ionisasi, Afinitas Elektron, Keelektronegatifan) beserta kecenderungannya dalam satu periode dan satu golongan.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p1_phys_newton_laws",
    pillar: "Pillar 1: Mindmaps & In-Place",
    category: "STEM_PHYSICS",
    prompt: "Buatkan mindmap tentang Tiga Hukum Gerak Newton: Hukum I (Inersia), Hukum II (F = m*a), dan Hukum III (Aksi-Reaksi) beserta contoh fenomena dalam kehidupan sehari-hari.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p1_hist_indonesia_independence",
    pillar: "Pillar 1: Mindmaps & In-Place",
    category: "HUMANITIES_HISTORY",
    prompt: "Buatkan mindmap kronologi Sejarah Proklamasi Kemerdekaan Indonesia: Peristiwa Rengasdengklok, Perumusan Teks di Rumah Laksamana Maeda, hingga Pembacaan Teks 17 Agustus 1945.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p1_geo_plate_tectonics",
    pillar: "Pillar 1: Mindmaps & In-Place",
    category: "EARTH_GEOGRAPHY",
    prompt: "Buatkan peta konsep Lempeng Tektonik dan Batas Lempeng: Konvergen (subduksi, tabrakan), Divergen (pemekaran lantai samudera), dan Transform (sesar geser) beserta dampaknya (gempa bumi, gunung api).",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p1_inplace_circulatory_system",
    pillar: "Pillar 1: Mindmaps & In-Place",
    category: "INPLACE_MUTATION",
    prompt: "Ubah mindmap sistem peredaran darah yang sedang aktif di kanvas, tambahkan cabang baru tentang 'Komponen Darah': Sel Darah Merah (Eritrosit), Sel Darah Putih (Leukosit), Keping Darah (Trombosit), dan Plasma Darah. Ingat: perbarui mindmap yang ada, jangan buat baru!",
    canvasObjects: [
      {
        id: "mm_circ_01",
        type: "MERMAID_DIAGRAM",
        left: 400,
        top: 200,
        width: 650,
        height: 500,
        data: {
          title: "Sistem Peredaran Darah Manusia",
          code: "mindmap\n  root((Sistem Peredaran Darah))\n    Jantung\n      Serambi Kanan & Kiri\n      Bilik Kanan & Kiri\n    Pembuluh Darah\n      Arteri\n      Vena\n      Kapiler"
        }
      }
    ],
    domElements: {
      "mm_circ_01": {
        id: "mm_circ_01",
        componentType: "MERMAID_DIAGRAM",
        title: "Sistem Peredaran Darah Manusia"
      }
    },
    intent: "modification",
    forceTools: true
  },
  {
    id: "p1_inplace_solar_system",
    pillar: "Pillar 1: Mindmaps & In-Place",
    category: "INPLACE_MUTATION",
    prompt: "Perbarui mindmap Tata Surya di kanvas, tambahkan cabang 'Sabuk Asteroid' antara Mars dan Jupiter, serta cabang 'Objek Trans-Neptunus' (Pluto, Sabuk Kuiper). Edit in-place pada widget yang sudah ada!",
    canvasObjects: [
      {
        id: "mm_solar_01",
        type: "MERMAID_DIAGRAM",
        left: 350,
        top: 150,
        width: 700,
        height: 520,
        data: {
          title: "Sistem Tata Surya",
          code: "mindmap\n  root((Sistem Tata Surya))\n    Matahari\n    Planet Dalam\n      Merkurius\n      Venus\n      Bumi\n      Mars\n    Planet Luar\n      Jupiter\n      Saturnus\n      Uranus\n      Neptunus"
        }
      }
    ],
    domElements: {
      "mm_solar_01": {
        id: "mm_solar_01",
        componentType: "MERMAID_DIAGRAM",
        title: "Sistem Tata Surya"
      }
    },
    intent: "modification",
    forceTools: true
  },
  {
    id: "p1_lang_bahasa_indonesia",
    pillar: "Pillar 1: Mindmaps & In-Place",
    category: "LANGUAGE_ARTS",
    prompt: "Buatkan peta konsep Tata Bahasa Indonesia: Morfologi (Kata Dasar, Imbuhan/Afiksasi, Kata Ulang), Sintaksis (Subjek, Predikat, Objek, Keterangan), dan Semantik (Makna Denotatif dan Konotatif).",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },

  // ─── PILLAR 2: INTERACTIVE STEM SIMULATIONS (HTML5/CANVAS) ──────
  {
    id: "p2_sim_projectile_motion",
    pillar: "Pillar 2: STEM Simulations",
    category: "STEM_PHYSICS",
    prompt: "Buatkan simulasi fisika interaktif Gerak Parabola (Projectile Motion) di kanvas menggunakan HTML5 Canvas: sediakan slider kecepatan awal (v0), sudut elevasi (theta), dan gravitasi (g), tombol Tembak dan Reset, serta tampilkan ketinggian maksimum dan jarak jangkauan secara realtime.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p2_sim_acid_base_titration",
    pillar: "Pillar 2: STEM Simulations",
    category: "STEM_CHEMISTRY",
    prompt: "Buatkan simulasi kimia interaktif Titrasi Asam Basa (HCl dengan NaOH): tampilkan gambar labu erlenmeyer dengan indikator PP yang berubah warna dari bening menjadi merah muda saat titik ekuivalen pH 7 tercapai, slider tetesan volume NaOH, dan kurva kurva titrasi pH interaktif.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p2_sim_ideal_gas_piston",
    pillar: "Pillar 2: STEM Simulations",
    category: "STEM_PHYSICS",
    prompt: "Buatkan simulasi Hukum Gas Ideal PV = nRT: sebuah bejana piston dengan partikel gas bergerak acak di dalamnya, slider temperatur (T) dan slider volume/posisi piston (V), serta jarum pengukur tekanan (P) dinamis yang membuktikan hukum Boyle dan Gay-Lussac.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p2_sim_gravity_orbit",
    pillar: "Pillar 2: STEM Simulations",
    category: "STEM_PHYSICS",
    prompt: "Buatkan simulasi gravitasi dan orbit planet mengitari bintang pusat: partikel planet bergerak dalam orbit elips interaktif sesuai hukum Kepler, slider massa bintang dan kecepatan awal orbit.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p2_sim_wave_interference",
    pillar: "Pillar 2: STEM Simulations",
    category: "STEM_PHYSICS",
    prompt: "Buatkan simulasi interferensi gelombang dua sumber: gelombang sinus berosilasi interaktif dengan slider frekuensi dan panjang gelombang, menampilkan interferensi konstruktif (saling menguatkan) dan destruktif (saling meniadakan).",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p2_sim_quadratic_function",
    pillar: "Pillar 2: STEM Simulations",
    category: "STEM_MATH",
    prompt: "Buatkan grafik interaktif fungsi kuadrat y = ax^2 + bx + c: slider untuk koefisien a, b, dan c, canvas yang menggambar kurva parabola, titik puncak, dan nilai diskriminan D = b^2 - 4ac.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },

  // ─── PILLAR 3: MULTI-QUADRANT SPATIAL CLASSROOM ORCHESTRATION ────
  {
    id: "p3_morning_classroom_start",
    pillar: "Pillar 3: Spatial Orchestration",
    category: "CLASSROOM_MANAGEMENT",
    prompt: "Selamat pagi! Siapkan kelas IPA pagi ini: pasang checklist kehadiran murid (Andi, Budi, Citra, Dewi, Eko) di TOP_LEFT, timer 15 menit untuk ice breaking di TOP_RIGHT, dan mindmap pembuka tentang Rantai Makanan di CENTER.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p3_quiz_competition_layout",
    pillar: "Pillar 3: Spatial Orchestration",
    category: "CLASSROOM_MANAGEMENT",
    prompt: "Siapkan cerdas cermat fisika kelas: pasang papan skor kelompok di BOTTOM_RIGHT, timer 10 menit di TOP_RIGHT, dan kuis pilihan ganda tentang Hukum Kekekalan Energi di CENTER.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p3_math_solving_workspace",
    pillar: "Pillar 3: Spatial Orchestration",
    category: "STEM_MATH",
    prompt: "Bantu sesi pemecahan masalah kalkulus: pasang kalkulator di TOP_RIGHT, catatan rumus turunan di BOTTOM_LEFT, dan grafik matematika di CENTER.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },

  // ─── PILLAR 4: MULTILINGUAL UN OFFICIAL LANGUAGES ────────────────
  {
    id: "p4_un_arabic_digestion",
    pillar: "Pillar 4: UN Multilingual",
    category: "MULTILINGUAL_UN",
    prompt: "أنشئ خريطة ذهنية تعليمية باللغة العربية عن الجهاز الهضمي للإنسان: الفم، المريء، المعدة، الأمعاء الدقيقة، والأمعاء الغليظة.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p4_un_french_revolution",
    pillar: "Pillar 4: UN Multilingual",
    category: "MULTILINGUAL_UN",
    prompt: "Créez une carte mentale en français sur la Révolution française: Causes politiques et sociales, Prise de la Bastille (1789), et Déclaration des droits de l'homme et du citoyen.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p4_un_spanish_cell_respiration",
    pillar: "Pillar 4: UN Multilingual",
    category: "MULTILINGUAL_UN",
    prompt: "Crea un mapa mental educativo en español sobre la respiración celular: Glucólisis, Ciclo de Krebs, y Cadena de transporte de electrones.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p4_un_chinese_inventions",
    pillar: "Pillar 4: UN Multilingual",
    category: "MULTILINGUAL_UN",
    prompt: "用中文制作一个关于中国古代四大发明的思维导图：造纸术、印刷术、火药和指南针及其历史意义。",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p4_un_russian_solar_system",
    pillar: "Pillar 4: UN Multilingual",
    category: "MULTILINGUAL_UN",
    prompt: "Создайте образовательную интеллект-карту на русском языке о планетах Солнечной системы: планеты земной группы и газовые гиганты.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p4_un_english_plate_tectonics",
    pillar: "Pillar 4: UN Multilingual",
    category: "MULTILINGUAL_UN",
    prompt: "Create an interactive educational mindmap in English about Plate Tectonics: Convergent boundaries, Divergent boundaries, and Transform faults with geological consequences.",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },

  // ─── PILLAR 5: JEV SYSTEM 1 REFLEXES & PEDAGOGICAL PERSONA ──────
  {
    id: "p5_jev_instant_timer_open",
    pillar: "Pillar 5: Reflex & Pedagogy",
    category: "JEV_SYSTEM_ONE",
    prompt: "buka timer 5 menit",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p5_jev_instant_calc_open",
    pillar: "Pillar 5: Reflex & Pedagogy",
    category: "JEV_SYSTEM_ONE",
    prompt: "buka kalkulator",
    canvasObjects: [],
    domElements: {},
    intent: "creation",
    forceTools: true
  },
  {
    id: "p5_conversational_intro",
    pillar: "Pillar 5: Reflex & Pedagogy",
    category: "CONVERSATIONAL_PEDAGOGY",
    prompt: "Halo Trido! Siapa namamu, siapa pembuatmu, dan bagaimana caramu membantu saya mengajar di kelas hari ini?",
    canvasObjects: [],
    domElements: {},
    intent: "question",
    forceTools: false
  },
  {
    id: "p5_pedagogy_scaffolding",
    pillar: "Pillar 5: Reflex & Pedagogy",
    category: "CONVERSATIONAL_PEDAGOGY",
    prompt: "Murid saya masih bingung membedakan antara massa dan berat benda. Tolong berikan analogi sederhana yang bisa saya ceritakan kepada mereka.",
    canvasObjects: [],
    domElements: {},
    intent: "question",
    forceTools: false
  }
];

async function runDistillation() {
  console.log(`🚀 Starting Trido Golden Teacher Distillation (Gemini 3.8 Flash on Vertex AI)...`);
  console.log(`📚 Target scenarios: ${CURRICULUM.length}`);
  console.log(`💾 Output destination: ${OUTPUT_FILE}\n`);

  const results: any[] = [];
  let successCount = 0;

  for (let i = 0; i < CURRICULUM.length; i++) {
    const item = CURRICULUM[i];
    console.log(`[${i + 1}/${CURRICULUM.length}] Distilling [${item.category}] "${item.prompt.slice(0, 60)}..."`);

    try {
      const startTime = Date.now();
      const res = await generateAgentActionsVertex(
        item.prompt,
        "",
        item.canvasObjects,
        { width: 1440, height: 900 },
        null,
        [],
        undefined,
        item.domElements,
        item.intent,
        item.forceTools,
        undefined,
        "gemini-3.8-flash"
      );
      const latencyMs = Date.now() - startTime;

      // Quality Gate Validation
      const hasTools = Array.isArray(res.functionCalls) && res.functionCalls.length > 0;
      const cleanResponse = (res.textResponse || "").trim();

      const sampleRecord = {
        id: item.id,
        pillar: item.pillar,
        category: item.category,
        prompt: item.prompt,
        input_context: {
          canvasObjectsCount: item.canvasObjects.length,
          domElementsCount: Object.keys(item.domElements).length,
          intent: item.intent
        },
        ground_truth: {
          functionCalls: res.functionCalls,
          textResponse: cleanResponse,
          thought: res.thought || ""
        },
        teacher_metadata: {
          model: "gemini-3.8-flash",
          provider: "vertex_ai",
          latencyMs,
          timestamp: new Date().toISOString()
        }
      };

      results.push(sampleRecord);
      successCount++;
      console.log(`   ✅ Success (${latencyMs}ms): ${res.functionCalls.length} tool calls, ${cleanResponse.length} chars text`);

      // Polite pacing between Vertex API requests
      await new Promise(r => setTimeout(r, 1500));
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message || err}`);
    }
  }

  // Write out JSONL
  const jsonlContent = results.map(r => JSON.stringify(r)).join('\n') + '\n';
  fs.writeFileSync(OUTPUT_FILE, jsonlContent, 'utf-8');

  console.log(`\n🎉 Distillation Completed!`);
  console.log(`📊 Successfully generated ${successCount}/${CURRICULUM.length} verified teacher samples.`);
  console.log(`📁 Master dataset saved to: ${OUTPUT_FILE}`);
}

runDistillation().catch(console.error);
