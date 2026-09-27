#!/usr/bin/env python3
"""
Trido SFT Dataset Generator (Production Edition)
Generates high-quality training samples for fine-tuning Gemma 2B / Gemma 4:e2b for the Trido AI Smartboard.

Covers the 4 Core Pillars:
1. In-Place Mutation & Continuous State (40%)
2. Pure Mermaid Mindmaps & Classroom Widgets (30%)
3. Multi-Task & Parallel Tool Orchestration (15%)
4. Pure Pedagogical Dialogue / Negative Examples (15%)
"""

import json
import os

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "trido_sft_dataset.jsonl")

DATASET_ENTRIES = [
    # ── PILLAR 1: IN-PLACE MUTATION & CONTINUOUS WHITEBOARD STATE ─────────────────
    {
        "user_prompt": "Tolong ubah mindmap fotosintesis tadi, tambahkan reaksi gelap dan siklus Calvin.",
        "canvas_context": "Viewport: 1440x900px, Interactive: - [mm_photo_1] MERMAID_DIAGRAM \"Fotosintesis\"\n    Code: mindmap root((Fotosintesis)) Reaksi Terang Klorofil",
        "expected_tool": "update_component",
        "expected_args": {
            "objectId": "mm_photo_1",
            "componentTitle": "Fotosintesis",
            "action": "REPLACE",
            "configJson": json.dumps({
                "title": "Fotosintesis Lengkap",
                "code": "mindmap\n  root((Fotosintesis))\n    Reaksi Terang\n      Klorofil\n      Eksitasi Elektron\n      Fotolisis Air\n    Reaksi Gelap\n      Stroma\n      Siklus Calvin\n      Fiksasi CO2"
            })
        }
    },
    {
        "user_prompt": "Tambahkan cabang respirasi anaerob (fermentasi asam laktat dan alkohol) ke peta konsep pernapasan.",
        "canvas_context": "Viewport: 1440x900px, Interactive: - [mm_resp_2] MERMAID_DIAGRAM \"Sistem Respirasi Seluler\"\n    Code: mindmap root((Respirasi)) Glikolisis Siklus Krebs Rantai Transpor",
        "expected_tool": "update_component",
        "expected_args": {
            "objectId": "mm_resp_2",
            "componentTitle": "Sistem Respirasi Seluler",
            "action": "REPLACE",
            "configJson": json.dumps({
                "title": "Sistem Respirasi Seluler",
                "code": "mindmap\n  root((Respirasi))\n    Aerob\n      Glikolisis\n      Siklus Krebs\n      Rantai Transpor\n    Anaerob (Fermentasi)\n      Asam Laktat\n      Alkohol"
            })
        }
    },
    {
        "user_prompt": "Ubah timer diskusi menjadi 15 menit dan langsung jalankan.",
        "canvas_context": "Viewport: 1440x900px, Interactive: - [timer_1] TIMER \"Waktu Pengerjaan\" (seconds: 300, isRunning: false)",
        "expected_tool": "update_component",
        "expected_args": {
            "objectId": "timer_1",
            "componentTitle": "Waktu Pengerjaan",
            "action": "REPLACE",
            "configJson": json.dumps({
                "title": "Waktu Diskusi",
                "seconds": 900,
                "mode": "TIMER",
                "isRunning": True,
                "isVisualPie": True
            })
        }
    },
    {
        "user_prompt": "Siswa Andi dan Dewi baru saja hadir, perbarui presensi kelas.",
        "canvas_context": "Viewport: 1440x900px, Interactive: - [att_1] ATTENDANCE \"Presensi Kelas\"\n    Students: Budi(H), Siti(H), Andi(A), Dewi(A)",
        "expected_tool": "update_component",
        "expected_args": {
            "objectId": "att_1",
            "componentTitle": "Presensi Kelas",
            "action": "REPLACE",
            "configJson": json.dumps({
                "title": "Presensi Kelas",
                "students": [
                    {"id": "s1", "name": "Budi", "status": "H"},
                    {"id": "s2", "name": "Siti", "status": "H"},
                    {"id": "s3", "name": "Andi", "status": "H"},
                    {"id": "s4", "name": "Dewi", "status": "H"}
                ]
            })
        }
    },
    {
        "user_prompt": "Tolong beri catatan rumus gaya berat W = m x g di bawah materi hukum Newton.",
        "canvas_context": "Viewport: 1440x900px, Interactive: - [note_newton] MARKDOWN_NOTE \"Hukum Newton\"\n    Preview: Hukum I, II, dan III Newton...",
        "expected_tool": "update_component",
        "expected_args": {
            "objectId": "note_newton",
            "componentTitle": "Hukum Newton",
            "action": "APPEND",
            "configJson": json.dumps({
                "markdown": "\n\n### Rumus Gaya Berat\n$$W = m \\times g$$\n- $W$: Gaya berat (N)\n- $m$: Massa benda (kg)\n- $g$: Percepatan gravitasi ($9.8\\text{ m/s}^2$)"
            })
        }
    },

    # ── PILLAR 2: PURE MERMAID MINDMAPS & INTERACTIVE WIDGETS ─────────────────────
    {
        "user_prompt": "Buatkan peta konsep tentang Tata Surya untuk pelajaran IPA kelas 7.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "expected_tool": "render_mermaid",
        "expected_args": {
            "title": "Peta Konsep Tata Surya",
            "gridPosition": "CENTER",
            "code": "mindmap\n  root((Tata Surya))\n    Matahari\n      Pusat Tata Surya\n      Sumber Energi\n    Planet Dalam\n      Merkurius\n      Venus\n      Bumi\n      Mars\n    Planet Luar\n      Yupiter\n      Saturnus\n      Uranus\n      Neptunus\n    Benda Langit Lain\n      Asteroid\n      Komet\n      Meteoroid"
        }
    },
    {
        "user_prompt": "Buatkan diagram alur (flowchart) siklus air (hidrologi) dari evaporasi sampai presipitasi.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "expected_tool": "render_mermaid",
        "expected_args": {
            "title": "Siklus Hidrologi",
            "gridPosition": "CENTER",
            "code": "flowchart TD\n  A[Air Permukaan: Laut & Danau] -->|Evaporasi| B[Uap Air di Atmosfer]\n  C[Tumbuhan] -->|Transpirasi| B\n  B -->|Kondensasi| D[Awan]\n  D -->|Presipitasi: Hujan| E[Permukaan Bumi]\n  E -->|Infiltrasi & Aliran Permukaan| A"
        }
    },
    {
        "user_prompt": "Buat kuis pilihan ganda 3 soal tentang Hukum Newton.",
        "canvas_context": "Viewport: 1440x900px, Existing: - [note_newton] MARKDOWN_NOTE",
        "expected_tool": "add_component",
        "expected_args": {
            "componentType": "QUIZ_MULTIPLE_CHOICE",
            "gridPosition": "CENTER_RIGHT",
            "configJson": json.dumps({
                "title": "Kuis Hukum Newton",
                "question": "Sebuah balok ditarik dengan gaya 20 N pada permukaan licin. Jika massa balok 4 kg, percepatannya adalah...",
                "options": ["2 m/s²", "4 m/s²", "5 m/s²", "8 m/s²"],
                "correctAnswer": 2,
                "explanation": "Berdasarkan Hukum II Newton: a = F / m = 20 / 4 = 5 m/s²."
            })
        }
    },
    {
        "user_prompt": "Buka papan daftar tugas kelas untuk persiapan ujian.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "expected_tool": "add_component",
        "expected_args": {
            "componentType": "TODOLIST",
            "gridPosition": "CENTER_LEFT",
            "configJson": json.dumps({
                "title": "Agenda Persiapan Ujian",
                "tasks": [
                    {"id": "t1", "text": "Membahas soal tahun lalu", "completed": False},
                    {"id": "t2", "text": "Rangkuman bab 1 - 4", "completed": False},
                    {"id": "t3", "text": "Latihan mandiri 15 soal", "completed": False}
                ]
            })
        }
    },
    {
        "user_prompt": "Buat mindmap tentang jenis-jenis kata dalam Bahasa Indonesia.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "expected_tool": "render_mermaid",
        "expected_args": {
            "title": "Kelas Kata Bahasa Indonesia",
            "gridPosition": "CENTER",
            "code": "mindmap\n  root((Kelas Kata))\n    Verba (Kata Kerja)\n      Transitif\n      Intransitif\n    Nomina (Kata Benda)\n      Konkret\n      Abstrak\n    Adjektiva (Kata Sifat)\n    Pronomina (Kata Ganti)\n      Orang\n      Penunjuk\n    Numeralia (Kata Bilangan)\n    Kata Tugas\n      Preposisi\n      Konjungsi"
        }
    },

    # ── PILLAR 3: MULTI-TASK & PARALLEL TOOL ORCHESTRATION ────────────────────────
    {
        "user_prompt": "Mulai sesi pelajaran: buatkan daftar hadir 4 murid (Ahmad, Bima, Citra, Dina), setel timer 20 menit, dan gambarkan mindmap pembuka tentang Ekosistem.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "multi_tools": [
            {
                "name": "add_component",
                "args": {
                    "componentType": "ATTENDANCE",
                    "gridPosition": "TOP_LEFT",
                    "configJson": json.dumps({
                        "title": "Presensi Kelas",
                        "students": [
                            {"id": "s1", "name": "Ahmad", "status": "H"},
                            {"id": "s2", "name": "Bima", "status": "H"},
                            {"id": "s3", "name": "Citra", "status": "H"},
                            {"id": "s4", "name": "Dina", "status": "H"}
                        ]
                    })
                }
            },
            {
                "name": "add_component",
                "args": {
                    "componentType": "TIMER",
                    "gridPosition": "TOP_RIGHT",
                    "configJson": json.dumps({
                        "title": "Sesi Ekosistem",
                        "seconds": 1200,
                        "mode": "TIMER",
                        "isRunning": True,
                        "isVisualPie": True
                    })
                }
            },
            {
                "name": "render_mermaid",
                "args": {
                    "title": "Komponen Ekosistem",
                    "gridPosition": "CENTER",
                    "code": "mindmap\n  root((Ekosistem))\n    Biotik\n      Produsen\n      Konsumen\n      Dekomposer\n    Abiotik\n      Cahaya Matahari\n      Air & Udara\n      Tanah & Suhu"
                }
            }
        ]
    },

    # ── PILLAR 4: PURE PEDAGOGICAL DIALOGUE (NO UNREQUESTED TOOLS) ────────────────
    {
        "user_prompt": "Bagaimana tips mengajar konsep pecahan agar murid kelas 4 SD mudah paham tanpa bingung pembilang dan penyebut?",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "expected_text": "Untuk mengenalkan konsep pecahan pada anak kelas 4 SD:\n1. **Gunakan analogi benda nyata:** Bayangkan pizza atau kue martabak utuh yang dipotong 4 bagian sama besar. 1 potong yang dimakan adalah 1/4.\n2. **Kaitkan dengan bahasa sehari-hari:** Pembilang (angka atas) menunjukkan 'berapa potong yang kita punya/ambil', sedangkan Penyebut (angka bawah) menunjukkan 'total semua potongan kue'.\n3. **Visualisasi bertahap:** Awali dengan gambar lingkaran atau balok warna sebelum beralih ke angka pecahan abstrak.\n\nApakah Anda ingin saya buatkan diagram visual pecahan di whiteboard?"
    },
    {
        "user_prompt": "Jelaskan perbedaan mendasar antara mitosis dan meiosis secara ringkas.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "expected_text": "Perbedaan mendasar antara Mitosis dan Meiosis:\n\n1. **Tujuan:** Mitosis untuk pertumbuhan dan perbaikan sel tubuh (somatis), sedangkan Meiosis untuk pembentukan sel gamet (sperma dan ovum).\n2. **Jumlah Pembelahan:** Mitosis membelah 1 kali (menghasilkan 2 sel anak diploid 2n), sedangkan Meiosis membelah 2 kali (menghasilkan 4 sel anak haploid n).\n3. **Variasi Genetik:** Sel anak mitosis identik secara genetik dengan induk, sedangkan meiosis menghasilkan rekombinasi genetik melalui crossing over.\n\nMau saya buatkan tabel perbandingan visual di papan tulis?"
    },

    # ── MULTILINGUAL UN LANGUAGES SAMPLES ─────────────────────────────────────────
    {
        "user_prompt": "Create an interactive concept map about cell biology in English.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "expected_tool": "render_mermaid",
        "expected_args": {
            "title": "Cell Biology Concept Map",
            "gridPosition": "CENTER",
            "code": "mindmap\n  root((Cell Biology))\n    Prokaryotes\n      Bacteria\n      Archaea\n      No Nucleus\n    Eukaryotes\n      Animal Cells\n        Mitochondria\n        Nucleus\n      Plant Cells\n        Chloroplast\n        Cell Wall\n        Vacuole"
        }
    },
    {
        "user_prompt": "أنشئ خريطة ذهنية عن أركان الإسلام الخمسة",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "expected_tool": "render_mermaid",
        "expected_args": {
            "title": "أركان الإسلام الخمسة",
            "gridPosition": "CENTER",
            "code": "mindmap\n  root((أركان الإسلام))\n    الشهادتان\n    إقامة الصلاة\n    إيتاء الزكاة\n    صوم رمضان\n    حج البيت"
        }
    },
    {
        "user_prompt": "Créez une carte mentale des principes de la Révolution Française en Français.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "expected_tool": "render_mermaid",
        "expected_args": {
            "title": "La Révolution Française",
            "gridPosition": "CENTER",
            "code": "mindmap\n  root((Révolution Française))\n    Liberté\n      Liberté d'expression\n      Fin des privilèges\n    Égalité\n      Devant la loi\n      Fiscale\n    Fraternité\n      Unité nationale\n      Solidarité"
        }
    }
]

