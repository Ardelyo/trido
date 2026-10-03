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
  Image as ImageIcon, Copy, GripVertical
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
  const [draggingWidget, setDraggingWidget] = useState<{ id: string; startMouseX: number; startMouseY: number; startElX: number; startElY: number } | null>(null);
  const [resizingWidget, setResizingWidget] = useState<{ id: string; startMouseX: number; startMouseY: number; startWidth: number; startHeight: number } | null>(null);

  const handleTitlebarMouseDown = (el: DomElementState, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only drag on left click
    e.preventDefault();
    e.stopPropagation();
    setDraggingWidget({
      id: el.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElX: el.x,
      startElY: el.y
    });
  };

  const handleResizeMouseDown = (el: DomElementState, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setResizingWidget({
      id: el.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: el.width,
      startHeight: el.height
    });
  };

  useEffect(() => {
    if (!draggingWidget && !resizingWidget) return;

    const handleMouseMove = (e: MouseEvent) => {
      const scale = viewportTransform[0] || 1;

      if (draggingWidget) {
        const deltaX = (e.clientX - draggingWidget.startMouseX) / scale;
        const deltaY = (e.clientY - draggingWidget.startMouseY) / scale;

        const newX = Math.round(draggingWidget.startElX + deltaX);
        const newY = Math.round(draggingWidget.startElY + deltaY);

        useStore.getState().updateDomElement(draggingWidget.id, { x: newX, y: newY });
        const event = new CustomEvent('moveCanvasPlaceholder', { detail: { id: draggingWidget.id, x: newX, y: newY } });
        window.dispatchEvent(event);
      } else if (resizingWidget) {
        const deltaX = (e.clientX - resizingWidget.startMouseX) / scale;
        const deltaY = (e.clientY - resizingWidget.startMouseY) / scale;

        const newW = Math.max(260, Math.round(resizingWidget.startWidth + deltaX));
        const newH = Math.max(180, Math.round(resizingWidget.startHeight + deltaY));

        useStore.getState().updateDomElement(resizingWidget.id, { width: newW, height: newH });
        const event = new CustomEvent('resizeCanvasPlaceholder', { detail: { id: resizingWidget.id, width: newW, height: newH } });
        window.dispatchEvent(event);
      }
    };

    const handleMouseUp = () => {
      setDraggingWidget(null);
      setResizingWidget(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingWidget, resizingWidget, viewportTransform]);

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
        case 'MERMAID_DIAGRAM':
          return <MermaidTool id={el.id} config={el.config} />;
        case 'INTERACTIVE_APP':
        case 'APP_BUILDER':
        case 'STEM_SIMULATION':
        case 'SIMULASI_FISIKA':
        case 'SIMULASI_KIMIA':
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

          const isDragging = draggingWidget?.id === el.id;
          const isResizing = resizingWidget?.id === el.id;

          return (
            <div
              key={el.id}
              className={`absolute flex flex-col overflow-hidden rounded-[2rem] bg-white border-2 transition-all duration-200 will-change-transform select-none ${
                isActing ? 'opacity-50' : 'opacity-100'
              } ${
                isDragging
                  ? 'shadow-[0_24px_70px_rgba(10,26,58,0.22)] border-[#1550aa] scale-[1.018] z-40 ring-4 ring-[#1550aa]/15'
                  : 'shadow-[0_12px_45px_rgba(10,26,58,0.10)] border-slate-200/90 hover:border-slate-300'
              }`}
              style={{
                width: `${el.width}px`,
                height: `${el.height}px`,
                left: el.x,
                top: el.y,
                transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                transformOrigin: 'center center',
                pointerEvents: 'auto'
              }}
            >
              {/* Desktop Header / PC Window Titlebar with Generous Drag Area */}
              <div
                onMouseDown={(e) => handleTitlebarMouseDown(el, e)}
                onDoubleClick={() => setFullscreenWidgetId(el.id)}
                className={`flex h-12 w-full items-center justify-between px-3.5 border-b border-slate-200/80 shrink-0 select-none transition-colors cursor-grab active:cursor-grabbing ${
                  isDragging ? 'bg-[#1550aa]/10' : 'bg-slate-50/90 hover:bg-slate-100/90'
                }`}
                title="Tahan dan geser di mana saja pada judul untuk memindahkan widget • Klik ganda untuk Layar Penuh"
              >
                {/* Title & Icon & Drag Hitbox (Flex-1 so touching/clicking anywhere drags) */}
                <div className="flex-1 flex items-center gap-2.5 min-w-0 pr-3 py-1 cursor-grab active:cursor-grabbing">
                  <div className="flex items-center justify-center text-slate-400 group-hover:text-slate-600 shrink-0">
                    <GripVertical size={16} />
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0">
                    {getComponentIcon(el.componentType)}
                  </div>
                  <div className="font-extrabold text-[12.5px] text-[#0a1a3a] tracking-tight truncate font-sans">
                    {title}
                  </div>
                </div>

                {/* PC Window Actions: Clean, non-redundant controls */}
                <div className="flex items-center gap-1 shrink-0 no-print" onMouseDown={(e) => e.stopPropagation()}>
                  {/* Quick Export Artifact */}
                  <button
                    onClick={(e) => handleQuickExport(el, e)}
                    className="p-1.5 rounded-full hover:bg-slate-200/70 text-slate-500 hover:text-[#1550aa] transition cursor-pointer"
                    title="Unduh Berkas Mandiri (SVG/MD/HTML)"
                  >
                    <Download size={14} />
                  </button>

                  {/* Fullscreen / Focus Mode */}
                  <button
                    onClick={() => setFullscreenWidgetId(el.id)}
                    className="p-1.5 rounded-full hover:bg-slate-200/70 text-slate-500 hover:text-purple-600 transition cursor-pointer"
                    title="Layar Penuh (Fullscreen PC Focus)"
                  >
                    <Maximize2 size={14} />
                  </button>

                  <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />

                  {/* Sole Close / Delete Button */}
                  <button
                    onClick={(e) => handleDelete(el.id, e)}
                    className="p-1.5 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Tutup Komponen"
                  >
                    <X size={15} strokeWidth={2.5} />
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

              {/* Tactile Corner Resize Handle (learned from C7Cards & windows) */}
              <div
                onMouseDown={(e) => handleResizeMouseDown(el, e)}
                className="absolute bottom-0 right-0 w-8 h-8 flex items-end justify-end p-1.5 cursor-nwse-resize z-40 select-none group/resize touch-none"
                title="Tarik sudut untuk mengubah ukuran widget"
              >
                <div className="w-3.5 h-3.5 rounded-br-sm border-b-2 border-r-2 border-[#1550aa] group-hover/resize:border-[#ffcc00] group-hover/resize:scale-125 transition-all" />
                {isResizing && (
                  <div className="absolute -top-7 right-0 px-2 py-0.5 rounded-full bg-[#0a1a3a] text-white text-[10px] font-mono font-bold whitespace-nowrap shadow-md pointer-events-none">
                    {el.width} × {el.height}
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
