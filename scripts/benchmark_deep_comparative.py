#!/usr/bin/env python3
"""
Trido Comparative Benchmark Harness: Cloud vs. Local SLMs
Evaluates:
  1. Cloud Frontier: gemini-3.8-flash (Google Cloud Vertex AI)
  2. Local Flagship: trido-model:latest (Ornith 9B Trido Fine-Tuned)
  3. Local Edge: trido-gemma:2b (Gemma 4 E2B Trido Calibrated)
  4. Local General: qwen3.5-aggressive:9b (Base Un-tuned)

Across 5 Rigorous Tasks:
  - Task 1: Standard Concept Visual (Mermaid Mindmap)
  - Task 2: Continuous In-Place Mutation ("Edit, Don't Recreate")
  - Task 3: Multi-Task Agentic Orchestration (Parallel 3+ Tools)
  - Task 4: Multilingual UN Languages (Arabic RTL Mindmap)
  - Task 5: Hardest Long Prompt (Multi-Zone STEM Curriculum with LaTeX & Constraints)

Output: data/benchmark_results.json and a formatted research-grade report.
"""

import sys
import os
import json
import time
import urllib.request

API_URL = "http://localhost:3000/api/ai/generate"
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
RESULTS_FILE = os.path.join(DATA_DIR, "comparative_benchmark_results.json")
os.makedirs(DATA_DIR, exist_ok=True)

MODELS = [
    {
        "id": "vertex_gemini",
        "name": "gemini-3.8-flash",
        "type": "Cloud (Vertex AI)",
        "aiPreference": "vertex",
        "selectedModel": "gemini-3.8-flash"
    },
    {
        "id": "trido_model_flagship",
        "name": "trido-model:latest",
        "type": "Local 9B (Ornith Fine-Tuned)",
        "aiPreference": "ollama",
        "selectedModel": "trido-model:latest"
    },
    {
        "id": "trido_gemma_edge",
        "name": "trido-gemma:2b",
        "type": "Local 2.3B (Gemma 4 E2B)",
        "aiPreference": "ollama",
        "selectedModel": "trido-gemma:2b"
    },
    {
        "id": "qwen_base",
        "name": "qwen3.5-aggressive:9b",
        "type": "Local 9B (Base Un-Tuned)",
        "aiPreference": "ollama",
        "selectedModel": "qwen3.5-aggressive:9b"
    }
]

