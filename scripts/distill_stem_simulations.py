#!/usr/bin/env python3
"""
Trido STEM Interactive Simulation Distillation Engine
Distills interactive HTML5/Canvas/JavaScript simulations from Gemini 3.8 Flash (Vertex AI)
for local Trido models:
  1. Physics: Pendulum Motion with Gravity Slider (Ayunan Bandul)
  2. Physics: Ideal Gas Law (PV = nRT) Piston Simulation
  3. Chemistry: Acid-Base pH Titration Simulator
  4. Physics: Projectile Motion Trajectory (Gerak Parabola)
  5. Biology: Monohybrid Punnett Square Simulator
"""

import os
import json
import time
import urllib.request

GATEWAY_URL = "http://localhost:3000/api/ai/generate"
DISTILLED_DATASET_FILE = os.path.join(os.path.dirname(__file__), "trido_gemini_distilled_dataset.jsonl")

SIMULATION_PROMPTS = [
    {
        "id": "sim_physics_pendulum",
        "category": "STEM_SIMULATION_PHYSICS",
        "prompt": "Buatkan simulasi fisika interaktif di kanvas tentang Ayunan Bandul Sederhana (Simple Pendulum): sediakan canvas animasi bandul berayun, slider panjang tali L (1-5m), slider gravitasi g (1-20 m/s^2), tombol Pause/Play, dan tampilkan rumus periode T = 2*pi*sqrt(L/g) serta nilai periode realtime.",
    },
    {
        "id": "sim_physics_gas_law",
        "category": "STEM_SIMULATION_PHYSICS",
        "prompt": "Buatkan simulasi interaktif Hukum Gas Ideal P.V = n.R.T: tampilkan bejana tabung piston dengan partikel gas bergerak, slider suhu T dan slider volume V, serta manometer pengukur tekanan P yang berubah realtime sesuai rumus.",
    },
    {
        "id": "sim_chemistry_ph_titration",
        "category": "STEM_SIMULATION_CHEMISTRY",
        "prompt": "Buatkan simulasi kimia interaktif skala pH dan titrasi asam-basa: sediakan gelas beker berisi larutan dengan warna indikator yang berubah dinamis (merah untuk asam, hijau netral pH 7, ungu/biru untuk basa), slider penambahan larutan tetes demi tetes, dan kurva pH realtime.",
    },
    {
        "id": "sim_physics_projectile",
        "category": "STEM_SIMULATION_PHYSICS",
        "prompt": "Buatkan simulasi fisika gerak parabola (projectile motion): ada meriam penembak dengan slider sudut elevasi (0-90 derajat) dan slider kecepatan awal v0, tombol TEMBAK, lintasan peluru digambar di canvas, dan tampilkan jarak maksimum Xmax serta tinggi maksimum Hmax.",
    },
    {
        "id": "sim_biology_punnett",
        "category": "STEM_SIMULATION_BIOLOGY",
        "prompt": "Buatkan simulator interaktif biologi genetika Kotak Punnett (Punnett Square): pemilih alel induk jantan dan betina (misal: Bb x Bb), tabel 2x2 interaktif, dan grafik persentase rasio genotipe (BB, Bb, bb) serta fenotipe.",
    }
]

def query_gemini_teacher(item):
    payload = {
        "prompt": item["prompt"],
        "canvasImageBase64": "",
        "canvasObjects": [],
        "viewport": {"width": 1440, "height": 900},
        "history": [],
        "domElements": {},
        "aiPreference": "vertex"
    }

    req = urllib.request.Request(
        GATEWAY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        start_time = time.time()
        with urllib.request.urlopen(req, timeout=120) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            latency = time.time() - start_time
            return res_data, latency
    except Exception as e:
        print(f"❌ Error distilling {item['id']}: {e}")
        return None, 0

def main():
    print("=" * 80)
    print("DISTILLING STEM INTERACTIVE SIMULATIONS FROM GEMINI 3.8 FLASH")
    print("Target Output: Interactive Canvas HTML/JS Simulation Widgets")
    print(f"Dataset File: {DISTILLED_DATASET_FILE}")
    print("=" * 80)

    for i, item in enumerate(SIMULATION_PROMPTS):
        print(f"\n▶ [{i+1}/{len(SIMULATION_PROMPTS)}] Distilling {item['id']} ({item['category']})...")
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

        training_sample = {
            "id": f"distilled_{item['id']}",
            "category": item["category"],
            "teacher": "gemini-3.8-flash",
            "prompt": item["prompt"],
            "canvasObjects": [],
            "domElements": {},
            "teacher_output": {
                "textResponse": text_resp,
                "functionCalls": func_calls
            },
            "messages": [
                {
                    "role": "system",
                    "content": "You are TRIDO, the autonomous spatial AI smartboard co-worker for classroom education. You can generate interactive HTML/JS physics and chemistry simulations using STEM_SIMULATION widgets."
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

        with open(DISTILLED_DATASET_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(training_sample, ensure_ascii=False) + "\n")

        time.sleep(1)

    print("\n" + "=" * 80)
    print("🎉 STEM SIMULATION DISTILLATION COMPLETE!")
    print("=" * 80)

if __name__ == "__main__":
    main()
