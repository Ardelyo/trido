import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, Image as ImageIcon, FileJson, FileText, Upload,
  Layers, Check, Sparkles, FolderUp, History, ArrowRight,
  Code, Globe, BookOpen, CheckSquare, Printer, Compass, FileCode
} from 'lucide-react';
import { useStore } from '../store';
import { toast } from '../utils/toast';
import { useTranslation } from '../utils/translations';
import {
  detectBoardObjects,
  exportDocumentAsHtml,
  exportDocumentAsMarkdown,
  printCleanDocument,
  exportInteractiveAppAsHtml,
  exportQuizAsPrintableWorksheet,
  exportMindmapAsMarkdown,
  exportSmartCroppedCanvasPNG,
  getBoardContentBoundingBox,
  downloadFile,
  slugify
} from '../utils/smartExport';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<any>;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, canvasRef }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'objects' | 'board' | 'import'>('objects');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const {
    pages,
    currentPageIndex,
    domElements,
    activeMindmapNodes,
    importProjectSession,
    toggleHistory
  } = useStore();

  // Detect rich objects on the current board
  const detected = useMemo(() => {
    return detectBoardObjects(canvasRef.current, domElements, activeMindmapNodes);
  }, [domElements, activeMindmapNodes, canvasRef.current, isOpen]);

  // ── 1. SMART CROPPED PNG EXPORT ──────────────────────────────────────────
  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    try {
      const dataURL = await exportSmartCroppedCanvasPNG(canvas, domElements, 2);
      downloadFile(dataURL, `trido_papan_${Date.now()}.png`, 'image/png');
      toast.success('Gambar PNG berhasil diekspor (Auto-Crop objek).');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengekspor gambar PNG.');
    }
  };

  // ── 2. SMART CROPPED SVG EXPORT ──────────────────────────────────────────
  const handleExportSVG = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    try {
      const bounds = getBoardContentBoundingBox(canvas, domElements);
      const svg = canvas.toSVG({
        viewBox: {
          x: bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height
        }
      });

      downloadFile(svg, `trido_vektor_${Date.now()}.svg`, 'image/svg+xml;charset=utf-8');
      toast.success('Vektor SVG berhasil diekspor (Auto-Crop objek).');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengekspor vektor SVG.');
    }
  };

  // ── 3. SMART CROPPED PDF EXPORT ──────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    setIsExportingPdf(true);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const dataURL = await exportSmartCroppedCanvasPNG(canvas, domElements, 2);

      const pdfDoc = await PDFDocument.create();
      // A4 landscape: 842 x 595 pt
      const page = pdfDoc.addPage([842, 595]);

      const pngImageBytes = await fetch(dataURL).then(res => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      const margin = 28;
      const maxWidth = 842 - margin * 2;
      const maxHeight = 595 - margin * 2;

      let drawWidth = maxWidth;
      let drawHeight = (pngImage.height / pngImage.width) * drawWidth;

      if (drawHeight > maxHeight) {
        drawHeight = maxHeight;
        drawWidth = (pngImage.width / pngImage.height) * drawHeight;
      }

      const x = margin + (maxWidth - drawWidth) / 2;
      const y = margin + (maxHeight - drawHeight) / 2;

      page.drawImage(pngImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight
      });

      const pdfBytes = await pdfDoc.save();
      downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), `trido_dokumen_${Date.now()}.pdf`, 'application/pdf');

      toast.success('Dokumen PDF berhasil dibuat.');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal membuat dokumen PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ── 4. EXPORT PROJECT JSON ───────────────────────────────────────────────
  const handleExportJSON = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const currentCanvasJson = canvas.toJSON(['id', 'zIndex', 'isDomPlaceholder']);
    
    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = {
      canvas: currentCanvasJson,
      dom: domElements,
      previewDataUrl: canvas.toDataURL({ format: 'png', multiplier: 0.2 }),
      mindmapNodes: activeMindmapNodes
    };

    const exportData = {
      app: 'trido',
      version: '1.0.0',
      exportedAt: Date.now(),
      title: `Trido Board Backup - ${new Date().toLocaleDateString('id-ID')}`,
      pages: updatedPages,
      currentPageIndex
    };

    downloadFile(JSON.stringify(exportData, null, 2), `trido_proyek_${Date.now()}.trido.json`, 'application/json');
    toast.success('Cadangan berkas proyek berhasil diekspor.');
    onClose();
  };

  // ── 5. IMPORT PROJECT FILE (.trido / .json) ──────────────────────────────
  const handleProjectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importProjectSession(parsed);
      toast.success(`Proyek "${file.name}" berhasil diimpor!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal membaca berkas proyek.');
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  // ── 6. IMPORT IMAGE ONTO CANVAS ──────────────────────────────────────────
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current || !window.fabric) return;

    const canvas = canvasRef.current;
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      window.fabric.Image.fromURL(dataUrl, (img: any) => {
        if (!img) {
          toast.error('Gagal memuat gambar.');
          return;
        }

        const maxDim = 400;
        let scale = 1;
        if (img.width > maxDim || img.height > maxDim) {
          scale = maxDim / Math.max(img.width, img.height);
        }

        const center = canvas.getCenter();
        img.set({
          left: center.left - (img.width * scale) / 2,
          top: center.top - (img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          cornerColor: '#2563eb',
          cornerStyle: 'circle',
          borderColor: '#3b82f6',
          transparentCorners: false
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        toast.success('Gambar berhasil ditambahkan ke kanvas!');
        onClose();
      });
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const hasSpecificObjects = detected.documents.length > 0 || detected.apps.length > 0 || detected.quizzes.length > 0 || detected.mindmap.hasNodes;

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-xl bg-white rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.18)] border border-slate-200 z-[101] overflow-hidden flex flex-col font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-slate-900 leading-tight">
                    Pusat Ekspor & Unduh Cerdas
                  </h3>
                  <p className="text-[12px] text-slate-500 font-medium">
                    Ekspor objek digital (dokumen, web app, kuis) atau seluruh papan
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1.5 bg-slate-100/80 border-b border-slate-200/60 gap-1 px-4">
              <button
                type="button"
                onClick={() => setActiveTab('objects')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'objects'
                    ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles size={14} /> Objek di Papan
                {hasSpecificObjects && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse ml-0.5"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('board')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'board'
                    ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={14} /> Seluruh Papan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'import'
                    ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload size={14} /> Impor
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={projectFileInputRef}
              type="file"
              accept=".json,.trido"
              className="hidden"
              onChange={handleProjectFileChange}
            />
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {/* Content Body */}
            <div className="p-5 flex flex-col gap-3 max-h-[64vh] overflow-y-auto custom-scrollbar">
              {/* ── TAB 1: OBJECTS EXPORT (DOKUMEN, WEBSITE, KUIS, MINDMAP) ── */}
              {activeTab === 'objects' && (
                <div className="flex flex-col gap-3">
                  {/* Documents Section */}
                  {detected.documents.map((doc, idx) => (
                    <div key={doc.id || idx} className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <BookOpen size={16} />
                          </div>
                          <div>
                            <div className="text-[10px] font-black tracking-wider uppercase text-indigo-600">Dokumen / Catatan Materi</div>
                            <div className="font-bold text-slate-800 text-sm line-clamp-1">{doc.title}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            printCleanDocument(doc.elementNodeId, doc.title);
                            toast.success('Membuka pratinjau cetak PDF bersih.');
                            onClose();
                          }}
                          className="px-2.5 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-[11px] font-bold text-slate-700 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Printer size={13} /> Cetak / PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            exportDocumentAsHtml(doc.title, doc.markdown);
                            toast.success('Dokumen HTML berhasil diunduh.');
                            onClose();
                          }}
                          className="px-2.5 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-[11px] font-bold text-slate-700 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Globe size={13} /> Laman HTML
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            exportDocumentAsMarkdown(doc.title, doc.markdown);
                            toast.success('Berkas Markdown (.md) berhasil diunduh.');
                            onClose();
                          }}
                          className="px-2.5 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-[11px] font-bold text-slate-700 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <FileText size={13} /> Markdown
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Interactive Apps / Website Section */}
                  {detected.apps.map((app, idx) => (
                    <div key={app.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 text-slate-100 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Code size={16} />
                          </div>
                          <div>
                            <div className="text-[10px] font-black tracking-wider uppercase text-emerald-400">Aplikasi Web Interaktif / Website Artifact</div>
                            <div className="font-bold text-white text-sm line-clamp-1">{app.title}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            exportInteractiveAppAsHtml({
                              title: app.title,
                              html: app.html,
                              css: app.css,
                              js: app.js
                            });
                            toast.success('Aplikasi web mandiri (.html) berhasil diunduh!');
                            onClose();
                          }}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                        >
                          <FileCode size={15} /> Unduh File Web Standalone (.html)
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Quizzes Section */}
                  {detected.quizzes.map((quiz, idx) => (
                    <div key={quiz.id || idx} className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                          <CheckSquare size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-wider uppercase text-amber-600">Kuis & Lembar Soal</div>
                          <div className="font-bold text-slate-800 text-sm line-clamp-1">{quiz.title}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          exportQuizAsPrintableWorksheet(quiz);
                          toast.success('Membuka lembar ujian siap cetak.');
                          onClose();
                        }}
                        className="py-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold text-slate-800 hover:text-amber-700 flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                      >
                        <Printer size={14} /> Cetak Lembar Ujian Siswa (PDF)
                      </button>
                    </div>
                  ))}

                  {/* Mindmap Section */}
                  {detected.mindmap.hasNodes && (
                    <div key="mindmap" className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Compass size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-wider uppercase text-blue-600">Mind Map & Peta Konsep</div>
                          <div className="font-bold text-slate-800 text-sm">
                            {detected.mindmap.rootText} ({detected.mindmap.count} cabang)
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            exportMindmapAsMarkdown(activeMindmapNodes);
                            toast.success('Garis besar mindmap (.md) berhasil diunduh.');
                            onClose();
                          }}
                          className="py-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <FileText size={13} /> Garis Besar Teks (.md)
                        </button>
                        <button
                          type="button"
                          onClick={handleExportSVG}
                          className="py-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Layers size={13} /> Vektor SVG Bersih
                        </button>
                      </div>
                    </div>
                  )}

                  {!hasSpecificObjects && (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center">
                        <Sparkles size={18} />
                      </div>
                      <div className="font-bold text-slate-700 text-sm">Belum ada objek dokumen/website mandiri</div>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Buat catatan materi, kuis, atau aplikasi web bersama AI, atau ekspor coretan gambar papan di tab <strong>Seluruh Papan</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: BOARD EXPORT (SMART AUTO-CROPPED) ── */}
              {activeTab === 'board' && (
                <div className="flex flex-col gap-2.5">
                  {/* PNG HD */}
                  <button
                    onClick={handleExportPNG}
                    className="flex items-center gap-3.5 px-4 py-3.5 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all group text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ImageIcon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-[14.5px] flex items-center gap-2">
                        Gambar PNG (HD)
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">Auto-Crop</span>
                      </div>
                      <div className="text-[12px] text-slate-500 font-medium">
                        Cerdas memotong pas pada objek, resolusi tajam 2x Retina
                      </div>
                    </div>
                  </button>

                  {/* SVG */}
                  <button
                    onClick={handleExportSVG}
                    className="flex items-center gap-3.5 px-4 py-3.5 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-2xl transition-all group text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Layers size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-[14.5px] flex items-center gap-2">
                        Vektor SVG
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">Auto-Crop</span>
                      </div>
                      <div className="text-[12px] text-slate-500 font-medium">
                        Vektor murni tanpa batas kanvas kosong, tidak pecah saat di-zoom
                      </div>
                    </div>
                  </button>

                  {/* PDF */}
                  <button
                    disabled={isExportingPdf}
                    onClick={handleExportPDF}
                    className="flex items-center gap-3.5 px-4 py-3.5 bg-white hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 rounded-2xl transition-all group text-left cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-[14.5px]">
                        {isExportingPdf ? 'Membuat PDF...' : 'Dokumen PDF (A4)'}
                      </div>
                      <div className="text-[12px] text-slate-500 font-medium">
                        Tata letak A4 proporsional berpusat pada objek konten
                      </div>
                    </div>
                  </button>

                  {/* JSON Project Backup */}
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-3.5 px-4 py-3.5 bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-2xl transition-all group text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileJson size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-[14.5px]">Cadangan Proyek (.trido.json)</div>
                      <div className="text-[12px] text-slate-500 font-medium">
                        Simpan seluruh halaman, mindmap, dan widget utuh untuk dipulihkan nanti
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* ── TAB 3: IMPORT ── */}
              {activeTab === 'import' && (
                <div className="flex flex-col gap-2.5">
                  {/* IMPORT PROJECT */}
                  <button
                    disabled={isImporting}
                    onClick={() => projectFileInputRef.current?.click()}
                    className="flex items-center gap-3.5 px-4 py-4 bg-white hover:bg-emerald-50/80 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl transition-all group text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FolderUp size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-[14.5px]">
                        {isImporting ? 'Mengimpor Proyek...' : 'Buka Berkas Proyek (.trido / .json)'}
                      </div>
                      <div className="text-[12px] text-slate-500 font-medium">Pulihkan papan tulis lengkap beserta semua halaman</div>
                    </div>
                  </button>

                  {/* IMPORT IMAGE ONTO CANVAS */}
                  <button
                    onClick={() => imageFileInputRef.current?.click()}
                    className="flex items-center gap-3.5 px-4 py-3.5 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all group text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ImageIcon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-[14.5px]">Sisipkan Gambar ke Kanvas</div>
                      <div className="text-[12px] text-slate-500 font-medium">Tempel gambar diagram, foto, atau bagan (PNG/JPG)</div>
                    </div>
                  </button>

                  <div className="mt-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-[12px] text-slate-600 leading-relaxed">
                    💡 <strong>Tips:</strong> Anda juga bisa membuka kembali sesi tersimpan sebelumnya kapan saja melalui menu <strong>Riwayat</strong>.
                  </div>
                </div>
              )}
            </div>

            {/* Footer Shortcut to History */}
            <div className="p-3.5 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[12px] text-slate-500 font-medium">Perlu sesi sebelumnya?</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  toggleHistory();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                <History size={13} /> Buka Riwayat Sesi <ArrowRight size={12} />
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
