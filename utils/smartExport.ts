import { DomElementState, MindmapNodeRecord } from '../types';
import { MindmapLayoutNode } from './mindmapLayout';
import { toPng, toBlob } from 'html-to-image';

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
 * Uses the CSS print-isolation engine to hide 100% of the website UI and print
 * ONLY the pristine document/quiz onto A4 paper.
 */
export function triggerPrintComponent(target: HTMLElement | string) {
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) {
    window.print();
    return;
  }

  document.body.classList.add('printing-isolated');
  el.classList.add('trido-print-target');

  const cleanup = () => {
    document.body.classList.remove('printing-isolated');
    el.classList.remove('trido-print-target');
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(cleanup, 2500);
}

export function printCleanDocument(elementId: string, title?: string) {
  triggerPrintComponent(elementId);
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
 * ── 9. EXPORT SMART CROPPED CANVAS (PNG) WITH SOLID BACKGROUND PLATE ────────
 * Solves the black background issue in Windows/mobile photo viewers by inserting
 * a solid white or dark plate behind the transparent alpha layer.
 */
export async function exportSafeCompositePNG(
  canvas: any,
  domElements: Record<string, DomElementState>,
  options: {
    backgroundColor?: string;
    multiplier?: number;
  } = {}
): Promise<string> {
  if (!canvas) throw new Error('Canvas not found');

  const bg = options.backgroundColor || '#ffffff';
  const multiplier = options.multiplier || 2;

  canvas.discardActiveObject();
  canvas.requestRenderAll();

  const bounds = getBoardContentBoundingBox(canvas, domElements);

  const canvasDataUrl = canvas.toDataURL({
    format: 'png',
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    multiplier
  });

  const offscreen = document.createElement('canvas');
  offscreen.width = Math.round(bounds.width * multiplier);
  offscreen.height = Math.round(bounds.height * multiplier);
  const ctx = offscreen.getContext('2d');
  if (!ctx) return canvasDataUrl;

  if (bg !== 'transparent') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
  }

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = reject;
    img.src = canvasDataUrl;
  });

  return offscreen.toDataURL('image/png');
}

export async function exportSmartCroppedCanvasPNG(
  canvas: any,
  domElements: Record<string, DomElementState>,
  multiplier = 2
): Promise<string> {
  return exportSafeCompositePNG(canvas, domElements, { backgroundColor: '#ffffff', multiplier });
}

/**
 * ── 10. COPY IMAGE DIRECTLY TO CLIPBOARD (Zero-File Workflow) ──────────────
 */
