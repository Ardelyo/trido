import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, Sparkles, FileText, Table, Presentation, Network,
  Download, ArrowRight, CornerDownLeft, X, Copy, Check,
  ChevronLeft, ChevronRight, Pin, ChevronDown, ChevronUp,
  Cpu, Lightbulb, CheckCircle2, Eye, Code, Printer,
  History, ShieldCheck, HelpCircle, Layers, SlidersHorizontal, BookOpen,
  Search, Settings2
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

// Global Teacher Context configuration
interface TeacherContext {
  curriculum: string;
  gradeLevel: string;
  subject: string;
  classSpecific: string;
  studentCount: number;
  semester: string;
}

// Saved Document History Item
interface AgentikaHistoryItem {
  id: string;
  title: string;
  mode: AgentikaMode;
  content: string;
  timestamp: number;
}

// Standard Indonesian Subjects for combobox
const STANDARD_SUBJECTS = [
  'Fisika', 'Biologi', 'Kimia', 'Matematika', 'Informatika',
  'Bahasa Indonesia', 'Bahasa Inggris', 'Sejarah', 'Geografi',
  'Ekonomi', 'Sosiologi', 'Pendidikan Pancasila (PPKn)', 'Seni Budaya',
  'Pendidikan Jasmani & Olahraga (PJOK)', 'Pendidikan Agama'
];

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
    text: 'Saat menggunakan Mode Privat Offline (Ollama/Gemma), seluruh data nilai dan identitas siswa Anda diproses 100% lokal di perangkat.'
  },
  {
    tag: 'Desain Presentasi Kelas',
    text: 'Slide ajar terbaik membatasi maksimal 4 poin utama per slide dengan catatan pemantik untuk memandu interaksi dua arah.'
  }
];

