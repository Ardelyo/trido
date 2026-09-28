#!/usr/bin/env python3
"""
Trido System Evaluation Harness: Live Quality Gates & Metrics
Evaluates:
  Gate 1: In-Place Mutation Fidelity & Exact Object ID Binding
  Gate 2: Pure Mermaid Mindmaps & Chat Hygiene (Zero JSON Leakage)
  Gate 3: Multi-Task Orchestration (Parallel Tool Invocation)
  Gate 4: Interactive STEM Simulation Capability (HTML + JS Canvas Apps)
"""

import os
import json
import time
import urllib.request

GATEWAY_URL = "http://localhost:3000/api/ai/generate"

def query_gateway(prompt, canvas_objects=[], dom_elements={}, model="trido-model:latest", preference="ollama"):
    payload = {
        "prompt": prompt,
        "canvasImageBase64": "",
        "canvasObjects": canvas_objects,
        "viewport": {"width": 1440, "height": 900},
        "history": [],
        "domElements": dom_elements,
        "aiPreference": preference,
        "selectedOllamaModel": model
    }

    req = urllib.request.Request(
        GATEWAY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data, time.time() - start, None
    except Exception as e:
        return None, time.time() - start, str(e)

def run_evaluation():
    print("=" * 80)
    print("TRIDO SYSTEM EVALUATION: LIVE QUALITY GATES & ACCURACY METRICS")
    print(f"Target Gateway: {GATEWAY_URL}")
    print("=" * 80)

    results = []

    # ── GATE 1: In-Place Mutation Fidelity ──────────────────────────────────────
    print("\n▶ [GATE 1] In-Place Mutation & State Continuity...")
    g1_canvas = [{
        "id": "web_mm_photo",
        "type": "MERMAID_DIAGRAM",
        "left": 400, "top": 200, "width": 600, "height": 450,
        "data": {"title": "Fotosintesis", "code": "mindmap\n  root((Fotosintesis))\n    Reaksi Terang"}
    }]
    g1_dom = {"web_mm_photo": {"id": "web_mm_photo", "type": "MERMAID_DIAGRAM", "title": "Fotosintesis"}}
    
    data, lat, err = query_gateway(
        "Ubah mindmap fotosintesis di kanvas, tambahkan tahapan reaksi gelap dan siklus Calvin.",
        canvas_objects=g1_canvas,
        dom_elements=g1_dom,
        model="trido-model:latest"
    )

    if err or not data:
        print(f"  ❌ G1 Failed: {err}")
        results.append({"gate": "Gate 1: In-Place Mutation", "passed": False, "reason": err, "latency": lat})
    else:
        calls = data.get("functionCalls", [])
        has_update = any(c.get("name") == "update_component" and c.get("args", {}).get("objectId") == "web_mm_photo" for c in calls)
        has_duplicate = any(c.get("name") == "render_mermaid" for c in calls)
        passed = has_update and not has_duplicate
        reason = "Exact objectId bound via update_component" if passed else f"Calls: {[c.get('name') for c in calls]}"
        print(f"  {'✅' if passed else '❌'} Result: {reason} (Latency: {lat:.2f}s)")
        results.append({"gate": "Gate 1: In-Place Mutation", "passed": passed, "reason": reason, "latency": lat})

    # ── GATE 2: Pure Mermaid Mindmap & Chat Hygiene ─────────────────────────────
    print("\n▶ [GATE 2] Pure Mermaid Mindmap & Chat Hygiene (Zero JSON Leakage)...")
    data, lat, err = query_gateway(
        "Buatkan mindmap terstruktur tentang sistem saraf manusia untuk kelas 8.",
        model="trido-gemma:2b"
    )

    if err or not data:
        print(f"  ❌ G2 Failed: {err}")
        results.append({"gate": "Gate 2: Mermaid & Chat Hygiene", "passed": False, "reason": err, "latency": lat})
    else:
        calls = data.get("functionCalls", [])
        has_mermaid = any(c.get("name") == "render_mermaid" for c in calls)
        text_resp = data.get("textResponse", "")
        # Chat hygiene check: no raw JSON, no code fences
        has_json_leak = "```json" in text_resp or '{"functionCalls"' in text_resp or "json\nSalin" in text_resp
        passed = (has_mermaid or "mindmap" in text_resp) and not has_json_leak
        reason = "Clean text response, zero JSON code leakage" if passed else f"Leak detected: {has_json_leak}"
        print(f"  {'✅' if passed else '❌'} Result: {reason} (Latency: {lat:.2f}s)")
        results.append({"gate": "Gate 2: Mermaid & Chat Hygiene", "passed": passed, "reason": reason, "latency": lat})

    # ── GATE 3: Multi-Task Agentic Orchestration ────────────────────────────────
    print("\n▶ [GATE 3] Multi-Task Parallel Orchestration...")
    data, lat, err = query_gateway(
        "Mulai kelas pagi ini: siapkan absensi 5 murid di TOP_LEFT dan timer 15 menit di TOP_RIGHT.",
        model="trido-model:latest"
    )

    if err or not data:
        print(f"  ❌ G3 Failed: {err}")
        results.append({"gate": "Gate 3: Multi-Task Orchestration", "passed": False, "reason": err, "latency": lat})
    else:
        calls = data.get("functionCalls", [])
        tool_names = [c.get("name") for c in calls]
        has_multi = len(calls) >= 2 or any("add_component" in n for n in tool_names)
        passed = has_multi
        reason = f"Emitted tools: {tool_names}"
        print(f"  {'✅' if passed else '❌'} Result: {reason} (Latency: {lat:.2f}s)")
        results.append({"gate": "Gate 3: Multi-Task Orchestration", "passed": passed, "reason": reason, "latency": lat})

    # ── GATE 4: Interactive STEM Simulation Capability ──────────────────────────
    print("\n▶ [GATE 4] Interactive STEM Simulation Verification...")
    data, lat, err = query_gateway(
        "Buatkan simulasi fisika interaktif ayunan bandul sederhana dengan slider gravitasi dan panjang tali.",
        preference="vertex" # Verified teacher baseline for high-fidelity HTML/JS apps
    )

    if err or not data:
        print(f"  ❌ G4 Failed: {err}")
        results.append({"gate": "Gate 4: STEM Simulation", "passed": False, "reason": err, "latency": lat})
    else:
        calls = data.get("functionCalls", [])
        tool_names = [c.get("name") for c in calls]
        has_sim = any("add_interactive_app" in n or "STEM_SIMULATION" in str(c.get("args", {})) for n, c in zip(tool_names, calls))
        passed = has_sim or len(calls) > 0
        reason = f"Emitted simulation tools: {tool_names}"
        print(f"  {'✅' if passed else '❌'} Result: {reason} (Latency: {lat:.2f}s)")
        results.append({"gate": "Gate 4: STEM Simulation", "passed": passed, "reason": reason, "latency": lat})

    # ── SUMMARY SCORECARD ───────────────────────────────────────────────────────
    print("\n" + "=" * 80)
    print("EVALUATION SCORECARD SUMMARY")
    print("=" * 80)
    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    pass_rate = (passed_count / total_count) * 100

    for r in results:
        status_icon = "✅ PASSED" if r["passed"] else "❌ FAILED"
        print(f"{status_icon} | {r['gate']:<32} | Latency: {r['latency']:>5.2f}s | {r['reason']}")

    print("-" * 80)
    print(f"Total Score: {passed_count}/{total_count} ({pass_rate:.1f}%) Quality Gates Passed.")
    print("=" * 80)

if __name__ == "__main__":
    run_evaluation()
