import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, Sparkles, FileText, Table, Presentation, Network,
  Download, ArrowRight, CornerDownLeft, X, Copy, Check,
  ChevronLeft, ChevronRight, RefreshCw, Pin, Paperclip,
  CheckCircle2, Clock, Cpu, Sliders, Eye
} from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../utils/translations';
import { toast } from '../utils/toast';
import { exportToDocx, exportToSpreadsheet, exportToSlideDeck, exportToMarkdown } from '../utils/agentikaExporter';

export type AgentikaMode = 'doc' | 'sheet' | 'slide' | 'diagram';

interface AgentikaViewProps {
  onClose: () => void;
  canvasRef: React.RefObject<any>;
}

// Pre-built production-grade prompts for educators
const CAPABILITY_PREVIEWS = [
  {
    mode: 'doc' as AgentikaMode,
    icon: FileText,
    badge: 'DOCX / Markdown',
    title: 'Modul Ajar & RPP Kurikulum Merdeka',
    desc: 'Susun RPP lengkap dengan Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), asesmen diagnostik, dan lembar kerja siswa (LKPD).',
    prompt: 'Tolong buatkan Modul Ajar Kurikulum Merdeka Fase E untuk materi "Hukum Newton tentang Gerak" (Fisika SMA Kelas 10). Lengkap dengan identitas modul, kompetensi awal, profil pelajar pancasila, tujuan pembelajaran, rincian kegiatan pembelajaran (pendahuluan, inti, penutup), asesmen formatif, serta LKPD dan rubrik penilaian.'
  },
  {
    mode: 'sheet' as AgentikaMode,
    icon: Table,
    badge: 'XLSX / CSV',
    title: 'Buku Nilai & Analisis Ketuntasan Siswa',
    desc: 'Rekap tabel nilai ulangan 30 siswa dengan kalkulasi otomatis rata-rata, persentase ketuntasan (KKM 75), ranking, dan deteksi siswa remedial.',
    prompt: 'Buatkan tabel rekapitulasi nilai Ulangan Harian Biologi untuk 25 siswa kelas XI IPA 2. Kolom terdiri dari: No, NISN, Nama Siswa, Tugas 1, Tugas 2, Nilai UH, Nilai Akhir, Status (Tuntas / Remedial), dan Rekomendasi Tindak Lanjut. Sertakan baris Rata-rata Kelas, Nilai Tertinggi, Nilai Terendah, dan Persentase Kelulusan.'
  },
  {
    mode: 'slide' as AgentikaMode,
    icon: Presentation,
    badge: 'PPTX / Slide Deck',
    title: 'Slide Presentasi Interaktif Kelas',
    desc: 'Dek presentasi 8-10 slide interaktif siap ajar dengan alur terstruktur, pertanyaan pemantik diskusi, dan catatan pembicara untuk guru.',
    prompt: 'Rancanglah dek presentasi materi kelas 8 slide tentang "Sistem Tata Surya & Karakteristik Planet". Setiap slide harus memuat: Judul Slide, Poin Materi Inti (bullet points), Pertanyaan Interaktif untuk Siswa, dan Catatan Guru (Speaker Notes).'
  },
  {
    mode: 'diagram' as AgentikaMode,
    icon: Network,
    badge: 'Peta Konsep & Smartboard',
    title: 'Peta Konsep & Alur Pembelajaran',
    desc: 'Struktur hubungan konsep materi secara bertingkat untuk ditempel langsung ke kanvas papan tulis Trido.',
    prompt: 'Buatkan peta konsep terstruktur tentang "Klasifikasi Makhluk Hidup (Kingdom Monera hingga Animalia)" dengan cabang utama, karakteristik khas tiap kingdom, dan contoh spesiesnya yang relevan untuk papan tulis.'
  }
];

