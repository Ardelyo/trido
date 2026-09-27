#!/usr/bin/env python3
"""
Trido Knowledge Distillation Engine: Gemini 3.8 Flash -> Trido Local SLMs
Leverages Gemini 3.8 Flash (via Vertex AI Cloud) as the Frontier Teacher to generate
ground-truth pedagogical training data for Trido local models.

Focus: Extreme Accuracy, Zero Hallucinations, Spatial Quadrant Precision, KaTeX LaTeX,
Continuous In-Place Mutation, and UN Multilingual Fluency.
"""

import os
import json
import time
import urllib.request
import urllib.error

GATEWAY_URL = "http://localhost:3000/api/ai/generate"
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)
DISTILLED_DATASET_FILE = os.path.join(DATA_DIR, "trido_gemini_distilled_dataset.jsonl")

# Diverse high-depth pedagogical curriculum prompts
CURRICULUM_PROMPTS = [
    {
        "id": "stem_physics_thermo",
        "category": "STEM_PHYSICS",
        "prompt": "Buatkan rencana pembelajaran fisika SMA kelas 11 tentang Termodinamika: 1) Pasang timer 20 menit di TOP_RIGHT, 2) Buatkan mindmap 4 proses termodinamika (Isotermal, Isobarik, Isokhorik, Adiabatik) di CENTER, 3) Buatkan dokumen rumus usaha W dan hukum 1 termodinamika Delta U = Q - W dalam KaTeX di BOTTOM_CENTER.",
        "canvasObjects": [],
        "domElements": {}
    },
    {
        "id": "stem_chemistry_equilibrium",
        "category": "STEM_CHEMISTRY",
        "prompt": "Ajarkan materi Kesetimbangan Kimia: buatkan mindmap faktor-faktor yang mempengaruhi pergeseran kesetimbangan menurut Asas Le Chatelier (konsentrasi, suhu, tekanan, volume).",
        "canvasObjects": [],
        "domElements": {}
    },
    {
        "id": "stem_calculus_derivatives",
        "category": "STEM_MATH",
        "prompt": "Buatkan dokumen catatan pembelajaran tentang Turunan Fungsi Aljabar beserta rumus dasar d/dx [x^n] = n*x^(n-1) dan aturan rantai (chain rule) dalam notasi LaTeX yang rapi.",
        "canvasObjects": [],
        "domElements": {}
    },
    {
        "id": "stem_biology_genetics",
        "category": "STEM_BIOLOGY",
        "prompt": "Buatkan mindmap terstruktur tentang Hukum Pewarisan Sifat Mendel (Hukum I Mendel: Segregasi dan Hukum II Mendel: Asortasi Bebas) untuk biologi kelas 12.",
        "canvasObjects": [],
        "domElements": {}
    },
    {
        "id": "classroom_orchestration_morning",
        "category": "CLASSROOM_MANAGEMENT",
        "prompt": "Mulai kelas pagi ini: siapkan absensi 5 murid (Farhan, Gita, Hani, Iqbal, Jihan) di TOP_LEFT, timer visual 15 menit di TOP_RIGHT, dan mindmap pembuka tentang Ekosistem Hutan Hujan Tropis di CENTER.",
        "canvasObjects": [],
        "domElements": {}
    },
    {
        "id": "inplace_mutation_circulatory",
        "category": "INPLACE_MUTATION",
        "prompt": "Ubah mindmap sistem peredaran darah yang sedang aktif di kanvas, tambahkan cabang baru tentang 'Komponen Darah': Eritrosit, Leukosit, Trombosit, dan Plasma Darah.",
        "canvasObjects": [
            {
                "id": "web_mm_circ",
                "type": "MERMAID_DIAGRAM",
                "left": 400,
                "top": 200,
                "width": 600,
                "height": 450,
                "data": {
                    "title": "Sistem Peredaran Darah",
                    "code": "mindmap\n  root((Sistem Peredaran Darah))\n    Jantung\n      Serambi\n      Bilik\n    Pembuluh Darah\n      Arteri\n      Vena\n      Kapiler"
                }
            }
        ],
        "domElements": {
            "web_mm_circ": {
                "id": "web_mm_circ",
                "type": "MERMAID_DIAGRAM",
                "title": "Sistem Peredaran Darah"
            }
        }
    },
    {
        "id": "inplace_mutation_astronomy",
        "category": "INPLACE_MUTATION",
        "prompt": "Perbarui mindmap Tata Surya di kanvas, tambahkan detail tentang Sabuk Asteroid dan Planet Kerdil (Pluto, Ceres, Eris). Jangan buat baru!",
        "canvasObjects": [
            {
                "id": "web_mm_solar",
                "type": "MERMAID_DIAGRAM",
                "left": 350,
                "top": 150,
                "width": 650,
                "height": 480,
                "data": {
                    "title": "Sistem Tata Surya",
                    "code": "mindmap\n  root((Tata Surya))\n    Matahari\n    Planet Dalam\n      Merkurius\n      Venus\n      Bumi\n      Mars\n    Planet Luar\n      Jupiter\n      Saturnus\n      Uranus\n      Neptunus"
                }
            }
        ],
        "domElements": {
            "web_mm_solar": {
                "id": "web_mm_solar",
                "type": "MERMAID_DIAGRAM",
                "title": "Sistem Tata Surya"
            }
        }
    },
    {
        "id": "un_arabic_sciences",
        "category": "MULTILINGUAL_UN",
        "prompt": "أنشئ خريطة ذهنية تعليمية باللغة العربية عن دورة الماء في الطبيعة: التبخر، التكاثف، الهطول، والجريان السطحي",
        "canvasObjects": [],
        "domElements": {}
    },
    {
        "id": "un_french_revolution",
        "category": "MULTILINGUAL_UN",
        "prompt": "Créez une carte mentale en français sur la Révolution française: Causes (sociales, économiques), Événements clés (Prise de la Bastille), et Conséquences (Déclaration des droits de l'homme).",
        "canvasObjects": [],
        "domElements": {}
    },
    {
        "id": "interactive_quiz_carnot",
        "category": "INTERACTIVE_EVALUATION",
        "prompt": "Buatkan 1 kuis interaktif pilihan ganda di kanvas tentang efisiensi mesin Carnot dengan 4 pilihan jawaban dan penjelasan pedagogis yang mendalam.",
        "canvasObjects": [],
        "domElements": {}
    }
]

