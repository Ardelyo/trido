import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, Image as ImageIcon, FileJson, FileText, Upload,
  Layers, Check, Sparkles, FolderUp, History, ArrowRight,
  Code, Globe, BookOpen, CheckSquare, Printer, Compass, FileCode,
  Copy, ExternalLink, Palette, AlertTriangle, Share2
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
  exportSafeCompositePNG,
  exportMindmapToMermaid,
  exportMindmapToCanvaSVG,
  exportQuizToGIFT,
  exportQuizToQuizizzCSV,
  copyImageToClipboard,
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
  const [activeTab, setActiveTab] = useState<'board' | 'objects' | 'tools' | 'backup'>('board');
  const [bgColor, setBgColor] = useState<'#ffffff' | '#0f172a' | 'transparent'>('#ffffff');
  const [multiplier, setMultiplier] = useState<2 | 4>(2);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedMermaid, setCopiedMermaid] = useState(false);

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

  const detected = useMemo(() => {
    return detectBoardObjects(canvasRef.current, domElements, activeMindmapNodes);
  }, [domElements, activeMindmapNodes, canvasRef.current, isOpen]);

  // ── 1. EXPORT SAFE COMPOSITE PNG (Solid Background Plate) ────────────────
  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    try {
      const dataURL = await exportSafeCompositePNG(canvasRef.current, domElements, {
        backgroundColor: bgColor,
        multiplier
      });
      downloadFile(dataURL, `trido_papan_${multiplier === 4 ? '4K_' : ''}${Date.now()}.png`, 'image/png');
      toast.success(`Gambar PNG (${multiplier}x) berhasil diekspor.`);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengekspor gambar PNG.');
    }
  };

  // ── 2. COPY IMAGE TO CLIPBOARD ───────────────────────────────────────────
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      const dataURL = await exportSafeCompositePNG(canvasRef.current, domElements, {
        backgroundColor: bgColor,
        multiplier: 2
      });
      const ok = await copyImageToClipboard(dataURL);
      if (ok) {
        setCopiedImage(true);
        toast.success('Gambar disalin ke clipboard! Siap di-paste ke Canva, Word, WA.');
        setTimeout(() => setCopiedImage(false), 2000);
      } else {
        toast.error('Browser tidak mengizinkan salin gambar langsung.');
      }
    } catch (err: any) {
      toast.error('Gagal menyalin gambar.');
    }
  };

  // ── 3. EXPORT SVG WITH BOUNDING BOX ──────────────────────────────────────
  const handleExportSVG = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    try {
      const bounds = getBoardContentBoundingBox(canvas, domElements);
      let svg = canvas.toSVG({
        viewBox: {
          x: bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height
        }
      });

      if (bgColor !== 'transparent') {
        svg = svg.replace('<svg ', `<svg style="background-color: ${bgColor};" `);
      }

      downloadFile(svg, `trido_vektor_${Date.now()}.svg`, 'image/svg+xml;charset=utf-8');
      toast.success('Vektor SVG berhasil diekspor.');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengekspor vektor SVG.');
    }
  };

  // ── 4. EXPORT A4 PDF DOCUMENT ────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    setIsExportingPdf(true);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const dataURL = await exportSafeCompositePNG(canvasRef.current, domElements, {
        backgroundColor: '#ffffff',
        multiplier: 2
      });

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

  // ── 5. EXPORT PROJECT JSON ───────────────────────────────────────────────
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

  // ── 6. IMPORT PROJECT FILE (.trido / .json) ──────────────────────────────
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

  // ── 7. IMPORT IMAGE ONTO CANVAS ──────────────────────────────────────────
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-2xl bg-white rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.18)] border border-slate-200 z-[101] overflow-hidden flex flex-col font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-slate-900 leading-tight">
                    Pusat Ekspor & Interoperabilitas Terpadu
                  </h3>
                  <p className="text-[12px] text-slate-500 font-medium">
                    Anti-Layar Hitam • Kompatibel Canva, Mermaid, Markdown & LMS
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
            <div className="flex p-1.5 bg-slate-100/80 border-b border-slate-200/60 gap-1 px-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('board')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'board'
                    ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={14} /> Berbagi Cepat & Papan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tools')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'tools'
                    ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ExternalLink size={14} /> Buka di Alat Lain (Canva/Mermaid)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('objects')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
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
                onClick={() => setActiveTab('backup')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'backup'
                    ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload size={14} /> Cadangan & Impor
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
            <div className="p-5 flex flex-col gap-4 max-h-[64vh] overflow-y-auto custom-scrollbar">
              
              {/* ── TAB 1: BERBAGI CEPAT & PAPAN (DENGAN BACKGROUND PLATE) ── */}
              {activeTab === 'board' && (
                <div className="flex flex-col gap-4">
                  {/* Visual Background Plate Selector */}
                  <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Palette size={14} className="text-blue-600" /> Warna Latar Belakang (Anti-Layar Hitam)
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">Pilih sebelum unduh</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBgColor('#ffffff')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          bgColor === '#ffffff'
                            ? 'bg-white border-blue-500 text-blue-700 shadow-sm ring-2 ring-blue-500/20'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shadow-2xs"></span>
                        Putih Solid (Cetak & Galeri)
                      </button>

                      <button
                        type="button"
                        onClick={() => setBgColor('#0f172a')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          bgColor === '#0f172a'
                            ? 'bg-slate-900 border-blue-500 text-white shadow-sm ring-2 ring-blue-500/20'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700"></span>
                        Mode Gelap (#0f172a)
                      </button>

                      <button
                        type="button"
                        onClick={() => setBgColor('transparent')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          bgColor === 'transparent'
                            ? 'bg-white border-amber-500 text-amber-700 shadow-sm ring-2 ring-amber-500/20'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-dashed border-slate-400"></span>
                        Transparan (Khusus Desain)
                      </button>
                    </div>

                    {bgColor === 'transparent' && (
                      <div className="flex items-start gap-2 p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/70 text-[11px] text-amber-800 leading-relaxed">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Catatan:</strong> Gambar transparan dapat tampak hitam di galeri bawaan Windows/ponsel. Gunakan <strong>Putih Solid</strong> jika ingin membuka langsung di galeri atau mencetak.</span>
                      </div>
                    )}
                  </div>

                  {/* Resolution Toggle */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-bold">
                    <span className="text-slate-700">Tingkat Ketajaman Gambar:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMultiplier(2)}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          multiplier === 2 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        2x HD Retina
                      </button>
                      <button
                        type="button"
                        onClick={() => setMultiplier(4)}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          multiplier === 4 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        4x Ultra 4K (300 DPI)
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Clipboard Copy */}
                  <button
                    onClick={handleCopyImage}
                    className="flex items-center gap-3.5 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl transition-all shadow-md group text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {copiedImage ? <Check size={22} className="text-emerald-300" /> : <Copy size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-[15px] flex items-center gap-2">
                        {copiedImage ? 'Gambar Berhasil Disalin!' : 'Salin Gambar ke Clipboard'}
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Siap Paste</span>
                      </div>
                      <div className="text-[12px] text-blue-100 font-medium">
                        Langsung Ctrl+V di Canva, Word, PowerPoint, atau WhatsApp Web tanpa unduh berkas
                      </div>
                    </div>
                  </button>

                  {/* Grid Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* PNG */}
                    <button
                      onClick={handleExportPNG}
                      className="flex flex-col gap-1.5 p-3.5 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-2xl transition group text-left cursor-pointer shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <ImageIcon size={18} />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">Unduh PNG ({multiplier}x)</div>
                      <div className="text-[11px] text-slate-400">Auto-crop pas pada objek</div>
                    </button>

                    {/* SVG */}
                    <button
                      onClick={handleExportSVG}
                      className="flex flex-col gap-1.5 p-3.5 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-2xl transition group text-left cursor-pointer shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Layers size={18} />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">Vektor SVG</div>
                      <div className="text-[11px] text-slate-400">Vektor tajam tanpa pecah</div>
                    </button>

                    {/* PDF */}
                    <button
                      disabled={isExportingPdf}
                      onClick={handleExportPDF}
                      className="flex flex-col gap-1.5 p-3.5 bg-white hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 rounded-2xl transition group text-left cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                        <FileText size={18} />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">
                        {isExportingPdf ? 'Membuat...' : 'Dokumen PDF'}
                      </div>
                      <div className="text-[11px] text-slate-400">Ukuran A4 proporsional</div>
                    </button>
                  </div>
                </div>
              )}

              {/* ── TAB 2: INTEROPERABILITAS ALAT LAIN (CANVA / MERMAID / LMS) ── */}
              {activeTab === 'tools' && (
                <div className="flex flex-col gap-3.5">
                  {/* Canva Compatibility Card */}
                  <div className="bg-gradient-to-r from-teal-50/70 to-blue-50/70 border border-teal-200/80 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                          <Palette size={18} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-wider uppercase text-teal-700">Integrasi Canva</div>
                          <div className="font-bold text-slate-900 text-sm">Buka & Edit Mindmap di Canva</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Ekspor sebagai <strong>Layered SVG</strong> semantik. Saat diunggah ke Canva, klik kanan lalu <em>"Ungroup"</em> untuk mengedit teks dan mengubah warna setiap cabang sesuka Anda.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const svg = exportMindmapToCanvaSVG(activeMindmapNodes, bgColor === 'transparent' ? '#ffffff' : bgColor);
                          downloadFile(svg, `trido_canva_mindmap_${Date.now()}.svg`, 'image/svg+xml;charset=utf-8');
                          toast.success('Layered SVG untuk Canva berhasil diunduh!');
                        }}
                        className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                      >
                        <Layers size={14} /> Unduh Layered SVG untuk Canva
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyImage}
                        className="px-3.5 py-2.5 bg-white hover:bg-teal-50 border border-teal-300 text-teal-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Salin gambar untuk paste langsung ke Canva"
                      >
                        Salin Gambar
                      </button>
                    </div>
                  </div>

                  {/* Mermaid & Markdown Card */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                          <Code size={18} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-wider uppercase text-emerald-700">Mermaid & Markdown</div>
                          <div className="font-bold text-slate-900 text-sm">Lanjutkan di Notion, Obsidian & GitHub</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const mmd = exportMindmapToMermaid(activeMindmapNodes);
                          navigator.clipboard.writeText(mmd);
                          setCopiedMermaid(true);
                          toast.success('Sintaks Mermaid disalin! Siap dipaste ke Notion/Obsidian.');
                          setTimeout(() => setCopiedMermaid(false), 2000);
                        }}
                        className="py-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold text-slate-800 hover:text-emerald-700 flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                      >
                        {copiedMermaid ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        Salin Kode Mermaid
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportMindmapAsMarkdown(activeMindmapNodes);
                          toast.success('Garis besar Markdown (.md) berhasil diunduh.');
                        }}
                        className="py-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold text-slate-800 hover:text-emerald-700 flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                      >
                        <FileText size={14} /> Unduh Markdown (.md)
                      </button>
                    </div>
                  </div>

                  {/* LMS Evaluation & Quiz Interchange */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                          <CheckSquare size={18} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-wider uppercase text-amber-700">Format Evaluasi & LMS</div>
                          <div className="font-bold text-slate-900 text-sm">Moodle, Canvas LMS, Quizizz & Kahoot</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const gift = exportQuizToGIFT(detected.quizzes);
                          downloadFile(gift, `trido_bank_soal_${Date.now()}.gift`, 'text/plain;charset=utf-8');
                          toast.success('Format GIFT (Moodle/Canvas LMS) berhasil diunduh.');
                        }}
                        className="py-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold text-slate-800 hover:text-amber-700 flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                      >
                        <FileCode size={14} /> Format GIFT (Moodle)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const csv = exportQuizToQuizizzCSV(detected.quizzes);
                          downloadFile(csv, `trido_quizizz_soal_${Date.now()}.csv`, 'text/csv;charset=utf-8');
                          toast.success('Format CSV Quizizz berhasil diunduh.');
                        }}
                        className="py-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold text-slate-800 hover:text-amber-700 flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                      >
                        <FileText size={14} /> CSV Soal (Quizizz)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: OBJECTS ON BOARD ── */}
              {activeTab === 'objects' && (
                <div className="flex flex-col gap-3">
                  {detected.documents.map((doc, idx) => (
                    <div key={doc.id || idx} className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-wider uppercase text-indigo-600">Dokumen Materi</div>
                          <div className="font-bold text-slate-800 text-sm line-clamp-1">{doc.title}</div>
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
                          className="px-2.5 py-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
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
                          className="px-2.5 py-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
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
                          className="px-2.5 py-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <FileText size={13} /> Markdown
                        </button>
                      </div>
                    </div>
                  ))}

                  {detected.apps.map((app, idx) => (
                    <div key={app.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 text-slate-100 shadow-md">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Code size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-wider uppercase text-emerald-400">Aplikasi Web Interaktif</div>
                          <div className="font-bold text-white text-sm line-clamp-1">{app.title}</div>
                        </div>
                      </div>
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
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                      >
                        <FileCode size={15} /> Unduh File Web Standalone (.html)
                      </button>
                    </div>
                  ))}

                  {!hasSpecificObjects && (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center">
                        <Sparkles size={18} />
                      </div>
                      <div className="font-bold text-slate-700 text-sm">Belum ada objek dokumen/website mandiri</div>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Buat catatan materi atau kuis bersama AI, atau gunakan tab <strong>Berbagi Cepat & Papan</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 4: CADANGAN & IMPOR ── */}
              {activeTab === 'backup' && (
                <div className="flex flex-col gap-3">
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
