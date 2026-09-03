import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

fig, ax = plt.subplots(figsize=(16, 10))
fig.patch.set_facecolor('#f8fafc')
ax.set_facecolor('#f8fafc')
ax.axis('off')

# Title
ax.text(0.5, 0.96, 'BUSINESS MODEL CANVAS (BMC) — TRIDO AI', ha='center', va='center', fontsize=20, fontweight='black', color='#0f172a')
ax.text(0.5, 0.93, 'Autonomous Spatial Pedagogical Co-Worker • EdTech Smartboard Platform', ha='center', va='center', fontsize=12, fontweight='bold', color='#2563eb')

def draw_block(x, y, w, h, title, prefix, points, bg_color='#ffffff', border_color='#cbd5e1'):
    box = FancyBboxPatch((x, y), w, h, facecolor=bg_color, edgecolor=border_color, linewidth=1.5, boxstyle='round,pad=0.015')
    ax.add_patch(box)
    ax.text(x + 0.015, y + h - 0.035, f"{prefix} {title}", ha='left', va='center', fontsize=10.5, fontweight='black', color='#0f172a')
    
    text_content = "\n".join([f"• {p}" for p in points])
    ax.text(x + 0.015, y + h - 0.07, text_content, ha='left', va='top', fontsize=8.5, color='#334155', linespacing=1.35)

# 1. Key Partners
draw_block(0.02, 0.38, 0.18, 0.52, 'KEY PARTNERS', '[KP]', [
    'Google Cloud & Vertex AI',
    'IFP Hardware OEMs\n  (ViewSonic, BenQ, Samsung)',
    'Komunitas Guru\n  (MGMP, KKG, IGI, PGRI)',
    'Sekolah Mitra & Lab K-12',
    'Penerbit Buku Pendidikan'
])

# 2. Key Activities
draw_block(0.21, 0.65, 0.18, 0.25, 'KEY ACTIVITIES', '[KA]', [
    'R&D Agentic Motor Control',
    'Gemma 4 Edge Quantization',
    'Kurasi Template Pedagogi',
    'Optimasi Zero-Latency',
    'Keamanan Privasi Kelas'
])

# 3. Key Resources
draw_block(0.21, 0.38, 0.18, 0.25, 'KEY RESOURCES', '[KR]', [
    'Canvas Motor Controller',
    'Vertex AI Project Pipeline',
    'IndexedDB Zero-Cloud DB',
    'Fabric.js Spatial Engine',
    'Komunitas Guru Kreator'
])

# 4. Value Propositions
draw_block(0.40, 0.38, 0.20, 0.52, 'VALUE PROPOSITIONS', '[VP]', [
    'Autonomous Spatial Agent\n  (Bukan Chatbot Teks Biasa)',
    'Dual-Engine Hibrida:\n  • Gemini 3.8 Flash Cloud\n  • Gemma 4 Offline Edge',
    'Zero-Latency (<600ms)\n  thinkingBudget: 0',
    'Artefak Pedagogi Siap Ajar\n  (Mindmap, Kuis, Web Apps)',
    'Full Computer-Use\n  (Drag, Click, Connect, Draw)',
    'Privasi Penuh (Zero Tracker)'
], bg_color='#eff6ff', border_color='#3b82f6')

# 5. Customer Relationships
draw_block(0.61, 0.65, 0.18, 0.25, 'RELATIONSHIPS', '[CR]', [
    'Self-Serve Freemium Guru',
    'Dedicated School Success',
    'Pelatihan Resmi Bersertifikat',
    'Komunitas Guru Trido Hub'
])

# 6. Channels
draw_block(0.61, 0.38, 0.18, 0.25, 'CHANNELS', '[CH]', [
    'Web PWA (trido.vercel.app)',
    'Desktop Native App\n  (Win, Mac, Linux)',
    'B2B School Direct Sales',
    'Pre-installed Smartboard OEM'
])

# 7. Customer Segments
draw_block(0.80, 0.38, 0.18, 0.52, 'CUSTOMER SEGMENTS', '[CS]', [
    'Guru K-12 Sains, MTK, IPS',
    'Sekolah Negeri & Swasta\n  Pemilik Smartboard IFP',
    'Dinas Pendidikan Daerah\n  & Kemendikbudristek',
    'Bimbingan Belajar & Bimbel',
    'Dosen & Edukator Mandiri'
])

# 8. Cost Structure
draw_block(0.02, 0.04, 0.47, 0.31, 'COST STRUCTURE', '[C$]', [
    'Inference API & Token Costs (Google Cloud Vertex AI)',
    'Serverless Edge Infrastructure (Vercel Pro, WebSockets)',
    'Gaji Tim Rekayasa AI, Frontend Canvas & QA Pendidik',
    'Sertifikat Code Signing Desktop (Windows & Mac)',
    'Biaya Pelatihan Lapangan, Workshop & Operasional Komunitas'
])

# 9. Revenue Streams
draw_block(0.51, 0.04, 0.47, 0.31, 'REVENUE STREAMS', '[R$]', [
    'Trido Free (Guru Mandiri): Akses lokal tanpa batas + basic cloud tier',
    'Trido Pro Teacher ($8/bln atau Rp99.000/bln): Cloud Gemini 3.8 Flash tak terbatas',
    'Trido Campus B2B License ($1.200 - $3.500/sekolah/tahun): 10 - 50 smartboard',
    'Hardware OEM Pre-load Royalty ($15 - $25 per lisensi Smartboard IFP)',
    'Kustomisasi Kurikulum Daerah & Enterprise Government Tenders'
], bg_color='#f0fdf4', border_color='#22c55e')

plt.tight_layout()
bmc_chart_path = 'docs/assets/trido_business_model_canvas.png'
plt.savefig(bmc_chart_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
plt.close()
print('BMC Chart generated:', bmc_chart_path)
