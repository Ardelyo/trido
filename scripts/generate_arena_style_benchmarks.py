#!/usr/bin/env python3
"""
Trido Arena Benchmark Visualizer (Artificial Analysis / Arena.ai Style)
Strictly includes ONLY models empirically tested on Trido Smartboard:
  1. Gemini 3.8 Flash (Google Cloud Vertex AI)
  2. trido-model:latest (Trido Local Flagship 9B - Ornith)
  3. qwen3.5-aggressive:9b (Qwen Base 9B Un-tuned)
  4. trido-gemma:2b (Trido Gemma 4 E2B Local Edge)
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.path import Path
import numpy as np

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def draw_rounded_bar(ax, x, y, width, height, rx=0.14, ry=4.0, color="#2563eb"):
    """
    Draws a vertical bar with pronounced rounded top corners matching Artificial Analysis style.
    rx is horizontal radius, ry is vertical radius (scaled to 100-scale y-axis).
    """
    if height <= 0:
        return
    rx = min(rx, width / 2.0)
    ry = min(ry, height / 2.0)
    w_half = width / 2.0
    
    verts = [
        (x - w_half, y),                           # 1. bottom-left
        (x - w_half, y + height - ry),              # 2. up to top-left curve start
        (x - w_half, y + height),                  # 3. top-left control
        (x - w_half + rx, y + height),              # 4. top-left curve end
        (x + w_half - rx, y + height),              # 5. top-right curve start
        (x + w_half, y + height),                  # 6. top-right control
        (x + w_half, y + height - ry),              # 7. top-right curve end
        (x + w_half, y),                           # 8. down to bottom-right
        (x - w_half, y),                           # 9. close
    ]
    codes = [
        Path.MOVETO,
        Path.LINETO,
        Path.CURVE3,
        Path.CURVE3,
        Path.LINETO,
        Path.CURVE3,
        Path.CURVE3,
        Path.LINETO,
        Path.CLOSEPOLY,
    ]
    path = Path(verts, codes)
    patch = patches.PathPatch(path, facecolor=color, edgecolor='none', zorder=3, antialiased=True)
    ax.add_patch(patch)

# ── 1. TRIDO SMARTBOARD AGENT INDEX (COMPOSITE BENCHMARK SCORE) ───────────────

def generate_smartboard_agent_index():
    out_file = os.path.join(OUTPUT_DIR, "arena_smartboard_agent_index.png")
    
    data = [
        {
            "rank": 1,
            "label": "Gemini 3.8 Flash ⚲",
            "score": 100,
            "color": "#10b981", # Emerald Green
            "provider": "Google Cloud (Vertex AI)",
            "meta": "5/5 Tasks Passed • 10.6s Avg Latency"
        },
        {
            "rank": 2,
            "label": "trido-model:latest ⚲",
            "score": 60,
            "color": "#2563eb", # Royal Blue
            "provider": "Trido Local (Ornith 9B)",
            "meta": "3/5 Tasks Passed • Passed Hardest STEM"
        },
        {
            "rank": 3,
            "label": "qwen3.5-aggressive:9b",
            "score": 60,
            "color": "#ea580c", # Vivid Orange
            "provider": "Alibaba / Ollama (Base 9B)",
            "meta": "3/5 Tasks Passed • Timed Out on Hardest Task"
        },
        {
            "rank": 4,
            "label": "trido-gemma:2b ⚲",
            "score": 40,
            "color": "#8b5cf6", # Purple
            "provider": "Google DeepMind / Trido (2.3B)",
            "meta": "2/5 Tasks Passed • Fastest Edge (9.47s STEM)"
        }
    ]

    fig, ax = plt.subplots(figsize=(11.5, 6.4), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    n_bars = len(data)
    x_positions = np.arange(n_bars) * 1.25 + 0.9
    bar_width = 0.58

    # Gridlines
    for y in range(0, 121, 20):
        ax.axhline(y=y, color='#f1f5f9', linestyle='-', linewidth=1.2, zorder=1)

    for i, item in enumerate(data):
        score = item["score"]
        color = item["color"]
        draw_rounded_bar(ax, x_positions[i], 0, bar_width, score, rx=0.16, ry=4.5, color=color)
        
        # White score inside
        ax.text(x_positions[i], score - 11 if score > 30 else score + 4, str(score), 
                ha='center', va='center', color='#ffffff' if score > 30 else color, 
                fontsize=20, fontweight='bold', zorder=4)
        
        # Rank badge
        ax.text(x_positions[i], score + 4 if score > 30 else score + 16, f"#{item['rank']}", 
                ha='center', va='bottom', color=color, fontsize=10.5, fontweight='bold', zorder=4)

        # Dot
        circle = patches.Circle((x_positions[i], -4), radius=0.14, facecolor=color, edgecolor='#ffffff', linewidth=1, zorder=4)
        ax.add_patch(circle)

        # Diagonal label
        ax.text(x_positions[i], -7, item["label"], rotation=40, ha='right', va='top',
                fontsize=10.5, fontweight='bold', color='#0f172a', rotation_mode='anchor')

        # Subtext
        ax.text(x_positions[i] + 0.05, -34, f"{item['provider']}\n{item['meta']}", rotation=40, ha='right', va='top',
                fontsize=7.2, fontweight='medium', color='#64748b', rotation_mode='anchor')

    ax.set_xlim(0, x_positions[-1] + 1.1)
    ax.set_ylim(-46, 120)
    ax.set_yticks(range(0, 101, 20))
    ax.set_yticklabels([str(y) for y in range(0, 101, 20)], fontsize=9, color='#94a3b8', fontweight='bold')

    for spine in ['top', 'right', 'left']:
        ax.spines[spine].set_visible(False)
    ax.spines['bottom'].set_color('#e2e8f0')
    ax.spines['bottom'].set_linewidth(1.2)
    ax.set_xticks([]) # Clean baseline without raw numbers

    # Header layout with ample spacing
    plt.text(0.04, 0.95, "Trido Smartboard Agent Index", transform=fig.transFigure,
             fontsize=18, fontweight='bold', color='#0f172a')
    plt.text(0.04, 0.91, "Represents overall pass rate across tested pedagogical tasks (Mermaid Mindmap, In-Place Mutation, Multi-Task & STEM)",
             transform=fig.transFigure, fontsize=8.8, color='#64748b', style='italic')

    # Watermark aligned right
    plt.text(0.96, 0.95, "TRIDO ARENA BENCHMARKS", transform=fig.transFigure,
             fontsize=11, fontweight='bold', color='#2563eb', ha='right')
    plt.text(0.96, 0.915, "Verified Smartboard Testbed • Sept 2026", transform=fig.transFigure,
             fontsize=7.8, fontweight='bold', color='#94a3b8', ha='right')

    # Footer
    plt.text(0.04, 0.02, "TRIDO 2026 • Hak Cipta Terdaftar Kementerian Hukum Republik Indonesia • Evaluated on Windows 11 RTX 5050 & Vertex AI",
             transform=fig.transFigure, fontsize=7.2, color='#94a3b8')

    plt.tight_layout(rect=[0.02, 0.05, 0.98, 0.88])
    fig.savefig(out_file, format='png', dpi=300)
    plt.close(fig)
    print(f"✅ Generated: {out_file}")
    return out_file

# ── 2. HARDEST TASK: MULTI-ZONE STEM WITH LATEX ORCHESTRATION ─────────────────

def generate_hardest_stem_index():
    out_file = os.path.join(OUTPUT_DIR, "arena_hardest_stem_index.png")
    
    data = [
        {
            "rank": 1,
            "label": "Gemini 3.8 Flash ⚲",
            "score": 100,
            "status": "PASSED (14.22s)",
            "color": "#10b981", # Emerald Green
            "tools": "5 Tools: Att + Timer + Mermaid + KaTeX Doc + Carnot Quiz",
            "provider": "Google Cloud (Vertex AI)"
        },
        {
            "rank": 2,
            "label": "trido-gemma:2b ⚲",
            "score": 100,
            "status": "PASSED (9.47s - Fastest)",
            "color": "#8b5cf6", # Purple
            "tools": "5 Tools: Att + Timer + Mermaid + Formula Doc + Interactive Quiz",
            "provider": "Trido Gemma 4 Edge (2.3B)"
        },
        {
            "rank": 3,
            "label": "trido-model:latest ⚲",
            "score": 100,
            "status": "PASSED (85.68s)",
            "color": "#2563eb", # Royal Blue
            "tools": "5 Tools: Att + Timer + Mermaid + Formula Doc + Carnot Quiz",
            "provider": "Trido Local Flagship (Ornith 9B)"
        },
        {
            "rank": 4,
            "label": "qwen3.5-aggressive:9b",
            "score": 0,
            "status": "FAILED (Timeout >92s)",
            "color": "#ef4444", # Red
            "tools": "0 Tools: Timed out parsing 5 nested quadrant constraints",
            "provider": "Alibaba / Ollama (Base 9B)"
        }
    ]

    fig, ax = plt.subplots(figsize=(11.5, 6.4), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    n_bars = len(data)
    x_positions = np.arange(n_bars) * 1.25 + 0.9
    bar_width = 0.58

    for y in range(0, 121, 25):
        ax.axhline(y=y, color='#f1f5f9', linestyle='-', linewidth=1.2, zorder=1)

    for i, item in enumerate(data):
        score = item["score"]
        color = item["color"]
        if score > 0:
            draw_rounded_bar(ax, x_positions[i], 0, bar_width, score, rx=0.16, ry=4.5, color=color)
            ax.text(x_positions[i], score - 11, f"{score}%", ha='center', va='center', 
                    color='#ffffff', fontsize=18, fontweight='bold', zorder=4)
        else:
            rect = patches.Rectangle((x_positions[i] - bar_width / 2.0, 0), bar_width, 4, 
                                     facecolor='#fee2e2', edgecolor='#ef4444', linewidth=1, zorder=3)
            ax.add_patch(rect)
            ax.text(x_positions[i], 12, "FAILED\n0%", ha='center', va='bottom',
                    color='#dc2626', fontsize=10.5, fontweight='bold', zorder=4)

        ax.text(x_positions[i], max(score, 18) + 4, f"#{item['rank']} • {item['status']}", 
                ha='center', va='bottom', color=color, fontsize=8.8, fontweight='bold', zorder=4)

        circle = patches.Circle((x_positions[i], -4), radius=0.14, facecolor=color, edgecolor='#ffffff', linewidth=1, zorder=4)
        ax.add_patch(circle)

        ax.text(x_positions[i], -7, item["label"], rotation=40, ha='right', va='top',
                fontsize=10.5, fontweight='bold', color='#0f172a', rotation_mode='anchor')

        ax.text(x_positions[i] + 0.05, -34, f"{item['provider']}\n{item['tools']}", rotation=40, ha='right', va='top',
                fontsize=6.8, fontweight='medium', color='#64748b', rotation_mode='anchor')

    ax.set_xlim(0, x_positions[-1] + 1.1)
    ax.set_ylim(-46, 120)
    ax.set_yticks(range(0, 101, 25))
    ax.set_yticklabels([f"{y}%" for y in range(0, 101, 25)], fontsize=9, color='#94a3b8', fontweight='bold')

    for spine in ['top', 'right', 'left']:
        ax.spines[spine].set_visible(False)
    ax.spines['bottom'].set_color('#e2e8f0')
    ax.spines['bottom'].set_linewidth(1.2)
    ax.set_xticks([])

    plt.text(0.04, 0.95, "Hardest Task: 5-Component STEM with LaTeX Derivations", transform=fig.transFigure,
             fontsize=18, fontweight='bold', color='#0f172a')
    plt.text(0.04, 0.91, "Parallel generation across canvas grid zones: Attendance + Timer + Thermodynamics Map + KaTeX Notes (PV=nRT) + Carnot Quiz",
             transform=fig.transFigure, fontsize=8.8, color='#64748b', style='italic')

    plt.text(0.96, 0.95, "TRIDO ARENA BENCHMARKS", transform=fig.transFigure,
             fontsize=11, fontweight='bold', color='#2563eb', ha='right')
    plt.text(0.96, 0.915, "STEM Curriculum Stress Test • Sept 2026", transform=fig.transFigure,
             fontsize=7.8, fontweight='bold', color='#94a3b8', ha='right')

    plt.text(0.04, 0.02, "TRIDO 2026 • Hak Cipta Terdaftar Kementerian Hukum Republik Indonesia • Evaluated on Windows 11 RTX 5050 & Vertex AI",
             transform=fig.transFigure, fontsize=7.2, color='#94a3b8')

    plt.tight_layout(rect=[0.02, 0.05, 0.98, 0.88])
    fig.savefig(out_file, format='png', dpi=300)
    plt.close(fig)
    print(f"✅ Generated: {out_file}")
    return out_file

# ── 3. EXECUTION LATENCY INDEX (AVERAGE RESPONSE TIME IN SECONDS) ──────────────

def generate_execution_latency_index():
    out_file = os.path.join(OUTPUT_DIR, "arena_execution_latency_index.png")
    
    data = [
        {
            "rank": 1,
            "label": "Gemini 3.8 Flash ⚲",
            "latency": 10.58,
            "color": "#10b981",
            "provider": "Google Cloud (Vertex AI)",
            "meta": "Frontier Cloud TPU Farm • Sub-15s E2E"
        },
        {
            "rank": 2,
            "label": "trido-gemma:2b ⚲",
            "latency": 18.27,
            "color": "#8b5cf6",
            "provider": "Trido Gemma 4 Edge (2.3B)",
            "meta": "Local RTX 5050 • 9.47s on 5 Parallel Tools"
        },
        {
            "rank": 3,
            "label": "qwen3.5-aggressive:9b",
            "latency": 46.51,
            "color": "#ea580c",
            "provider": "Alibaba / Ollama (Base 9B)",
            "meta": "Local RTX 5050 • Failed Hardest STEM Task"
        },
        {
            "rank": 4,
            "label": "trido-model:latest ⚲",
            "latency": 49.71,
            "color": "#2563eb",
            "provider": "Trido Local Flagship (Ornith 9B)",
            "meta": "Local RTX 5050 • Deep 256K Context Evaluation"
        }
    ]

    fig, ax = plt.subplots(figsize=(11.5, 6.4), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    n_bars = len(data)
    x_positions = np.arange(n_bars) * 1.25 + 0.9
    bar_width = 0.58

    for y in range(0, 61, 10):
        ax.axhline(y=y, color='#f1f5f9', linestyle='-', linewidth=1.2, zorder=1)

    for i, item in enumerate(data):
        lat = item["latency"]
        color = item["color"]
        draw_rounded_bar(ax, x_positions[i], 0, bar_width, lat, rx=0.16, ry=2.5, color=color)
        
        ax.text(x_positions[i], lat - 4.5 if lat > 12 else lat + 2, f"{lat:.1f}s", 
                ha='center', va='center', color='#ffffff' if lat > 12 else color, 
                fontsize=16, fontweight='bold', zorder=4)

        ax.text(x_positions[i], lat + 3 if lat > 12 else lat + 7, f"#{item['rank']} Fast", 
                ha='center', va='bottom', color=color, fontsize=9.5, fontweight='bold', zorder=4)

        circle = patches.Circle((x_positions[i], -2.5), radius=0.11, facecolor=color, edgecolor='#ffffff', linewidth=1, zorder=4)
        ax.add_patch(circle)

        ax.text(x_positions[i], -4.5, item["label"], rotation=40, ha='right', va='top',
                fontsize=10.5, fontweight='bold', color='#0f172a', rotation_mode='anchor')

        ax.text(x_positions[i] + 0.05, -20, f"{item['provider']}\n{item['meta']}", rotation=40, ha='right', va='top',
                fontsize=7.2, fontweight='medium', color='#64748b', rotation_mode='anchor')

    ax.set_xlim(0, x_positions[-1] + 1.1)
    ax.set_ylim(-26, 65)
    ax.set_yticks(range(0, 61, 10))
    ax.set_yticklabels([f"{y}s" for y in range(0, 61, 10)], fontsize=9, color='#94a3b8', fontweight='bold')

    for spine in ['top', 'right', 'left']:
        ax.spines[spine].set_visible(False)
    ax.spines['bottom'].set_color('#e2e8f0')
    ax.spines['bottom'].set_linewidth(1.2)
    ax.set_xticks([])

    plt.text(0.04, 0.95, "Trido Smartboard Execution Latency Index", transform=fig.transFigure,
             fontsize=18, fontweight='bold', color='#0f172a')
    plt.text(0.04, 0.91, "Average end-to-end response time across all benchmarked tasks in seconds (Lower is Better / Faster)",
             transform=fig.transFigure, fontsize=8.8, color='#64748b', style='italic')

    plt.text(0.96, 0.95, "TRIDO ARENA BENCHMARKS", transform=fig.transFigure,
             fontsize=11, fontweight='bold', color='#2563eb', ha='right')
    plt.text(0.96, 0.915, "Inference Speed Evaluation • Sept 2026", transform=fig.transFigure,
             fontsize=7.8, fontweight='bold', color='#94a3b8', ha='right')

    plt.text(0.04, 0.02, "TRIDO 2026 • Hak Cipta Terdaftar Kementerian Hukum Republik Indonesia • Measured on local RTX 5050 & Vertex Cloud",
             transform=fig.transFigure, fontsize=7.2, color='#94a3b8')

    plt.tight_layout(rect=[0.02, 0.05, 0.98, 0.88])
    fig.savefig(out_file, format='png', dpi=300)
    plt.close(fig)
    print(f"✅ Generated: {out_file}")
    return out_file

def main():
    print("Re-generating polished Arena.ai-style benchmark ranking charts for Trido Smartboard...")
    generate_smartboard_agent_index()
    generate_hardest_stem_index()
    generate_execution_latency_index()
    print("All charts successfully generated!")

if __name__ == "__main__":
    main()
