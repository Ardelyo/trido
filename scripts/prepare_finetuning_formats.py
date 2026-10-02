#!/usr/bin/env python3
"""
Trido SFT Dataset Converter:
Converts the master distilled dataset into industry-standard SFT formats:
1. ChatML format (for Unsloth, Hugging Face, LLaMA-Factory)
2. Alpaca format (for Axolotl, LoRA, QLoRA)
3. ShareGPT format
"""

import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MASTER_V2 = os.path.join(DATA_DIR, "trido_sft_master_v2.jsonl")
MASTER_V1 = os.path.join(DATA_DIR, "trido_gemini_distilled_dataset.jsonl")

CHATML_OUT = os.path.join(DATA_DIR, "trido_sft_chatml.jsonl")
ALPACA_OUT = os.path.join(DATA_DIR, "trido_sft_alpaca.json")

SYSTEM_PROMPT = """Anda adalah TRIDO (Trido AI) — asisten cerdas digital smartboard untuk pendidikan kelas inklusif karya Ardellio Satria Anindito.
Prinsip utama Anda:
1. Murni diagram Mermaid (mindmap, flowchart) untuk peta konsep & visualisasi.
2. Mutasi in-place: Jika diminta mengubah/menambah materi, perbarui (update_component) widget yang ada tanpa membuat baru.
3. Simulasi STEM: Buat simulasi fisika, kimia, dan matematika interaktif mandiri HTML5 Canvas via add_interactive_app.
4. Jangan pernah menumpahkan kode JSON atau teks teknis mentah ke dalam chat percakapan guru."""

def load_all_samples():
    records = []
    seen_prompts = set()

    for path in [MASTER_V2, MASTER_V1]:
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    prompt = data.get("prompt", "").strip()
                    if prompt in seen_prompts:
                        continue
                    seen_prompts.add(prompt)
                    records.append(data)
                except Exception as e:
                    print(f"Error parsing line in {path}: {e}")
    return records

def convert():
    records = load_all_samples()
    print(f"Loaded {len(records)} unique high-quality master records.")

    chatml_lines = []
    alpaca_items = []

    for r in records:
        prompt = r.get("prompt", "")
        ground_truth = r.get("ground_truth", {})
        calls = ground_truth.get("functionCalls", [])
        text_resp = ground_truth.get("textResponse", "")

        # Format assistant content as clean execution output
        assistant_payload = {
            "functionCalls": calls,
            "textResponse": text_resp
        }
        assistant_content = json.dumps(assistant_payload, ensure_ascii=False)

        # 1. ChatML
        chatml_entry = {
            "id": r.get("id"),
            "category": r.get("category"),
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": assistant_content}
            ]
        }
        chatml_lines.append(json.dumps(chatml_entry, ensure_ascii=False))

        # 2. Alpaca
        alpaca_item = {
            "instruction": prompt,
            "input": f"Pillar: {r.get('pillar', '')} | Category: {r.get('category', '')}",
            "output": assistant_content,
            "system": SYSTEM_PROMPT
        }
        alpaca_items.append(alpaca_item)

    with open(CHATML_OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(chatml_lines) + "\n")

    with open(ALPACA_OUT, "w", encoding="utf-8") as f:
        json.dump(alpaca_items, f, indent=2, ensure_ascii=False)

    print(f"✅ Generated {len(chatml_lines)} ChatML samples -> {CHATML_OUT}")
    print(f"✅ Generated {len(alpaca_items)} Alpaca samples -> {ALPACA_OUT}")

if __name__ == "__main__":
    convert()
