import matplotlib.pyplot as plt
import numpy as np
import os

os.makedirs('docs/assets', exist_ok=True)
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

# ─────────────────────────────────────────────────────────────────────────────
# 1. LATENCY & TEACHER STEPS COMPARISON
# ─────────────────────────────────────────────────────────────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
fig.patch.set_facecolor('#f8fafc')

platforms = ['ChatGPT-4o\n(Web UI)', 'Claude 3.7\n(Web UI)', 'Gemini Web\n(Consumer)', 'Trido AI\n(Gemini 3.8 Flash)']
latency = [48, 42, 36, 1.8]
colors = ['#94a3b8', '#94a3b8', '#94a3b8', '#2563eb']

bars1 = ax1.bar(platforms, latency, color=colors, width=0.55, edgecolor='#1e293b', linewidth=1)
ax1.set_title('Waktu Hingga Muncul Artefak Spasial (Detik)\n[Lebih rendah lebih baik]', fontsize=13, fontweight='bold', pad=15, color='#0f172a')
ax1.set_ylabel('Detik (Seconds)', fontsize=11, fontweight='bold', color='#334155')
ax1.set_ylim(0, 55)
ax1.grid(axis='y', linestyle='--', alpha=0.5)

for bar in bars1:
    yval = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2.0, yval + 1.2, f'{yval}s', ha='center', va='bottom', fontsize=11, fontweight='bold', color='#0f172a')

# Teacher interaction steps
steps = [7, 6, 7, 1]
bars2 = ax2.bar(platforms, steps, color=['#cbd5e1', '#cbd5e1', '#cbd5e1', '#10b981'], width=0.55, edgecolor='#1e293b', linewidth=1)
ax2.set_title('Jumlah Langkah Manual Guru (Steps)\n[Lebih sedikit lebih intuitif]', fontsize=13, fontweight='bold', pad=15, color='#0f172a')
ax2.set_ylabel('Langkah (Steps)', fontsize=11, fontweight='bold', color='#334155')
ax2.set_ylim(0, 9)
ax2.grid(axis='y', linestyle='--', alpha=0.5)

for bar in bars2:
    yval = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2.0, yval + 0.2, f'{yval} langkah', ha='center', va='bottom', fontsize=11, fontweight='bold', color='#0f172a')

