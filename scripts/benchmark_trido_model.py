#!/usr/bin/env python3
"""
Trido Model Capability Evaluator & Quality Gate Benchmark
Tests local AI models (gemma4:e2b, ornith-1.5:9b, etc.) against Trido's 4 Quality Gates.
"""

import sys
import json
import urllib.request
import time

API_URL = "http://localhost:3000/api/ai/generate"

BENCHMARK_SCENARIOS = [
    {
        "id": "gate_1_mermaid_creation",
        "name": "Gate 1: Pure Mermaid Mindmap Creation",
        "prompt": "Buatkan mindmap tentang tata surya untuk kelas 7 SMP.",
        "domElements": {},
        "expected_tool": "render_mermaid",
        "must_contain": ["Tata Surya", "mindmap", "root"]
    },
    {
        "id": "gate_2_inplace_mutation",
        "name": "Gate 2: In-Place Mutation (Continuous State)",
        "prompt": "Ubah mindmap pernapasan yang ada, tambahkan cabang tentang diafragma dan inspirasi.",
        "domElements": {
            "web_mm_resp": {
                "id": "web_mm_resp",
                "componentType": "MERMAID_DIAGRAM",
                "title": "Sistem Pernapasan",
                "config": {
                    "title": "Sistem Pernapasan",
                    "code": "mindmap\n  root((Sistem Pernapasan))\n    Hidung\n    Trakea\n    Alveolus"
                }
            }
        },
        "expected_tool": "update_component",
        "must_not_contain_tool": "render_mermaid"
    },
    {
        "id": "gate_3_interactive_timer",
        "name": "Gate 3: Interactive Timer Configuration",
        "prompt": "Setel timer 10 menit untuk kuis mandiri.",
        "domElements": {},
        "expected_tool": "add_component",
        "must_contain": ["TIMER", "600"]
    },
    {
        "id": "gate_4_multilingual_arabic",
        "name": "Gate 4: UN Language Support (Arabic)",
        "prompt": "أنشئ خريطة ذهنية عن أركان الإسلام الخمسة",
        "domElements": {},
        "expected_tool": "render_mermaid",
        "must_contain": ["mindmap"]
    }
]

def run_scenario(scenario, model_name="ornith-1.5:9b"):
    payload = {
        "prompt": scenario["prompt"],
        "canvasImageBase64": "",
        "canvasObjects": [],
        "viewport": {"width": 1440, "height": 900},
        "history": [],
        "domElements": scenario["domElements"],
        "aiPreference": "ollama",
        "selectedOllamaModel": model_name
    }

    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            elapsed = time.time() - t0
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            return True, data, elapsed, None
    except Exception as e:
        return False, None, time.time() - t0, str(e)

def evaluate_model(model_name="ornith-1.5:9b"):
    print(f"\n=======================================================")
    print(f"BENCHMARKING TRIDO MODEL: {model_name}")
    print(f"Target: http://localhost:3000/api/ai/generate")
    print(f"=======================================================\n")

    passed_count = 0
    total = len(BENCHMARK_SCENARIOS)

    for sc in BENCHMARK_SCENARIOS:
        print(f"▶ Testing: [{sc['name']}]...")
        ok, res, latency, err = run_scenario(sc, model_name)
        if not ok:
            print(f"  ❌ FAILED: Network/Server error: {err} ({latency:.2f}s)")
            continue

        calls = res.get("functionCalls", [])
        if not calls:
            print(f"  ❌ FAILED: Zero tool calls generated. Text: {res.get('textResponse', '')[:100]}...")
            continue

        tool_names = [c["name"] for c in calls]
        
        # Check expected tool
        if sc.get("expected_tool") and sc["expected_tool"] not in tool_names:
            print(f"  ❌ FAILED: Expected tool '{sc['expected_tool']}', but received {tool_names}")
            continue

        # Check prohibited tool (e.g. duplicate recreation instead of mutation)
        if sc.get("must_not_contain_tool") and sc["must_not_contain_tool"] in tool_names:
            print(f"  ❌ FAILED: Disallowed tool '{sc['must_not_contain_tool']}' was called (duplicate widget creation instead of in-place mutation).")
            continue

        raw_str = json.dumps(calls)
        missing_keywords = [kw for kw in sc.get("must_contain", []) if kw not in raw_str]
        if missing_keywords:
            print(f"  ❌ FAILED: Missing required terms {missing_keywords} in tool arguments.")
            continue

        print(f"  ✅ PASSED ({latency:.2f}s) - Tool called: {tool_names}")
        passed_count += 1

    score_pct = (passed_count / total) * 100
    print(f"\n-------------------------------------------------------")
    print(f"FINAL SCORE FOR {model_name}: {passed_count}/{total} ({score_pct:.1f}%)")
    print(f"-------------------------------------------------------\n")
    return passed_count == total

if __name__ == "__main__":
    model = sys.argv[1] if len(sys.argv) > 1 else "ornith-1.5:9b"
    evaluate_model(model)