def generate_sample(entry):
    system_prompt = (
        "You are Trido — an intelligent, continuous AI smartboard assistant for educators.\n"
        "RULES:\n"
        "1. For visual diagrams and mindmaps, output render_mermaid (syntax: mindmap or flowchart).\n"
        "2. If a diagram already exists on canvas, use update_component to modify or expand it in-place.\n"
        "3. Output valid function call JSON format."
    )

    user_content = f"{entry['canvas_context']}\nUser prompt: {entry['user_prompt']}"

    if "multi_tools" in entry:
        calls = entry["multi_tools"]
        assistant_content = json.dumps({"functionCalls": calls}, ensure_ascii=False)
    elif "expected_tool" in entry:
        calls = [{"name": entry["expected_tool"], "args": entry["expected_args"]}]
        assistant_content = json.dumps({"functionCalls": calls}, ensure_ascii=False)
    else:
        assistant_content = json.dumps({"textResponse": entry.get("expected_text", "")}, ensure_ascii=False)

    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
            {"role": "assistant", "content": assistant_content}
        ]
    }

def main():
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for entry in DATASET_ENTRIES:
            sample = generate_sample(entry)
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")

    print(f"✅ SFT Dataset successfully generated: {OUTPUT_FILE} ({len(DATASET_ENTRIES)} curated samples)")

if __name__ == "__main__":
    main()