// Rich Sample Previews so teachers see the exact output structure before generating
const SAMPLE_PREVIEWS: Record<AgentikaMode, { title: string; subtitle: string; content: string }> = {
  doc: {
    title: 'Contoh: Modul Ajar Fisika Fase E (Hukum Newton)',
    subtitle: 'Standar Kurikulum Merdeka Kemendikbudristek',
    content: `# MODUL AJAR FISIKA: HUKUM NEWTON TENTANG GERAK

## I. IDENTITAS MODUL
- **Nama Penyusun**: Ardellio Satria Anindito, S.Pd.
- **Satuan Pendidikan**: SMA Negeri 1 Inklusif
- **Fase / Kelas**: E / X (Sepuluh)
- **Alokasi Waktu**: 2 JP x 45 Menit (Pertemuan 1)
- **Model Pembelajaran**: Problem Based Learning (PBL)

---

## II. KOMPETENSI INTI
### A. Capaian Pembelajaran (CP)
Peserta didik mampu menyelidiki prinsip dinamika gerak lurus dan menganalisis pengaruh gaya terhadap percepatan benda dalam kehidupan sehari-hari.

### B. Tujuan Pembelajaran (TP)
1. Melalui demonstrasi papan tulis, peserta didik dapat merumuskan konsep kelembaman ($F = 0$) secara kritis.
2. Peserta didik dapat menghitung percepatan balok bermassa $m$ dengan gaya gesek menggunakan persamaan $a = \\frac{\\Sigma F}{m}$.

---

## III. ASESMEN FORMATIF & LKPD
| Kriteria Penilaian | Indikator Ketercapaian | Rubrik Skor (1-4) |
|---|---|---|
| Pemahaman Konsep | Menjelaskan Hukum I Newton | 4: Sangat Baik, 3: Baik, 2: Cukup |
| Analisis Kasus | Menghitung gaya gesek kinetik | 4: Akurat, 3: Sebagian Benar |

> **Pertanyaan Pemantik**: Mengapa tubuh kita terdorong ke depan saat bus direm mendadak?`
  },
  sheet: {
    title: 'Contoh: Rekapitulasi Nilai Ulangan 25 Siswa',
    subtitle: 'Format CSV / Excel Lengkap dengan Rumus KKM',
    content: `No,NISN,Nama Siswa,Tugas 1,Tugas 2,Nilai UH,Nilai Akhir,Status,Tindak Lanjut
1,0081234561,Aditya Pratama,85,90,88,88,Tuntas,Pengayaan Materi Bab II
2,0081234562,Aisyah Nuraini,75,80,78,78,Tuntas,Pengayaan Materi Bab II
3,0081234563,Bima Wicaksono,60,65,62,62,Remedial,Bimbingan Khusus Rumus Gaya
4,0081234564,Cantika Kirana,90,95,92,92,Tuntas,Tutor Sebaya Kelompok A
5,0081234565,Daffa Ramadhan,70,72,71,71,Remedial,Penugasan Ulang LKPD 1
---,---,Rata-rata Kelas,76.0,80.4,78.2,78.2,76% Lulus,-`
  },
  slide: {
    title: 'Contoh: Dek Presentasi 8 Slide Tata Surya',
    subtitle: 'Slide Interaktif Siap Ajar Lengkap dengan Speaker Notes',
    content: `--- SLIDE START ---
TITLE: 🪐 Sistem Tata Surya Kita
CONTENT:
- Pusat orbit: Matahari (Bintang deret utama)
- 8 Planet utama terbagi: Planet Kebumian & Raksasa Gas
- Sabuk Asteroid membatasi Mars dan Jupiter
NOTES: Tanyakan ke siswa: Apa perbedaan mendasar antara planet dalam dan luar?
--- SLIDE END ---

--- SLIDE START ---
TITLE: 🌍 Karakteristik Bumi & Atmosfer
CONTENT:
- Satu-satunya planet dengan air berwujud cair stabil di permukaan
- Komposisi atmosfer: 78% Nitrogen, 21% Oksigen, 1% Gas Lain
- Medan magnetik melindungi dari radiasi angin matahari
NOTES: Diskusikan peran lapisan ozon dalam melindungi keanekaragaman hayati.
--- SLIDE END ---`
  },
  diagram: {
    title: 'Contoh: Peta Konsep Klasifikasi Makhluk Hidup',
    subtitle: 'Sintaks Mermaid untuk Ditempel Langsung ke Kanvas Papan',
    content: `graph TD
    Root[Klasifikasi Makhluk Hidup] --> Monera[Kingdom Monera<br/>Prokariotik, Uniseluler]
    Root --> Protista[Kingdom Protista<br/>Eukariotik, Mirip Hewan/Tumbuhan]
    Root --> Fungi[Kingdom Fungi<br/>Heterotrof, Dinding Kitin]
    Root --> Plantae[Kingdom Plantae<br/>Autotrof, Fotosintesis]
    Root --> Animalia[Kingdom Animalia<br/>Multiseluler, Bergerak Aktif]`
  }
};

