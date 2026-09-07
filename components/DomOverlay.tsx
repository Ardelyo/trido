import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { DomElementState } from '../types';
import { QuizMultipleChoice } from './quiz/QuizMultipleChoice';
import { QuizEssay } from './quiz/QuizEssay';
import { QuizTrueFalse } from './quiz/QuizTrueFalse';
import { QuizDragMatch } from './quiz/QuizDragMatch';
import { DocumentBlock } from './DocumentBlock';
import { TimerTool } from './TimerTool';
import { CalculatorTool } from './CalculatorTool';
import { AppBuilderTool } from './AppBuilderTool';
import { FlashcardTool } from './FlashcardTool';
import { QuizApp } from './quiz/QuizApp';
import { MarkmapTool } from './MarkmapTool';
import { MermaidTool } from './MermaidTool';
import { AttendanceTool } from './AttendanceTool';
import { TodoListTool } from './TodoListTool';
import { SpinWheelTool } from './SpinWheelTool';
import { ScoreboardTool } from './ScoreboardTool';
import { MathGraphTool } from './MathGraphTool';
import {
  Printer, Maximize2, Minimize2, X, Download, FileText, Globe,
  Code, Compass, BookOpen, Clock, Calculator, HelpCircle, Layers, Sparkles, Users, SquareCheckBig
} from 'lucide-react';
import {
  printCleanDocument,
  exportDocumentAsHtml,
  exportDocumentAsMarkdown,
  exportInteractiveAppAsHtml,
  exportQuizAsPrintableWorksheet,
  downloadFile,
  slugify
} from '../utils/smartExport';
import { toast } from '../utils/toast';

