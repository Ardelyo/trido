#!/usr/bin/env python3
"""
Trido SFT Dataset Generator for Gemma-2-2B-it / Gemma-4 Fine-Tuning.
Generates multi-turn teacher prompts paired with precise Trido tool calls (render_mermaid, update_component, etc.).
"""

import json
import os

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "trido_sft_dataset.jsonl")

EXAMPLES = [
    {
        "instruction": "Buatkan mindmap tentang sistem pernapasan manusia untuk kelas 8.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "output": json.dumps({
            "name": "render_mermaid",
            "args": {
                "title": "Sistem Pernapasan Manusia",
                "gridPosition": "CENTER",
                "code": "mindmap\n  root((Sistem Pernapasan))\n    Hidung\n      Penyaring debu\n      Pengatur suhu\n    Faring & Laring\n      Pita suara\n    Trakea\n      Silia pembersih\n    Bronkus & Bronkiolus\n      Percabangan\n    Alveolus\n      Pertukaran O2 dan CO2"
            }
        }, ensure_ascii=False)
    },
    {
        "instruction": "Ubah mindmap pernapasan tadi, tambahkan detail tentang diafragma dan mekanisme bernapas.",
        "canvas_context": "Viewport: 1440x900px, Interactive: - [web_mermaid_1] MERMAID_DIAGRAM \"Sistem Pernapasan Manusia\"\n    Code: mindmap root((Sistem Pernapasan)) Hidung Faring Trakea Bronkus Alveolus",
        "output": json.dumps({
            "name": "update_component",
            "args": {
                "objectId": "web_mermaid_1",
                "componentTitle": "Sistem Pernapasan Manusia",
                "action": "REPLACE",
                "configJson": json.dumps({
                    "title": "Sistem Pernapasan Manusia",
                    "code": "mindmap\n  root((Sistem Pernapasan))\n    Hidung\n      Penyaring debu\n      Pengatur suhu\n    Faring & Laring\n      Pita suara\n    Trakea\n      Silia pembersih\n    Bronkus & Bronkiolus\n      Percabangan\n    Alveolus\n      Pertukaran O2 dan CO2\n    Mekanisme Bernapas\n      Inspirasi\n        Diafragma mendatar\n      Ekspirasi\n        Diafragma relaksasi"
                })
            }
        }, ensure_ascii=False)
    },
    {
        "instruction": "Pasang timer 10 menit untuk diskusi kelompok di pojok kanan atas.",
        "canvas_context": "Viewport: 1440x900px, Existing: - [web_mermaid_1] MERMAID_DIAGRAM",
        "output": json.dumps({
            "name": "add_component",
            "args": {
                "componentType": "TIMER",
                "gridPosition": "TOP_RIGHT",
                "configJson": json.dumps({
                    "title": "Waktu Diskusi Kelompok",
                    "seconds": 600,
                    "mode": "TIMER",
                    "isRunning": True,
                    "isVisualPie": True
                })
            }
        }, ensure_ascii=False)
    },
    {
        "instruction": "Buatkan daftar hadir absensi untuk 5 siswa: Budi, Siti, Andi, Dewi, dan Farhan.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "output": json.dumps({
            "name": "add_component",
            "args": {
                "componentType": "ATTENDANCE",
                "gridPosition": "TOP_LEFT",
                "configJson": json.dumps({
                    "title": "Presensi Kelas",
                    "students": [
                        {"id": "s1", "name": "Budi", "status": "H"},
                        {"id": "s2", "name": "Siti", "status": "H"},
                        {"id": "s3", "name": "Andi", "status": "H"},
                        {"id": "s4", "name": "Dewi", "status": "H"},
                        {"id": "s5", "name": "Farhan", "status": "H"}
                    ]
                })
            }
        }, ensure_ascii=False)
    },
    {
        "instruction": "Create a concept mindmap about Photosynthesis in English.",
        "canvas_context": "Viewport: 1440x900px, Existing: (empty)",
        "output": json.dumps({
            "name": "render_mermaid",
            "args": {
                "title": "Photosynthesis Concept Map",
                "gridPosition": "CENTER",
                "code": "mindmap\n  root((Photosynthesis))\n    Inputs\n      Sunlight\n      Water H2O\n      Carbon Dioxide CO2\n    Stages\n      Light Reactions\n        Thylakoid\n        Produces ATP and NADPH\n      Calvin Cycle\n        Stroma\n        Carbon Fixation\n    Outputs\n      Glucose C6H12O6\n      Oxygen O2"
            }
        }, ensure_ascii=False)
    }
]

def main():
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for ex in EXAMPLES:
            entry = {
                "messages": [
                    {
                        "role": "system",
                        "content": "You are Trido AI smartboard assistant. Output strict JSON function calls for educational whiteboard manipulation."
                    },
                    {
                        "role": "user",
                        "content": f"{ex['canvas_context']}\nUser prompt: {ex['instruction']}"
                    },
                    {
                        "role": "assistant",
                        "content": ex['output']
                    }
                ]
            }
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"Dataset generated with {len(EXAMPLES)} samples at: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