export const AgentikaView: React.FC<AgentikaViewProps> = ({ onClose, canvasRef }) => {
  const { t, language } = useTranslation();
  const { 
    selectedGeminiModel, 
    selectedOllamaModel, 
    selectedVertexModel, 
    aiPreference,
    addMessage,
    attachedDocument
  } = useStore();

  const [mode, setMode] = useState<AgentikaMode>('doc');
  const [promptText, setPromptText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Result state
  const [resultTitle, setResultTitle] = useState<string>('');
  const [resultContent, setResultContent] = useState<string>('');
  const [resultType, setResultType] = useState<AgentikaMode>('doc');
  const [parsedSlides, setParsedSlides] = useState<{ title: string; content: string; notes?: string }[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active AI Model display
  const activeModel = 
    aiPreference === 'ollama' 
      ? (selectedOllamaModel || 'Ollama (Lokal)') 
      : (aiPreference === 'vertex' ? (selectedVertexModel || 'Vertex AI') : (selectedGeminiModel || 'gemini-3.8-flash'));

  // Elapsed timer during run
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      const start = Date.now();
      interval = setInterval(() => {
        setElapsedSecs(Number(((Date.now() - start) / 1000).toFixed(1)));
      }, 100);
    } else {
      setElapsedSecs(0);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle agent execution
  const handleRunAgent = async () => {
    const finalPrompt = promptText.trim();
    if (!finalPrompt || isRunning) return;

    setIsRunning(true);
    setCurrentStep(1);
    setResultContent('');
    setResultTitle('');
    abortControllerRef.current = new AbortController();

    try {
      // Step 1: Deconstructing requirements
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 600));

      // Step 2: Formulating document schema
      setCurrentStep(2);

      // System instruction tailored for high-quality pedagogical deliverable
      let formatDirective = '';
      if (mode === 'doc') {
        formatDirective = `
You are the Lead Curriculum Architect of Agentika.
Generate a comprehensive, complete, professional educational document or lesson plan in clean Markdown.
Include clear H1 (# Title), H2 (## Sections), H3 (### Subsections), bullet points, and markdown tables.
DO NOT use placeholder dots or ellipsis like "...". Write out every section completely.`;
      } else if (mode === 'sheet') {
        formatDirective = `
You are the Educational Data Analyst of Agentika.
Generate a structured, realistic dataset and spreadsheet for teachers.
Provide the output strictly as a CSV table format with standard comma-separated values (or clean Markdown Table).
Columns must be well-labeled, realistic Indonesian student names/numbers, accurate arithmetic calculations (Averages, Totals, Percentages).`;
      } else if (mode === 'slide') {
        formatDirective = `
You are the Instructional Slide Deck Designer of Agentika.
Format the presentation as sequential slides using this exact repeatable delimiter:
--- SLIDE START ---
TITLE: [Slide Title]
CONTENT:
- [Key point 1]
- [Key point 2]
- [Key point 3]
NOTES: [Teacher speaker notes and student discussion prompts]
--- SLIDE END ---
Generate 6 to 10 comprehensive slides.`;
      } else {
        formatDirective = `
You are the Conceptual Diagramming Agent of Agentika.
Generate an in-depth educational mindmap or flowchart using Mermaid markdown (graph TD or mindmap).
Ensure nodes are well structured and informative for classroom smartboards.`;
      }

      const fullPrompt = `${formatDirective}\n\n[USER PEDAGOGICAL REQUEST]:\n${finalPrompt}`;

      // Call API
      const response = await fetch('/api/ai/tool-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          toolId: mode,
          prompt: fullPrompt,
          aiPreference,
          selectedGeminiModel,
          selectedOllamaModel,
          selectedVertexModel
        })
      });

      // Step 3: Synthesizing content
      setCurrentStep(3);

      if (!response.ok) {
        throw new Error(`Gagal memproses dengan model AI (HTTP ${response.status})`);
      }

      const data = await response.json();
      const rawText = data?.result || data?.content || (typeof data === 'string' ? data : JSON.stringify(data));

      // Step 4: Compiling deliverable
      setCurrentStep(4);
      await new Promise(r => setTimeout(r, 400));

      // Derive title
      const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
      let extractedTitle = lines[0]?.replace(/^[#\s*]+/, '').trim() || 'Dokumen Agentika';
      if (extractedTitle.length > 60) extractedTitle = extractedTitle.slice(0, 57) + '...';

      setResultTitle(extractedTitle);
      setResultContent(rawText);
      setResultType(mode);

      // Parse slides if in slide mode
      if (mode === 'slide') {
        const slideMatches = rawText.split(/--- SLIDE START ---/i).slice(1);
        const parsed = slideMatches.map((block: string) => {
          const cleanBlock = block.split(/--- SLIDE END ---/i)[0] || block;
          const titleMatch = cleanBlock.match(/TITLE:\s*(.*)/i);
          const notesMatch = cleanBlock.match(/NOTES:\s*([\s\S]*)/i);
          const contentMatch = cleanBlock.replace(/TITLE:[\s\S]*?\n/i, '').replace(/NOTES:[\s\S]*/i, '').trim();
          return {
            title: titleMatch ? titleMatch[1].trim() : 'Slide Pembelajaran',
            content: contentMatch || cleanBlock.trim(),
            notes: notesMatch ? notesMatch[1].trim() : undefined
          };
        });
        if (parsed.length > 0) {
          setParsedSlides(parsed);
          setCurrentSlideIndex(0);
        }
      }

      toast.success('Agen Agentika berhasil menyusun berkas produktivitas!');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.info('Tugas Agen dibatalkan oleh pengguna.');
      } else {
        toast.error(`Error: ${err.message || 'Gagal memproses'}`);
      }
    } finally {
      setIsRunning(false);
      setCurrentStep(0);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    setCurrentStep(0);
  };

  const handleCopy = () => {
    if (!resultContent) return;
    navigator.clipboard.writeText(resultContent);
    setCopied(true);
    toast.success('Konten berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePinToSmartboard = () => {
    if (!resultContent) return;
    
    // Add as document block or message in smartboard
    useStore.getState().addMessage({
      role: 'model',
      text: `### 📄 ${resultTitle || 'Dokumen Agentika'}\n\n${resultContent}`
    });

    toast.success('Ditempelkan ke Smartboard! Membuka papan tulis...');
    onClose();
  };

  const handleDownload = () => {
    const title = resultTitle || 'dokumen-agentika';
    if (resultType === 'doc') {
      exportToDocx(title, resultContent);
      toast.success('Mengunduh format DOCX (Word)...');
    } else if (resultType === 'sheet') {
      exportToSpreadsheet(title, resultContent);
      toast.success('Mengunduh format CSV (Excel)...');
    } else if (resultType === 'slide') {
      if (parsedSlides.length > 0) {
        exportToSlideDeck(title, parsedSlides);
      } else {
        exportToMarkdown(title, resultContent);
      }
      toast.success('Mengunduh dek presentasi slide...');
    } else {
      exportToMarkdown(title, resultContent);
      toast.success('Mengunduh berkas Markdown...');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#f8f7f5] text-[#0a1a3a] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <header className="h-16 px-6 lg:px-10 flex items-center justify-between border-b border-slate-200/70 bg-white/80 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#1550aa] text-white shadow-sm">
            <Bot size={22} className="text-[#ffcc00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-[#0a1a3a]">Agentika</h1>
              <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-[#1550aa] text-white uppercase">
                Eksperimental
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Studio Agen Mandiri Produktivitas Pendidik (Docs · Sheets · Slides · Diagrams)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Model Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1550aa] border border-blue-200/60 text-xs font-bold">
            <Cpu size={13} />
            <span>{activeModel}</span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer active:scale-95"
          >
            <X size={15} />
            <span>Kembali ke Papan</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-12 lg:py-8 space-y-8 custom-scrollbar pb-64">
        {/* Capability Showcase Cards */}
        {!resultContent && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-2xl font-black text-[#0a1a3a] tracking-tight">
                Pilih Kemampuan Agen & Hasilkan Berkas Siap Pakai
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Cukup pilih template di bawah atau ketik instruksi di Dock Island untuk mempekerjakan agen AI mandiri.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAPABILITY_PREVIEWS.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = mode === item.mode;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      setMode(item.mode);
                      setPromptText(item.prompt);
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white shadow-xs flex flex-col justify-between text-left group ${
                      isSelected ? 'border-[#1550aa] ring-2 ring-[#1550aa]/20' : 'border-slate-200/80 hover:border-[#1550aa]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#1550aa] text-white' : 'bg-blue-50 text-[#1550aa] group-hover:bg-[#1550aa] group-hover:text-white'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-[#0a1a3a] mb-1.5">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1550aa]">
                      <span>Gunakan Template Ini</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Deliverable Viewer (When Results are ready) */}
        {resultContent && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="bg-white rounded-[2rem] border-2 border-[#1550aa]/20 shadow-md p-6 lg:p-8 space-y-6">
              {/* Deliverable Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1550aa] uppercase">
                      {resultType.toUpperCase()} BERHASIL DIKOMPILASI
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-[#0a1a3a] tracking-tight">{resultTitle}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1550aa] hover:bg-[#0a1a3a] text-white font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95"
                  >
                    <Download size={14} className="text-[#ffcc00]" />
                    <span>Unduh {resultType === 'doc' ? '.DOCX' : resultType === 'sheet' ? '.CSV/.XLSX' : resultType === 'slide' ? '.HTML Slide' : '.MD'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePinToSmartboard}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Pin size={14} />
                    <span>Tempel ke Smartboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer active:scale-95"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copied ? 'Disalin' : 'Salin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultContent('')}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Tutup Hasil"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* View according to result type */}
              {resultType === 'slide' && parsedSlides.length > 0 ? (
                <div className="space-y-4">
                  {/* Slide Carousel */}
                  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 min-h-[300px] flex flex-col justify-between relative">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1550aa] uppercase tracking-wider mb-2">
                      <span>Slide {currentSlideIndex + 1} dari {parsedSlides.length}</span>
                      <span>Trido Slide Deck</span>
                    </div>

                    <div className="my-auto space-y-4">
                      <h3 className="text-2xl font-black text-[#0a1a3a]">
                        {parsedSlides[currentSlideIndex]?.title}
                      </h3>
                      <div className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                        {parsedSlides[currentSlideIndex]?.content}
                      </div>
                      {parsedSlides[currentSlideIndex]?.notes && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                          <strong>Catatan Guru:</strong> {parsedSlides[currentSlideIndex]?.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 mt-4">
                      <button
                        type="button"
                        disabled={currentSlideIndex === 0}
                        onClick={() => setCurrentSlideIndex(i => Math.max(0, i - 1))}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft size={14} /> Sebelumnya
                      </button>
                      <button
                        type="button"
                        disabled={currentSlideIndex === parsedSlides.length - 1}
                        onClick={() => setCurrentSlideIndex(i => Math.min(parsedSlides.length - 1, i + 1))}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        Berikutnya <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs overflow-x-auto max-h-[500px] whitespace-pre-wrap leading-relaxed custom-scrollbar">
                  {resultContent}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dock Island Prompt Bar (Fixed Middle-to-Bottom of Screen) */}
      <div className="fixed bottom-6 inset-x-4 max-w-3xl mx-auto z-30 font-sans pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.2rem] border-2 border-[#1550aa]/20 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 lg:p-4 space-y-3">
          
          {/* Top Pill Selector for Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
              {[
                { id: 'doc' as AgentikaMode, label: 'Dokumen (DOCX)', icon: FileText },
                { id: 'sheet' as AgentikaMode, label: 'Spreadsheet (XLSX)', icon: Table },
                { id: 'slide' as AgentikaMode, label: 'Slide Deck (PPTX)', icon: Presentation },
                { id: 'diagram' as AgentikaMode, label: 'Diagram / Papan', icon: Network },
              ].map(t => {
                const Icon = t.icon;
                const isActive = mode === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMode(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#1550aa] text-white shadow-xs' 
                        : 'text-slate-600 hover:text-[#0a1a3a] hover:bg-white/60'
                    }`}
                  >
                    <Icon size={12} className={isActive ? 'text-[#ffcc00]' : ''} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Running Status Timer */}
            {isRunning && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  ⏱️ {elapsedSecs.toFixed(1)}s
                </span>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer"
                >
                  <X size={12} /> Batal
                </button>
              </div>
            )}
          </div>

          {/* Stepper Pipeline Indicator (When Running) */}
          <AnimatePresence>
            {isRunning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-2 py-2 bg-blue-50/70 rounded-2xl border border-blue-200/60 space-y-2 overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#1550aa]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1550aa] animate-ping" />
                    <span>
                      {currentStep === 1 && 'Tahap 1: Menganalisis instruksi & standar kurikulum...'}
                      {currentStep === 2 && 'Tahap 2: Merancang skema tabel & struktur dokumen...'}
                      {currentStep === 3 && 'Tahap 3: Mensintesis konten akademis & kalkulasi data...'}
                      {currentStep === 4 && 'Tahap 4: Mengompilasi format berkas akhir...'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono">Langkah {currentStep} / 4</span>
                </div>

                {/* Indeterminate Solid Progress Line */}
                <div className="w-full h-1 bg-blue-200/50 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ left: '-30%', width: '30%' }}
                    animate={{ left: '100%', width: '40%' }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-y-0 bg-[#1550aa] rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea Input Form */}
          <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200/80 rounded-[1.6rem] p-2 focus-within:ring-2 focus-within:ring-[#1550aa]/30 focus-within:bg-white transition-all">
            <textarea
              ref={textareaRef}
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRunAgent();
                }
              }}
              rows={2}
              placeholder={`Tuliskan rincian ${mode === 'doc' ? 'dokumen/RPP' : mode === 'sheet' ? 'tabel/buku nilai' : mode === 'slide' ? 'materi slide' : 'diagram'} yang ingin disusun oleh Agen Agentika...`}
              className="flex-1 bg-transparent border-none outline-hidden resize-none text-sm text-[#0a1a3a] placeholder:text-slate-400 px-3 py-1.5 custom-scrollbar"
            />

            <button
              type="button"
              disabled={isRunning || !promptText.trim()}
              onClick={handleRunAgent}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1550aa] hover:bg-[#0a1a3a] text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
            >
              <Sparkles size={14} className="text-[#ffcc00] animate-pulse" />
              <span>{isRunning ? 'Memproses...' : 'Jalankan Agen'}</span>
              <CornerDownLeft size={12} className="opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentikaView;