export const DomOverlay: React.FC = () => {
  const domElements = useStore(state => state.domElements);
  const viewportTransform = useStore(state => state.viewportTransform);
  const isActing = useStore(state => state.isActing);
  const removeDomElement = useStore(state => state.removeDomElement);

  const [fullscreenWidgetId, setFullscreenWidgetId] = useState<string | null>(null);

  // Keyboard shortcut: Escape exits fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenWidgetId) {
        setFullscreenWidgetId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenWidgetId]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (fullscreenWidgetId === id) setFullscreenWidgetId(null);
    removeDomElement(id);
    const event = new CustomEvent('removeCanvasObject', { detail: { id } });
    window.dispatchEvent(event);
  };

  const handlePrint = (el: DomElementState, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const title = el.config?.title || el.componentType || 'Trido Dokumen';
    const type = el.componentType || '';

    // Specialized print handlers
    if (type.startsWith('QUIZ_')) {
      exportQuizAsPrintableWorksheet({ title, type, config: el.config });
      toast.success('Membuka lembar ujian siap cetak.');
      return;
    }

    if (type === 'MARKDOWN_NOTE' || type === 'DOCUMENT_PAGE' || type === 'MARKMAP_MINDMAP') {
      const ok = printCleanDocument(`widget-${el.id}`, title);
      if (ok) {
        toast.success('Membuka pratinjau cetak PDF bersih.');
        return;
      }
    }

    // Generic fallback print
    const elementNode = document.getElementById(`widget-${el.id}`);
    if (!elementNode) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.css" />
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
              .print-container { overflow: visible !important; height: auto !important; }
              * { box-shadow: none !important; }
            }
            body { padding: 30px; font-family: sans-serif; background: white; color: #1e293b; }
            .print-container { max-width: 850px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${elementNode.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 800);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleQuickExport = (el: DomElementState, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const type = el.componentType || '';
    const config = el.config || {};
    const title = config.title || type;

    if (type === 'MARKDOWN_NOTE' || type === 'DOCUMENT_PAGE') {
      exportDocumentAsHtml(title, config.markdown || config.content || '');
      toast.success('Dokumen HTML berhasil diunduh.');
    } else if (type === 'MARKMAP_MINDMAP') {
      const svg = document.querySelector(`#widget-${el.id} svg`);
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        downloadFile(svgData, `${slugify(title)}_markmap.svg`, 'image/svg+xml;charset=utf-8');
        toast.success('Vektor SVG Markmap berhasil diunduh.');
      } else {
        exportDocumentAsMarkdown(title, config.markdown || config.content || '');
        toast.success('Markdown berhasil diunduh.');
      }
    } else if (type === 'MERMAID_DIAGRAM') {
      const svg = document.querySelector(`#widget-${el.id} svg`);
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        downloadFile(svgData, `${slugify(title)}_diagram.svg`, 'image/svg+xml;charset=utf-8');
        toast.success('Vektor SVG diagram berhasil diunduh.');
      } else {
        downloadFile(config.code || '', `${slugify(title)}.mmd`, 'text/plain;charset=utf-8');
        toast.success('Kode Mermaid berhasil diunduh.');
      }
    } else if (type === 'INTERACTIVE_APP') {
      exportInteractiveAppAsHtml({
        title,
        html: config.html || '',
        css: config.css,
        js: config.js
      });
      toast.success('Aplikasi web mandiri (.html) berhasil diunduh.');
    } else if (type.startsWith('QUIZ_')) {
      exportQuizAsPrintableWorksheet({ title, type, config });
      toast.success('Membuka lembar ujian siswa.');
    } else {
      handlePrint(el, e);
    }
  };

  const getComponentIcon = (type?: string) => {
    switch (type) {
      case 'MARKDOWN_NOTE':
      case 'DOCUMENT_PAGE':
        return <BookOpen size={14} className="text-indigo-600" />;
      case 'MARKMAP_MINDMAP':
        return <Compass size={14} className="text-blue-600" />;
      case 'MERMAID_DIAGRAM':
        return <Layers size={14} className="text-emerald-600" />;
      case 'INTERACTIVE_APP':
        return <Code size={14} className="text-purple-600" />;
      case 'TIMER':
        return <Clock size={14} className="text-amber-600" />;
      case 'CALCULATOR':
        return <Calculator size={14} className="text-slate-600" />;
      case 'ATTENDANCE':
      case 'PRESENSI':
        return <Users size={14} className="text-blue-600" />;
      case 'TODOLIST':
        return <SquareCheckBig size={14} className="text-emerald-600" />;
      default:
        if (type?.startsWith('QUIZ')) return <HelpCircle size={14} className="text-rose-600" />;
        return <Sparkles size={14} className="text-blue-600" />;
    }
  };

  const renderContent = (el: DomElementState) => {
    if (el.componentType) {
      switch (el.componentType) {
        case 'QUIZ_MULTIPLE_CHOICE':
          return <QuizMultipleChoice config={el.config} />;
        case 'QUIZ_ESSAY':
          return <QuizEssay config={el.config} />;
        case 'QUIZ_TRUE_FALSE':
          return <QuizTrueFalse config={el.config} />;
        case 'QUIZ_DRAG_MATCH':
          return <QuizDragMatch config={el.config} />;
        case 'MARKDOWN_NOTE':
        case 'DOCUMENT_PAGE':
          return <DocumentBlock config={el.config} />;
        case 'TIMER':
          return <TimerTool config={el.config} />;
        case 'CALCULATOR':
          return <CalculatorTool />;
        case 'ATTENDANCE':
        case 'PRESENSI':
          return <AttendanceTool config={el.config} />;
        case 'TODOLIST':
          return <TodoListTool />;
        case 'SPIN_WHEEL':
        case 'RODA_ACAK':
          return <SpinWheelTool config={el.config} />;
        case 'SCOREBOARD':
        case 'PAPAN_SKOR':
          return <ScoreboardTool config={el.config} />;
        case 'MATH_GRAPH':
        case 'GRAFIK_MATEMATIKA':
          return <MathGraphTool config={el.config} />;
        case 'FLASHCARD':
          return <FlashcardTool config={el.config} />;
        case 'MARKMAP_MINDMAP':
          return <MarkmapTool config={el.config} />;
        case 'MERMAID_DIAGRAM':
          return <MermaidTool config={el.config} />;
        case 'INTERACTIVE_APP':
          return <AppBuilderTool config={el.config} />;
        case 'QUIZ_APP':
          return <QuizApp config={el.config} />;
        case 'IMAGE_URL':
          return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 p-3">
              <img
                src={el.config?.url}
                alt="Uploaded"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          );
        default:
          return (
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: el.html || '<div>Konten widget</div>' }}
            />
          );
      }
    }
    return (
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: el.html || '<div>Konten</div>' }}
      />
    );
  };

  const activeFullscreenEl = fullscreenWidgetId ? domElements[fullscreenWidgetId] : null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {/* ── 1. REGULAR CANVAS-PINNED DOM ELEMENTS ── */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `matrix(${viewportTransform.join(',')})`,
          transformOrigin: '0 0'
        }}
      >
        {Object.values(domElements).map((el: DomElementState) => {
          if (fullscreenWidgetId === el.id) return null; // Rendered in fullscreen portal instead

          const title = el.config?.title || el.componentType?.replace(/_/g, ' ') || 'KOMPONEN';

          return (
            <div
              key={el.id}
              className={`absolute flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_45px_rgba(0,0,0,0.12)] border border-slate-200/90 transition-opacity duration-300 will-change-transform select-none ${
                isActing ? 'opacity-50' : 'opacity-100'
              }`}
              style={{
                width: `${el.width}px`,
                height: `${el.height}px`,
                left: el.x,
                top: el.y,
                transform: `translate(-50%, -50%) scale(${el.scaleX}, ${el.scaleY}) rotate(${el.rotation}deg)`,
                transformOrigin: 'center center',
                pointerEvents: 'auto'
              }}
            >
              {/* Desktop Header / PC Window Titlebar */}
              <div
                onDoubleClick={() => setFullscreenWidgetId(el.id)}
                className="flex h-11 w-full items-center justify-between bg-slate-50/95 px-3.5 border-b border-slate-200/80 shrink-0 select-none cursor-move"
                title="Klik ganda untuk Layar Penuh (Fullscreen)"
              >
                {/* Title & Icon */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0">
                    {getComponentIcon(el.componentType)}
                  </div>
                  <div className="font-extrabold text-[12px] text-slate-800 tracking-tight truncate font-sans">
                    {title}
                  </div>
                </div>

                {/* PC Window Actions */}
                <div className="flex items-center gap-1 shrink-0 no-print">
                  {/* Print / PDF */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handlePrint(el, e)}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                    title="Cetak Dokumen / Unduh PDF Bersih"
                  >
                    <Printer size={13} />
                  </button>

                  {/* Quick Export Artifact */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleQuickExport(el, e)}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-blue-600 transition cursor-pointer"
                    title="Unduh Berkas Objek Mandiri (HTML/SVG/MD)"
                  >
                    <Download size={13} />
                  </button>

                  {/* Fullscreen / Focus Mode */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setFullscreenWidgetId(el.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-emerald-600 transition cursor-pointer"
                    title="Layar Penuh (Fullscreen PC Focus)"
                  >
                    <Maximize2 size={13} />
                  </button>

                  <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

                  {/* Close / Delete */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleDelete(el.id, e)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Tutup Komponen"
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Application Content */}
              <div id={`widget-${el.id}`} className="flex-1 bg-white relative overflow-auto pointer-events-auto">
                {renderContent(el)}

                {isActing && (
                  <div className="absolute inset-0 z-50 bg-[#00f0ff]/5 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-black/90 px-3 py-1 rounded border border-cyan-400/50 text-cyan-300 text-[10px] font-mono animate-pulse tracking-tighter">
                      AGENT_INTERACTING...
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2. FULLSCREEN PC FOCUS MODE OVERLAY ── */}
      {activeFullscreenEl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto p-4 sm:p-8 lg:p-12">
          {/* Backdrop */}
          <div
            onClick={() => setFullscreenWidgetId(null)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
          />

          {/* Desktop Fullscreen Window Card */}
          <div className="relative w-full h-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.35)] border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Titlebar */}
            <div className="flex h-13 px-6 items-center justify-between bg-slate-50 border-b border-slate-200/90 shrink-0 select-none">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm shrink-0">
                  {getComponentIcon(activeFullscreenEl.componentType)}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight truncate">
                    {activeFullscreenEl.config?.title || activeFullscreenEl.componentType?.replace(/_/g, ' ') || 'KOMPONEN'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Mode Fokus Layar Penuh (Tekan ESC untuk kembali)</p>
                </div>
              </div>

              {/* Titlebar Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handlePrint(activeFullscreenEl, e)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Cetak Dokumen / Unduh PDF"
                >
                  <Printer size={14} /> Cetak / PDF
                </button>

                <button
                  onClick={(e) => handleQuickExport(activeFullscreenEl, e)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Unduh Berkas Mandiri"
                >
                  <Download size={14} /> Unduh Berkas
                </button>

                <button
                  onClick={() => setFullscreenWidgetId(null)}
                  className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition cursor-pointer ml-1"
                  title="Keluar Layar Penuh (ESC)"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            </div>

            {/* Content Body in Fullscreen */}
            <div id={`widget-${activeFullscreenEl.id}-fullscreen`} className="flex-1 bg-white relative overflow-auto p-4 sm:p-6">
              {renderContent(activeFullscreenEl)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
