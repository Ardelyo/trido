import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, Image as ImageIcon, FileJson, FileText, Upload,
  Check, Sparkles, FolderUp, CheckSquare, Printer,
  Copy, ExternalLink, Eye,
  FileCode, GitBranch
} from 'lucide-react';
import { useStore } from '../store';
import { useBoardExport } from '../hooks/useBoardExport';
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
  exportMindmapToMermaid,
  exportMindmapToCanvaSVG,
  exportQuizToGIFT,
  downloadFile
} from '../utils/smartExport';
import { tween } from '../design/motion';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<any>;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, canvasRef }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'visual' | 'project' | 'objects'>('visual');
  const [copiedMermaid, setCopiedMermaid] = useState(false);

  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const { domElements, activeMindmapNodes, currentPageIndex } = useStore();
  const {
    bgColor, setBgColor, multiplier, setMultiplier,
    isExportingPdf, isImporting, copiedImage, livePreviewUrl,
    pendingImportData, setPendingImportData,
    handleExportPNG, handleCopyImage, handleExportSVG, handleExportPDF,
    handleExportJSON, handleProjectFileChange, handleApplyImport, handleImageFileChange,
  } = useBoardExport(isOpen, onClose, canvasRef);

  const detected = useMemo(() => {
    return detectBoardObjects(canvasRef.current, domElements, activeMindmapNodes);
  }, [domElements, activeMindmapNodes, canvasRef.current, isOpen]);


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={tween.fade}
            className="relative w-full max-w-4xl bg-white rounded-sheet shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-[101] max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-trido flex items-center justify-center text-white shadow-2xs">
                  <Download size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-ink">
                    Pusat Ekspor & Impor Papan Tulis
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pratinjau langsung • Anti-layar hitam • Kompatibel Canva, Word & PDF
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1.5 bg-slate-100 border-b border-slate-200 gap-1 px-6 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('visual')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'visual'
                    ? 'bg-white text-trido shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon size={15} />
                <span>Gambar & Dokumen (PNG / PDF / SVG)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('project')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'project'
                    ? 'bg-white text-trido shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderUp size={15} />
                <span>Cadangan Proyek (.trido) & Impor</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('objects')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'objects'
                    ? 'bg-white text-trido shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles size={15} />
                <span>Konten Khusus (Mermaid & Kuis)</span>
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

            {/* Content Area */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              
              {/* TAB 1: GAMBAR & DOKUMEN DENGAN LIVE PREVIEW */}
              {activeTab === 'visual' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Live Visual Board Preview */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Eye size={14} className="text-trido" />
                        <span>Pratinjau Hasil Ekspor</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Halaman {currentPageIndex + 1}</span>
                    </div>

                    <div className="aspect-[4/3] rounded-2xl border-2 border-slate-200 overflow-hidden relative flex items-center justify-center p-2 shadow-inner" style={{ backgroundColor: bgColor === 'transparent' ? '#f1f5f9' : bgColor }}>
                      {livePreviewUrl ? (
                        <img
                          src={livePreviewUrl}
                          alt="Live Canvas Preview"
                          className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="text-center space-y-1 text-slate-400">
                          <ImageIcon size={32} className="mx-auto opacity-50" />
                          <p className="text-xs font-semibold">Papan siap diekspor</p>
                        </div>
                      )}

                      {bgColor === 'transparent' && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                          Latar Transparan
                        </div>
                      )}
                    </div>

                    {/* Background Plate Settings */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 block">Warna Latar Belakang:</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setBgColor('#ffffff')}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            bgColor === '#ffffff' ? 'border-trido bg-white text-trido ring-2 ring-trido/15' : 'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full border border-slate-300 bg-white" />
                          <span>Putih</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBgColor('#0f172a')}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            bgColor === '#0f172a' ? 'border-trido bg-white text-trido ring-2 ring-trido/15' : 'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-slate-900" />
                          <span>Gelap</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBgColor('transparent')}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            bgColor === 'transparent' ? 'border-trido bg-white text-trido ring-2 ring-trido/15' : 'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full border border-dashed border-slate-400 bg-transparent" />
                          <span>Transparan</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions & Formats */}
                  <div className="lg:col-span-7 space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">Pilihan Format Ekspor:</span>

                    {/* PNG High-Res Card */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-trido/40 transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-trido flex items-center justify-center">
                            <ImageIcon size={18} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-ink">Gambar PNG Berkualitas Tinggi</h4>
                            <p className="text-[11px] text-slate-500 font-medium">Anti-layar hitam, resolusi tajam untuk presentasi</p>
                          </div>
                        </div>

                        {/* Multiplier Selector */}
                        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 text-[11px] font-bold">
                          {([1, 2, 4] as const).map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMultiplier(m)}
                              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                multiplier === m ? 'bg-trido text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {m === 4 ? '4K' : `${m}x`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleExportPNG}
                          className="flex-1 py-2 px-3 bg-trido hover:bg-ink text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Download size={14} />
                          <span>Unduh Gambar PNG ({multiplier === 4 ? '4K' : `${multiplier}x`})</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyImage}
                          className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Salin langsung ke clipboard untuk ditempel di WhatsApp Web atau Word"
                        >
                          {copiedImage ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          <span>{copiedImage ? 'Tersalin!' : 'Salin'}</span>
                        </button>
                      </div>
                    </div>

                    {/* PDF Document A4 Landscape */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-trido/40 transition-all flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-ink">Dokumen PDF Siap Cetak (A4)</h4>
                          <p className="text-[11px] text-slate-500 font-medium">Layout landscape rapi untuk lembar kerja & hand-out siswa</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isExportingPdf}
                        onClick={handleExportPDF}
                        className="py-2 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Printer size={14} />
                        <span>{isExportingPdf ? 'Menyusun...' : 'Unduh PDF'}</span>
                      </button>
                    </div>

                    {/* Scalable Vector SVG */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-trido/40 transition-all flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                          <FileCode size={18} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-ink">Vektor Skalabel SVG</h4>
                          <p className="text-[11px] text-slate-500 font-medium">Dapat dibuka & diedit kembali di Canva, Figma, Illustrator</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleExportSVG}
                        className="py-2 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <ExternalLink size={14} />
                        <span>Unduh SVG</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CADANGAN PROYEK (.TRIDO) & PUSAT IMPOR */}
              {activeTab === 'project' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Backup Section */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-trido flex items-center justify-center">
                          <Download size={16} />
                        </div>
                        <h4 className="font-extrabold text-sm text-ink">Cadangkan Proyek Lengkap</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Simpan seluruh status kanvas, halaman, elemen interaktif, dan riwayat obrolan ke berkas tunggal <code>.trido</code>.
                      </p>
                      <button
                        type="button"
                        onClick={handleExportJSON}
                        className="w-full py-2.5 px-4 bg-trido hover:bg-ink text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <FileJson size={15} />
                        <span>Unduh Berkas Cadangan (.trido)</span>
                      </button>
                    </div>

                    {/* Insert Image Section */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <ImageIcon size={16} />
                        </div>
                        <h4 className="font-extrabold text-sm text-ink">Sisipkan Gambar ke Papan</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Masukkan diagram, foto materi pelajaran, atau bagan (PNG, JPG, SVG) langsung ke posisi tengah papan aktif.
                      </p>
                      <button
                        type="button"
                        onClick={() => imageFileInputRef.current?.click()}
                        className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Upload size={15} />
                        <span>Pilih Gambar dari Komputer</span>
                      </button>
                    </div>
                  </div>

                  {/* Import Dropzone Area */}
                  <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-blue-50/30 hover:border-trido transition-all text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-trido flex items-center justify-center mx-auto shadow-2xs">
                      <FolderUp size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-ink">
                        Pulihkan / Buka Berkas Proyek Trido
                      </h4>
                      <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                        Pilih berkas cadangan <code>.trido</code> atau <code>.json</code> untuk melanjutkan sesi mengajar sebelumnya.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => projectFileInputRef.current?.click()}
                      className="px-5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Jelajahi Berkas Cadangan (.trido)
                    </button>

                    {/* Pending Import Inspection Card */}
                    {pendingImportData && (
                      <div className="mt-4 p-4 bg-white rounded-2xl border-2 border-trido text-left space-y-3 shadow-md max-w-lg mx-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-trido bg-blue-50 px-2 py-0.5 rounded-full">
                            Berkas Siap Dipulihkan
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{pendingImportData.sizeKb} KB</span>
                        </div>
                        <div>
                          <h5 className="font-extrabold text-sm text-ink">{pendingImportData.title}</h5>
                          <p className="text-xs text-slate-500">
                            Terdiri dari {pendingImportData.pageCount} halaman • Dicadangkan {pendingImportData.exportedAt}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleApplyImport}
                            disabled={isImporting}
                            className="flex-1 py-2 bg-trido hover:bg-ink text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            {isImporting ? 'Memulihkan...' : 'Buka Proyek Ini di Papan ↵'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingImportData(null)}
                            className="py-2 px-3 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: KONTEN KHUSUS (MERMAID & KUIS) */}
              {activeTab === 'objects' && (
                <div className="space-y-4 text-left">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                    <Sparkles size={18} className="text-trido shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Trido dapat mengekspor diagram konsep, dokumen materi, simulasi interaktif, dan kuis evaluasi di papan ke format standar agar dapat langsung digunakan di Canva, Notion, atau LMS sekolah (Moodle/Canvas).
                    </p>
                  </div>

                  {/* 1. Mermaid Diagram Widgets on DOM Overlay */}
                  {Object.values(domElements).filter((el: any) => el.componentType === 'MERMAID_DIAGRAM').map((el: any) => (
                    <div key={el.id} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <GitBranch size={16} className="text-trido" />
                        <h4 className="font-extrabold text-sm text-ink">{el.config?.title || 'Diagram Mermaid'}</h4>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-800 max-h-32 overflow-y-auto custom-scrollbar border border-slate-200 whitespace-pre-wrap">
                        {el.config?.code || ''}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(el.config?.code || '');
                            setCopiedMermaid(true);
                            toast.success('Sintaks Mermaid disalin!');
                            setTimeout(() => setCopiedMermaid(false), 2000);
                          }}
                          className="px-3 py-1.5 bg-trido text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedMermaid ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedMermaid ? 'Tersalin' : 'Salin Kode Mermaid'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            downloadFile(el.config?.code || '', `${el.config?.title || 'diagram'}.mmd`, 'text/plain;charset=utf-8');
                            toast.success('Berkas .mmd diunduh!');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download size={14} /> Unduh .MMD
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 2. Legacy Canvas Mindmap Export */}
                  {detected.mindmap.hasNodes && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <GitBranch size={16} className="text-trido" />
                        <h4 className="font-extrabold text-sm text-ink">Diagram Mindmap Kanvas ({detected.mindmap.rootText})</h4>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-800 max-h-32 overflow-y-auto custom-scrollbar border border-slate-200 whitespace-pre-wrap">
                        {exportMindmapToMermaid(activeMindmapNodes)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const code = exportMindmapToMermaid(activeMindmapNodes);
                            navigator.clipboard.writeText(code);
                            setCopiedMermaid(true);
                            toast.success('Sintaks Mermaid disalin!');
                            setTimeout(() => setCopiedMermaid(false), 2000);
                          }}
                          className="px-3 py-1.5 bg-trido text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedMermaid ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedMermaid ? 'Tersalin' : 'Salin Kode Mermaid'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            exportMindmapAsMarkdown(activeMindmapNodes);
                            toast.success('Outline Markdown diunduh!');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText size={14} /> Unduh Outline .MD
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const svg = exportMindmapToCanvaSVG(activeMindmapNodes);
                            if (svg) {
                              downloadFile(svg, 'mindmap_canva.svg', 'image/svg+xml;charset=utf-8');
                              toast.success('SVG Canva diunduh!');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download size={14} /> Unduh Canva .SVG
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Quizzes Export (Printable Worksheet & Moodle GIFT) */}
                  {detected.quizzes.length > 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckSquare size={16} className="text-trido" />
                          <h4 className="font-extrabold text-sm text-ink">Kuis & Evaluasi ({detected.quizzes.length})</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const gift = exportQuizToGIFT(detected.quizzes);
                            downloadFile(gift, `kuis_moodle_${Date.now()}.gift.txt`, 'text/plain;charset=utf-8');
                            toast.success('Format GIFT Moodle/LMS berhasil diunduh!');
                          }}
                          className="px-3 py-1.5 bg-trido text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download size={13} /> Ekspor Semua ke Moodle GIFT
                        </button>
                      </div>
                      <div className="space-y-2">
                        {detected.quizzes.map((q) => (
                          <div key={q.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                            <span className="text-xs font-bold text-slate-700 truncate">{q.title}</span>
                            <button
                              type="button"
                              onClick={() => {
                                exportQuizAsPrintableWorksheet(q);
                                toast.success('Membuka lembar ujian siap cetak!');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Printer size={12} /> Cetak Lembar Soal
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Documents Export */}
                  {detected.documents.length > 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-trido" />
                        <h4 className="font-extrabold text-sm text-ink">Dokumen & Catatan ({detected.documents.length})</h4>
                      </div>
                      {detected.documents.map((doc) => (
                        <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-xs font-bold text-slate-700 truncate">{doc.title}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => exportDocumentAsHtml(doc.title, doc.markdown)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                            >
                              HTML
                            </button>
                            <button
                              type="button"
                              onClick={() => exportDocumentAsMarkdown(doc.title, doc.markdown)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                            >
                              .MD
                            </button>
                            <button
                              type="button"
                              onClick={() => printCleanDocument(doc.elementNodeId, doc.title)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                            >
                              Cetak
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 5. Interactive Apps Export */}
                  {detected.apps.filter(a => a.html).length > 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <FileCode size={16} className="text-trido" />
                        <h4 className="font-extrabold text-sm text-ink">Simulasi & Aplikasi Mini</h4>
                      </div>
                      {detected.apps.filter(a => a.html).map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-xs font-bold text-slate-700 truncate">{app.title}</span>
                          <button
                            type="button"
                            onClick={() => exportInteractiveAppAsHtml(app)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Download size={12} /> Unduh .HTML Mandiri
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!detected.mindmap.hasNodes &&
                    Object.values(domElements).filter((el: any) => el.componentType === 'MERMAID_DIAGRAM').length === 0 &&
                    detected.quizzes.length === 0 &&
                    detected.documents.length === 0 &&
                    detected.apps.filter(a => a.html).length === 0 && (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center">
                        <GitBranch size={20} />
                      </div>
                      <div className="font-bold text-slate-700 text-sm">Belum ada diagram mindmap atau kuis di halaman aktif</div>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Buat peta konsep atau kuis bersama AI untuk melihat opsi ekspor khusus di sini.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExportDialog;