BENCHMARK_TASKS = [
    {
        "id": "T1_standard_mindmap",
        "name": "Task 1: Standard Concept Visual (Mermaid Mindmap)",
        "prompt": "Buatkan mindmap terstruktur tentang Sistem Tata Surya untuk kelas 7 SMP.",
        "domElements": {},
        "expected_tools": ["render_mermaid"],
        "disallowed_tools": ["add_mindmap_node"],
        "keywords": ["Tata Surya", "mindmap", "root"]
    },
    {
        "id": "T2_inplace_mutation",
        "name": "Task 2: Continuous In-Place Mutation",
        "prompt": "Ubah mindmap fotosintesis yang sudah ada di kanvas, tambahkan cabang tentang reaksi gelap dan siklus Calvin.",
        "domElements": {
            "web_mm_photo": {
                "id": "web_mm_photo",
                "componentType": "MERMAID_DIAGRAM",
                "title": "Fotosintesis",
                "config": {
                    "title": "Fotosintesis",
                    "code": "mindmap\n  root((Fotosintesis))\n    Reaksi Terang\n      Klorofil\n      Fotolisis Air"
                }
            }
        },
        "expected_tools": ["update_component"],
        "disallowed_tools": ["render_mermaid"],
        "target_id": "web_mm_photo"
    },
    {
        "id": "T3_multitask_orchestration",
        "name": "Task 3: Multi-Task Agentic Orchestration",
        "prompt": "Mulai sesi kelas: siapkan absensi 5 murid (Ahmad, Bima, Citra, Dina, Eko), setel timer 20 menit di kanan atas, dan buatkan peta konsep Ekosistem di tengah.",
        "domElements": {},
        "expected_tools": ["add_component", "render_mermaid"],
        "min_tool_calls": 3,
        "keywords": ["ATTENDANCE", "TIMER"]
    },
    {
        "id": "T4_multilingual_arabic",
        "name": "Task 4: Multilingual UN Challenge (Arabic RTL)",
        "prompt": "أنشئ خريطة ذهنية عن أركان الإسلام الخمسة مع تفاصيل كل ركن",
        "domElements": {},
        "expected_tools": ["render_mermaid"],
        "keywords": ["mindmap"]
    },
    {
        "id": "T5_hardest_long_prompt",
        "name": "Task 5: Hardest Multi-Zone STEM Curriculum with LaTeX",
        "prompt": (
            "Saya guru Fisika SMA ingin mengajarkan bab Termodinamika & Hukum Gas Ideal hari ini secara komprehensif.\n"
            "Instruksi lengkap:\n"
            "1. Pasang absensi 4 siswa kelompok praktikum di zona TOP_LEFT.\n"
            "2. Pasang timer visual 25 menit untuk pengerjaan soal di zona TOP_RIGHT.\n"
            "3. Di zona CENTER, buatkan mindmap lengkap tentang 4 Proses Termodinamika: Isotermal (T tetap), Isobarik (P tetap), Isokhorik (V tetap), dan Adiabatik (Q = 0) beserta rumus usahanya W.\n"
            "4. Di zona BOTTOM_CENTER, buatkan catatan dokumen berisi penurunan rumus gas ideal P.V = n.R.T dan hukum I Termodinamika Delta U = Q - W dalam notasi LaTeX.\n"
            "5. Buatkan 1 kuis pilihan ganda interaktif di CENTER_RIGHT tentang efisiensi mesin Carnot.\n"
            "Jangan ada elemen yang tumpang tindih!"
        ),
        "domElements": {},
        "expected_tools": ["add_component", "render_mermaid"],
        "min_tool_calls": 3,
        "keywords": ["Termodinamika"]
    }
]

def run_query(model_cfg, task, timeout_s=120):
    payload = {
        "prompt": task["prompt"],
        "canvasImageBase64": "",
        "canvasObjects": [],
        "viewport": {"width": 1440, "height": 900},
        "history": [],
        "domElements": task["domElements"],
        "aiPreference": model_cfg["aiPreference"],
        "selectedOllamaModel": model_cfg["selectedModel"] if model_cfg["aiPreference"] == "ollama" else None,
        "selectedVertexModel": model_cfg["selectedModel"] if model_cfg["aiPreference"] == "vertex" else None
    }

    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            latency = time.time() - t0
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            return True, data, latency, None
    except Exception as e:
        return False, None, time.time() - t0, str(e)

def evaluate_response(task, response_data):
    if not response_data:
        return False, "No response data returned"

    calls = response_data.get("functionCalls", [])
    text = response_data.get("textResponse", "")

    if not calls and not text:
        return False, "Completely empty output"

    tool_names = [c.get("name") for c in calls]
    raw_calls_str = json.dumps(calls)

    # 1. Check disallowed tools
    for dt in task.get("disallowed_tools", []):
        if dt in tool_names:
            return False, f"Used prohibited tool: {dt} (should mutate in-place, not re-create)"

    # 2. Check expected tools
    for et in task.get("expected_tools", []):
        if et not in tool_names:
            return False, f"Missing required tool: {et} (got: {tool_names})"

    # 3. Check minimum tool call count for multi-task
    if "min_tool_calls" in task:
        if len(calls) < task["min_tool_calls"]:
            return False, f"Insufficient tool calls: generated {len(calls)} calls, required {task['min_tool_calls']}"

    # 4. Check in-place target ID
    if "target_id" in task:
        target_found = any(c.get("args", {}).get("objectId") == task["target_id"] for c in calls if c.get("name") == "update_component")
        if not target_found:
            return False, f"Did not target expected objectId '{task['target_id']}' in update_component"

    # 5. Check keywords in arguments or text
    for kw in task.get("keywords", []):
        if kw.lower() not in raw_calls_str.lower() and kw.lower() not in text.lower():
            return False, f"Missing key domain concept: '{kw}'"

    return True, "Passed all constraints"