def query_gemini_teacher(item):
    """Queries Gemini 3.8 Flash via Vertex AI Cloud on Trido Gateway."""
    payload = {
        "prompt": item["prompt"],
        "canvasImageBase64": "",
        "canvasObjects": item["canvasObjects"],
        "viewport": {"width": 1440, "height": 900},
        "history": [],
        "domElements": item["domElements"],
        "aiPreference": "vertex"
    }

    req = urllib.request.Request(
        GATEWAY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        start_time = time.time()
        with urllib.request.urlopen(req, timeout=90) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            latency = time.time() - start_time
            return res_data, latency
    except Exception as e:
        print(f"❌ Error querying Gemini teacher for {item['id']}: {e}")
        return None, 0

def main():
    print("=" * 80)
    print("TRIDO KNOWLEDGE DISTILLATION: GEMINI 3.8 FLASH -> TRIDO LOCAL SLM")
    print("Teacher Model: gemini-3.8-flash (Google Cloud Vertex AI)")
    print("Focus: High Accuracy, Zero Hallucination, KaTeX Formats, In-Place Mutation")
    print(f"Output Target: {DISTILLED_DATASET_FILE}")
    print("=" * 80)

    distilled_records = []

    for i, item in enumerate(CURRICULUM_PROMPTS):
        print(f"\n▶ [{i+1}/{len(CURRICULUM_PROMPTS)}] Distilling {item['id']} ({item['category']})...")
        print(f"  Prompt: {item['prompt'][:75]}...")

        teacher_res, latency = query_gemini_teacher(item)
        if not teacher_res:
            print("  ⚠️ Skipped due to query error.")
            continue

        func_calls = teacher_res.get("functionCalls", [])
        text_resp = teacher_res.get("textResponse", "")

        print(f"  ✅ Teacher Response in {latency:.2f}s | Function Calls: {len(func_calls)}")
        for fc in func_calls:
            print(f"     - Tool: {fc.get('name')} | Args: {list(fc.get('args', {}).keys())}")

        # Construct SFT Training Sample
        training_sample = {
            "id": f"distilled_{item['id']}",
            "category": item["category"],
            "teacher": "gemini-3.8-flash",
            "prompt": item["prompt"],
            "canvasObjects": item["canvasObjects"],
            "domElements": item["domElements"],
            "teacher_output": {
                "textResponse": text_resp,
                "functionCalls": func_calls
            },
            # Formatted conversation for SFT / Modelfile training
            "messages": [
                {
                    "role": "system",
                    "content": "You are TRIDO, the autonomous spatial AI smartboard co-worker for classroom education created by Ardellio Satria Anindito. Always prioritize in-place mutations (update_component) over widget recreation. Generate pure Mermaid for mindmaps and KaTeX for formulas."
                },
                {
                    "role": "user",
                    "content": item["prompt"]
                },
                {
                    "role": "assistant",
                    "content": json.dumps({
                        "textResponse": text_resp,
                        "functionCalls": func_calls
                    }, ensure_ascii=False)
                }
            ]
        }

        distilled_records.append(training_sample)

        # Write incrementally so no data is lost
        with open(DISTILLED_DATASET_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(training_sample, ensure_ascii=False) + "\n")

        time.sleep(1) # Brief cooldown between teacher calls

    print("\n" + "=" * 80)
    print(f"🎉 DISTILLATION COMPLETE! Total golden samples captured: {len(distilled_records)}")
    print(f"File saved: {DISTILLED_DATASET_FILE}")
    print("=" * 80)

if __name__ == "__main__":
    main()
