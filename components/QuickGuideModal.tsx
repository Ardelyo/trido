import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, HelpCircle, Sparkles, PenTool, Mic, 
  Wrench, Atom, Check, ChevronRight, Copy, Search,
  MousePointer, Square, Type, Eraser, Move, Maximize2,
  GitBranch, Play, RefreshCw, Cpu, ShieldCheck, WifiOff,
  Calculator, Timer, Dices, Trophy, ClipboardCheck, LineChart,
  Layers, ExternalLink, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { useStore } from '../store';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSamplePromptClick?: (prompt: string) => void;
}

type GuideCategory = 'all' | 'canvas' | 'ai' | 'stem' | 'voice' | 'tools';

interface GuideCardItem {
  id: string;
  category: 'canvas' | 'ai' | 'stem' | 'voice' | 'tools';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  shortcut?: string;
  badge?: string;
  details: string[];
  actionPrompt?: string;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ 
  isOpen, 
  onClose,
  onSamplePromptClick 
}) => {
  const { language } = useStore();
  const isIndo = language === 'id';

  const [activeCategory, setActiveCategory] = useState<GuideCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const guideItems: GuideCardItem[] = useMemo(() => [
    // 1. KANVAS & GAMBAR
    {
      id: 'tool-pointer',
      category: 'canvas',
      title: isIndo ? 'Pointer & Seleksi Objek' : 'Pointer & Object Selection',
      subtitle: isIndo ? 'Navigasi dan manipulasi elemen di kanvas' : 'Navigate and manipulate canvas elements',
      description: isIndo 
        ? 'Pilih satu atau beberapa objek sekaligus untuk dipindahkan, dirotasi, atau diatur ulang posisinya di papan tulis.'
        : 'Select single or multiple objects to drag, rotate, resize, or rearrange on the whiteboard.',
      icon: MousePointer,
      shortcut: 'V',
      badge: isIndo ? 'Navigasi' : 'Navigation',
      details: [
        isIndo ? 'Klik dan seret untuk membuat kotak seleksi multi-objek' : 'Click and drag to select multiple objects',
        isIndo ? 'Tekan Shift + Klik untuk menambah objek ke seleksi aktif' : 'Shift + Click to add items to active selection',
        isIndo ? 'Dukungan input sentuh penuh tanpa jeda respon' : 'Full touch-screen support with zero input lag'
      ]
    },
    {
      id: 'tool-pen',
      category: 'canvas',
      title: isIndo ? 'Pena & Garis Bebas' : 'Freehand Pen & Brush',
      subtitle: isIndo ? 'Menulis rumus, mencatat, dan membuat sketsa' : 'Handwriting formulas, notes, and quick sketches',
      description: isIndo
        ? 'Pena vektor responsif dengan deteksi tekanan dinamis. Garis tetap tajam dan mulus di layar proyektor resolusi tinggi.'
        : 'Responsive vector brush with smooth pressure detection, retaining sharpness on high-resolution displays.',
      icon: PenTool,
      shortcut: 'P',
      badge: isIndo ? 'Menggambar' : 'Drawing',
      details: [
        isIndo ? 'Pilihan ketebalan goresan dan palet warna kontras kelas' : 'Customizable stroke weight and classroom contrast palette',
        isIndo ? 'Perenderan berbasis Fabric.js dengan akselerasi hardware' : 'Hardware-accelerated Fabric.js vector rendering',
        isIndo ? 'Dukungan stylus pen layar interaktif tanpa jeda' : 'Native active stylus pen support with low latency'
      ]
    },
    {
      id: 'tool-shapes',
      category: 'canvas',
      title: isIndo ? 'Bentuk Geometri Vektor' : 'Geometric Vector Shapes',
      subtitle: isIndo ? 'Persegi, lingkaran, segitiga, dan garis lurus' : 'Rectangles, circles, triangles, and arrows',
      description: isIndo
        ? 'Bentuk geometris presisi yang tidak mengalami distorsi ketebalan garis saat ditarik atau diubah ukurannya.'
        : 'Clean geometric shapes that preserve stroke thickness without stretching or distortion during resize.',
      icon: Square,
      shortcut: 'R',
      badge: isIndo ? 'Geometri' : 'Geometry',
      details: [
        isIndo ? 'Penarikan sudut mempertahankan rasio proporsional bentuk' : 'Corner handles preserve proportional aspect ratio',
        isIndo ? 'Tepi melengkung halus mengikuti standar visual Trido' : 'Subtle corner radiuses aligned with Trido visual standard',
        isIndo ? 'Dapat digabungkan dengan garis panah penghubung' : 'Connectable with relational flow arrows'
      ]
    },
    {
      id: 'tool-text',
      category: 'canvas',
      title: isIndo ? 'Teks & Judul Materi' : 'Typography & Headers',
      subtitle: isIndo ? 'Blok tipografi sans-serif berdaya baca tinggi' : 'High-legibility sans-serif text blocks',
      description: isIndo
        ? 'Tambahkan judul bab, definisi istilah penting, atau poin ringkasan pelajaran dengan keterbacaan optimal dari baris belakang kelas.'
        : 'Add lesson headings, definitions, or bullet summaries optimized for legibility from the back of the classroom.',
      icon: Type,
      shortcut: 'T',
      badge: isIndo ? 'Tipografi' : 'Typography',
      details: [
        isIndo ? 'Klik dua kali teks di kanvas untuk mengedit isi' : 'Double click any canvas text to inline edit',
        isIndo ? 'Dukungan penyalinan dan penempelan teks langsung' : 'Native clipboard paste and formatting preservation',
        isIndo ? 'Ukuran teks adaptif terhadap level zoom kanvas' : 'Adaptive text scaling relative to whiteboard zoom'
      ]
    },
    {
      id: 'tool-eraser',
      category: 'canvas',
      title: isIndo ? 'Penghapus Selektif' : 'Object & Stroke Eraser',
      subtitle: isIndo ? 'Hapus goresan spesifik atau bersihkan area' : 'Delete specific strokes or clear whiteboard',
      description: isIndo
        ? 'Hapus goresan pena, bentuk, atau teks yang tidak lagi diperlukan secara presisi tanpa mengganggu elemen lain di sekitarnya.'
        : 'Erase specific strokes, shapes, or notes precisely without disrupting surrounding content on the board.',
      icon: Eraser,
      shortcut: 'E',
      badge: isIndo ? 'Penghapusan' : 'Cleanup',
      details: [
        isIndo ? 'Klik objek untuk menghapus elemen tunggal seketika' : 'Click any object to remove it instantly',
        isIndo ? 'Gunakan tombol Bersihkan Papan untuk reset penuh' : 'Use Clear Whiteboard action for complete reset',
        isIndo ? 'Fungsi Undo (Ctrl+Z) siap memulihkan elemen terhapus' : 'Undo (Ctrl+Z) instantly restores erased elements'
      ]
    },
    {
      id: 'tool-canvas-nav',
      category: 'canvas',
      title: isIndo ? 'Navigasi Papan & Multi-Halaman' : 'Canvas Pan, Zoom & Pages',
      subtitle: isIndo ? 'Ruang kerja tanpa batas dengan manajemen slide' : 'Infinite workspace with multi-page navigation',
      description: isIndo
        ? 'Geser kanvas tak terbatas untuk melanjutkan penjelasan materi tanpa perlu menghapus materi bab sebelumnya.'
        : 'Pan across an expansive canvas to continue explaining without wiping earlier lecture notes.',
      icon: Layers,
      badge: isIndo ? 'Ruang Kerja' : 'Workspace',
      details: [
        isIndo ? 'Gunakan tombol + di pojok kiri bawah untuk menambah lembar papan' : 'Press + at bottom-left to create new whiteboard pages',
        isIndo ? 'Pinch layar sentuh atau scroll mouse untuk memperbesar/memperkecil' : 'Pinch or mouse scroll to zoom in and out smoothly',
        isIndo ? 'Gunakan tombol Reset Zoom (100%) untuk kembali ke tampilan awal' : 'Click Reset Zoom (100%) to re-center the canvas'
      ]
    },

    // 2. AI & PETA KONSEP
    {
      id: 'ai-mindmap-generator',
      category: 'ai',
      title: isIndo ? 'Generator Mindmap Mermaid' : 'Mermaid Mindmap Engine',
      subtitle: isIndo ? 'Peta konsep terstruktur otomatis dari topik ajar' : 'Automated structured concept maps from lesson topics',
      description: isIndo
        ? 'AI merancang diagram konsep hierarkis berbasis standar Mermaid murni. Node cabang tertata rapi dan langsung dapat dipindahkan di papan.'
        : 'AI generates hierarchical concept trees rendered via pure Mermaid. Nodes are clean, readable, and draggable.',
      icon: GitBranch,
      badge: isIndo ? 'AI Smartboard' : 'AI Smartboard',
      details: [
        isIndo ? 'Dihasilkan langsung ke dalam widget kanvas interaktif' : 'Rendered directly into an interactive canvas widget',
        isIndo ? 'Menggunakan format teks diagram standar industri' : 'Powered by industry-standard declarative diagram syntax',
        isIndo ? 'Dapat diperluas tanpa batas cabang hierarki' : 'Extendable to deep multi-tier concept hierarchies'
      ],
      actionPrompt: isIndo 
        ? 'Buatkan peta konsep Fotosintesis pada tumbuhan lengkap dengan reaksi terang dan reaksi gelap'
        : 'Generate a concept map of Photosynthesis including light and dark reactions'
    },
    {
      id: 'ai-inplace-mutation',
      category: 'ai',
      title: isIndo ? 'Mutasi Diagram di Tempat (In-Place)' : 'In-Place Mindmap Mutation',
      subtitle: isIndo ? 'Perbarui diagram yang ada tanpa membuat baru' : 'Update existing diagrams without recreating them',
      description: isIndo
        ? 'Trido mempertahankan kontinuitas status diagram. Saat Anda meminta penambahan cabang, diagram yang sudah ada di kanvas akan dimutasi langsung.'
        : 'Trido maintains state continuity. Requesting new nodes mutates the existing diagram in-place rather than duplicating.',
      icon: RefreshCw,
      badge: isIndo ? 'Kontinuitas' : 'Continuity',
      details: [
        isIndo ? 'Mencegah kanvas tertumpuk oleh duplikasi widget berulang' : 'Prevents canvas clutter from repeated duplicate widgets',
        isIndo ? 'Cukup instruksikan: "Tambahkan subtopik X ke cabang Y"' : 'Simply say: "Add subtopic X to branch Y"',
        isIndo ? 'Node baru mewarisi posisi dan gaya visual diagram aktif' : 'New nodes inherit the active layout and styling'
      ],
      actionPrompt: isIndo
        ? 'Tambahkan cabang Asesmen Diagnostik dan Tindak Lanjut Remedial pada diagram yang aktif'
        : 'Add Diagnostic Assessment and Remedial Follow-up branches to active diagram'
    },
    {
      id: 'ai-curriculum-context',
      category: 'ai',
      title: isIndo ? 'Penyesuaian Kurikulum & Pemantik' : 'Curriculum & Inquiry Prompts',
      subtitle: isIndo ? 'Konteks Kurikulum Merdeka dan pertanyaan terbuka' : 'Aligned with curriculum standards and open inquiry',
      description: isIndo
        ? 'AI dilatih menyusun pertanyaan pemantik apersepsi di awal pertemuan untuk mengaktifkan pemikiran kritis dan diskusi kelas.'
        : 'Trained to generate introductory inquiry hooks that trigger student critical thinking and discussion.',
      icon: Sparkles,
      badge: isIndo ? 'Pedagogi' : 'Pedagogy',
      details: [
        isIndo ? 'Mendukung fase pembelajaran A hingga F (SD, SMP, SMA/SMK)' : 'Supports learning phases A through F (Elementary to High School)',
        isIndo ? 'Sesuai format Capaian Pembelajaran dan Tujuan Pembelajaran' : 'Structured around standard learning outcomes and objectives',
        isIndo ? 'Rekomendasi model: Problem Based Learning & Inquiry' : 'Recommends Problem Based Learning and Guided Inquiry'
      ],
      actionPrompt: isIndo
        ? 'Buatkan 3 pertanyaan pemantik diskusi tentang Hukum Kekekalan Energi untuk membuka kelas Fisika Fase E'
        : 'Generate 3 inquiry starter questions on Conservation of Energy for high school physics'
    },

    // 3. SIMULASI STEM
    {
      id: 'stem-physics-lab',
      category: 'stem',
      title: isIndo ? 'Simulasi Fisika Kinematika & Gaya' : 'Kinematics & Dynamics Simulations',
      subtitle: isIndo ? 'Eksperimen gerak parabola, gravitasi, dan orbit' : 'Interactive projectile motion, gravity, and orbits',
      description: isIndo
        ? 'Simulasi laboratorium interaktif berbasis HTML5 Canvas. Siswa dapat menggeser sudut elevasi, kecepatan awal, atau massa benda untuk mengamati grafik.'
        : 'Interactive HTML5 Canvas simulations. Students can adjust velocity, launch angle, and mass to observe trajectory curves in real time.',
      icon: Atom,
      badge: isIndo ? 'Fisika' : 'Physics',
      details: [
        isIndo ? 'Kalkulasi trajektori lintasan numerik akurat secara real-time' : 'Real-time accurate numerical trajectory computation',
        isIndo ? 'Slider parameter interaktif dapat dioperasikan via layar sentuh' : 'Touch-friendly parameter sliders for classroom manipulation',
        isIndo ? 'Dilengkapi visualisasi vektor kecepatan dan gaya gesek udara' : 'Includes live velocity vectors and air resistance toggles'
      ],
      actionPrompt: isIndo
        ? 'Buatkan simulasi gerak parabola fisika interaktif dengan slider sudut dan kecepatan awal'
        : 'Create an interactive projectile motion physics simulation with angle and velocity sliders'
    },
    {
      id: 'stem-chemistry-lab',
      category: 'stem',
      title: isIndo ? 'Simulasi Kimia pH & Titrasi' : 'Chemistry pH & Titration Labs',
      subtitle: isIndo ? 'Indikator asam-basa dan kurva netralisasi' : 'Acid-base indicators and neutralization curves',
      description: isIndo
        ? 'Laboratorium virtual visualisasi perubahan warna larutan berdasarkan skala pH serta perhitungan kurva konsentrasi molaritas.'
        : 'Virtual chemistry lab visualizing liquid color shifts based on pH values and molarity calculations.',
      icon: Atom,
      badge: isIndo ? 'Kimia' : 'Chemistry',
      details: [
        isIndo ? 'Visualisasi skala indikator universal (merah asam ke biru basa)' : 'Universal indicator scale visualization (acidic red to alkaline blue)',
        isIndo ? 'Kalkulasi kesetimbangan ionik [H+] dan [OH-] secara otomatis' : 'Automatic ionic equilibrium calculation for [H+] and [OH-]',
        isIndo ? 'Lingkungan aman tanpa risiko bahaya bahan kimia nyata' : 'Safe sandbox environment without physical chemical hazards'
      ],
      actionPrompt: isIndo
        ? 'Buatkan simulasi pH asam basa dan indikator warna kimia interaktif'
        : 'Create an interactive acid-base pH indicator and color shift simulation'
    },
    {
      id: 'stem-thermo-gas',
      category: 'stem',
      title: isIndo ? 'Simulasi Termodinamika Gas Ideal' : 'Thermodynamics & Ideal Gas Piston',
      subtitle: isIndo ? 'Eksplorasi hukum Boyle-Gay Lussac (PV=nRT)' : 'Boyle-Gay Lussac ideal gas law exploration (PV=nRT)',
      description: isIndo
        ? 'Animasi partikel gas di dalam bejana silinder bertekanan. Guru dapat menggeser suhu dan volume untuk mendemonstrasikan hubungan tekanan.'
        : 'Particle physics engine inside a pressurized piston cylinder demonstrating temperature, pressure, and volume relations.',
      icon: Atom,
      badge: isIndo ? 'Termodinamika' : 'Thermodynamics',
      details: [
        isIndo ? 'Kecepatan gerak partikel gas berbanding lurus dengan suhu Kelvin' : 'Particle kinetic velocity scales dynamically with Kelvin temperature',
        isIndo ? 'Plot diagram P-V otomatis diperbarui saat piston digerakkan' : 'Live P-V diagram plot generated as piston position shifts',
        isIndo ? 'Format terisolasi di dalam kotak aman kanvas (*sandbox*)' : 'Secure sandboxed iframe execution on the whiteboard'
      ],
      actionPrompt: isIndo
        ? 'Buatkan simulasi gas ideal PV=nRT dengan piston yang dapat digeser dan grafik P-V'
        : 'Create an ideal gas PV=nRT simulation with movable piston and P-V curve'
    },

    // 4. SUARA & PRIVASI
    {
      id: 'voice-offline-engine',
      category: 'voice',
      title: isIndo ? 'Mesin Suara Faster-Whisper Offline' : 'Offline Faster-Whisper STT',
      subtitle: isIndo ? 'Transkripsi suara lokal tanpa sambungan internet' : 'On-device local voice transcription without internet',
      description: isIndo
        ? 'Trido mengintegrasikan Faster-Whisper yang beroperasi penuh di komputer lokal. Suara pengajar tidak pernah dikirim ke server luar.'
        : 'Trido integrates Faster-Whisper operating locally on-device. Audio streams are never dispatched to external cloud servers.',
      icon: WifiOff,
      badge: isIndo ? '100% Offline' : '100% Offline',
      details: [
        isIndo ? 'Privasi kelas terjamin: rekaman suara diproses secara lokal' : 'Classroom privacy guaranteed: audio processed entirely on-device',
        isIndo ? 'Tetap berfungsi optimal saat jaringan internet sekolah terputus' : 'Functions seamlessly during school network outages',
        isIndo ? 'Dukungan akurasi tinggi untuk istilah pedagogis bahasa Indonesia' : 'High transcription accuracy for Indonesian educational terms'
      ]
    },
    {
      id: 'voice-continuous-mode',
      category: 'voice',
      title: isIndo ? 'Perekaman Berkelanjutan (Manual)' : 'Continuous Manual Recording',
      subtitle: isIndo ? 'Bicara leluasa tanpa pemotongan batas waktu otomatis' : 'Speak naturally without arbitrary timeout cutoffs',
      description: isIndo
        ? 'Perekaman suara di Trido tidak memotong pembicaraan pengajar di detik ke-10. Guru memegang kendali penuh kapan mulai dan selesai bicara.'
        : 'Voice input in Trido never cuts off speech at arbitrary thresholds. Teachers retain full control over start and stop timing.',
      icon: Mic,
      badge: isIndo ? 'Bebas Batas' : 'No Timeout',
      details: [
        isIndo ? 'Tekan ikon mic sekali untuk mulai merekam penjelasan panjang' : 'Click the mic icon once to begin speaking detailed instructions',
        isIndo ? 'Tekan kembali saat selesai untuk memproses perintah ke AI' : 'Click again when finished to dispatch commands to the AI engine',
        isIndo ? 'Dapat dibatalkan seketika menggunakan tombol Esc atau ikon silang' : 'Cancelable at any instant via Escape or cancel actions'
      ]
    },

    // 5. ALAT BANTU KELAS
    {
      id: 'tool-calculator',
      category: 'tools',
      title: isIndo ? 'Kalkulator Ilmiah Mengambang' : 'Floating Scientific Calculator',
      subtitle: isIndo ? 'Perhitungan cepat operasi matematika di papan tulis' : 'Quick calculations without leaving the whiteboard',
      description: isIndo
        ? 'Alat hitung numerik dan trigonometri siap pakai untuk mendampingi penyelesaian soal eksak bersama siswa di kelas.'
        : 'Clean floating calculator supporting arithmetic and trigonometric operations alongside classroom lectures.',
      icon: Calculator,
      badge: isIndo ? 'Alat Kelas' : 'Class Tool',
      details: [
        isIndo ? 'Posisi widget dapat digeser bebas ke sudut kanvas manapun' : 'Freely draggable to any corner of the active whiteboard',
        isIndo ? 'Mendukung operasi trigonometri (sin, cos, tan), logaritma, dan akar' : 'Supports trigonometry (sin, cos, tan), log, and square root',
        isIndo ? 'Dapat disematkan langsung di samping mindmap pelajaran' : 'Pinnable directly alongside the lesson mindmap'
      ]
    },
    {
      id: 'tool-timer',
      category: 'tools',
      title: isIndo ? 'Timer & Stopwatch Kelas' : 'Classroom Timer & Stopwatch',
      subtitle: isIndo ? 'Manajemen durasi kuis, presentasi, dan diskusi' : 'Countdown management for quizzes and group discussions',
      description: isIndo
        ? 'Tampilkan hitung mundur waktu diskusi kelompok secara transparan di layar papan agar alokasi jam pelajaran tetap disiplin.'
        : 'Display a transparent countdown on the board to keep group activities and timed quizzes strictly on schedule.',
      icon: Timer,
      badge: isIndo ? 'Alat Kelas' : 'Class Tool',
      details: [
        isIndo ? 'Pilihan durasi instan: 1 menit, 3 menit, 5 menit, hingga 15 menit' : 'Quick presets: 1 min, 3 mins, 5 mins, up to 15 mins',
        isIndo ? 'Pemberitahuan visual halus saat waktu diskusi telah berakhir' : 'Subtle visual notification when target duration concludes',
        isIndo ? 'Dapat diminimalkan agar tidak mengganggu fokus visual materi' : 'Minimizable into a discrete pill to preserve canvas focus'
      ]
    },
    {
      id: 'tool-spinner',
      category: 'tools',
      title: isIndo ? 'Pemilih Siswa Acak (Fair Wheel)' : 'Random Student Selector',
      subtitle: isIndo ? 'Tunjuk siswa menjawab pertanyaan secara adil' : 'Fair and transparent student question callout',
      description: isIndo
        ? 'Hindari bias penunjukan siswa di kelas dengan roda undian acak yang transparan dan meningkatkan partisipasi aktif seluruh peserta didik.'
        : 'Eliminate callout bias with an interactive random selection wheel that energizes classroom engagement.',
      icon: Dices,
      badge: isIndo ? 'Interaktif' : 'Interactive',
      details: [
        isIndo ? 'Impor daftar nama murid per kelas dengan sekali tempel' : 'Import full student rosters with a single paste action',
        isIndo ? 'Nama yang telah terpilih dapat dikeluarkan dari putaran berikutnya' : 'Exclude picked students from subsequent rounds automatically',
        isIndo ? 'Animasi putaran halus yang menciptakan antusiasme sehat di kelas' : 'Smooth physics spin animation creating healthy excitement'
      ]
    },
    {
      id: 'tool-scoreboard',
      category: 'tools',
      title: isIndo ? 'Papan Skor Kompetisi Kelompok' : 'Group Competition Scoreboard',
      subtitle: isIndo ? 'Catat perolehan poin cerdas cermat dan kuis' : 'Track team points during classroom trivia contests',
      description: isIndo
        ? 'Papan penghitung skor multipel kelompok dengan tombol penambahan dan pengurangan poin cepat saat sesi pembelajaran gamifikasi.'
        : 'Multi-team scoring board with rapid add/subtract point buttons for gamified classroom learning sessions.',
      icon: Trophy,
      badge: isIndo ? 'Gamifikasi' : 'Gamification',
      details: [
        isIndo ? 'Dukungan hingga 6 kelompok belajar secara berdampingan' : 'Side-by-side tracking for up to 6 student study groups',
        isIndo ? 'Penamaan kelompok dapat disesuaikan dengan tema materi' : 'Custom team labels matched to lesson themes',
        isIndo ? 'Tombol reset cepat untuk memulai babak kompetisi baru' : 'One-click reset to initiate fresh competitive rounds'
      ]
    },
    {
      id: 'tool-attendance',
      category: 'tools',
      title: isIndo ? 'Presensi & Kehadiran Kelas' : 'Quick Attendance Tracker',
      subtitle: isIndo ? 'Pendataan hadir, izin, sakit, dan dispensasi' : 'Mark presence, permits, sick leaves, and dispensations',
      description: isIndo
        ? 'Catat status kehadiran kelas secara efisien sebelum memulai kegiatan belajar-mengajar tanpa perlu membuka buku absen fisik.'
        : 'Log classroom attendance efficiently at the start of the period without flipping through physical logs.',
      icon: ClipboardCheck,
      badge: isIndo ? 'Administrasi' : 'Admin',
      details: [
        isIndo ? 'Ringkasan persentase kehadiran siswa terhitung otomatis' : 'Automatic percentage calculation of attending students',
        isIndo ? 'Status per siswa tersimpan dalam sesi kanvas aktif' : 'Status preserved locally inside the active canvas session',
        isIndo ? 'Dapat diekspor ke format rekap nilai pembelajaran' : 'Exportable alongside classroom performance summaries'
      ]
    },
    {
      id: 'tool-graph-plotter',
      category: 'tools',
      title: isIndo ? 'Plotter Grafik Matematika' : 'Function Curve Plotter',
      subtitle: isIndo ? 'Visualisasi kurva linear, kuadrat, dan trigonometri' : 'Visualize linear, quadratic, and trigonometric graphs',
      description: isIndo
        ? 'Gambar grafik fungsi matematika f(x) secara instan di kanvas untuk menjelaskan konsep titik potong sumbu dan gradien kemiringan.'
        : 'Render mathematical functions f(x) instantly on the board to illustrate axis intercepts and slope gradients.',
      icon: LineChart,
      badge: isIndo ? 'Matematika' : 'Mathematics',
      details: [
        isIndo ? 'Plot otomatis fungsi f(x) = ax² + bx + c dan trigonometri' : 'Automatic plotting for f(x) = ax² + bx + c and trig waves',
        isIndo ? 'Grid sumbu kartesius X-Y presisi dengan skala adaptif' : 'Precision Cartesian X-Y grid with adaptive scaling numbers',
        isIndo ? 'Dapat dicoret langsung dengan pena digital di atas kurva' : 'Direct digital pen annotation over rendered curves'
      ]
    }
  ], [isIndo]);

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return guideItems.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCategory;

      const matchQuery = 
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.shortcut && item.shortcut.toLowerCase().includes(q)) ||
        item.details.some(d => d.toLowerCase().includes(q));

      return matchCategory && matchQuery;
    });
  }, [guideItems, activeCategory, searchQuery]);

  const handleCopyPrompt = (prompt: string, id: string) => {
    navigator.clipboard?.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    if (onSamplePromptClick) {
      onSamplePromptClick(prompt);
      onClose();
    }
  };

  const categoryTabs: { id: GuideCategory; label: string; count: number }[] = [
    { id: 'all', label: isIndo ? 'Semua Panduan' : 'All Guides', count: guideItems.length },
    { id: 'canvas', label: isIndo ? 'Kanvas & Gambar' : 'Canvas & Draw', count: guideItems.filter(i => i.category === 'canvas').length },
    { id: 'ai', label: isIndo ? 'AI & Peta Konsep' : 'AI & Mindmap', count: guideItems.filter(i => i.category === 'ai').length },
    { id: 'stem', label: isIndo ? 'Simulasi STEM' : 'STEM Labs', count: guideItems.filter(i => i.category === 'stem').length },
    { id: 'voice', label: isIndo ? 'Suara & Privasi' : 'Voice & Privacy', count: guideItems.filter(i => i.category === 'voice').length },
    { id: 'tools', label: isIndo ? 'Alat Kelas' : 'Classroom Tools', count: guideItems.filter(i => i.category === 'tools').length },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-5xl bg-[#f8f7f5] rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header: Pure Minimalist Structure (No Emojis) */}
            <div className="px-6 py-5 bg-white border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1550aa] flex items-center justify-center text-white shadow-xs">
                  <HelpCircle size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-[#0a1a3a] tracking-tight">
                      {isIndo ? 'Panduan Penggunaan Trido' : 'Trido User Guide'}
                    </h2>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      v2.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {isIndo 
                      ? 'Dokumentasi praktis fitur smartboard, kecerdasan buatan, dan simulasi ajar'
                      : 'Practical documentation for smartboard tools, AI capabilities, and interactive labs'}
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2.5">
                <div className="relative w-48 sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isIndo ? 'Cari panduan, tombol, rumus...' : 'Search guides, keys, tools...'}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-full text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-[#1550aa] transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  title={isIndo ? 'Tutup panduan' : 'Close guide'}
                >
                  <X size={18} strokeWidth={2.4} />
                </button>
              </div>
            </div>

            {/* Category Filter Tabs: Clean Line Pills */}
            <div className="px-6 py-2.5 bg-[#f3f2ef] border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 select-none">
              {categoryTabs.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#1550aa] text-white shadow-xs' 
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Content Body: Minimal Structured vCards Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mx-auto">
                    <Search size={20} />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800">
                    {isIndo ? 'Tidak ada panduan yang cocok' : 'No matching guides found'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isIndo 
                      ? 'Coba gunakan kata kunci lain seperti "pena", "mindmap", "timer", atau pilih kategori "Semua Panduan".'
                      : 'Try different search keywords like "pen", "mindmap", "timer", or select "All Guides".'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 text-left"
                      >
                        {/* Card Top: Icon Badge + Titles + Metadata Badge */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-[#1550aa] shrink-0">
                                <Icon size={20} strokeWidth={2} />
                              </div>
                              <div>
                                <h3 className="font-black text-sm text-[#0a1a3a] leading-tight">
                                  {item.title}
                                </h3>
                                <p className="text-[11px] text-slate-500 font-medium leading-normal mt-0.5">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.shortcut && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[10px]">
                                  {item.shortcut}
                                </span>
                              )}
                              {item.badge && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#1550aa] font-bold text-[10px]">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            {item.description}
                          </p>

                          {/* Detailed Micro-Specs / Instructional Steps */}
                          <div className="bg-slate-50/70 rounded-xl border border-slate-200/70 p-3 space-y-1.5 text-[11px] text-slate-600">
                            {item.details.map((detail, dIdx) => (
                              <div key={dIdx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1550aa] shrink-0 mt-1.5" />
                                <span className="leading-relaxed">{detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Prompt Action Bar (if applicable) */}
                        {item.actionPrompt && (
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[240px]" title={item.actionPrompt}>
                              "{item.actionPrompt}"
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyPrompt(item.actionPrompt!, item.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-[#1550aa] hover:bg-[#0a1a3a] text-white text-[11px] font-bold rounded-full transition-colors cursor-pointer shrink-0 shadow-2xs"
                            >
                              {copiedId === item.id ? (
                                <>
                                  <Check size={12} strokeWidth={2.5} />
                                  <span>{isIndo ? 'Diterapkan' : 'Applied'}</span>
                                </>
                              ) : (
                                <>
                                  <CornerDownLeft size={12} />
                                  <span>{isIndo ? 'Coba di AI' : 'Try in AI'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Minimalist Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  {isIndo 
                    ? 'Sistem Cerdas Trido: Papan Tulis Inklusif Siap Mengajar' 
                    : 'Trido Smartboard: Inclusive Classroom Ready'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#1550aa] hover:bg-[#0a1a3a] text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs"
                >
                  {isIndo ? 'Tutup & Mulai Mengajar' : 'Close & Start Teaching'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickGuideModal;