export async function copyImageToClipboard(dataURL: string): Promise<boolean> {
  try {
    const res = await fetch(dataURL);
    const blob = await res.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}

/**
 * ── 11. EXPORT MINDMAP TO MERMAID DECLARATIVE SYNTAX ────────────────────────
 */
export function exportMindmapToMermaid(nodes: (MindmapLayoutNode | MindmapNodeRecord)[]): string {
  if (!nodes || nodes.length === 0) return '';
  const root = nodes.find(n => !n.parentNodeText) || nodes[0];
  let mmd = `mindmap\n  root(("${root.text.replace(/[()"]/g, '')}"))\n`;

  const childMap = new Map<string, any[]>();
  nodes.forEach(n => {
    if (n.parentNodeText) {
      const p = n.parentNodeText.toLowerCase().trim();
      if (!childMap.has(p)) childMap.set(p, []);
      childMap.get(p)!.push(n);
    }
  });

  function appendChildren(parentText: string, depth: number) {
    const children = childMap.get(parentText.toLowerCase().trim()) || [];
    children.forEach(c => {
      const indent = '    '.repeat(depth);
      const cleanLabel = c.text.replace(/["()]/g, '');
      mmd += `${indent}${cleanLabel}\n`;
      appendChildren(c.text, depth + 1);
    });
  }

  appendChildren(root.text, 1);
  return mmd;
}

/**
 * ── 12. EXPORT MINDMAP TO CANVA-COMPATIBLE LAYERED VECTOR SVG ──────────────
 */
export function exportMindmapToCanvaSVG(
  nodes: (MindmapLayoutNode | MindmapNodeRecord)[],
  bgColor = '#ffffff'
): string {
  if (!nodes || nodes.length === 0) return '';

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    const nx = n.x || 0;
    const ny = n.y || 0;
    minX = Math.min(minX, nx - 140);
    minY = Math.min(minY, ny - 60);
    maxX = Math.max(maxX, nx + 140);
    maxY = Math.max(maxY, ny + 60);
  });

  const width = Math.max(800, (maxX - minX) + 120);
  const height = Math.max(600, (maxY - minY) + 120);
  const offsetX = minX - 60;
  const offsetY = minY - 60;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Canva Compatible Solid Background Plate -->
  <rect width="100%" height="100%" fill="${bgColor}" />
  <g id="connections" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round">
`;

  nodes.forEach(n => {
    if (n.parentNodeText) {
      const parent = nodes.find(p => p.text.toLowerCase() === n.parentNodeText?.toLowerCase());
      if (parent) {
        const x1 = (parent.x || 0) - offsetX;
        const y1 = (parent.y || 0) - offsetY;
        const x2 = (n.x || 0) - offsetX;
        const y2 = (n.y || 0) - offsetY;
        svg += `    <path d="M ${x1} ${y1} Q ${(x1 + x2) / 2} ${y1} ${x2} ${y2}" />\n`;
      }
    }
  });

  svg += `  </g>\n  <g id="mindmap-nodes">\n`;

  nodes.forEach((n, idx) => {
    const nx = (n.x || 0) - offsetX;
    const ny = (n.y || 0) - offsetY;
    const isRoot = !n.parentNodeText;
    const rectW = isRoot ? 220 : (n.style === 'SUBTOPIC' ? 180 : 160);
    const rectH = isRoot ? 60 : 44;
    const fill = isRoot ? '#2563eb' : (n.style === 'SUBTOPIC' ? '#f0fdf4' : '#ffffff');
    const stroke = isRoot ? '#1d4ed8' : (n.style === 'SUBTOPIC' ? '#10b981' : '#cbd5e1');
    const textColor = isRoot ? '#ffffff' : (n.style === 'SUBTOPIC' ? '#065f46' : '#1e293b');

    svg += `    <g id="node-${idx}" class="canva-layer" transform="translate(${nx - rectW / 2}, ${ny - rectH / 2})">
      <rect width="${rectW}" height="${rectH}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />
      <text x="${rectW / 2}" y="${rectH / 2 + 5}" fill="${textColor}" font-family="Inter, sans-serif" font-size="${isRoot ? 14 : 12}" font-weight="${isRoot ? 700 : 600}" text-anchor="middle">${n.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
    </g>\n`;
  });

  svg += `  </g>\n</svg>`;
  return svg;
}

/**
 * ── 13. EXPORT QUIZZES TO GIFT FORMAT (Moodle & Canvas LMS) ────────────────
 */
export function exportQuizToGIFT(quizzes: any[]): string {
  let output = `// Kuis Pembelajaran Trido AI\n// Diekspor pada: ${new Date().toLocaleString('id-ID')}\n\n`;

  quizzes.forEach((q, index) => {
    const cfg = q.config || {};
    const title = (q.title || `Soal ${index + 1}`).replace(/[:{}]/g, '');
    const question = (cfg.question || 'Pertanyaan').replace(/[{}]/g, '');

    if (cfg.options && Array.isArray(cfg.options)) {
      output += `::${title}:: ${question} {\n`;
      cfg.options.forEach((opt: string, idx: number) => {
        const isCorrect = idx === cfg.answerIndex || idx === cfg.correctIndex;
        const prefix = isCorrect ? '=' : '~';
        output += `  ${prefix}${opt.replace(/[=~#]/g, '')}\n`;
      });
      output += '}\n\n';
    } else if (q.type === 'QUIZ_TRUE_FALSE') {
      const isTrue = cfg.answer === true || cfg.answer === 'BENAR';
      output += `::${title}:: ${question} {${isTrue ? 'TRUE' : 'FALSE'}}\n\n`;
    } else {
      output += `::${title}:: ${question} {}\n\n`;
    }
  });

  return output;
}

/**
 * ── 14. EXPORT QUIZZES TO QUIZIZZ / KAHOOT CSV ────────────────────────────
 */
export function exportQuizToQuizizzCSV(quizzes: any[]): string {
  let csv = 'Question,Option 1,Option 2,Option 3,Option 4,Correct Answer,Time in seconds\n';

  quizzes.forEach(q => {
    const cfg = q.config || {};
    const question = `"${(cfg.question || '').replace(/"/g, '""')}"`;
    const opts = (cfg.options || []).map((o: string) => `"${o.replace(/"/g, '""')}"`);
    while (opts.length < 4) opts.push('""');
    const correctNum = ((cfg.answerIndex !== undefined ? cfg.answerIndex : cfg.correctIndex) || 0) + 1;
    csv += `${question},${opts[0]},${opts[1]},${opts[2]},${opts[3]},${correctNum},30\n`;
  });

  return csv;
}

/**
 * ── 15. EXPORT ANY DOM COMPONENT DIRECTLY AS HIGH-PRECISION PNG ─────────────
 */
export async function exportComponentAsPNG(
  target: string | HTMLElement,
  title: string,
  options: { pixelRatio?: number; backgroundColor?: string } = {}
): Promise<boolean> {
  const node = typeof target === 'string' ? document.getElementById(target) : target;
  if (!node) return false;

  const bg = options.backgroundColor || '#ffffff';
  const pixelRatio = options.pixelRatio || 2;

  try {
    const dataUrl = await toPng(node, {
      pixelRatio,
      backgroundColor: bg,
      filter: (child: HTMLElement) => !child.classList?.contains('no-print')
    });

    downloadFile(dataUrl, `${slugify(title)}_${pixelRatio}x.png`, 'image/png');
    return true;
  } catch (err) {
    console.error('Failed to export component as PNG:', err);
    return false;
  }
}

/**
 * ── 16. COPY COMPONENT DIRECTLY AS IMAGE TO CLIPBOARD ──────────────────────
 */
export async function copyComponentAsImage(target: string | HTMLElement): Promise<boolean> {
  const node = typeof target === 'string' ? document.getElementById(target) : target;
  if (!node) return false;

  try {
    const blob = await toBlob(node, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: (child: HTMLElement) => !child.classList?.contains('no-print')
    });
    if (!blob) return false;

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  } catch (err) {
    console.error('Failed to copy component image:', err);
    return false;
  }
}
