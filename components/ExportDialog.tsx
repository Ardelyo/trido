import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, Image as ImageIcon, FileJson, FileText, Upload,
  Layers, Check, Sparkles, FolderUp, History, ArrowRight
} from 'lucide-react';
import { useStore } from '../store';
import { toast } from '../utils/toast';
import { useTranslation } from '../utils/translations';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<any>;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, canvasRef }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const { pages, currentPageIndex, domElements, activeMindmapNodes, importProjectSession, toggleHistory } = useStore();

  // ── 1. EXPORT PNG ────────────────────────────────────────────────────────
  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        multiplier: 2 // High resolution
      });

      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `trido_papan_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Gambar PNG berhasil diekspor.');
      onClose();
    } catch (err: any) {
      toast.error('Gagal mengekspor gambar PNG.');
    }
  };

  // ── 2. EXPORT SVG ────────────────────────────────────────────────────────
  const handleExportSVG = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    try {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `trido_vektor_${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Vektor SVG berhasil diekspor.');
      onClose();
    } catch (err: any) {
      toast.error('Gagal mengekspor vektor SVG.');
    }
  };

  // ── 3. EXPORT PDF ────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    setIsExportingPdf(true);
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    try {
      const { PDFDocument } = await import('pdf-lib');
      const dataURL = canvas.toDataURL({
        format: 'png',
        multiplier: 2
      });

      const pdfDoc = await PDFDocument.create();
      // A4 landscape: 842 x 595 pt
      const page = pdfDoc.addPage([842, 595]);

      const pngImageBytes = await fetch(dataURL).then(res => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      // Fit image neatly onto A4 page with 24pt margins
      const margin = 24;
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
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `trido_dokumen_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

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
    
    // Package current page along with all store pages
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

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `trido_proyek_${Date.now()}.trido.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

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

        // Scale image reasonably to fit inside current view
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md bg-white rounded-4xl shadow-[0_24px_70px_rgba(0,0,0,0.16)] border border-slate-200 z-[101] overflow-hidden flex flex-col font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-slate-900 leading-tight">
                    Ekspor & Impor
                  </h3>
                  <p className="text-[12px] text-slate-500 font-medium">Papan Tulis Digital Trido</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 bg-slate-100/70 border-b border-slate-200/60 gap-1.5 px-4">
              <button
                type="button"
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Download size={14} /> Ekspor Berkas
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
                <Upload size={14} /> Impor Berkas
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
            <div className="p-5 flex flex-col gap-2.5 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {activeTab === 'export' ? (
                <>
                  {/* PNG */}
                  <button
                    onClick={handleExportPNG}
                    className="flex items-center gap-3.5 px-4 py-3.5 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all group text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ImageIcon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-[14.5px]">Gambar PNG (HD)</div>
                      <div className="text-[12px] text-slate-500 font-medium">Resolusi tajam 2x untuk presentasi & materi</div>
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
                      <div className="font-bold text-slate-800 text-[14.5px]">Vektor SVG</div>
                      <div className="text-[12px] text-slate-500 font-medium">Dapat diperbesar tanpa pecah, format standar vektor</div>
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
                      <div className="text-[12px] text-slate-500 font-medium">Format cetak siap bagikan untuk siswa</div>
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
                      <div className="text-[12px] text-slate-500 font-medium">Simpan seluruh halaman, mindmap, dan widget utuh</div>
                    </div>
                  </button>
                </>
              ) : (
                <>
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
                </>
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
