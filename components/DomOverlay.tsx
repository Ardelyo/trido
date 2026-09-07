import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Code, Compass, BookOpen, Clock, Calculator, HelpCircle, Layers, Sparkles, Users, SquareCheckBig,
  Image as ImageIcon, Copy
} from 'lucide-react';
import {
  triggerPrintComponent,
  printCleanDocument,
  exportDocumentAsHtml,
  exportDocumentAsMarkdown,
  exportInteractiveAppAsHtml,
  exportQuizAsPrintableWorksheet,
  exportComponentAsPNG,
  copyComponentAsImage,
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

    triggerPrintComponent(`widget-${el.id}`);
    toast.success('Membuka pratinjau cetak PDF bersih.');
  };

  const handleExportComponentPNG = async (el: DomElementState, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const title = el.config?.title || el.componentType || 'komponen';
    toast.info('Membuat gambar PNG HD...');
    const ok = await exportComponentAsPNG(`widget-${el.id}`, title, { pixelRatio: 2 });
    if (ok) {
      toast.success('Gambar PNG berhasil diunduh!');
    } else {
      toast.error('Gagal membuat gambar PNG.');
    }
  };

  const handleCopyComponentImage = async (el: DomElementState, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toast.info('Menyalin gambar ke clipboard...');
    const ok = await copyComponentAsImage(`widget-${el.id}`);
    if (ok) {
      toast.success('Gambar disalin ke clipboard! Siap di-paste ke Canva/WA.');
    } else {
      toast.error('Gagal menyalin gambar.');
    }
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
                  {/* Unduh PNG */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleExportComponentPNG(el, e)}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-blue-600 transition cursor-pointer"
                    title="Unduh Gambar PNG HD Objek (2x Retina)"
                  >
                    <ImageIcon size={13} />
                  </button>

                  {/* Salin Gambar */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleCopyComponentImage(el, e)}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-emerald-600 transition cursor-pointer"
                    title="Salin Gambar ke Clipboard (Siap Paste ke Canva/Word/WA)"
                  >
                    <Copy size={13} />
                  </button>

                  {/* Print / PDF */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handlePrint(el, e)}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                    title="Cetak Dokumen Bersih / PDF"
                  >
                    <Printer size={13} />
                  </button>

                  {/* Quick Export Artifact */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleQuickExport(el, e)}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-amber-600 transition cursor-pointer"
                    title="Unduh Berkas Mandiri (HTML/SVG/MD/CSV)"
                  >
                    <Download size={13} />
                  </button>

                  {/* Fullscreen / Focus Mode */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setFullscreenWidgetId(el.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-purple-600 transition cursor-pointer"
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

      {/* ── 2. TRUE FULLSCREEN PC FOCUS MODE OVERLAY (MOUNTED DIRECTLY TO BODY VIA PORTAL) ── */}
      {activeFullscreenEl && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center pointer-events-auto p-3 sm:p-6 lg:p-8 font-sans select-none">
          {/* Dark Backdrop */}
          <div
            onClick={() => setFullscreenWidgetId(null)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
          />

          {/* Desktop Fullscreen Window Card */}
          <div className="relative w-full h-full max-w-7xl max-h-[95vh] bg-white rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.6)] border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 z-10">
            {/* Titlebar */}
            <div className="flex h-14 px-6 items-center justify-between bg-slate-50 border-b border-slate-200/90 shrink-0 select-none">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm shrink-0">
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
                  onClick={(e) => handleExportComponentPNG(activeFullscreenEl, e)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Unduh Gambar PNG HD Objek"
                >
                  <ImageIcon size={14} /> Unduh PNG
                </button>

                <button
                  onClick={(e) => handleCopyComponentImage(activeFullscreenEl, e)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Salin Gambar ke Clipboard"
                >
                  <Copy size={14} /> Salin Gambar
                </button>

                <button
                  onClick={(e) => handlePrint(activeFullscreenEl, e)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Cetak Dokumen Bersih / PDF"
                >
                  <Printer size={14} /> Cetak / PDF
                </button>

                <button
                  onClick={(e) => handleQuickExport(activeFullscreenEl, e)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Unduh Berkas Mandiri"
                >
                  <Download size={14} /> Unduh Berkas
                </button>

                <button
                  onClick={() => setFullscreenWidgetId(null)}
                  className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer ml-1"
                  title="Keluar Layar Penuh (ESC)"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            </div>

            {/* Content Body in Fullscreen */}
            <div id={`widget-${activeFullscreenEl.id}-fullscreen`} className="flex-1 bg-white relative overflow-auto p-4 sm:p-8">
              {renderContent(activeFullscreenEl)}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
