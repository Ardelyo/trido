import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, Sparkles, FileText, Table, Presentation, Network,
  Download, ArrowRight, CornerDownLeft, X, Copy, Check,
  Pin, ChevronDown, ChevronUp,
  Cpu, Lightbulb, CheckCircle2, Eye, Code, Printer,
  History, ShieldCheck, SlidersHorizontal, BookOpen,
  Search, Settings2, Mic, MicOff, Volume2, VolumeX, Paperclip,
  UploadCloud, FileSpreadsheet, FileArchive, HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useStore } from '../store';
import { useTranslation } from '../utils/translations';
import { toast } from '../utils/toast';
import { exportToDocx, exportToSpreadsheet, exportToSlideDeck, exportToMarkdown } from '../utils/agentikaExporter';
import { parseDocumentFile } from '../utils/documentParser';
import { AttachedDocument } from '../types';

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
    text: 'Spreadsheet yang dihasilkan Agentika otomatis menyertakan formula Excel standar (=AVERAGE, =IF, =RANK) untuk kalkulasi nilai.'
  },
  {
    tag: 'Diferensiasi Pembelajaran',
    text: 'Modul ajar yang efektif memfasilitasi 3 gaya belajar: visual (bagan), auditori (diskusi), dan kinestetik (proyek praktis).'
  },
  {
    tag: 'Privasi & Offline-First',
    text: 'Saat menggunakan Mode Privat Offline (Ollama/Gemma), seluruh data nilai dan identitas siswa diproses 100% lokal di perangkat.'
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
    subtitle: 'Format Spreadsheet Interaktif dengan Formula Live',
    content: `No,NISN,Nama Siswa,Tugas 1,Tugas 2,Nilai UH,Nilai Akhir,Status,Tindak Lanjut
1,0081234561,Aditya Pratama,85,90,88,=AVERAGE(D2:F2),=IF(G2>=75,"Tuntas","Remedial"),Pengayaan Materi Bab II
2,0081234562,Aisyah Nuraini,75,80,78,=AVERAGE(D3:F3),=IF(G3>=75,"Tuntas","Remedial"),Pengayaan Materi Bab II
3,0081234563,Bima Wicaksono,60,65,62,=AVERAGE(D4:F4),=IF(G4>=75,"Tuntas","Remedial"),Bimbingan Khusus Rumus Gaya
4,0081234564,Cantika Kirana,90,95,92,=AVERAGE(D5:F5),=IF(G5>=75,"Tuntas","Remedial"),Tutor Sebaya Kelompok A
5,0081234565,Daffa Ramadhan,70,72,71,=AVERAGE(D6:F6),=IF(G6>=75,"Tuntas","Remedial"),Penugasan Ulang LKPD 1
6,0081234566,Eka Prasetya,82,85,84,=AVERAGE(D7:F7),=IF(G7>=75,"Tuntas","Remedial"),Pengayaan Mandiri
7,0081234567,Fadhil Akbar,65,68,66,=AVERAGE(D8:F8),=IF(G8>=75,"Tuntas","Remedial"),Remedial Ulangan Harian
8,0081234568,Gita Saraswati,88,92,90,=AVERAGE(D9:F9),=IF(G9>=75,"Tuntas","Remedial"),Pengayaan Materi Bab II
---,---,Rata-rata Kelas,=AVERAGE(D2:D9),=AVERAGE(E2:E9),=AVERAGE(F2:F9),=AVERAGE(G2:G9),75% Lulus,-`
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
    badge: 'XLSX / CSV Formula',
    title: 'Buku Nilai & Analisis',
    desc: 'Tabel evaluasi siswa lengkap dengan formula live =AVERAGE, =IF untuk KKM 75, ranking, dan tindak lanjut remedial.',
    prompt: 'Buatkan tabel rekapitulasi nilai Ulangan Harian Biologi untuk 25 siswa kelas XI IPA 2. Kolom terdiri dari: No, NISN, Nama Siswa, Tugas 1, Tugas 2, Nilai UH, Nilai Akhir (rumus =AVERAGE(D2:F2)), Status (=IF(G2>=75,"Tuntas","Remedial")), dan Rekomendasi Tindak Lanjut. Sertakan baris Rata-rata Kelas dan persentase kelulusan.'
  },
  {
    mode: 'slide' as AgentikaMode,
    icon: Presentation,
    badge: 'PPTX / Slide Deck',
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

  // 🎙️ VOICE STATE
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // 📎 FILE ATTACHMENT DROPZONE STATE
  const [uploadedFiles, setUploadedFiles] = useState<AttachedDocument[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input form mode: 'structured' vs 'free'
  const [inputMode, setInputMode] = useState<'structured' | 'free'>('free');
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
  const [selectedCellCoord, setSelectedCellCoord] = useState<{ row: number; col: number; ref: string } | null>(null);
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

  const getModelLabel = () => {
    switch (aiPreference) {
      case 'gemini': return 'Mode Cepat (Gemini)';
      case 'vertex': return 'Mode Terpadu (Vertex)';
      case 'ollama': return 'Mode Privat Offline (Lokal)';
      default: return 'Otomatis (Rekomendasi)';
    }
  };

  // 🎙️ VOICE: Initialize and toggle speech recognition
  const toggleVoiceRecording = () => {
    if (isVoiceListening) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
      setIsVoiceListening(false);
      toast.info('Perekaman suara dihentikan.');
      return;
    }

    const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SpeechRecognition) {
      toast.error('Browser ini belum mendukung Web Speech Recognition. Gunakan Chrome atau Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'en' ? 'en-US' : 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsVoiceListening(true);
        toast.success('🎙️ Mendengarkan suara... Silakan ucapkan instruksi Anda!');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setPromptText(prev => (prev ? prev + ' ' + transcript : transcript));
        }
      };

      recognition.onerror = (e: any) => {
        setIsVoiceListening(false);
        if (e.error !== 'no-speech') {
          toast.error(`Kesalahan suara: ${e.error}`);
        }
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err: any) {
      toast.error('Gagal memulai perekaman suara: ' + err.message);
      setIsVoiceListening(false);
    }
  };

  // 🎙️ VOICE: Text-to-Speech playback for generated documents
  const toggleTtsPlayback = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Browser tidak mendukung pembacaan suara (Text-to-Speech).');
      return;
    }

    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
      toast.info('Pembacaan suara dihentikan.');
      return;
    }

    if (!resultContent) return;

    // Clean markdown symbols for natural reading
    const cleanSpeechText = resultContent
      .replace(/[#*`_~[\]()]/g, ' ')
      .replace(/\|/g, ', ')
      .replace(/---\s*SLIDE\s*START\s*---/gi, 'Slide berikutnya. ')
      .slice(0, 3000);

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = language === 'en' ? 'en-US' : 'id-ID';
    utterance.rate = 1.0;

    utterance.onstart = () => setIsTtsPlaying(true);
    utterance.onend = () => setIsTtsPlaying(false);
    utterance.onerror = () => setIsTtsPlaying(false);

    window.speechSynthesis.speak(utterance);
    toast.success('🔊 Membacakan dokumen...');
  };

  // 📎 FILE: Handle file uploads (PDF, DOCX, XLSX, Images, Audio)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        toast.info(`Membaca berkas ${file.name}...`);
        const parsed = await parseDocumentFile(file);
        setUploadedFiles(prev => [...prev, parsed]);
        toast.success(`Berkas ${file.name} berhasil disematkan sebagai konteks!`);
      } catch (err: any) {
        toast.error(`Gagal membaca ${file.name}: ${err.message || 'Format tidak didukung'}`);
      }
    }
  };

  const removeUploadedFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Synchronize structured fields into prompt text
  const applyStructuredPrompt = () => {
    if (mode === 'doc') {
      setPromptText(`Tolong susun Modul Ajar ${teacherContext.curriculum} untuk mata pelajaran ${teacherContext.subject} (${teacherContext.classSpecific}, ${teacherContext.gradeLevel}). Materi: "${structuredTopic}". Alokasi waktu: ${structuredDuration}. Model pembelajaran: ${structuredModel}. Lengkap dengan identitas modul, Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), langkah kegiatan pembelajaran, asesmen formatif, LKPD siswa, dan rubrik penilaian.`);
    } else if (mode === 'sheet') {
      setPromptText(`Buatkan tabel rekapitulasi nilai evaluasi ${teacherContext.subject} untuk ${teacherContext.studentCount} siswa ${teacherContext.classSpecific}. Materi: "${structuredTopic}". KKM/KKTP: ${structuredKkm}. Kolom: No, NISN, Nama Siswa, Tugas 1, Tugas 2, Nilai UH, Nilai Akhir (=AVERAGE(D2:F2)), Status (=IF(G2>=75,"Tuntas","Remedial")), Tindak Lanjut. Sertakan baris rata-rata kelas, nilai tertinggi, dan persentase kelulusan.`);
    } else if (mode === 'slide') {
      setPromptText(`Rancanglah dek presentasi materi kelas 8 slide tentang "${structuredTopic}" untuk mata pelajaran ${teacherContext.subject} (${teacherContext.classSpecific}). Setiap slide harus memuat: Judul Slide, Poin Inti (bullet points), Pertanyaan Interaktif Siswa, dan Catatan Guru (Speaker Notes).`);
    } else {
      setPromptText(`Buatkan peta konsep terstruktur tentang "${structuredTopic}" untuk mata pelajaran ${teacherContext.subject} (${teacherContext.classSpecific}) dengan cabang hierarki konsep utama, sub-konsep, dan contoh aplikasi untuk ditampilkan di papan tulis.`);
    }
    setInputMode('free');
    toast.success('Formulir terstruktur berhasil diterapkan ke prompt!');
  };

  // Stopwatch timer during generation
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

  // Rotate educational insights every 3.5 seconds
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
    setSelectedCellCoord(null);
    abortControllerRef.current = new AbortController();

    try {
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 600));

      setCurrentStep(2);

      // Ingest uploaded files into prompt context
      let filesContext = '';
      if (uploadedFiles.length > 0) {
        filesContext = '\n\n[BERKAS REFERENSI TERLAMPIR]:\n' + uploadedFiles.map(f => `--- ${f.name} (${f.category.toUpperCase()}) ---\n${f.text.slice(0, 30000)}`).join('\n\n');
      }

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
Susun tabel dataset nilai sekolah yang rapi, realistis, dan MENGANDUNG FORMULA EXCEL LIVE.
Konteks: ${teacherContext.subject} (${teacherContext.classSpecific}, ${teacherContext.studentCount} Siswa).
Format keluaran HANYA dalam format tabel CSV (dipisahkan tanda koma).
PENTING: Gunakan formula spreadsheet asli di kolom yang relevan:
- Kolom Nilai Akhir: masukkan formula =AVERAGE(D2:F2)
- Kolom Status: masukkan formula =IF(G2>=75,"Tuntas","Remedial")
- Baris Rata-rata: masukkan =AVERAGE(...)
Pastikan header kolom jelas dan nama siswa realistis Indonesia.`;
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

      const fullPrompt = `${formatDirective}${filesContext}\n\n[PERMINTAAN PENDIDIK]:\n${finalPrompt}`;

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
        throw new Error('Model AI tidak menghasilkan teks keluaran. Coba ganti mode AI atau perjelas instruksi.');
      }

      setCurrentStep(4);
      await new Promise(r => setTimeout(r, 400));

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

      // Parse spreadsheet CSV
      if (mode === 'sheet') {
        const rows = rawText
          .split('\n')
          .filter((r: string) => r.trim().length > 0 && !r.startsWith('```'))
          .map((r: string) => r.includes(',') ? r.split(',').map((c: string) => c.trim().replace(/^"|"$/g, '')) : r.split('|').map((c: string) => c.trim()).filter((c: string) => c.length > 0));
        if (rows.length > 1) {
          setParsedTableRows(rows);
          setSelectedCellCoord({ row: 1, col: 0, ref: 'A2' });
        }
      }

      // Parse slides
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

  // Pin to canvas with actual DomOverlay placement
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

  // Helper to convert column index (0, 1, 2) to Excel letter (A, B, C...)
  const getColLetter = (index: number) => String.fromCharCode(65 + index);

  // Active cell content for spreadsheet formula bar
  const activeCellValue = useMemo(() => {
    if (!selectedCellCoord || parsedTableRows.length === 0) return '';
    const { row, col } = selectedCellCoord;
    return parsedTableRows[row]?.[col] || '';
  }, [selectedCellCoord, parsedTableRows]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#E8E6E1] text-[#111827] overflow-hidden select-none font-sans">
      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Zona 2: Sub-Header Agentika Studio (Brand Blue #1D4ED8 & Warm Amber #F5C518 accents) */}
      <header className="relative h-14 px-4 lg:px-8 flex items-center justify-between border-b border-slate-300/80 bg-white/95 backdrop-blur-md shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#1D4ED8] text-white shadow-xs">
            <Bot size={18} strokeWidth={2.2} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-[#111827] tracking-tight">Agentika Studio</h1>
            <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
              VOICE FIRST · AI AGENT
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Consolidated Single Compact Dropdown for Mode */}
          <div className="relative flex items-center">
            <select
              value={aiPreference}
              onChange={e => setAiPreference(e.target.value as any)}
              className="appearance-none pl-3 pr-7 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-full text-xs font-bold text-slate-800 cursor-pointer focus:outline-hidden focus:border-[#1D4ED8] transition-colors shadow-2xs"
              title="Pilih mode pemrosesan agen AI"
            >
              <option value="auto">Mode: Otomatis (Rekomendasi)</option>
              <option value="gemini">Mode: Cepat (Gemini)</option>
              <option value="vertex">Mode: Terpadu (Vertex)</option>
              <option value="ollama">Mode: Privat Offline (Lokal)</option>
            </select>
            <ChevronDown size={13} className="absolute right-2 text-slate-500 pointer-events-none" />
          </div>

          {/* History Drawer Trigger with Badge Counter */}
          <button
            type="button"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-full text-xs font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
            title={historyItems.length > 0 ? `Lihat ${historyItems.length} riwayat dokumen` : 'Belum ada riwayat dokumen'}
          >
            <History size={13} strokeWidth={2} className="text-slate-600" />
            <span>Riwayat</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-[#F5C518] text-[#111827]">
              {historyItems.length}
            </span>
          </button>

          {/* Return to Board Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-full transition-colors cursor-pointer active:scale-95"
          >
            <X size={14} />
            <span className="hidden sm:inline">Papan Tulis</span>
          </button>
        </div>
      </header>

      {/* Zona 3: Teacher Context Bar (Warm Cream Background #E8E6E1) */}
      <div className="bg-[#E8E6E1] border-b border-slate-300/80 px-4 lg:px-8 py-2 z-10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 font-medium">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-slate-700 flex items-center gap-1">
            <SlidersHorizontal size={13} strokeWidth={2.2} className="text-[#1D4ED8]" /> Konteks:
          </span>

          <div className="relative flex items-center">
            <select
              value={teacherContext.curriculum}
              onChange={e => updateTeacherContext({ curriculum: e.target.value })}
              className="appearance-none pl-2.5 pr-6 py-0.5 bg-white border border-slate-300 rounded-full font-bold text-slate-800 text-xs cursor-pointer focus:outline-hidden"
            >
              <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
              <option value="Kurikulum 2013 (K-13)">Kurikulum 2013 (K-13)</option>
              <option value="Kurikulum Internasional">Kurikulum Internasional</option>
            </select>
            <ChevronDown size={11} className="absolute right-1.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <select
              value={teacherContext.gradeLevel}
              onChange={e => updateTeacherContext({ gradeLevel: e.target.value })}
              className="appearance-none pl-2.5 pr-6 py-0.5 bg-white border border-slate-300 rounded-full font-bold text-slate-800 text-xs cursor-pointer focus:outline-hidden"
            >
              <option value="SMA/SMK (Fase E)">SMA/SMK (Fase E/F)</option>
              <option value="SMP (Fase D)">SMP (Fase D)</option>
              <option value="SD (Fase A/B/C)">SD (Fase A/B/C)</option>
              <option value="PAUD">PAUD</option>
            </select>
            <ChevronDown size={11} className="absolute right-1.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <Search size={11} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              list="subject-options"
              value={teacherContext.subject}
              onChange={e => updateTeacherContext({ subject: e.target.value })}
              placeholder="Mata Pelajaran..."
              className="pl-7 pr-2.5 py-0.5 bg-white border border-slate-300 rounded-full font-bold text-slate-800 text-xs w-32 sm:w-40 focus:outline-hidden focus:border-[#1D4ED8]"
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
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              showAdvancedContext ? 'bg-white text-[#1D4ED8] border-[#1D4ED8]' : 'bg-white/80 text-slate-700 border-slate-300 hover:bg-white'
            }`}
          >
            <Settings2 size={11} />
            <span>{showAdvancedContext ? 'Tutup Rincian' : '+ Rincian Kelas'}</span>
          </button>
        </div>

        <span className="hidden xl:inline text-[11px] text-slate-600 font-semibold">
          🎙️ "Teach out loud. The board listens."
        </span>
      </div>

      {/* Advanced Context Drawer */}
      <AnimatePresence>
        {showAdvancedContext && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#E4E1DB] border-b border-slate-300 px-4 lg:px-8 py-2.5 flex flex-wrap items-center gap-4 text-xs z-10 shrink-0 overflow-hidden font-medium"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 font-bold">Kelas Spesifik:</span>
              <input
                type="text"
                value={teacherContext.classSpecific}
                onChange={e => updateTeacherContext({ classSpecific: e.target.value })}
                className="px-2.5 py-0.5 bg-white border border-slate-300 rounded-md font-bold text-xs w-28"
                placeholder="misal: X-1"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 font-bold">Jumlah Siswa:</span>
              <input
                type="number"
                min={1}
                max={60}
                value={teacherContext.studentCount}
                onChange={e => updateTeacherContext({ studentCount: Number(e.target.value) || 25 })}
                className="px-2.5 py-0.5 bg-white border border-slate-300 rounded-md font-bold text-xs w-16"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 font-bold">Semester:</span>
              <select
                value={teacherContext.semester}
                onChange={e => updateTeacherContext({ semester: e.target.value })}
                className="px-2.5 py-0.5 bg-white border border-slate-300 rounded-md font-bold text-xs cursor-pointer"
              >
                <option value="Semester 1 (Ganjil)">Semester 1 (Ganjil)</option>
                <option value="Semester 2 (Genap)">Semester 2 (Genap)</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zona 4: Main Content Area (Scrollable flex-1 container - NEVER OVERLAPPED BY DOCK) */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingFile(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        className="flex-1 overflow-y-auto px-4 py-8 lg:px-12 lg:py-10 space-y-8 custom-scrollbar z-10 relative"
      >
        {/* Drag-and-drop Visual Overlay */}
        <AnimatePresence>
          {isDraggingFile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-4 z-40 bg-[#1D4ED8]/10 border-3 border-dashed border-[#1D4ED8] rounded-2xl flex flex-col items-center justify-center gap-3 backdrop-blur-xs pointer-events-none"
            >
              <UploadCloud size={48} className="text-[#1D4ED8] animate-bounce" />
              <div className="text-base font-extrabold text-[#111827]">Lepaskan berkas di sini untuk disematkan</div>
              <div className="text-xs text-slate-600 font-medium">Mendukung PDF, DOCX, XLSX, Gambar, dan Audio Kelas</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimalist Horizontal Step Indicator (IKEA Assembly Manual Clarity) */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-300 p-6 space-y-6 shadow-sm"
            >
              {/* Stepper Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8] animate-ping" />
                  <span className="font-extrabold text-sm text-[#111827]">Agen Sedang Menyusun Berkas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                    ⏱️ {elapsedSecs.toFixed(1)}s
                  </span>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>

              {/* Minimalist Horizontal Line + Dot Stepper */}
              <div className="relative flex items-center justify-between">
                <div className="absolute left-4 right-4 top-3 h-0.5 bg-slate-200 -z-0" />
                <div 
                  className="absolute left-4 top-3 h-0.5 bg-[#1D4ED8] transition-all duration-300 -z-0"
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
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isDone 
                          ? 'bg-[#1D4ED8] text-white' 
                          : isCurrent 
                            ? 'bg-white border-2 border-[#1D4ED8] text-[#1D4ED8] ring-4 ring-[#1D4ED8]/15' 
                            : 'bg-white border border-slate-300 text-slate-400'
                      }`}>
                        {isDone ? <Check size={14} strokeWidth={3} /> : s.num}
                      </div>
                      <span className={`text-[11px] ${
                        isCurrent ? 'font-black text-[#1D4ED8]' : isDone ? 'font-bold text-slate-800' : 'text-slate-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Pedagogical Tip */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
                <Lightbulb size={16} className="text-[#F5C518] shrink-0 mt-0.5" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={insightIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="leading-relaxed font-medium"
                  >
                    <strong>Wawasan Guru:</strong> {PEDAGOGICAL_INSIGHTS[insightIndex].text}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template Cards Grid (Consistent White Cards on Warm Cream Canvas) */}
        {!resultContent && !isRunning && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-[#111827] tracking-tight">
                Pilih Format Pembelajaran
              </h2>
              <p className="text-xs text-slate-600 font-medium max-w-lg mx-auto">
                Pilih format ajar di bawah atau berikan instruksi bebas menggunakan suara atau teks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CAPABILITY_PREVIEWS.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = mode === item.mode;
                return (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl border bg-white transition-all flex flex-col justify-between text-left ${
                      isSelected 
                        ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20 shadow-md' 
                        : 'border-slate-300 hover:border-slate-400 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#1D4ED8]">
                          <Icon size={20} strokeWidth={2} />
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-[#111827] mb-1.5">{item.title}</h3>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">{item.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSampleModalMode(item.mode)}
                        className="text-xs font-bold text-slate-600 hover:text-[#1D4ED8] transition-colors cursor-pointer"
                        title="Lihat contoh format dokumen jadi sebelum generate"
                      >
                        👁️ Contoh Hasil
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
                        className="text-xs font-bold text-[#1D4ED8] hover:text-[#0a1a3a] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Gunakan</span>
                        <ArrowRight size={13} />
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
            <div className="bg-white rounded-2xl border border-slate-300 p-6 lg:p-8 space-y-6 shadow-sm">
              {/* Deliverable Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#1D4ED8] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {resultType.toUpperCase()} SELESAI
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-[#111827] tracking-tight">{resultTitle}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* 🔊 Text-To-Speech Playback Button */}
                  <button
                    type="button"
                    onClick={toggleTtsPlayback}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                      isTtsPlaying ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                    title="Dengarkan pembacaan dokumen ini dengan suara"
                  >
                    {isTtsPlaying ? <VolumeX size={14} className="text-rose-600" /> : <Volume2 size={14} className="text-[#1D4ED8]" />}
                    <span>{isTtsPlaying ? 'Berhenti' : 'Bacakan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1D4ED8] hover:bg-[#0a1a3a] text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download size={13} className="text-[#F5C518]" />
                    <span>Unduh {resultType === 'doc' ? '.DOCX' : resultType === 'sheet' ? '.XLSX/.CSV' : resultType === 'slide' ? '.HTML Slide' : '.MD'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePinToSmartboard}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Pin size={13} />
                    <span>Tempel ke Smartboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copied ? 'Disalin' : 'Salin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultContent('')}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Tutup Hasil"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* View according to result type */}
              {resultType === 'slide' && parsedSlides.length > 0 ? (
                <div className="space-y-3">
                  <div className="aspect-[16/9] w-full max-w-2xl mx-auto p-8 rounded-2xl bg-slate-900 text-white flex flex-col justify-between shadow-xl">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>Slide {currentSlideIndex + 1} dari {parsedSlides.length}</span>
                      <span>Trido Presentation Deck</span>
                    </div>

                    <div className="my-auto space-y-3">
                      <h3 className="text-2xl font-black text-white">
                        {parsedSlides[currentSlideIndex]?.title}
                      </h3>
                      <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                        {parsedSlides[currentSlideIndex]?.content}
                      </div>
                    </div>

                    {parsedSlides[currentSlideIndex]?.notes && (
                      <div className="p-2.5 bg-white/10 rounded-xl text-xs text-amber-200 border border-white/10">
                        <strong>Catatan Guru:</strong> {parsedSlides[currentSlideIndex]?.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/15 mt-2">
                      <button
                        type="button"
                        disabled={currentSlideIndex === 0}
                        onClick={() => setCurrentSlideIndex(i => Math.max(0, i - 1))}
                        className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        disabled={currentSlideIndex === parsedSlides.length - 1}
                        onClick={() => setCurrentSlideIndex(i => Math.min(parsedSlides.length - 1, i + 1))}
                        className="px-3 py-1 rounded-full bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                </div>
              ) : resultType === 'sheet' && parsedTableRows.length > 1 ? (
                /* 📊 TRUE INTERACTIVE SPREADSHEET VIEWER (Table 3 Formula Support) */
                <div className="space-y-3 font-sans">
                  {/* Spreadsheet Formula Bar */}
                  <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-xl border border-slate-300 text-xs font-mono">
                    <div className="px-2 py-1 bg-white rounded border border-slate-300 font-bold text-[#1D4ED8] w-12 text-center">
                      {selectedCellCoord?.ref || 'A1'}
                    </div>
                    <div className="text-slate-400 font-bold">fx</div>
                    <input
                      type="text"
                      readOnly
                      value={activeCellValue}
                      placeholder="Klik cell untuk memeriksa formula/nilai..."
                      className="flex-1 bg-white px-2.5 py-1 rounded border border-slate-300 text-slate-800 font-medium outline-hidden"
                    />
                  </div>

                  {/* Interactive Spreadsheet Table with Row/Col Index */}
                  <div className="overflow-x-auto rounded-xl border border-slate-300 max-h-[480px] custom-scrollbar bg-white shadow-2xs">
                    <table className="w-full text-xs text-left border-collapse font-sans">
                      <thead className="sticky top-0 bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300 z-10">
                        <tr>
                          <th className="w-10 p-2 text-center border-r border-slate-300 bg-slate-200/80 text-[10px] text-slate-500">#</th>
                          {parsedTableRows[0].map((head, cIdx) => (
                            <th key={cIdx} className="p-2.5 border-r border-slate-300 last:border-r-0 whitespace-nowrap">
                              <span className="text-[10px] text-slate-400 mr-1.5 font-mono">{getColLetter(cIdx)}</span>
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {parsedTableRows.slice(1).map((row, rIdx) => {
                          const isSummaryRow = row[0]?.includes('---') || row[2]?.toLowerCase().includes('rata-rata');
                          return (
                            <tr key={rIdx} className={isSummaryRow ? 'bg-amber-50/60 font-bold border-t-2 border-slate-300' : (rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60')}>
                              <td className="p-2 text-center border-r border-slate-300 bg-slate-100/70 text-[10px] text-slate-500 font-mono">
                                {rIdx + 1}
                              </td>
                              {row.map((cell, cIdx) => {
                                const isSelected = selectedCellCoord?.row === (rIdx + 1) && selectedCellCoord?.col === cIdx;
                                const isRemedial = cell.toLowerCase().includes('remedial');
                                const hasFormula = cell.startsWith('=');
                                return (
                                  <td
                                    key={cIdx}
                                    onClick={() => setSelectedCellCoord({ row: rIdx + 1, col: cIdx, ref: `${getColLetter(cIdx)}${rIdx + 2}` })}
                                    className={`p-2.5 border-r border-slate-200 last:border-r-0 whitespace-nowrap cursor-pointer transition-all ${
                                      isSelected ? 'ring-2 ring-[#1D4ED8] bg-blue-50/70 font-bold text-[#1D4ED8]' : ''
                                    } ${isRemedial ? 'text-rose-700 font-bold bg-rose-50/50' : 'text-slate-800'}`}
                                  >
                                    {hasFormula ? (
                                      <span className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 text-[11px]" title={`Formula aktif: ${cell}`}>
                                        {cell}
                                      </span>
                                    ) : (
                                      cell
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold">
                    <span>💡 Tip: Cell dengan formula (=AVERAGE, =IF) aktif dan terbawa utuh saat diekspor ke Excel (.xlsx / .csv).</span>
                    <span className="text-[#1D4ED8]">Format Standar Kemendikbud</span>
                  </div>
                </div>
              ) : resultType === 'doc' ? (
                <div className="space-y-4">
                  {/* View Mode Switcher Toolbar */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('paper')}
                        className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                          previewTab === 'paper' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Halaman Dokumen
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('source')}
                        className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                          previewTab === 'source' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Sumber Markdown
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Cetak / PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          exportToMarkdown(resultTitle || 'dokumen', resultContent);
                          toast.success('Mengunduh .MD');
                        }}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Unduh .MD
                      </button>
                    </div>
                  </div>

                  {/* Rendered A4 Sheet vs Raw Markdown */}
                  {previewTab === 'paper' ? (
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-300 p-8 lg:p-12 min-h-[500px] shadow-sm">
                      {/* Document Formal Header Stamp */}
                      <div className="border-b-2 border-[#1D4ED8] pb-3 mb-6 flex items-center justify-between text-xs text-slate-600 font-bold">
                        <div>
                          <div className="text-sm font-black text-[#1D4ED8] uppercase tracking-wide">
                            TRIDO AGENTIKA · PENDIDIKAN INKLUSIF
                          </div>
                          <div className="text-slate-500 font-medium">{teacherContext.curriculum} · {teacherContext.gradeLevel} ({teacherContext.classSpecific})</div>
                        </div>
                        <div className="font-mono text-slate-400 text-xs">
                          {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>

                      {/* Markdown Rendered Content */}
                      <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-table:border prose-table:border-slate-300 prose-th:bg-slate-100 prose-th:p-2.5 prose-td:p-2.5 prose-td:border prose-td:border-slate-200 text-xs sm:text-sm font-sans">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {resultContent}
                        </ReactMarkdown>
                      </div>

                      <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                        <span>Disusun dengan Trido Agentika</span>
                        <span>Hak Cipta © 2026 Ardellio Satria Anindito</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-[500px] whitespace-pre-wrap leading-relaxed custom-scrollbar">
                      {resultContent}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono overflow-x-auto max-h-[480px] whitespace-pre-wrap custom-scrollbar">
                  {resultContent}
                </div>
              )}

              {/* Pedagogy Disclaimer */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-slate-700 flex items-center gap-2 font-medium">
                <ShieldCheck size={16} className="text-[#1D4ED8] shrink-0" />
                <span>
                  <strong>Verifikasi Guru:</strong> Hasil agen AI disesuaikan dengan Capaian Pembelajaran {teacherContext.curriculum}. Harap tinjau kembali sebelum diterapkan di ruang kelas.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zona 5: Command Bar / Dock (In-flow flex sibling — ZERO OVERLAP) */}
      <div className="shrink-0 bg-white border-t border-slate-300 px-4 py-3 lg:px-8 z-20 shadow-md">
        <div className="max-w-4xl mx-auto space-y-2.5">
          
          {/* Top Row: Segmented Control for Mode & Helper Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
              {[
                { id: 'doc' as AgentikaMode, label: 'Modul Ajar', icon: FileText },
                { id: 'sheet' as AgentikaMode, label: 'Buku Nilai (Live Formula)', icon: Table },
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
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-white text-slate-900 shadow-2xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={13} strokeWidth={2} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputMode(m => m === 'structured' ? 'free' : 'structured')}
                className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                  inputMode === 'structured' ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {inputMode === 'structured' ? 'Mode Bebas' : '+ Isian Terstruktur'}
              </button>

              <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">
                {getModelLabel()}
              </span>
            </div>
          </div>

          {/* Attached Files Thumbnail Pills */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-blue-50/60 rounded-xl border border-blue-200 text-xs">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Paperclip size={12} className="text-[#1D4ED8]" /> Terlampir:
              </span>
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white rounded-full border border-blue-200 font-medium text-slate-700">
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button type="button" onClick={() => removeUploadedFile(idx)} className="text-slate-400 hover:text-rose-600 cursor-pointer">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Structured Input Form Fields (When Active) */}
          <AnimatePresence>
            {inputMode === 'structured' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-slate-50 border border-slate-300 rounded-2xl space-y-2.5 overflow-hidden text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Topik Materi:</label>
                    <input
                      type="text"
                      value={structuredTopic}
                      onChange={e => setStructuredTopic(e.target.value)}
                      placeholder="contoh: Hukum Newton"
                      className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-hidden focus:border-[#1D4ED8]"
                    />
                  </div>

                  {mode === 'doc' && (
                    <>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Model Pembelajaran:</label>
                        <select
                          value={structuredModel}
                          onChange={e => setStructuredModel(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-hidden"
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
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-hidden"
                        />
                      </div>
                    </>
                  )}

                  {mode === 'sheet' && (
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">KKM/KKTP:</label>
                      <input
                        type="number"
                        value={structuredKkm}
                        onChange={e => setStructuredKkm(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={applyStructuredPrompt}
                      className="w-full py-1.5 px-3 rounded-lg bg-[#1D4ED8] hover:bg-[#0a1a3a] text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Terapkan Isian ↵
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea Input Form with Signature Microphone Button */}
          <div className="relative flex items-end gap-2 bg-[#F5F4F0] border border-slate-300 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#1D4ED8]/25 focus-within:bg-white transition-all shadow-xs">
            {/* Hidden File Input for Paperclip */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.jpg,.jpeg,.png,.webm,.mp3,.m4a"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />

            {/* Paperclip Button for File Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
              title="Lampirkan berkas referensi (PDF, DOCX, XLSX, Gambar, Audio)"
            >
              <Paperclip size={18} strokeWidth={2} />
            </button>

            {/* Main Prompt Textarea */}
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
              className="flex-1 bg-transparent border-none outline-hidden resize-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 px-2 py-1 custom-scrollbar font-medium"
            />

            {/* 🎙️ SIGNATURE TRIDO VOICE MIC BUTTON (Table 5 Spec) */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer shrink-0 shadow-xs ${
                isVoiceListening 
                  ? 'bg-[#F5C518] text-[#111827] ring-4 ring-[#F5C518]/40 animate-pulse' 
                  : 'bg-[#1D4ED8] hover:bg-[#0a1a3a] text-white border-2 border-[#F5C518]'
              }`}
              title={isVoiceListening ? 'Mendengarkan... Klik untuk berhenti' : 'Bicara untuk mendiktekan instruksi (Voice-First)'}
            >
              {isVoiceListening ? <MicOff size={18} strokeWidth={2.5} /> : <Mic size={18} strokeWidth={2.2} />}
              {isVoiceListening && (
                <span className="absolute -inset-1 rounded-full border border-[#1D4ED8] animate-ping opacity-75 pointer-events-none" />
              )}
            </button>

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={isRunning || (!promptText.trim() && uploadedFiles.length === 0)}
              onClick={handleRunAgent}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#1D4ED8] hover:bg-[#0a1a3a] text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0 shadow-xs"
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
              className="bg-white rounded-2xl border border-slate-300 shadow-xl max-w-xl w-full max-h-[80vh] flex flex-col overflow-hidden font-sans"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-[#111827]">
                    {SAMPLE_PREVIEWS[sampleModalMode].title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {SAMPLE_PREVIEWS[sampleModalMode].subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSampleModalMode(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-[#E8E6E1]/30 custom-scrollbar text-xs">
                <div className="bg-white rounded-xl border border-slate-300 p-5 prose prose-slate max-w-none text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {SAMPLE_PREVIEWS[sampleModalMode].content}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between">
                <span className="text-[11px] text-slate-600 font-semibold">
                  Format dapat disesuaikan dan diunduh (.DOCX / .CSV).
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode(sampleModalMode);
                    const tmpl = CAPABILITY_PREVIEWS.find(c => c.mode === sampleModalMode);
                    if (tmpl) setPromptText(tmpl.prompt);
                    setSampleModalMode(null);
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#1D4ED8] hover:bg-[#0a1a3a] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
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
              className="bg-white w-full max-w-sm h-full shadow-2xl border-l border-slate-300 flex flex-col font-sans"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <History size={16} className="text-[#1D4ED8]" />
                  <h3 className="font-extrabold text-sm text-[#111827]">Riwayat Dokumen Sesi</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                {historyItems.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <BookOpen size={30} className="mx-auto text-slate-300" />
                    <p className="text-xs font-extrabold text-slate-700">Belum ada riwayat dokumen</p>
                    <p className="text-[11px] text-slate-500 font-medium">Dokumen yang selesai disusun akan tersimpan di sini.</p>
                  </div>
                ) : (
                  historyItems.map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-colors space-y-1.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200">
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
                          className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
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