def save_results(all_results):
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

def main():
    target_model_id = sys.argv[1] if len(sys.argv) > 1 else None

    print("=" * 80)
    print("TRIDO COMPREHENSIVE AI BENCHMARK: CLOUD FRONTIER VS. LOCAL EDGE SLMS")
    print("Standard: Research-Grade Empirical Evaluation Matrix")
    print(f"Target Gateway: {API_URL}")
    print("=" * 80)

    all_results = {}
    if os.path.exists(RESULTS_FILE):
        try:
            with open(RESULTS_FILE, "r", encoding="utf-8") as f:
                all_results = json.load(f)
        except Exception:
            all_results = {}

    selected_models = [m for m in MODELS if m["id"] == target_model_id] if target_model_id else MODELS

    for model_cfg in selected_models:
        m_id = model_cfg["id"]
        m_name = model_cfg["name"]
        m_type = model_cfg["type"]
        print(f"\n=======================================================")
        print(f"EVALUATING MODEL: {m_name} [{m_type}]")
        print("=======================================================")

        model_results = []
        passed_count = 0

        for task in BENCHMARK_TASKS:
            t_id = task["id"]
            t_name = task["name"]
            print(f"▶ {t_name}...", end=" ", flush=True)

            success_net, resp_data, latency, net_err = run_query(model_cfg, task, timeout_s=90)
            if not success_net:
                print(f"❌ ERROR ({latency:.2f}s): {net_err}")
                model_results.append({
                    "task_id": t_id,
                    "task_name": t_name,
                    "passed": False,
                    "reason": f"Network/Timeout Error: {net_err}",
                    "latency_s": round(latency, 2),
                    "tool_calls_count": 0,
                    "tool_names": []
                })
                continue

            passed_eval, eval_reason = evaluate_response(task, resp_data)
            calls = resp_data.get("functionCalls", [])
            tool_names = [c.get("name") for c in calls]

            if passed_eval:
                print(f"✅ PASSED ({latency:.2f}s) | Tools: {tool_names}")
                passed_count += 1
            else:
                print(f"❌ FAILED ({latency:.2f}s) | Reason: {eval_reason} | Tools: {tool_names}")

            model_results.append({
                "task_id": t_id,
                "task_name": t_name,
                "passed": passed_eval,
                "reason": eval_reason,
                "latency_s": round(latency, 2),
                "tool_calls_count": len(calls),
                "tool_names": tool_names,
                "telemetry": resp_data.get("telemetry", {})
            })

        score_pct = (passed_count / len(BENCHMARK_TASKS)) * 100
        avg_latency = sum(r["latency_s"] for r in model_results) / len(model_results)

        print(f"--- Summary for {m_name}: {passed_count}/{len(BENCHMARK_TASKS)} Passed ({score_pct:.1f}%) | Avg Latency: {avg_latency:.2f}s ---")

        all_results[m_id] = {
            "name": m_name,
            "type": m_type,
            "score_pct": score_pct,
            "passed_count": passed_count,
            "total_tasks": len(BENCHMARK_TASKS),
            "avg_latency_s": round(avg_latency, 2),
            "tasks": model_results
        }
        save_results(all_results)

    print("\n" + "=" * 80)
    print(f"BENCHMARK COMPLETE! Full empirical dataset saved to: {RESULTS_FILE}")
    print("=" * 80)

if __name__ == "__main__":
    main()