const CAPABILITY_PREVIEWS = [
  {
    mode: 'doc' as AgentikaMode,
    icon: FileText,
    iconColor: 'text-[#1550aa]',
    badgeBg: 'bg-blue-50 text-[#1550aa] border-blue-200',
    badge: 'DOCX / Markdown',
    title: 'Modul Ajar & RPP Kurikulum Merdeka',
    desc: 'Susun RPP lengkap dengan Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), asesmen diagnostik, dan lembar kerja siswa (LKPD).',
    prompt: 'Tolong buatkan Modul Ajar Kurikulum Merdeka Fase E untuk materi "Hukum Newton tentang Gerak" (Fisika SMA Kelas 10). Lengkap dengan identitas modul, kompetensi awal, profil pelajar pancasila, tujuan pembelajaran, rincian kegiatan pembelajaran (pendahuluan, inti, penutup), asesmen formatif, serta LKPD dan rubrik penilaian.'
  },
  {
    mode: 'sheet' as AgentikaMode,
    icon: Table,
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badge: 'XLSX / CSV',
    title: 'Buku Nilai & Analisis Ketuntasan Siswa',
    desc: 'Rekap tabel nilai ulangan 25 siswa dengan kalkulasi otomatis rata-rata, persentase ketuntasan (KKM 75), ranking, dan deteksi siswa remedial.',
    prompt: 'Buatkan tabel rekapitulasi nilai Ulangan Harian Biologi untuk 25 siswa kelas XI IPA 2. Kolom terdiri dari: No, NISN, Nama Siswa, Tugas 1, Tugas 2, Nilai UH, Nilai Akhir, Status (Tuntas / Remedial), dan Rekomendasi Tindak Lanjut. Sertakan baris Rata-rata Kelas, Nilai Tertinggi, Nilai Terendah, dan Persentase Kelulusan.'
  },
  {
    mode: 'slide' as AgentikaMode,
    icon: Presentation,
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'PPTX / Slide Deck',
    title: 'Slide Presentasi Interaktif Kelas',
    desc: 'Dek presentasi 8 slide interaktif siap ajar dengan alur terstruktur, pertanyaan pemantik diskusi, dan catatan pembicara untuk guru.',
    prompt: 'Rancanglah dek presentasi materi kelas 8 slide tentang "Sistem Tata Surya & Karakteristik Planet". Setiap slide harus memuat: Judul Slide, Poin Materi Inti (bullet points), Pertanyaan Interaktif untuk Siswa, dan Catatan Guru (Speaker Notes).'
  },
  {
    mode: 'diagram' as AgentikaMode,
    icon: Network,
    iconColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
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

  // Input form mode: 'structured' vs 'free'
  const [inputMode, setInputMode] = useState<'structured' | 'free'>('free');

  // Structured Form Fields
  const [structuredTopic, setStructuredTopic] = useState('Hukum Newton tentang Gerak');
  const [structuredModel, setStructuredModel] = useState('Problem Based Learning (PBL)');
  const [structuredDuration, setStructuredDuration] = useState('2 JP x 45 Menit');
  const [structuredKkm, setStructuredKkm] = useState('75');

  // Global Teacher Context (saved to localStorage)
  const [teacherContext, setTeacherContext] = useState<TeacherContext>(() => {
    try {
      const saved = localStorage.getItem('trido_teacher_context');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      curriculum: 'Kurikulum Merdeka',
      gradeLevel: 'SMA/SMK (Fase E)',
      subject: 'Fisika',
      classSpecific: 'Kelas X',
      studentCount: 25,
      semester: 'Semester 1 (Ganjil)'
    };
  });
  const [showAdvancedContext, setShowAdvancedContext] = useState(false);

  // Sample Preview Modal State
  const [sampleModalMode, setSampleModalMode] = useState<AgentikaMode | null>(null);

  // Document History State
  const [historyItems, setHistoryItems] = useState<AgentikaHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('trido_agentika_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

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

  // Save teacher context on change
  const updateTeacherContext = (patch: Partial<TeacherContext>) => {
    const next = { ...teacherContext, ...patch };
    setTeacherContext(next);
    try {
      localStorage.setItem('trido_teacher_context', JSON.stringify(next));
    } catch {}
  };

  // Friendly human labels for AI modes
  const getModelLabel = () => {
    switch (aiPreference) {
      case 'gemini': return 'Mode Cepat (Gemini)';
      case 'vertex': return 'Mode Terpadu (Vertex)';
      case 'ollama': return 'Mode Privat Offline (Lokal)';
      default: return 'Otomatis (Rekomendasi)';
    }
  };

  // Synchronize structured fields into prompt text
  const applyStructuredPrompt = () => {
    if (mode === 'doc') {
      setPromptText(`Tolong susun Modul Ajar ${teacherContext.curriculum} untuk mata pelajaran ${teacherContext.subject} (${teacherContext.classSpecific}, ${teacherContext.gradeLevel}). Materi: "${structuredTopic}". Alokasi waktu: ${structuredDuration}. Model pembelajaran: ${structuredModel}. Lengkap dengan identitas modul, Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), langkah kegiatan pembelajaran, asesmen formatif, LKPD siswa, dan rubrik penilaian.`);
    } else if (mode === 'sheet') {
      setPromptText(`Buatkan tabel rekapitulasi nilai evaluasi ${teacherContext.subject} untuk ${teacherContext.studentCount} siswa ${teacherContext.classSpecific}. Materi: "${structuredTopic}". KKM/KKTP: ${structuredKkm}. Kolom: No, NISN, Nama Siswa, Tugas 1, Tugas 2, Nilai UH, Nilai Akhir, Status (Tuntas/Remedial), Tindak Lanjut. Sertakan baris rata-rata kelas, nilai tertinggi, dan persentase kelulusan.`);
    } else if (mode === 'slide') {
      setPromptText(`Rancanglah dek presentasi materi kelas 8 slide tentang "${structuredTopic}" untuk mata pelajaran ${teacherContext.subject} (${teacherContext.classSpecific}). Setiap slide harus memuat: Judul Slide, Poin Inti (bullet points), Pertanyaan Interaktif Siswa, dan Catatan Guru (Speaker Notes).`);
    } else {
      setPromptText(`Buatkan peta konsep terstruktur tentang "${structuredTopic}" untuk mata pelajaran ${teacherContext.subject} (${teacherContext.classSpecific}) dengan cabang hierarki konsep utama, sub-konsep, dan contoh aplikasi untuk ditampilkan di papan tulis.`);
    }
    setInputMode('free');
    toast.success('Formulir terstruktur berhasil diterapkan ke prompt!');
  };

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

  // Execute agent pipeline with live 4-step trace
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
      await new Promise(r => setTimeout(r, 600));

      // Step 2: Formulating pedagogical schema
      setCurrentStep(2);

      let formatDirective = '';
      if (mode === 'doc') {
        formatDirective = `
Anda adalah Lead Curriculum Architect dari Trido Agentika.
Susun dokumen ajar atau modul pembelajaran lengkap dan profesional dalam format Markdown bersih.
Sertakan judul (# Judul), sub-bagian (## Bagian), rincian poin, dan tabel markdown jika relevan.
Pedoman Konteks Pendidik:
- Kurikulum: ${teacherContext.curriculum}
- Jenjang: ${teacherContext.gradeLevel}
- Mata Pelajaran: ${teacherContext.subject}
- Kelas: ${teacherContext.classSpecific} (${teacherContext.semester})
Jangan gunakan tanda elipsis "..." atau menyisakan placeholder kosong; tuliskan materi secara tuntas dan berbobot akademis.`;
      } else if (mode === 'sheet') {
        formatDirective = `
Anda adalah Data Analyst Pendidikan dari Trido Agentika.
Susun tabel dataset nilai/administrasi sekolah yang rapi dan realistis.
Konteks: ${teacherContext.subject} (${teacherContext.classSpecific}, ${teacherContext.studentCount} Siswa).
Format keluaran HANYA dalam format tabel CSV (dipisahkan tanda koma) atau tabel Markdown yang valid.
Pastikan header kolom jelas, nama siswa realistis Indonesia, kalkulasi rata-rata dan ranking akurat.`;
      } else if (mode === 'slide') {
        formatDirective = `
Anda adalah Instructional Slide Deck Designer dari Trido Agentika.
Konteks: ${teacherContext.subject} (${teacherContext.classSpecific}, ${teacherContext.curriculum}).
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
Konteks: ${teacherContext.subject} (${teacherContext.classSpecific}).
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

      // Step 3: Synthesizing Content & Calculations
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

      // Save to Document History
      const newHistoryItem: AgentikaHistoryItem = {
        id: `doc_${Date.now()}`,
        title: extractedTitle,
        mode,
        content: rawText,
        timestamp: Date.now()
      };
      const updatedHistory = [newHistoryItem, ...historyItems].slice(0, 20);
      setHistoryItems(updatedHistory);
      try {
        localStorage.setItem('trido_agentika_history', JSON.stringify(updatedHistory));
      } catch {}

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

  // Pin to canvas with actual DomOverlay placement
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
        } catch {}
      }

      // 2. Configure widget dimensions and type
      let componentType = 'DOCUMENT_PAGE';
      let width = 680;
      let height = 540;
      let config: any = {
        title: `📄 ${titleSnippet}`,
        markdown: resultContent,
        model: getModelLabel()
      };

      if (resultType === 'diagram') {
        componentType = 'MERMAID_DIAGRAM';
        width = 720;
        height = 520;
        config = {
          title: `🗺️ ${titleSnippet}`,
          code: resultContent.replace(/```mermaid/g, '').replace(/```/g, '').trim(),
          model: getModelLabel()
        };
      } else if (resultType === 'sheet') {
        width = 760;
        height = 500;
        config = {
          title: `📊 ${titleSnippet}`,
          markdown: resultContent,
          model: getModelLabel()
        };
      } else if (resultType === 'slide') {
        width = 700;
        height = 540;
        config = {
          title: `📽️ ${titleSnippet}`,
          markdown: resultContent,
          model: getModelLabel()
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
      <header className="relative h-16 px-4 lg:px-8 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#1550aa] text-white shadow-xs">
            <Bot size={22} className="text-[#ffcc00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-[#0a1a3a]">Agentika Studio</h1>
              <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-[#1550aa] text-white uppercase" title="Fitur eksperimental studio agen mandiri produktivitas pendidik">
                Eksperimental
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Studio Agen Mandiri Produktivitas Pendidik (RPP · Nilai · Slide · Peta Konsep)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Single Source of Truth Mode Selector */}
          <div className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAiPreference('auto')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                aiPreference === 'auto' ? 'bg-[#1550aa] text-white shadow-xs' : 'text-slate-600 hover:text-[#0a1a3a]'
              }`}
              title="Memilih penyedia AI terbaik secara otomatis"
            >
              Otomatis
            </button>
            <button
              type="button"
              onClick={() => setAiPreference('gemini')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                aiPreference === 'gemini' ? 'bg-[#1550aa] text-white shadow-xs' : 'text-slate-600 hover:text-[#0a1a3a]'
              }`}
              title="Mode pemrosesan awan berkecepatan tinggi"
            >
              Mode Cepat
            </button>
            <button
              type="button"
              onClick={() => setAiPreference('ollama')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                aiPreference === 'ollama' ? 'bg-[#1550aa] text-white shadow-xs' : 'text-slate-600 hover:text-[#0a1a3a]'
              }`}
              title="Privasi 100% offline lokal di laptop Anda tanpa koneksi internet"
            >
              Mode Privat (Offline)
            </button>
          </div>

          {/* History Drawer Trigger with Badge Count */}
          <button
            type="button"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-2xs"
            title={historyItems.length > 0 ? `Lihat ${historyItems.length} riwayat dokumen sesi` : 'Belum ada riwayat dokumen'}
          >
            <History size={14} className="text-[#1550aa]" />
            <span className="hidden sm:inline">Riwayat</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              historyItems.length > 0 ? 'bg-[#1550aa] text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {historyItems.length}
            </span>
          </button>

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

      {/* Global Teacher Context Setter Bar */}
      <div className="bg-white/90 border-b border-slate-200/80 px-4 lg:px-8 py-2 z-10 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <SlidersHorizontal size={13} className="text-[#1550aa]" /> Konteks Kelas:
          </span>

          {/* Curriculum Dropdown */}
          <select
            value={teacherContext.curriculum}
            onChange={e => updateTeacherContext({ curriculum: e.target.value })}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full font-bold text-[#0a1a3a] text-xs cursor-pointer focus:outline-hidden"
          >
            <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
            <option value="Kurikulum 2013 (K-13)">Kurikulum 2013 (K-13)</option>
            <option value="Kurikulum Internasional / Cambridge">Kurikulum Internasional</option>
          </select>

          {/* Grade Level Dropdown */}
          <select
            value={teacherContext.gradeLevel}
            onChange={e => updateTeacherContext({ gradeLevel: e.target.value })}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full font-bold text-[#0a1a3a] text-xs cursor-pointer focus:outline-hidden"
          >
            <option value="SMA/SMK (Fase E)">SMA/SMK (Fase E/F)</option>
            <option value="SMP (Fase D)">SMP (Fase D)</option>
            <option value="SD (Fase A/B/C)">SD (Fase A/B/C)</option>
            <option value="PAUD">PAUD</option>
          </select>

          {/* Subject Combobox with Search Affordance */}
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              list="subject-options"
              value={teacherContext.subject}
              onChange={e => updateTeacherContext({ subject: e.target.value })}
              placeholder="Pilih / Cari Mapel..."
              className="pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-full font-bold text-[#0a1a3a] text-xs w-36 sm:w-44 focus:outline-hidden focus:border-[#1550aa]"
            />
            <datalist id="subject-options">
              {STANDARD_SUBJECTS.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* Expandable Advanced Context Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedContext(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              showAdvancedContext ? 'bg-blue-50 text-[#1550aa] border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Settings2 size={12} />
            <span>{showAdvancedContext ? 'Tutup Rincian' : 'Rincian Kelas'}</span>
            {showAdvancedContext ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Konteks otomatis disematkan pada setiap dokumen yang disusun</span>
        </div>
      </div>

      {/* Advanced Context Options (Dropdown Drawer) */}
      <AnimatePresence>
        {showAdvancedContext && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50/90 border-b border-slate-200 px-4 lg:px-8 py-2.5 flex flex-wrap items-center gap-3 text-xs z-10 shrink-0 overflow-hidden font-sans"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Kelas Spesifik:</span>
              <input
                type="text"
                value={teacherContext.classSpecific}
                onChange={e => updateTeacherContext({ classSpecific: e.target.value })}
                className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-xs w-28"
                placeholder="misal: Kelas X IPA 1"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Jumlah Siswa:</span>
              <input
                type="number"
                min={1}
                max={60}
                value={teacherContext.studentCount}
                onChange={e => updateTeacherContext({ studentCount: Number(e.target.value) || 25 })}
                className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-xs w-20"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Semester:</span>
              <select
                value={teacherContext.semester}
                onChange={e => updateTeacherContext({ semester: e.target.value })}
                className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-xs cursor-pointer"
              >
                <option value="Semester 1 (Ganjil)">Semester 1 (Ganjil)</option>
                <option value="Semester 2 (Genap)">Semester 2 (Genap)</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Area (Scrollable flex-1 container - CARDS & RESULTS NEVER OVERLAPPED BY DOCK) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-12 lg:py-8 space-y-8 custom-scrollbar z-10">
        
        {/* Live 4-Step Agentic Reasoning Trace Stepper (Visible During Execution) */}
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
                      Penyedia AI: <span className="font-bold text-[#1550aa]">{getModelLabel()}</span>
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

              {/* Step Pipeline Tracker with Clear Agentic Transparency */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { num: 1, label: 'Menganalisis Kurikulum & TP', detail: 'Membedah Capaian Pembelajaran' },
                  { num: 2, label: 'Menyusun Skema Berkas', detail: 'Merancang Struktur & Format' },
                  { num: 3, label: 'Sintesis Materi & Asesmen', detail: 'Menulis LKPD & Rubrik Nilai' },
                  { num: 4, label: 'Kompilasi Berkas Akhir', detail: 'Membangun Berkas Siap Pakai' }
                ].map(s => {
                  const isDone = currentStep > s.num;
                  const isCurrent = currentStep === s.num;
                  return (
                    <div 
                      key={s.num} 
                      className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1 transition-all ${
                        isCurrent 
                          ? 'bg-blue-50/80 border-[#1550aa] text-[#1550aa] ring-2 ring-[#1550aa]/20' 
                          : isDone 
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-700' 
                            : 'bg-slate-50 border-slate-200/70 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-black">
                        {isDone ? <CheckCircle2 size={16} className="text-emerald-600" /> : s.num}
                      </div>
                      <span className="text-xs font-bold leading-tight">{s.label}</span>
                      <span className="text-[10px] text-slate-400 hidden sm:block">{s.detail}</span>
                    </div>
                  );
                })}
              </div>

              {/* Solid Indeterminate Progress Line (Strictly Zero Gradient) */}
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
            <div className="text-center space-y-1.5 mb-6">
              <h2 className="text-2xl font-black text-[#0a1a3a] tracking-tight">
                Pilih Kemampuan Agen & Hasilkan Berkas Siap Pakai
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto font-medium">
                Pilih salah satu template di bawah, tinjau contoh hasilnya, atau gunakan formulir terstruktur di bilah bawah.
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
                    className={`p-5 rounded-3xl border-2 transition-all bg-white shadow-xs flex flex-col justify-between text-left group ${
                      isSelected ? 'border-[#1550aa] ring-2 ring-[#1550aa]/20' : 'border-slate-200/80 hover:border-[#1550aa]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#1550aa] text-white' : 'bg-slate-50 ' + item.iconColor
                        }`}>
                          <Icon size={20} />
                        </div>
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${item.badgeBg}`}>
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-[#0a1a3a] mb-1.5">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">{item.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSampleModalMode(item.mode)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1550aa] px-2.5 py-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Lihat contoh format dokumen jadi sebelum generate"
                      >
                        <Eye size={13} />
                        <span>Contoh Hasil</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMode(item.mode);
                          setPromptText(item.prompt);
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-white bg-[#1550aa] hover:bg-[#0a1a3a] px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <span>Gunakan Template</span>
                        <ArrowRight size={13} />
                      </button>
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
                              {teacherContext.curriculum} · {teacherContext.gradeLevel} ({teacherContext.classSpecific})
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

                      {/* Formal Footer & Teacher Disclaimer */}
                      <div className="mt-12 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium gap-2">
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

              {/* Pedagogy Trust Disclaimer Banner */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 flex items-center gap-2 text-xs text-slate-600 font-medium">
                <ShieldCheck size={16} className="text-[#1550aa] shrink-0" />
                <span>
                  <strong>Catatan Verifikasi Guru:</strong> Hasil agen AI ini disesuaikan dengan Capaian Pembelajaran {teacherContext.curriculum}. Harap tinjau kembali kesesuaian materi sebelum diterapkan di ruang kelas.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* IN-FLOW STICKY BOTTOM COMMAND BAR (Dock is an in-flow flex sibling — ZERO OVERLAP GUARANTEED) */}
      <div className="shrink-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(10,26,58,0.06)] px-4 py-3 lg:px-8 z-20 font-sans">
        <div className="max-w-4xl mx-auto space-y-2.5">
          
          {/* Top Row: Mode Selector Pills & Read-Only Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
              {[
                { id: 'doc' as AgentikaMode, label: 'Modul Ajar (DOCX)', icon: FileText },
                { id: 'sheet' as AgentikaMode, label: 'Buku Nilai (XLSX)', icon: Table },
                { id: 'slide' as AgentikaMode, label: 'Presentasi (PPTX)', icon: Presentation },
                { id: 'diagram' as AgentikaMode, label: 'Peta Konsep (Papan)', icon: Network },
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

            {/* Read-Only Status & Structured Input Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputMode(m => m === 'structured' ? 'free' : 'structured')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  inputMode === 'structured' ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title="Buka isian terstruktur untuk membantu menyusun instruksi"
              >
                <SlidersHorizontal size={12} />
                <span>{inputMode === 'structured' ? 'Mode Bebas' : 'Formulir Terstruktur'}</span>
              </button>

              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60 hidden sm:inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Berjalan di: {getModelLabel()}</span>
              </span>
            </div>
          </div>

          {/* Structured Input Form Fields (When Active) */}
          <AnimatePresence>
            {inputMode === 'structured' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-2xl space-y-3 overflow-hidden text-xs"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/50">
                  <span className="font-bold text-[#1550aa] flex items-center gap-1.5">
                    <SlidersHorizontal size={13} />
                    <span>Formulir Terstruktur Agen: {mode.toUpperCase()}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Isi field di bawah, lalu klik "Terapkan ke Bilah Agen"
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Topik / Materi Pokok:</label>
                    <input
                      type="text"
                      value={structuredTopic}
                      onChange={e => setStructuredTopic(e.target.value)}
                      placeholder="contoh: Hukum Newton"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#1550aa]"
                    />
                  </div>

                  {mode === 'doc' && (
                    <>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Model Pembelajaran:</label>
                        <select
                          value={structuredModel}
                          onChange={e => setStructuredModel(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        >
                          <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                          <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                          <option value="Discovery Learning">Discovery Learning</option>
                          <option value="Inquiry Terbimbing">Inquiry Terbimbing</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Alokasi Waktu:</label>
                        <input
                          type="text"
                          value={structuredDuration}
                          onChange={e => setStructuredDuration(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                    </>
                  )}

                  {mode === 'sheet' && (
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">KKM / KKTP:</label>
                      <input
                        type="number"
                        value={structuredKkm}
                        onChange={e => setStructuredKkm(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={applyStructuredPrompt}
                      className="w-full py-1.5 px-3 rounded-lg bg-[#1550aa] hover:bg-[#0a1a3a] text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      Terapkan ke Bilah Agen ↵
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea Input Form */}
          <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200/90 rounded-[1.6rem] p-2 focus-within:ring-2 focus-within:ring-[#1550aa]/30 focus-within:bg-white transition-all shadow-2xs">
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
              placeholder={`Contoh: Modul Ajar ${teacherContext.subject} materi ${structuredTopic}, 2 pertemuan, model Problem Based Learning lengkap LKPD...`}
              className="flex-1 bg-transparent border-none outline-hidden resize-none text-sm text-[#0a1a3a] placeholder:text-slate-400 px-3 py-1.5 custom-scrollbar font-medium"
            />

            <button
              type="button"
              disabled={isRunning || !promptText.trim()}
              onClick={handleRunAgent}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#1550aa] hover:bg-[#0a1a3a] text-white font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
            >
              <Sparkles size={14} className="text-[#ffcc00] animate-pulse" />
              <span>{isRunning ? 'Memproses...' : 'Jalankan Agen'}</span>
              <CornerDownLeft size={12} className="opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* Sample Result Preview Modal */}
      <AnimatePresence>
        {sampleModalMode && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] border-2 border-[#1550aa]/20 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden font-sans"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-[#0a1a3a]">
                    {SAMPLE_PREVIEWS[sampleModalMode].title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {SAMPLE_PREVIEWS[sampleModalMode].subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSampleModalMode(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs text-xs sm:text-sm font-sans prose prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {SAMPLE_PREVIEWS[sampleModalMode].content}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Setiap dokumen yang dihasilkan dapat disesuaikan dan diunduh (.DOCX / .CSV).
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode(sampleModalMode);
                    const tmpl = CAPABILITY_PREVIEWS.find(c => c.mode === sampleModalMode);
                    if (tmpl) setPromptText(tmpl.prompt);
                    setSampleModalMode(null);
                  }}
                  className="px-4 py-2 rounded-full bg-[#1550aa] hover:bg-[#0a1a3a] text-white font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Gunakan Format Ini
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document History Drawer */}
      <AnimatePresence>
        {isHistoryDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col font-sans"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-[#1550aa]" />
                  <h3 className="font-black text-base text-[#0a1a3a]">Riwayat Dokumen Sesi</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {historyItems.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <BookOpen size={32} className="mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">Belum ada riwayat dokumen</p>
                    <p className="text-xs text-slate-400">Dokumen yang berhasil disusun akan tersimpan otomatis di sini.</p>
                  </div>
                ) : (
                  historyItems.map(item => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-[#1550aa] bg-white transition-all shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#1550aa]">
                          {item.mode.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-[#0a1a3a] line-clamp-1">{item.title}</h4>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setResultTitle(item.title);
                            setResultContent(item.content);
                            setResultType(item.mode);
                            setIsHistoryDrawerOpen(false);
                            toast.info(`Memuat "${item.title}"`);
                          }}
                          className="px-3 py-1 rounded-full bg-[#1550aa] text-white text-xs font-bold cursor-pointer hover:bg-[#0a1a3a]"
                        >
                          Buka
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentikaView;
