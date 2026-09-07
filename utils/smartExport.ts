import { DomElementState, MindmapNodeRecord } from '../types';
import { MindmapLayoutNode } from './mindmapLayout';

/**
 * Utility helper to trigger clean file downloads in browser
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Clean filename slug helper
 */
export function slugify(text: string): string {
  return (text || 'trido_export')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50);
}

/**
 * ── 1. EXPORT CLEAN DOCUMENT AS STANDALONE HTML ─────────────────────────────
 */
export function exportDocumentAsHtml(title: string, markdown: string) {
  const cleanTitle = title || 'Dokumen Materi Trido';
  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #1e293b; }
    .doc-article { font-family: 'Merriweather', serif; }
    .doc-article h1, .doc-article h2, .doc-article h3, .doc-article h4 { font-family: 'Inter', sans-serif; }
    .doc-article code { font-family: 'JetBrains Mono', monospace; }
    @media print {
      body { background: white !important; }
      .no-print { display: none !important; }
      .page-container { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body class="py-10 px-4 md:px-8">
  <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 md:p-14 page-container">
    <div class="border-b border-slate-100 pb-6 mb-8 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Trido Academic Document</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 font-sans">${cleanTitle}</h1>
      </div>
      <button onclick="window.print()" class="no-print px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
        Cetak / PDF
      </button>
    </div>
    <div id="content" class="doc-article prose prose-slate max-w-none leading-relaxed text-slate-700"></div>
  </div>

  <script>
    const rawMarkdown = ${JSON.stringify(markdown)};
    document.getElementById('content').innerHTML = marked.parse(rawMarkdown);
  </script>
</body>
</html>`;

  downloadFile(htmlContent, `${slugify(cleanTitle)}.html`, 'text/html;charset=utf-8');
}

/**
 * ── 2. EXPORT CLEAN DOCUMENT AS RAW MARKDOWN ───────────────────────────────
 */
export function exportDocumentAsMarkdown(title: string, markdown: string) {
  const cleanTitle = title || 'Dokumen Materi Trido';
  const header = `# ${cleanTitle}\n*Diekspor dari Trido Whiteboard - ${new Date().toLocaleDateString('id-ID')}*\n\n---\n\n`;
  downloadFile(header + (markdown || ''), `${slugify(cleanTitle)}.md`, 'text/markdown;charset=utf-8');
}

/**
 * ── 3. EXPORT CLEAN DOCUMENT / WIDGET AS PRINTABLE PDF ─────────────────────
 */
export function printCleanDocument(elementId: string, title?: string) {
  const elementNode = document.getElementById(elementId);
  if (!elementNode) return false;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) return false;

  const cleanTitle = title || 'Trido Dokumen Pembelajaran';

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${cleanTitle}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap" rel="stylesheet">
    <style>
      @page {
        size: A4;
        margin: 18mm 16mm;
      }
      body {
        font-family: 'Merriweather', serif;
        color: #1e293b;
        background: white;
        padding: 0;
        margin: 0;
      }
      h1, h2, h3, h4, .font-sans {
        font-family: 'Inter', sans-serif !important;
      }
      .no-print { display: none !important; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-container { overflow: visible !important; height: auto !important; width: 100% !important; max-width: 100% !important; box-shadow: none !important; }
        * { box-shadow: none !important; }
      }
      .print-container { max-width: 800px; margin: 0 auto; }
    </style>
  </head>
  <body class="p-6 md:p-10">
    <div class="print-container">
      <div class="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-end font-sans">
        <div>
          <div class="text-[10px] font-black tracking-widest text-blue-600 uppercase">TRIDO DIGITAL BOARD ARTIFACT</div>
          <h1 class="text-2xl font-black text-slate-900">${cleanTitle}</h1>
        </div>
        <div class="text-right text-[11px] text-slate-500 font-medium">
          Tanggal: ${new Date().toLocaleDateString('id-ID')}
        </div>
      </div>
      <div class="content-body">
        ${elementNode.innerHTML}
      </div>
    </div>
    <script>
      setTimeout(() => {
        window.print();
        window.close();
      }, 800);
    </script>
  </body>
</html>`);
  printWindow.document.close();
  return true;
}

/**
 * ── 4. EXPORT INTERACTIVE APP / WEBSITE AS STANDALONE ARTIFACT ──────────────
 */
export function exportInteractiveAppAsHtml(config: {
  title?: string;
  html: string;
  css?: string;
  js?: string;
}) {
  const cleanTitle = config.title || 'Trido Interactive App';
  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanTitle}</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Font Awesome / Lucide Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
    ${config.css || ''}
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
  <!-- Topbar Artifact Branding -->
  <header class="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between text-xs">
    <div class="flex items-center gap-2">
      <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
      <span class="font-bold text-slate-200 tracking-wide">${cleanTitle}</span>
    </div>
    <span class="text-slate-500 text-[11px] font-mono">Standalone Web Application • Exported from Trido</span>
  </header>

  <!-- Interactive App Content -->
  <main class="flex-1 w-full h-full relative">
    ${config.html || ''}
  </main>

  <script>
    try {
      ${config.js || ''}
    } catch (err) {
      console.error('Runtime error in standalone app:', err);
      const errBox = document.createElement('div');
      errBox.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#ef4444;color:white;padding:12px 18px;border-radius:12px;font-family:monospace;font-size:12px;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,0.3);';
      errBox.innerHTML = '<strong>Application Error:</strong> ' + err.message;
      document.body.appendChild(errBox);
    }
  </script>
</body>
</html>`;

  downloadFile(fullHtml, `${slugify(cleanTitle)}.html`, 'text/html;charset=utf-8');
}

/**
 * ── 5. EXPORT QUIZ / EXAM AS PRINTABLE WORKSHEET ───────────────────────────
 */
export function exportQuizAsPrintableWorksheet(quiz: {
  title?: string;
  type?: string;
  config: any;
}) {
  const cleanTitle = quiz.title || quiz.config?.title || 'Lembar Soal Latihan Siswa';
  const isMultipleChoice = quiz.type === 'QUIZ_MULTIPLE_CHOICE' || !!quiz.config?.options;
  const isEssay = quiz.type === 'QUIZ_ESSAY' || !!quiz.config?.rubric;
  const isTrueFalse = quiz.type === 'QUIZ_TRUE_FALSE';

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) return false;

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${cleanTitle} - Lembar Ujian</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4; margin: 20mm 15mm; }
    body { font-family: sans-serif; color: #1e293b; background: white; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="p-8 max-w-4xl mx-auto">
  <!-- School Exam Header -->
  <div class="border-b-2 border-slate-900 pb-4 mb-6">
    <div class="flex justify-between items-start mb-3">
      <div>
        <div class="text-[10px] font-black tracking-widest text-blue-600 uppercase">LEMBAR AKTIVITAS & EVALUASI PEMBELAJARAN</div>
        <h1 class="text-2xl font-black text-slate-900 uppercase">${cleanTitle}</h1>
      </div>
      <button onclick="window.print()" class="no-print px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer">
        Cetak Soal
      </button>
    </div>

    <!-- Student Metadata Grid -->
    <div class="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-xs font-medium text-slate-700 border-t border-slate-200 pt-3">
      <div>Nama Lengkap : _____________________________________</div>
      <div>Kelas / No. Presensi : ____________________</div>
      <div>Mata Pelajaran : _____________________________________</div>
      <div>Tanggal Ujian : ${new Date().toLocaleDateString('id-ID')}</div>
    </div>
  </div>

  <!-- Instructions -->
  <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-600">
    <strong>Petunjuk Pengerjaan:</strong><br>
    1. Berdoalah sebelum mengerjakan soal.<br>
    2. Bacalah setiap pertanyaan dengan teliti sebelum menjawab.<br>
    3. Kerjakan secara mandiri dan teliti.
  </div>

  <!-- Question Section -->
  <div class="space-y-6">
    <div class="border border-slate-200 rounded-2xl p-6 bg-white">
      <div class="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">Soal No. 1</div>
      <p class="text-base font-semibold text-slate-900 leading-relaxed mb-4">
        ${quiz.config?.question || 'Jelaskan materi terkait.'}
      </p>

      ${isMultipleChoice && Array.isArray(quiz.config?.options) ? `
        <div class="space-y-2.5 mt-4">
          ${quiz.config.options.map((opt: string, idx: number) => {
            const letter = String.fromCharCode(65 + idx);
            return `
              <div class="flex items-center gap-3 p-3 border border-slate-200 rounded-xl">
                <span class="w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">${letter}</span>
                <span class="text-sm text-slate-800">${opt}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      ${isTrueFalse ? `
        <div class="flex gap-4 mt-4">
          <div class="flex-1 p-3 border border-slate-300 rounded-xl text-center font-bold text-sm">[   ] BENAR</div>
          <div class="flex-1 p-3 border border-slate-300 rounded-xl text-center font-bold text-sm">[   ] SALAH</div>
        </div>
      ` : ''}

      ${isEssay ? `
        <div class="mt-4 pt-4 border-t border-slate-100">
          <div class="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Ruang Jawaban:</div>
          <div class="h-44 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4 text-xs text-slate-400">
            (Tuliskan jawaban Anda di sini)
          </div>
        </div>
      ` : ''}
    </div>
  </div>

  <!-- Teacher Answer Key / Solution Section (Collapsible / Print Option) -->
  ${quiz.config?.explanation || quiz.config?.answerIndex !== undefined || quiz.config?.sampleAnswer ? `
    <div class="mt-12 pt-6 border-t-2 border-dashed border-slate-300 page-break-before">
      <div class="text-xs font-black uppercase tracking-wider text-rose-600 mb-2">KUNCI JAWABAN & PEMBAHASAN (GURU)</div>
      <div class="bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 leading-relaxed">
        ${quiz.config?.answerIndex !== undefined && quiz.config?.options ? `
          <div class="mb-2"><strong>Kunci Jawaban:</strong> Pilihan ${String.fromCharCode(65 + quiz.config.answerIndex)} (${quiz.config.options[quiz.config.answerIndex]})</div>
        ` : ''}
        ${quiz.config?.sampleAnswer ? `
          <div class="mb-2"><strong>Contoh Jawaban Ideal:</strong> ${quiz.config.sampleAnswer}</div>
        ` : ''}
        ${quiz.config?.rubric ? `
          <div class="mb-2"><strong>Rubrik Penilaian:</strong> ${quiz.config.rubric}</div>
        ` : ''}
        ${quiz.config?.explanation ? `
          <div><strong>Pembahasan:</strong> ${quiz.config.explanation}</div>
        ` : ''}
      </div>
    </div>
  ` : ''}

  <script>
    setTimeout(() => { window.print(); }, 800);
  </script>
</body>
</html>`);
  printWindow.document.close();
  return true;
}

/**
 * ── 6. EXPORT MINDMAP AS STRUCTURED OUTLINE MARKDOWN ───────────────────────
 */
export function exportMindmapAsMarkdown(nodes: (MindmapLayoutNode | MindmapNodeRecord)[]): void {
  if (!nodes || nodes.length === 0) return;

  const root = nodes.find(n => !n.parentNodeText) || nodes[0];
  let output = `# ${root.text}\n\n`;

  const childMap = new Map<string, MindmapLayoutNode[]>();
  nodes.forEach(n => {
    if (n.parentNodeText) {
      const p = n.parentNodeText.toLowerCase();
      if (!childMap.has(p)) childMap.set(p, []);
      childMap.get(p)!.push(n);
    }
  });

  function appendBranch(nodeText: string, depth: number) {
    const children = childMap.get(nodeText.toLowerCase()) || [];
    children.forEach(c => {
      const indent = '  '.repeat(depth);
      output += `${indent}- **${c.text}**\n`;
      appendBranch(c.text, depth + 1);
    });
  }

  appendBranch(root.text, 0);

  downloadFile(output, `${slugify(root.text)}_mindmap.md`, 'text/markdown;charset=utf-8');
}

/**
 * ── 7. DETECT ALL DISTINCT OBJECTS ON BOARD ────────────────────────────────
 */
export interface BoardObjectAnalysis {
  documents: { id: string; title: string; markdown: string; elementNodeId: string }[];
  apps: { id: string; title: string; html: string; css?: string; js?: string }[];
  quizzes: { id: string; title: string; type: string; config: any; elementNodeId: string }[];
  mindmap: { hasNodes: boolean; rootText: string; count: number };
  fabricObjectCount: number;
  totalItems: number;
}

export function detectBoardObjects(
  canvas: any,
  domElements: Record<string, DomElementState>,
  mindmapNodes: (MindmapLayoutNode | MindmapNodeRecord)[]
): BoardObjectAnalysis {
  const documents: BoardObjectAnalysis['documents'] = [];
  const apps: BoardObjectAnalysis['apps'] = [];
  const quizzes: BoardObjectAnalysis['quizzes'] = [];

  Object.entries(domElements || {}).forEach(([id, el]) => {
    const type = el.componentType || '';
    const config = el.config || {};

    if (type === 'MARKDOWN_NOTE' || type === 'DOCUMENT_PAGE' || type === 'MARKMAP_MINDMAP' || config.markdown || config.content) {
      documents.push({
        id,
        title: config.title || (type === 'MARKMAP_MINDMAP' ? 'Peta Konsep Markmap' : 'Dokumen Materi'),
        markdown: config.markdown || config.content || '',
        elementNodeId: `widget-${id}`
      });
    } else if (type === 'INTERACTIVE_APP' || type === 'MERMAID_DIAGRAM' || config.html) {
      apps.push({
        id,
        title: config.title || (type === 'MERMAID_DIAGRAM' ? 'Diagram Mermaid' : 'Aplikasi Web Interaktif'),
        html: config.html || '',
        css: config.css,
        js: config.js
      });
    } else if (type.startsWith('QUIZ_') || config.options || config.question) {
      quizzes.push({
        id,
        title: config.title || 'Lembar Kuis & Evaluasi',
        type,
        config,
        elementNodeId: `widget-${id}`
      });
    }
  });

  const mindmapCount = (mindmapNodes || []).length;
  const rootNode = (mindmapNodes || []).find(n => !n.parentNodeText) || mindmapNodes?.[0];

  const fabricObjectCount = canvas ? (canvas.getObjects().filter((o: any) => !o.id?.startsWith('__guide')).length) : 0;

  return {
    documents,
    apps,
    quizzes,
    mindmap: {
      hasNodes: mindmapCount > 0,
      rootText: rootNode?.text || 'Peta Konsep',
      count: mindmapCount
    },
    fabricObjectCount,
    totalItems: documents.length + apps.length + quizzes.length + (mindmapCount > 0 ? 1 : 0) + fabricObjectCount
  };
}

/**
 * ── 8. SMART BOUNDING BOX CROP FOR CANVAS EXPORT ────────────────────────────
 * Computes tight bounding box of real objects on the board instead of blank viewport
 */
export function getBoardContentBoundingBox(
  canvas: any,
  domElements: Record<string, DomElementState>
): { left: number; top: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasItems = false;

  // 1. Check Fabric canvas objects
  if (canvas) {
    const objs = canvas.getObjects().filter((o: any) => !o.id?.startsWith('__guide') && o.visible !== false);
    objs.forEach((o: any) => {
      const bound = o.getBoundingRect(true, true);
      if (bound.width > 0 && bound.height > 0) {
        hasItems = true;
        minX = Math.min(minX, bound.left);
        minY = Math.min(minY, bound.top);
        maxX = Math.max(maxX, bound.left + bound.width);
        maxY = Math.max(maxY, bound.top + bound.height);
      }
    });
  }

  // 2. Check DOM overlay elements
  Object.values(domElements || {}).forEach(el => {
    hasItems = true;
    const halfW = (el.width || 400) / 2;
    const halfH = (el.height || 300) / 2;
    minX = Math.min(minX, el.x - halfW);
    minY = Math.min(minY, el.y - halfH);
    maxX = Math.max(maxX, el.x + halfW);
    maxY = Math.max(maxY, el.y + halfH);
  });

  if (!hasItems || minX === Infinity) {
    // Fallback to center viewport
    const w = canvas?.width || 1200;
    const h = canvas?.height || 800;
    return { left: 0, top: 0, width: w, height: h };
  }

  // Add 50px clean padding
  const padding = 50;
  const left = Math.max(0, minX - padding);
  const top = Math.max(0, minY - padding);
  const width = Math.max(400, (maxX - minX) + padding * 2);
  const height = Math.max(300, (maxY - minY) + padding * 2);

  return { left, top, width, height };
}

/**
 * ── 9. EXPORT SMART CROPPED CANVAS (PNG) WITH COMPOSITE OVERLAYS ───────────
 */
export async function exportSmartCroppedCanvasPNG(
  canvas: any,
  domElements: Record<string, DomElementState>,
  multiplier = 2
): Promise<string> {
  if (!canvas) throw new Error('Canvas not found');

  canvas.discardActiveObject();
  canvas.requestRenderAll();

  const bounds = getBoardContentBoundingBox(canvas, domElements);

  // Generate cropped dataURL directly using Fabric's native window cropping
  const dataURL = canvas.toDataURL({
    format: 'png',
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    multiplier
  });

  return dataURL;
}
