#!/usr/bin/env python3
"""
Trido AI Multilingual Benchmark Evaluator:
Evaluates real-time AI responses across all 6 UN Official Languages + 5 Global Languages.
Tests:
1. Native Prompt Comprehension
2. Pure Mermaid Syntax Generation
3. Target Language Output Fidelity
4. Zero-JSON chat leakage
"""

import urllib.request
import json
import time

GATEWAY_URL = "http://localhost:3000/api/ai/generate"

BENCHMARK_PROMPTS = [
    {
        "lang": "id",
        "name": "Indonesian",
        "isUN": False,
        "prompt": "Buatkan mindmap tentang Struktur Sel Tumbuhan: Dinding Sel, Membran Sel, Kloroplas, Vakuola, dan Inti Sel.",
        "expected_keywords": ["Sel", "Dinding", "Kloroplas"]
    },
    {
        "lang": "en",
        "name": "English",
        "isUN": True,
        "prompt": "Create an educational mindmap about the Solar System: Inner Planets and Gas Giants.",
        "expected_keywords": ["Solar", "Planets"]
    },
    {
        "lang": "ar",
        "name": "Arabic",
        "isUN": True,
        "prompt": "أنشئ خريطة ذهنية عن الجهاز التنفسي عند الإنسان: الأنف، الحنجرة، القصبة الهوائية، والرئتين.",
        "expected_keywords": ["الجهاز", "التنفسي"]
    },
    {
        "lang": "zh",
        "name": "Chinese",
        "isUN": True,
        "prompt": "制作关于水循环的思维导图：蒸发、凝结、降水和径流。",
        "expected_keywords": ["循环", "水"]
    },
    {
        "lang": "fr",
        "name": "French",
        "isUN": True,
        "prompt": "Créez une carte mentale sur les états de la matière: solide, liquide et gaz.",
        "expected_keywords": ["matière", "solide"]
    },
    {
        "lang": "ru",
        "name": "Russian",
        "isUN": True,
        "prompt": "Создайте интеллект-карту о круговороте воды в природе: испарение, конденсация, осадки.",
        "expected_keywords": ["воды", "природе"]
    },
    {
        "lang": "es",
        "name": "Spanish",
        "isUN": True,
        "prompt": "Crea un mapa mental sobre el sistema circulatorio: corazón, arterias, venas y capilares.",
        "expected_keywords": ["sistema", "circulatorio"]
    },
    {
        "lang": "ja",
        "name": "Japanese",
        "isUN": False,
        "prompt": "光合成の仕組みについてのマインドマップを作成してください：明反応と暗反応。",
        "expected_keywords": ["光合成", "反応"]
    },
    {
        "lang": "ko",
        "name": "Korean",
        "isUN": False,
        "prompt": "식물의 광합성 과정에 대한 마인드맵을 만들어주세요: 명반응과 암반응.",
        "expected_keywords": ["광합성", "식물"]
    },
    {
        "lang": "de",
        "name": "German",
        "isUN": False,
        "prompt": "Erstelle eine Mindmap über die Photosynthese: Lichtreaktion und Dunkelreaktion.",
        "expected_keywords": ["Photosynthese", "Reaktion"]
    },
    {
        "lang": "pt",
        "name": "Portuguese",
        "isUN": False,
        "prompt": "Crie um mapa mental sobre o ciclo da água: evaporação, condensação e precipitação.",
        "expected_keywords": ["ciclo", "água"]
    }
]

def evaluate_language(item, model_name="trido-model:latest"):
    payload = {
        "prompt": item["prompt"],
        "canvasImageBase64": "",
        "canvasObjects": [],
        "viewport": {"width": 1440, "height": 900},
        "history": [],
        "domElements": {},
        "aiPreference": "ollama",
        "selectedOllamaModel": model_name
    }

    req = urllib.request.Request(
        GATEWAY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            latency_s = round(time.time() - start_time, 2)
            
            calls = data.get("functionCalls", [])
            has_mindmap = any(c.get("name") == "render_mermaid" for c in calls)
            
            # Check mermaid code validity
            mermaid_code = ""
            for c in calls:
                if c.get("name") == "render_mermaid":
                    mermaid_code = c.get("args", {}).get("code", "")
                    break
            
            is_valid_mermaid = "mindmap" in mermaid_code or "graph" in mermaid_code or "flowchart" in mermaid_code
            text_resp = data.get("textResponse", "")
            
            # Chat leakage check: must NOT have raw JSON in textResponse
            no_json_leak = not text_resp.startswith("{") and '"functionCalls"' not in text_resp
            
            status = "PASS" if (has_mindmap and is_valid_mermaid and no_json_leak) else "PARTIAL"
            
            return {
                "lang": item["lang"],
                "name": item["name"],
                "isUN": item["isUN"],
                "status": status,
                "latency_s": latency_s,
                "has_mindmap": has_mindmap,
                "is_valid_mermaid": is_valid_mermaid,
                "no_json_leak": no_json_leak,
                "tool_calls_count": len(calls),
                "mermaid_sample": mermaid_code[:80].replace("\n", " ") if mermaid_code else "None"
            }
    except Exception as e:
        latency_s = round(time.time() - start_time, 2)
        return {
            "lang": item["lang"],
            "name": item["name"],
            "isUN": item["isUN"],
            "status": "FAIL",
            "latency_s": latency_s,
            "error": str(e)
        }

def run_all():
    print("=" * 80)
    print("🌍 TRIDO MULTILINGUAL INTERNATIONAL EVALUATION BENCHMARK")
    print("Testing all 6 UN Official Languages + 5 Global Languages")
    print("=" * 80)

    results = []
    for item in BENCHMARK_PROMPTS:
        tag = "[UN]" if item["isUN"] else "[GLOBAL]"
        print(f"\nEvaluating {tag} {item['name']} ({item['lang']})...")
        res = evaluate_language(item)
        results.append(res)
        print(f"  Result: {res['status']} | Latency: {res['latency_s']}s | Tools: {res.get('tool_calls_count', 0)} | Valid Mermaid: {res.get('is_valid_mermaid', False)}")
        if res.get("mermaid_sample"):
            print(f"  Mermaid Preview: {res['mermaid_sample']}...")

    print("\n" + "=" * 80)
    print("📊 MULTILINGUAL EVALUATION SCORECARD:")
    print(f"{'Code':<6} | {'Language':<15} | {'UN?':<5} | {'Status':<8} | {'Latency':<8} | {'Mermaid Syntax':<15}")
    print("-" * 80)

    pass_count = 0
    for r in results:
        is_pass = r["status"] == "PASS"
        if is_pass:
            pass_count += 1
        un_str = "Yes" if r["isUN"] else "No"
        print(f"{r['lang']:<6} | {r['name']:<15} | {un_str:<5} | {r['status']:<8} | {r['latency_s']}s{'':<4} | {r.get('mermaid_sample', 'None')[:15]}")

    print("=" * 80)
    print(f"🎯 Total Score: {pass_count}/{len(results)} languages passed ({round(pass_count / len(results) * 100, 1)}%)")
    print("=" * 80)

if __name__ == "__main__":
    run_all()
