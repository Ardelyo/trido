import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, FileText, Table, Presentation, Network,
  Download, ArrowRight, CornerDownLeft, X, Copy, Check,
  Pin, ChevronDown, ChevronUp,
  Lightbulb, Eye, Printer,
  History, ShieldCheck, SlidersHorizontal, BookOpen,
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

interface TeacherContext {
  curriculum: string;
  gradeLevel: string;
  subject: string;
  classSpecific: string;
  studentCount: number;
  semester: string;
}

interface AgentikaHistoryItem {
  id: string;
  title: string;
  mode: AgentikaMode;
  content: string;
  timestamp: number;
}

const STANDARD_SUBJECTS = [
  'Fisika', 'Biologi', 'Kimia', 'Matematika', 'Informatika',
  'Bahasa Indonesia', 'Bahasa Inggris', 'Sejarah', 'Geografi',
  'Ekonomi', 'Sosiologi', 'Pendidikan Pancasila (PPKn)', 'Seni Budaya',
  'Pendidikan Jasmani & Olahraga (PJOK)', 'Pendidikan Agama'
];

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
    badge: 'DOCX / Markdown',
    title: 'Modul Ajar & RPP',
    desc: 'Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), asesmen diagnostik, serta lembar kerja siswa (LKPD).',
    prompt: 'Tolong buatkan Modul Ajar Kurikulum Merdeka Fase E untuk materi "Hukum Newton tentang Gerak" (Fisika SMA Kelas 10). Lengkap dengan identitas modul, kompetensi awal, profil pelajar pancasila, tujuan pembelajaran, rincian kegiatan pembelajaran (pendahuluan, inti, penutup), asesmen formatif, serta LKPD dan rubrik penilaian.'
  },
  {
    mode: 'sheet' as AgentikaMode,
    icon: Table,
    badge: 'XLSX / CSV',
    title: 'Buku Nilai & Ketuntasan',
    desc: 'Tabel evaluasi siswa dengan kalkulasi otomatis rata-rata kelas, status KKM 75, ranking, dan tindak lanjut remedial.',
    prompt: 'Buatkan tabel rekapitulasi nilai Ulangan Harian Biologi untuk 25 siswa kelas XI IPA 2. Kolom terdiri dari: No, NISN, Nama Siswa, Tugas 1, Tugas 2, Nilai UH, Nilai Akhir, Status (Tuntas / Remedial), dan Rekomendasi Tindak Lanjut. Sertakan baris Rata-rata Kelas, Nilai Tertinggi, Nilai Terendah, dan Persentase Kelulusan.'
  },
  {
    mode: 'slide' as AgentikaMode,
    icon: Presentation,
    badge: 'PPTX / HTML Deck',
    title: 'Slide Presentasi Kelas',
    desc: 'Materi ajar 8 slide siap presentasi dengan poin inti, pemantik diskusi interaktif, dan catatan panduan guru.',
    prompt: 'Rancanglah dek presentasi materi kelas 8 slide tentang "Sistem Tata Surya & Karakteristik Planet". Setiap slide harus memuat: Judul Slide, Poin Materi Inti (bullet points), Pertanyaan Interaktif untuk Siswa, dan Catatan Guru (Speaker Notes).'
  },
  {
    mode: 'diagram' as AgentikaMode,
    icon: Network,
    badge: 'Mermaid / Smartboard',
    title: 'Peta Konsep & Alur',
    desc: 'Bagan relasi konsep materi secara bertingkat untuk ditempel langsung ke papan tulis Trido.',
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
    setAiPreference
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

  const updateTeacherContext = (patch: Partial<TeacherContext>) => {
    const next = { ...teacherContext, ...patch };
    setTeacherContext(next);
    try {
      localStorage.setItem('trido_teacher_context', JSON.stringify(next));
    } catch {}
  };

  const getModelLabel = () => {
    switch (aiPreference) {
      case 'gemini': return 'Mode Cepat (Gemini)';
      case 'vertex': return 'Mode Terpadu (Vertex)';
      case 'ollama': return 'Mode Privat Offline (Lokal)';
      default: return 'Otomatis (Rekomendasi)';
    }
  };

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

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setInsightIndex(prev => (prev + 1) % PEDAGOGICAL_INSIGHTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isRunning]);

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
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 600));

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

      setCurrentStep(3);

      if (!response.ok) {
        throw new Error(`Gagal memproses dengan model AI (HTTP ${response.status})`);
      }

      const data = await response.json();
      const rawText = data?.result || data?.content || (typeof data === 'string' ? data : JSON.stringify(data));

      if (!rawText || rawText.trim() === '') {
        throw new Error('Model AI tidak menghasilkan teks keluaran. Coba ganti model atau ulangi prompt.');
      }

      setCurrentStep(4);
      await new Promise(r => setTimeout(r, 400));

      const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
      let extractedTitle = lines[0]?.replace(/^[#\s*|,-]+/, '').trim() || 'Dokumen Agentika';
      if (extractedTitle.length > 60) extractedTitle = extractedTitle.slice(0, 57) + '...';

      setResultTitle(extractedTitle);
      setResultContent(rawText);
      setResultType(mode);

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

      if (mode === 'sheet') {
        const rows = rawText
          .split('\n')
          .filter((r: string) => r.trim().length > 0 && !r.startsWith('```'))
          .map((r: string) => r.includes(',') ? r.split(',').map((c: string) => c.trim().replace(/^"|"$/g, '')) : r.split('|').map((c: string) => c.trim()).filter((c: string) => c.length > 0));
        if (rows.length > 1) {
          setParsedTableRows(rows);
        }
      }

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

      toast.success('Agen Agentika berhasil menyusun berkas!');
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
        className="absolute inset-0 pointer-events-none opacity-30 z-0"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Zona 2: Sub-Header Agentika Studio (Minimalist & Consolidated) */}
      <header className="relative h-14 px-4 lg:px-8 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-[#1550aa]">
            <Bot size={18} strokeWidth={2} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[#0a1a3a] tracking-tight">Agentika Studio</h1>
            <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Eksperimental
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Consolidated Single Compact Dropdown for Mode */}
          <div className="relative flex items-center">
            <select
              value={aiPreference}
              onChange={e => setAiPreference(e.target.value as any)}
              className="appearance-none pl-3 pr-7 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:border-[#1550aa] transition-colors"
              title="Pilih mode pemrosesan agen AI"
            >
              <option value="auto">Mode: Otomatis (Rekomendasi)</option>
              <option value="gemini">Mode: Cepat (Gemini)</option>
              <option value="vertex">Mode: Terpadu (Vertex)</option>
              <option value="ollama">Mode: Privat Offline (Lokal)</option>
            </select>
            <ChevronDown size={13} className="absolute right-2 text-slate-400 pointer-events-none" />
          </div>

          {/* History Drawer Trigger with Badge Counter */}
          <button
            type="button"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            title={historyItems.length > 0 ? `Lihat ${historyItems.length} riwayat dokumen` : 'Belum ada riwayat dokumen'}
          >
            <History size={13} strokeWidth={1.8} className="text-slate-500" />
            <span>Riwayat</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              {historyItems.length}
            </span>
          </button>

          {/* Return to Board Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer active:scale-95"
          >
            <X size={14} />
            <span className="hidden sm:inline">Papan Tulis</span>
          </button>
        </div>
      </header>

      {/* Zona 3: Teacher Context Bar (Compact, IKEA manual clarity) */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-2 z-10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <SlidersHorizontal size={13} strokeWidth={2} className="text-slate-400" /> Konteks:
          </span>

          <div className="relative flex items-center">
            <select
              value={teacherContext.curriculum}
              onChange={e => updateTeacherContext({ curriculum: e.target.value })}
              className="appearance-none pl-2.5 pr-6 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800 text-xs cursor-pointer focus:outline-hidden"
            >
              <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
              <option value="Kurikulum 2013 (K-13)">Kurikulum 2013 (K-13)</option>
              <option value="Kurikulum Internasional">Kurikulum Internasional</option>
            </select>
            <ChevronDown size={11} className="absolute right-1.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <select
              value={teacherContext.gradeLevel}
              onChange={e => updateTeacherContext({ gradeLevel: e.target.value })}
              className="appearance-none pl-2.5 pr-6 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800 text-xs cursor-pointer focus:outline-hidden"
            >
              <option value="SMA/SMK (Fase E)">SMA/SMK (Fase E/F)</option>
              <option value="SMP (Fase D)">SMP (Fase D)</option>
              <option value="SD (Fase A/B/C)">SD (Fase A/B/C)</option>
              <option value="PAUD">PAUD</option>
            </select>
            <ChevronDown size={11} className="absolute right-1.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <Search size={11} className="absolute left-2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              list="subject-options"
              value={teacherContext.subject}
              onChange={e => updateTeacherContext({ subject: e.target.value })}
              placeholder="Mata Pelajaran..."
              className="pl-6 pr-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800 text-xs w-32 sm:w-40 focus:outline-hidden focus:border-[#1550aa]"
            />
            <datalist id="subject-options">
              {STANDARD_SUBJECTS.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedContext(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              showAdvancedContext ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-transparent text-slate-500 border-dashed border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Settings2 size={11} />
            <span>{showAdvancedContext ? 'Sembunyikan Rincian' : '+ Rincian Kelas'}</span>
          </button>
        </div>

        <span className="hidden xl:inline text-[11px] text-slate-400">
          Konteks otomatis disematkan ke instruksi agen
        </span>
      </div>

      {/* Advanced Context Drawer */}
      <AnimatePresence>
        {showAdvancedContext && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 border-b border-slate-200 px-4 lg:px-8 py-2 flex flex-wrap items-center gap-4 text-xs z-10 shrink-0 overflow-hidden"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Kelas:</span>
              <input
                type="text"
                value={teacherContext.classSpecific}
                onChange={e => updateTeacherContext({ classSpecific: e.target.value })}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold w-28"
                placeholder="misal: X-1"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Jumlah Siswa:</span>
              <input
                type="number"
                min={1}
                max={60}
                value={teacherContext.studentCount}
                onChange={e => updateTeacherContext({ studentCount: Number(e.target.value) || 25 })}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold w-16"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Semester:</span>
              <select
                value={teacherContext.semester}
                onChange={e => updateTeacherContext({ semester: e.target.value })}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold"
              >
                <option value="Semester 1 (Ganjil)">Semester 1 (Ganjil)</option>
                <option value="Semester 2 (Genap)">Semester 2 (Genap)</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zona 4: Main Content Area (Scrollable flex-1 container - NEVER OVERLAPPED BY DOCK) */}
      <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-12 lg:py-10 space-y-8 custom-scrollbar z-10">
        
        {/* Minimalist Horizontal Step Indicator (IKEA Assembly Manual Clarity) */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs"
            >
              {/* Stepper Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1550aa] animate-ping" />
                  <span className="font-bold text-sm text-[#0a1a3a]">Agen Sedang Menyusun Dokumen</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {elapsedSecs.toFixed(1)}s
                  </span>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>

              {/* Minimalist Horizontal Line + Dot Stepper */}
              <div className="relative flex items-center justify-between">
                {/* Background Connecting Line */}
                <div className="absolute left-4 right-4 top-3 h-0.5 bg-slate-100 -z-0" />
                
                {/* Active Progress Bar Segment */}
                <div 
                  className="absolute left-4 top-3 h-0.5 bg-[#1550aa] transition-all duration-300 -z-0"
                  style={{ width: `${Math.max(0, (currentStep - 1) / 3 * 100)}%` }}
                />

                {[
                  { num: 1, label: 'Analisis' },
                  { num: 2, label: 'Struktur' },
                  { num: 3, label: 'Sintesis' },
                  { num: 4, label: 'Kompilasi' }
                ].map(s => {
                  const isDone = currentStep > s.num;
                  const isCurrent = currentStep === s.num;
                  return (
                    <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone 
                          ? 'bg-[#1550aa] text-white' 
                          : isCurrent 
                            ? 'bg-white border-2 border-[#1550aa] text-[#1550aa] ring-4 ring-[#1550aa]/10' 
                            : 'bg-white border border-slate-200 text-slate-400'
                      }`}>
                        {isDone ? <Check size={13} strokeWidth={2.5} /> : s.num}
                      </div>
                      <span className={`text-[11px] font-medium ${
                        isCurrent ? 'font-bold text-[#1550aa]' : isDone ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Neutral Pedagogical Tip */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
                <Lightbulb size={14} className="text-slate-500 shrink-0 mt-0.5" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={insightIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="leading-relaxed"
                  >
                    <strong>Tips:</strong> {PEDAGOGICAL_INSIGHTS[insightIndex].text}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template Cards Grid (Consistent Monochrome Aesthetic) */}
        {!resultContent && !isRunning && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-[#0a1a3a] tracking-tight">
                Pilih Jenis Dokumen Pembelajaran
              </h2>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Pilih format baku di bawah atau tulis instruksi langsung pada bilah perintah.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CAPABILITY_PREVIEWS.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = mode === item.mode;
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-xl border bg-white transition-all flex flex-col justify-between text-left ${
                      isSelected 
                        ? 'border-[#1550aa] ring-1 ring-[#1550aa]' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700">
                          <Icon size={18} strokeWidth={1.8} />
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#0a1a3a] mb-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSampleModalMode(item.mode)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        title="Lihat contoh format dokumen jadi sebelum generate"
                      >
                        Contoh Hasil
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
                        className="text-xs font-bold text-[#1550aa] hover:text-[#0a1a3a] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Gunakan</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Deliverable Viewer (When Results are ready) */}
        {resultContent && !isRunning && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 space-y-6 shadow-xs">
              {/* Deliverable Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {resultType.toUpperCase()} SELESAI
                  </span>
                  <h2 className="text-lg font-bold text-[#0a1a3a] tracking-tight">{resultTitle}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1550aa] hover:bg-[#0a1a3a] text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Unduh {resultType === 'doc' ? '.DOCX' : resultType === 'sheet' ? '.CSV' : resultType === 'slide' ? '.HTML' : '.MD'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePinToSmartboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Pin size={13} />
                    <span>Tempel ke Papan</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copied ? 'Disalin' : 'Salin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultContent('')}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Tutup Hasil"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* View according to result type */}
              {resultType === 'slide' && parsedSlides.length > 0 ? (
                <div className="space-y-3">
                  <div className="aspect-[16/9] w-full max-w-2xl mx-auto p-8 rounded-xl bg-slate-900 text-white flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>Slide {currentSlideIndex + 1} dari {parsedSlides.length}</span>
                      <span>Trido Presentation Deck</span>
                    </div>

                    <div className="my-auto space-y-3">
                      <h3 className="text-xl font-bold text-white">
                        {parsedSlides[currentSlideIndex]?.title}
                      </h3>
                      <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {parsedSlides[currentSlideIndex]?.content}
                      </div>
                    </div>

                    {parsedSlides[currentSlideIndex]?.notes && (
                      <div className="p-2.5 bg-white/10 rounded-lg text-xs text-slate-300 border border-white/10">
                        <strong>Catatan Guru:</strong> {parsedSlides[currentSlideIndex]?.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/15 mt-2">
                      <button
                        type="button"
                        disabled={currentSlideIndex === 0}
                        onClick={() => setCurrentSlideIndex(i => Math.max(0, i - 1))}
                        className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium disabled:opacity-30 cursor-pointer"
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        disabled={currentSlideIndex === parsedSlides.length - 1}
                        onClick={() => setCurrentSlideIndex(i => Math.min(parsedSlides.length - 1, i + 1))}
                        className="px-3 py-1 rounded bg-[#1550aa] hover:bg-blue-600 text-white text-xs font-medium disabled:opacity-30 cursor-pointer"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                </div>
              ) : resultType === 'sheet' && parsedTableRows.length > 1 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[480px] custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <tr>
                        {parsedTableRows[0].map((head, i) => (
                          <th key={i} className="p-2.5 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedTableRows.slice(1).map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 border-r border-slate-100 last:border-r-0 text-slate-700 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : resultType === 'doc' ? (
                <div className="space-y-4">
                  {/* View Mode Switcher Toolbar */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('paper')}
                        className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                          previewTab === 'paper' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Halaman Dokumen
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('source')}
                        className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                          previewTab === 'source' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Sumber Markdown
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium cursor-pointer"
                      >
                        Cetak / PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          exportToMarkdown(resultTitle || 'dokumen', resultContent);
                          toast.success('Mengunduh .MD');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium cursor-pointer"
                      >
                        Unduh .MD
                      </button>
                    </div>
                  </div>

                  {/* Rendered A4 Sheet vs Raw Markdown */}
                  {previewTab === 'paper' ? (
                    <div className="max-w-3xl mx-auto bg-white rounded-lg border border-slate-200 p-8 lg:p-12 min-h-[500px] shadow-xs">
                      {/* Document Formal Header Stamp */}
                      <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between text-xs text-slate-500">
                        <div>
                          <div className="font-bold text-slate-800 uppercase tracking-wide">
                            TRIDO AGENTIKA · PENDIDIKAN INKLUSIF
                          </div>
                          <div>{teacherContext.curriculum} · {teacherContext.gradeLevel} ({teacherContext.classSpecific})</div>
                        </div>
                        <div className="font-mono text-slate-400">
                          {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>

                      {/* Markdown Rendered Content */}
                      <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-slate-100 text-xs sm:text-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {resultContent}
                        </ReactMarkdown>
                      </div>

                      <div className="mt-8 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Disusun dengan Trido Agentika</span>
                        <span>Hak Cipta © 2026 Ardellio Satria Anindito</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-[500px] whitespace-pre-wrap leading-relaxed custom-scrollbar">
                      {resultContent}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono overflow-x-auto max-h-[480px] whitespace-pre-wrap custom-scrollbar">
                  {resultContent}
                </div>
              )}

              {/* Pedagogy Disclaimer */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck size={14} className="text-slate-400 shrink-0" />
                <span>
                  <strong>Verifikasi:</strong> Hasil agen AI disesuaikan dengan Capaian Pembelajaran {teacherContext.curriculum}. Harap tinjau kembali sebelum diterapkan di kelas.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zona 5: Command Bar / Dock (In-flow flex sibling — ZERO OVERLAP) */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-4 py-3 lg:px-8 z-20">
        <div className="max-w-4xl mx-auto space-y-2">
          
          {/* Top Row: Segmented Control for Mode & Helper Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
              {[
                { id: 'doc' as AgentikaMode, label: 'Modul Ajar', icon: FileText },
                { id: 'sheet' as AgentikaMode, label: 'Buku Nilai', icon: Table },
                { id: 'slide' as AgentikaMode, label: 'Presentasi', icon: Presentation },
                { id: 'diagram' as AgentikaMode, label: 'Peta Konsep', icon: Network },
              ].map(t => {
                const Icon = t.icon;
                const isActive = mode === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMode(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-white text-slate-900 shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={12} strokeWidth={1.8} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputMode(m => m === 'structured' ? 'free' : 'structured')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  inputMode === 'structured' ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-transparent text-slate-500 border-dashed border-slate-300 hover:bg-slate-50'
                }`}
              >
                {inputMode === 'structured' ? 'Mode Bebas' : '+ Isian Terstruktur'}
              </button>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {getModelLabel()}
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
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 overflow-hidden text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Topik Materi:</label>
                    <input
                      type="text"
                      value={structuredTopic}
                      onChange={e => setStructuredTopic(e.target.value)}
                      placeholder="contoh: Hukum Newton"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-hidden focus:border-[#1550aa]"
                    />
                  </div>

                  {mode === 'doc' && (
                    <>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Model Pembelajaran:</label>
                        <select
                          value={structuredModel}
                          onChange={e => setStructuredModel(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-hidden"
                        >
                          <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                          <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                          <option value="Discovery Learning">Discovery Learning</option>
                          <option value="Inquiry Terbimbing">Inquiry Terbimbing</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Alokasi Waktu:</label>
                        <input
                          type="text"
                          value={structuredDuration}
                          onChange={e => setStructuredDuration(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-hidden"
                        />
                      </div>
                    </>
                  )}

                  {mode === 'sheet' && (
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">KKM/KKTP:</label>
                      <input
                        type="number"
                        value={structuredKkm}
                        onChange={e => setStructuredKkm(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={applyStructuredPrompt}
                      className="w-full py-1 px-3 rounded bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Terapkan Isian ↵
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea Input Form */}
          <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-1 focus-within:ring-[#1550aa] focus-within:bg-white transition-all">
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
              placeholder={`Contoh: Modul Ajar ${teacherContext.subject} materi ${structuredTopic}, 2 pertemuan, model Problem Based Learning...`}
              className="flex-1 bg-transparent border-none outline-hidden resize-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 px-2 py-1 custom-scrollbar font-medium"
            />

            <button
              type="button"
              disabled={isRunning || !promptText.trim()}
              onClick={handleRunAgent}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1550aa] hover:bg-[#0a1a3a] text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
            >
              <span>{isRunning ? 'Menyusun...' : 'Jalankan Agen'}</span>
              <CornerDownLeft size={12} className="opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* Sample Result Preview Modal */}
      <AnimatePresence>
        {sampleModalMode && (
          <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#0a1a3a]">
                    {SAMPLE_PREVIEWS[sampleModalMode].title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {SAMPLE_PREVIEWS[sampleModalMode].subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSampleModalMode(null)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 custom-scrollbar text-xs">
                <div className="bg-white rounded border border-slate-200 p-4 prose prose-slate max-w-none text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {SAMPLE_PREVIEWS[sampleModalMode].content}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Dapat disesuaikan dan diunduh (.DOCX / .CSV).
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode(sampleModalMode);
                    const tmpl = CAPABILITY_PREVIEWS.find(c => c.mode === sampleModalMode);
                    if (tmpl) setPromptText(tmpl.prompt);
                    setSampleModalMode(null);
                  }}
                  className="px-3 py-1.5 rounded bg-[#1550aa] hover:bg-[#0a1a3a] text-white font-semibold text-xs transition-colors cursor-pointer"
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
          <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-xs flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white w-full max-w-sm h-full shadow-xl border-l border-slate-200 flex flex-col font-sans"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <History size={15} className="text-slate-600" />
                  <h3 className="font-bold text-sm text-[#0a1a3a]">Riwayat Dokumen Sesi</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {historyItems.length === 0 ? (
                  <div className="text-center py-16 space-y-1.5">
                    <BookOpen size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Belum ada riwayat dokumen</p>
                    <p className="text-[11px] text-slate-400">Dokumen yang selesai disusun akan tersimpan di sini.</p>
                  </div>
                ) : (
                  historyItems.map(item => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {item.mode.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setResultTitle(item.title);
                            setResultContent(item.content);
                            setResultType(item.mode);
                            setIsHistoryDrawerOpen(false);
                            toast.info(`Memuat "${item.title}"`);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
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
