import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, Sparkles, FileText, Table, Presentation, Network,
  Download, ArrowRight, CornerDownLeft, X, Copy, Check,
  ChevronLeft, ChevronRight, Pin,
  Cpu, Lightbulb, CheckCircle2, Eye, Code, Printer
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useStore } from '../store';
import { useTranslation } from '../utils/translations';
import { toast } from '../utils/toast';
import { exportToDocx, exportToSpreadsheet, exportToSlideDeck, exportToMarkdown } from '../utils/agentikaExporter';

export type AgentikaMode = 'doc' | 'sheet' | 'slide' | 'diagram';

interface AgentikaViewProps {
  onClose: () => void;
  canvasRef: React.RefObject<any>;
}

// Rotating Pedagogical Tips & Insights during generation
const PEDAGOGICAL_INSIGHTS = [
  {
    tag: 'Kurikulum Merdeka',
    text: 'Pertanyaan pemantik terbuka di awal bab terbukti meningkatkan partisipasi aktif peserta didik hingga 40%.'
  },
  {
    tag: 'Otomatisasi Spreadsheet',
    text: 'Spreadsheet yang dihasilkan Agentika otomatis menyertakan formula Excel standar untuk kalkulasi rata-rata dan status KKM.'
  },
  {
    tag: 'Diferensiasi Pembelajaran',
    text: 'Modul ajar yang efektif memfasilitasi 3 gaya belajar: visual (bagan), auditori (diskusi), dan kinestetik (proyek praktis).'
  },
  {
    tag: 'Privasi & Offline-First',
    text: 'Saat menggunakan Ollama (Gemma), seluruh data nilai dan identitas siswa Anda diproses 100% lokal tanpa meninggalkan perangkat.'
  },
  {
    tag: 'Desain Presentasi Kelas',
    text: 'Slide ajar terbaik membatasi maksimal 4 poin utama per slide dengan catatan pemantik untuk memandu interaksi dua arah.'
  }
];

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
    desc: 'Rekap tabel nilai ulangan 25 siswa dengan kalkulasi otomatis rata-rata, persentase ketuntasan (KKM 75), ranking, dan deteksi siswa remedial.',
    prompt: 'Buatkan tabel rekapitulasi nilai Ulangan Harian Biologi untuk 25 siswa kelas XI IPA 2. Kolom terdiri dari: No, NISN, Nama Siswa, Tugas 1, Tugas 2, Nilai UH, Nilai Akhir, Status (Tuntas / Remedial), dan Rekomendasi Tindak Lanjut. Sertakan baris Rata-rata Kelas, Nilai Tertinggi, Nilai Terendah, dan Persentase Kelulusan.'
  },
  {
    mode: 'slide' as AgentikaMode,
    icon: Presentation,
    badge: 'PPTX / Slide Deck',
    title: 'Slide Presentasi Interaktif Kelas',
    desc: 'Dek presentasi 8 slide interaktif siap ajar dengan alur terstruktur, pertanyaan pemantik diskusi, dan catatan pembicara untuk guru.',
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
    setAiPreference,
    attachedDocument
  } = useStore();

  const [mode, setMode] = useState<AgentikaMode>('doc');
  const [promptText, setPromptText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);
  const [insightIndex, setInsightIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Result state
  const [resultTitle, setResultTitle] = useState<string>('');
  const [resultContent, setResultContent] = useState<string>('');
  const [resultType, setResultType] = useState<AgentikaMode>('doc');
  const [parsedSlides, setParsedSlides] = useState<{ title: string; content: string; notes?: string }[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [parsedTableRows, setParsedTableRows] = useState<string[][]>([]);
  const [previewTab, setPreviewTab] = useState<'paper' | 'source'>('paper');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active AI Model display
  const activeModelDisplay = 
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

  // Rotate educational insights every 3.5 seconds during execution
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setInsightIndex(prev => (prev + 1) % PEDAGOGICAL_INSIGHTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Execute agent pipeline
  const handleRunAgent = async () => {
    const finalPrompt = promptText.trim();
    if (!finalPrompt || isRunning) return;

    setIsRunning(true);
    setCurrentStep(1);
    setResultContent('');
    setResultTitle('');
    setParsedTableRows([]);
    setParsedSlides([]);
    abortControllerRef.current = new AbortController();

    try {
      // Step 1: Analyzing curriculum & intent
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 450));

      // Step 2: Formulating schema
      setCurrentStep(2);

      let formatDirective = '';
      if (mode === 'doc') {
        formatDirective = `
Anda adalah Lead Curriculum Architect dari Trido Agentika.
Susun dokumen ajar atau modul pembelajaran lengkap dan profesional dalam format Markdown bersih.
Sertakan judul (# Judul), sub-bagian (## Bagian), rincian poin, dan tabel markdown jika relevan.
Jangan gunakan tanda elipsis "..." atau menyisakan placeholder kosong; tuliskan materi secara tuntas dan berbobot akademis.`;
      } else if (mode === 'sheet') {
        formatDirective = `
Anda adalah Data Analyst Pendidikan dari Trido Agentika.
Susun tabel dataset nilai/administrasi sekolah yang rapi dan realistis.
Format keluaran HANYA dalam format tabel CSV (dipisahkan tanda koma) atau tabel Markdown yang valid.
Pastikan header kolom jelas, nama siswa realistis Indonesia, kalkulasi rata-rata dan ranking akurat.`;
      } else if (mode === 'slide') {
        formatDirective = `
Anda adalah Instructional Slide Deck Designer dari Trido Agentika.
Format presentasi menjadi 6 hingga 10 slide terstruktur menggunakan penanda berikut:
--- SLIDE START ---
TITLE: [Judul Slide]
CONTENT:
- [Poin Inti 1]
- [Poin Inti 2]
- [Poin Inti 3]
NOTES: [Catatan Panduan & Pemantik Diskusi Guru]
--- SLIDE END ---
Tuliskan materi secara lengkap dan siap ajar.`;
      } else {
        formatDirective = `
Anda adalah Conceptual Diagramming Agent dari Trido Agentika.
Susun diagram atau peta konsep terstruktur menggunakan sintaks Mermaid (graph TD atau mindmap).
Pastikan hierarki konsep jelas dan mudah dipahami siswa saat ditampilkan di papan tulis.`;
      }

      const fullPrompt = `${formatDirective}\n\n[PERMINTAAN PENDIDIK]:\n${finalPrompt}`;

      // Call tool-content endpoint
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

      // Step 3: Synthesizing Content
      setCurrentStep(3);

      if (!response.ok) {
        throw new Error(`Gagal memproses dengan model AI (HTTP ${response.status})`);
      }

      const data = await response.json();
      const rawText = data?.result || data?.content || (typeof data === 'string' ? data : JSON.stringify(data));

      if (!rawText || rawText.trim() === '') {
        throw new Error('Model AI tidak menghasilkan teks keluaran. Coba ganti model atau ulangi prompt.');
      }

      // Step 4: Compiling Deliverable
      setCurrentStep(4);
      await new Promise(r => setTimeout(r, 400));

      // Derive title
      const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
      let extractedTitle = lines[0]?.replace(/^[#\s*|,-]+/, '').trim() || 'Dokumen Agentika';
      if (extractedTitle.length > 60) extractedTitle = extractedTitle.slice(0, 57) + '...';

      setResultTitle(extractedTitle);
      setResultContent(rawText);
      setResultType(mode);

      // Parse spreadsheet CSV if in sheet mode
      if (mode === 'sheet') {
        const rows = rawText
          .split('\n')
          .filter((r: string) => r.trim().length > 0 && !r.startsWith('```'))
          .map((r: string) => r.includes(',') ? r.split(',').map((c: string) => c.trim().replace(/^"|"$/g, '')) : r.split('|').map((c: string) => c.trim()).filter((c: string) => c.length > 0));
        if (rows.length > 1) {
          setParsedTableRows(rows);
        }
      }

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

    try {
      const id = `agentika_${Date.now()}`;
      const titleSnippet = resultTitle || 'Dokumen Agentika';

      // 1. Calculate center coordinates of current viewport on whiteboard canvas
      let centerX = 640;
      let centerY = 420;
      if (canvasRef?.current) {
        try {
          const vpt = canvasRef.current.viewportTransform || [1, 0, 0, 1, 0, 0];
          const zoom = canvasRef.current.getZoom() || 1;
          const width = canvasRef.current.getWidth() || 1280;
          const height = canvasRef.current.getHeight() || 800;
          centerX = (-vpt[4] + width / 2) / zoom;
          centerY = (-vpt[5] + height / 2) / zoom;
        } catch {
          // fallback
        }
      }

      // 2. Configure widget dimensions and type
      let componentType = 'DOCUMENT_PAGE';
      let width = 680;
      let height = 540;
      let config: any = {
        title: `📄 ${titleSnippet}`,
        markdown: resultContent,
        model: activeModelDisplay
      };

      if (resultType === 'diagram') {
        componentType = 'MERMAID_DIAGRAM';
        width = 720;
        height = 520;
        config = {
          title: `🗺️ ${titleSnippet}`,
          code: resultContent.replace(/```mermaid/g, '').replace(/```/g, '').trim(),
          model: activeModelDisplay
        };
      } else if (resultType === 'sheet') {
        width = 760;
        height = 500;
        config = {
          title: `📊 ${titleSnippet}`,
          markdown: resultContent,
          model: activeModelDisplay
        };
      } else if (resultType === 'slide') {
        width = 700;
        height = 540;
        config = {
          title: `📽️ ${titleSnippet}`,
          markdown: resultContent,
          model: activeModelDisplay
        };
      }

      // 3. Mount directly to whiteboard DOM overlay
      useStore.getState().updateDomElement(id, {
        id,
        html: '<div>Dokumen Agentika</div>',
        componentType,
        config,
        x: Math.round(centerX),
        y: Math.round(centerY),
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        zIndex: 25
      });

      // 4. Dispatch canvas placeholder registration
      const event = new CustomEvent('addCanvasPlaceholder', {
        detail: {
          id,
          x: Math.round(centerX),
          y: Math.round(centerY),
          width,
          height
        }
      });
      window.dispatchEvent(event);

      // 5. Add confirmation message to chat history
      useStore.getState().addMessage({
        role: 'model',
        text: `✨ Berkas **${titleSnippet}** berhasil ditempelkan langsung ke kanvas papan tulis!`
      });

      toast.success('📌 Berhasil ditempelkan ke Papan Tulis!');
      onClose();
    } catch (err: any) {
      toast.error('Gagal menempelkan ke kanvas: ' + (err.message || 'Error'));
    }
  };

  const handleDownload = async () => {
    const title = resultTitle || 'dokumen-agentika';
    if (resultType === 'doc') {
      try {
        toast.info('Menyusun berkas OpenXML .DOCX...');
        await exportToDocx(title, resultContent);
        toast.success('Berkas .DOCX berhasil diunduh!');
      } catch (e: any) {
        exportToMarkdown(title, resultContent);
        toast.error('Gagal kompilasi docx, mengunduh markdown.');
      }
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
      {/* Background Dot Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 z-0"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Header */}
      <header className="relative h-16 px-6 lg:px-10 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#1550aa] text-white shadow-xs">
            <Bot size={22} className="text-[#ffcc00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-[#0a1a3a]">Agentika</h1>
              <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-[#1550aa] text-white uppercase">
                Eksperimental
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Studio Agen Mandiri Produktivitas Pendidik (Docs · Sheets · Slides · Diagrams)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Model Selector Pill */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAiPreference('auto')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                aiPreference === 'auto' ? 'bg-[#1550aa] text-white shadow-xs' : 'text-slate-600 hover:text-[#0a1a3a]'
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setAiPreference('gemini')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                aiPreference === 'gemini' ? 'bg-[#1550aa] text-white shadow-xs' : 'text-slate-600 hover:text-[#0a1a3a]'
              }`}
            >
              Gemini
            </button>
            <button
              type="button"
              onClick={() => setAiPreference('vertex')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                aiPreference === 'vertex' ? 'bg-[#1550aa] text-white shadow-xs' : 'text-slate-600 hover:text-[#0a1a3a]'
              }`}
            >
              Vertex
            </button>
            <button
              type="button"
              onClick={() => setAiPreference('ollama')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                aiPreference === 'ollama' ? 'bg-[#1550aa] text-white shadow-xs' : 'text-slate-600 hover:text-[#0a1a3a]'
              }`}
            >
              Lokal (Ollama)
            </button>
          </div>

          {/* Close / Return to Board button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-2xs"
          >
            <X size={15} />
            <span className="hidden sm:inline">Kembali ke Papan</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="relative flex-1 overflow-y-auto px-4 py-6 lg:px-12 lg:py-8 space-y-8 custom-scrollbar pb-64 z-10">
        
        {/* Animated Loading Progression HUD */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="max-w-3xl mx-auto bg-white rounded-[2rem] border-2 border-[#1550aa]/20 shadow-lg p-6 space-y-5"
            >
              {/* Header Status & Live Timer */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full bg-[#1550aa] flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Sparkles size={18} className="animate-pulse text-[#ffcc00]" />
                    <span className="absolute -inset-1 rounded-full border border-[#ffcc00]/50 animate-ping opacity-40 pointer-events-none" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[#0a1a3a] tracking-tight">
                      Agen Agentika Sedang Bekerja...
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Model aktif: <span className="font-bold text-[#1550aa]">{activeModelDisplay}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    ⏱️ {elapsedSecs.toFixed(1)}s
                  </span>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <X size={13} />
                    <span>Batalkan</span>
                  </button>
                </div>
              </div>

              {/* Step Pipeline Tracker */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { num: 1, label: 'Dekonstruksi' },
                  { num: 2, label: 'Skema Berkas' },
                  { num: 3, label: 'Sintesis Konten' },
                  { num: 4, label: 'Kompilasi' }
                ].map(s => {
                  const isDone = currentStep > s.num;
                  const isCurrent = currentStep === s.num;
                  return (
                    <div 
                      key={s.num} 
                      className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1 transition-all ${
                        isCurrent 
                          ? 'bg-blue-50/80 border-[#1550aa] text-[#1550aa] ring-2 ring-[#1550aa]/20' 
                          : isDone 
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-700' 
                            : 'bg-slate-50 border-slate-200/70 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black">
                        {isDone ? <CheckCircle2 size={14} className="text-emerald-600" /> : s.num}
                      </div>
                      <span className="text-[11px] font-bold leading-tight">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Solid Indeterminate Progress Line */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ left: '-30%', width: '30%' }}
                  animate={{ left: '100%', width: '40%' }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-y-0 bg-[#ffcc00] rounded-full"
                />
              </div>

              {/* Rotating Pedagogical Insights & Pro Tips */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <Lightbulb size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                      Wawasan Pengajar · {PEDAGOGICAL_INSIGHTS[insightIndex].tag}
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={insightIndex}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs text-amber-950/80 font-medium leading-relaxed"
                    >
                      {PEDAGOGICAL_INSIGHTS[insightIndex].text}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Capability Showcase Cards (When Idle) */}
        {!resultContent && !isRunning && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-2xl font-black text-[#0a1a3a] tracking-tight">
                Pilih Kemampuan Agen & Hasilkan Berkas Siap Pakai
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto font-medium">
                Pilih salah satu template di bawah atau ketik instruksi di Dock Island untuk mempekerjakan agen AI mandiri.
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
        {resultContent && !isRunning && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="bg-white rounded-[2.2rem] border-2 border-[#1550aa]/20 shadow-md p-6 lg:p-8 space-y-6">
              {/* Deliverable Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1550aa] uppercase tracking-wider">
                      {resultType.toUpperCase()} SELESAI
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
                  {/* 16:9 Presentation Slide Preview */}
                  <div className="aspect-[16/9] w-full max-w-3xl mx-auto p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-bold text-[#ffcc00] uppercase tracking-wider mb-2">
                      <span>Slide {currentSlideIndex + 1} dari {parsedSlides.length}</span>
                      <span>Trido Presentation Deck</span>
                    </div>

                    <div className="my-auto space-y-4">
                      <h3 className="text-2xl lg:text-3xl font-black text-white">
                        {parsedSlides[currentSlideIndex]?.title}
                      </h3>
                      <div className="text-slate-200 whitespace-pre-wrap leading-relaxed text-sm lg:text-base">
                        {parsedSlides[currentSlideIndex]?.content}
                      </div>
                    </div>

                    {parsedSlides[currentSlideIndex]?.notes && (
                      <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-xs text-amber-200 border border-white/15">
                        <strong>Catatan Guru:</strong> {parsedSlides[currentSlideIndex]?.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-white/20 mt-4">
                      <button
                        type="button"
                        disabled={currentSlideIndex === 0}
                        onClick={() => setCurrentSlideIndex(i => Math.max(0, i - 1))}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft size={14} /> Sebelumnya
                      </button>
                      <button
                        type="button"
                        disabled={currentSlideIndex === parsedSlides.length - 1}
                        onClick={() => setCurrentSlideIndex(i => Math.min(parsedSlides.length - 1, i + 1))}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#1550aa] hover:bg-blue-600 text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
                      >
                        Berikutnya <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : resultType === 'sheet' && parsedTableRows.length > 1 ? (
                /* Interactive Spreadsheet Table Preview */
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs max-h-[500px] custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0a1a3a] text-white font-bold">
                      <tr>
                        {parsedTableRows[0].map((head, i) => (
                          <th key={i} className="p-3 border-r border-slate-700 last:border-r-0 whitespace-nowrap">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {parsedTableRows.slice(1).map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 border-r border-slate-100 last:border-r-0 text-slate-700 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : resultType === 'doc' ? (
                /* Document Academic Paper & Markdown Preview */
                <div className="space-y-4">
                  {/* View Mode Switcher Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('paper')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                          previewTab === 'paper' ? 'bg-[#1550aa] text-white shadow-xs' : 'text-slate-600 hover:text-[#0a1a3a]'
                        }`}
                      >
                        <Eye size={13} />
                        <span>Halaman Dokumen (A4)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('source')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                          previewTab === 'source' ? 'bg-[#1550aa] text-white shadow-xs' : 'text-slate-600 hover:text-[#0a1a3a]'
                        }`}
                      >
                        <Code size={13} />
                        <span>Sumber Markdown</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Cetak atau Simpan PDF (Ctrl+P)"
                      >
                        <Printer size={13} />
                        <span>Cetak / PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          exportToMarkdown(resultTitle || 'dokumen', resultContent);
                          toast.success('Mengunduh berkas Markdown (.md)!');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        <FileText size={13} />
                        <span>Unduh .MD</span>
                      </button>
                    </div>
                  </div>

                  {/* Rendered A4 Sheet vs Raw Markdown */}
                  {previewTab === 'paper' ? (
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 lg:p-14 min-h-[500px]">
                      {/* Document Formal Header Stamp */}
                      <div className="border-b-2 border-[#1550aa] pb-4 mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src="/logo.png" alt="Trido" className="w-8 h-8 object-contain" />
                          <div>
                            <div className="font-black text-xs text-[#1550aa] tracking-widest uppercase">
                              TRIDO AGENTIKA · PENDIDIKAN INKLUSIF
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold">
                              Modul Ajar & Dokumen Kurikulum Merdeka
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                          {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>

                      {/* Markdown Rendered Content */}
                      <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h1:text-2xl prose-h1:text-[#1550aa] prose-h2:text-xl prose-h2:text-[#0a1a3a] prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 prose-h3:text-lg prose-p:text-slate-700 prose-p:leading-relaxed prose-li:text-slate-700 prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-th:p-3 prose-th:text-xs prose-td:p-3 prose-td:text-xs prose-td:border prose-td:border-slate-100 font-sans">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {resultContent}
                        </ReactMarkdown>
                      </div>

                      {/* Formal Footer */}
                      <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Dihasilkan oleh Agen Agentika · Siap digunakan di kelas</span>
                        <span>Hak Cipta © 2026 Ardellio Satria Anindito</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-[550px] whitespace-pre-wrap leading-relaxed custom-scrollbar">
                      {resultContent}
                    </div>
                  )}
                </div>
              ) : (
                /* Document Academic Paper Preview */
                <div className="p-6 lg:p-8 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-800 text-xs sm:text-sm overflow-x-auto max-h-[550px] whitespace-pre-wrap leading-relaxed custom-scrollbar font-mono">
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

            {/* Model Pill in Dock */}
            <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60 hidden sm:inline-block">
              {activeModelDisplay}
            </span>
          </div>

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