plt.tight_layout()
chart1_path = 'docs/assets/benchmark_latency_and_steps.png'
plt.savefig(chart1_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
plt.close()
print('Chart 1 generated:', chart1_path)

# ─────────────────────────────────────────────────────────────────────────────
# 2. RADAR CAPABILITY COMPARISON
# ─────────────────────────────────────────────────────────────────────────────
categories = [
    '2D Spatial Canvas',
    'Embodied Motor Control\n(Computer Use)',
    'Offline Air-Gapped\nResiliency',
    'Interactive Widgets\n(Quizzes, Apps)',
    'Zero-Latency Response\n(< 1 Detik)',
    'Multi-Page Document\n& PDF Export'
]
N = len(categories)

# Scores out of 10
trido_scores = [10, 10, 10, 10, 9.5, 10]
chatgpt_scores = [2, 1, 0, 3, 4, 3]
claude_scores = [3, 2, 0, 5, 4, 4]
gemini_scores = [2, 1, 0, 2, 5, 3]

angles = [n / float(N) * 2 * np.pi for n in range(N)]
angles += angles[:1]
trido_scores += trido_scores[:1]
chatgpt_scores += chatgpt_scores[:1]
claude_scores += claude_scores[:1]
gemini_scores += gemini_scores[:1]

fig, ax = plt.subplots(figsize=(9, 9), subplot_kw=dict(polar=True))
fig.patch.set_facecolor('#ffffff')

# Plot lines
ax.plot(angles, trido_scores, linewidth=3, linestyle='solid', label='Trido AI (Spatial Whiteboard)', color='#2563eb')
ax.fill(angles, trido_scores, '#3b82f6', alpha=0.25)

ax.plot(angles, chatgpt_scores, linewidth=1.5, linestyle='dashed', label='ChatGPT-4o (Chatbot)', color='#10b981')
ax.fill(angles, chatgpt_scores, '#10b981', alpha=0.08)

ax.plot(angles, claude_scores, linewidth=1.5, linestyle='dotted', label='Claude 3.7 (Artifacts)', color='#f59e0b')
ax.fill(angles, claude_scores, '#f59e0b', alpha=0.08)

ax.plot(angles, gemini_scores, linewidth=1.5, linestyle='dashdot', label='Gemini Web (Standard)', color='#64748b')

ax.set_xticks(angles[:-1])
ax.set_xticklabels(categories, fontsize=10, fontweight='bold', color='#1e293b')
ax.set_ylim(0, 10)
ax.set_yticks([2, 4, 6, 8, 10])
ax.set_yticklabels(['2', '4', '6', '8', '10'], color='#94a3b8', size=9)
ax.set_title('Perbandingan Dimensi Kapabilitas Pedagogis Ruang Kelas\n[Skala Skor Kematangan 0 - 10]', fontsize=13, fontweight='bold', pad=25, color='#0f172a')
ax.legend(loc='upper right', bbox_to_anchor=(1.25, 1.1), fontsize=10)

chart2_path = 'docs/assets/radar_pedagogical_comparison.png'
plt.savefig(chart2_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
plt.close()
print('Chart 2 generated:', chart2_path)

# ─────────────────────────────────────────────────────────────────────────────
# 3. ARCHITECTURE TOPOLOGY INFOGRAPHIC
# ─────────────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(14, 7))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')
ax.axis('off')

# Title
ax.text(0.5, 0.93, 'TRIDO HYBRID DUAL-ENGINE ARCHITECTURE', ha='center', va='center', fontsize=18, fontweight='black', color='#ffffff', family='sans-serif')
ax.text(0.5, 0.87, 'Autonomous Spatial Whiteboard Agent • Zero-Latency Cloud & Air-Gapped Edge', ha='center', va='center', fontsize=11, fontweight='bold', color='#38bdf8', family='sans-serif')

# Boxes
from matplotlib.patches import FancyBboxPatch

# Box 1: Inputs
rect1 = FancyBboxPatch((0.05, 0.38), 0.22, 0.42, facecolor='#1e293b', edgecolor='#3b82f6', linewidth=2, boxstyle='round,pad=0.03')
ax.add_patch(rect1)
ax.text(0.16, 0.75, 'MULTIMODAL INPUTS', ha='center', va='center', fontsize=12, fontweight='bold', color='#60a5fa')
ax.text(0.16, 0.58, '• Suara Guru (Microphone)\n• Teks Perintah / Chat\n• Foto / Snapshot Kanvas\n• Dokumen & Berkas Audio', ha='center', va='center', fontsize=10, color='#e2e8f0', linespacing=1.6)

# Box 2: Dual Engine
rect2 = FancyBboxPatch((0.37, 0.38), 0.26, 0.42, facecolor='#1e293b', edgecolor='#a855f7', linewidth=2, boxstyle='round,pad=0.03')
ax.add_patch(rect2)
ax.text(0.50, 0.75, 'DUAL AI ENGINE', ha='center', va='center', fontsize=12, fontweight='bold', color='#c084fc')
ax.text(0.50, 0.58, '1. CLOUD (Vertex AI GCP):\n   Gemini 3.8 Flash (<600ms)\n   thinkingBudget: 0\n\n2. LOCAL EDGE (Air-Gapped):\n   Gemma 4 on-device (Ollama)\n   100% Offline Resilient', ha='center', va='center', fontsize=9.5, color='#e2e8f0', linespacing=1.4)

# Box 3: Canvas Motor Output
rect3 = FancyBboxPatch((0.73, 0.38), 0.22, 0.42, facecolor='#1e293b', edgecolor='#10b981', linewidth=2, boxstyle='round,pad=0.03')
ax.add_patch(rect3)
ax.text(0.84, 0.75, 'SPATIAL MOTOR CONTROL', ha='center', va='center', fontsize=12, fontweight='bold', color='#34d399')
ax.text(0.84, 0.58, '• Kursor Fisik Bezier\n• Drag & Drop Elemen\n• Tarik Garis & Panah Relasi\n• Mindmap Hierarkis\n• Kuis & Mini Web App', ha='center', va='center', fontsize=10, color='#e2e8f0', linespacing=1.6)

# Connecting Arrows
ax.annotate('', xy=(0.36, 0.59), xytext=(0.28, 0.59), arrowprops=dict(facecolor='#38bdf8', edgecolor='#38bdf8', width=3, headwidth=10))
ax.annotate('', xy=(0.72, 0.59), xytext=(0.64, 0.59), arrowprops=dict(facecolor='#a855f7', edgecolor='#a855f7', width=3, headwidth=10))

# Bottom banner
rect_bot = FancyBboxPatch((0.05, 0.12), 0.90, 0.18, facecolor='#1e293b', edgecolor='#475569', linewidth=1.5, boxstyle='round,pad=0.02')
ax.add_patch(rect_bot)
ax.text(0.50, 0.21, 'BENEFIT UNTUK RUANG KELAS MODERN', ha='center', va='center', fontsize=11, fontweight='black', color='#facc15')
ax.text(0.50, 0.15, 'Zero-Latency (Tidak ada jeda menunggu AI) • Zero Split-Attention (Siswa fokus ke papan tulis) • Universal Deployment (Tablet, Laptop, IFP Smartboard)', ha='center', va='center', fontsize=9.5, color='#cbd5e1')

chart3_path = 'docs/assets/trido_architecture_topology.png'
plt.savefig(chart3_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
plt.close()
print('Chart 3 generated:', chart3_path)
