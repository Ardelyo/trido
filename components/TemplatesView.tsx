import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Search, Sparkles, BookOpen, Clock, PenTool, LayoutTemplate,
  Map, Lightbulb, ChevronRight, Zap, Brain, Calculator, FlaskConical,
  Globe2, Music, Trophy, Palette, Users, TrendingUp
} from 'lucide-react';
import { useStore } from '../store';

interface Template {
  id: string;
  title: string;
  category: string;
  icon: any;
  color: string;
  gradient: string;
  description: string;
  /** The AI prompt that gets injected into the chat to build this template */
  aiPrompt: string;
}

const TEMPLATES: Template[] = [
  // ── Pendidikan ─────────────────────────────────────────────────────────────
  {
    id: 't1', title: 'Peta Konsep Kosong', category: 'Pendidikan',
    icon: Map, color: 'text-emerald-600', gradient: 'from-emerald-50 to-teal-50 border-emerald-200',
    description: 'Mind map dengan topik utama di tengah dan 4 subtopik siap diisi.',
    aiPrompt: 'Buat mind map kosong dengan 1 node utama berlabel "Topik Utama" di tengah dan 4 subtopik kosong di sekelilingnya: "Subtopik 1", "Subtopik 2", "Subtopik 3", "Subtopik 4". Hubungkan semua subtopik ke topik utama.'
  },
  {
    id: 't2', title: 'Quiz 5 Soal Pilihan Ganda', category: 'Pendidikan',
    icon: Brain, color: 'text-blue-600', gradient: 'from-blue-50 to-indigo-50 border-blue-200',
    description: 'Soal pilihan ganda interaktif dengan 4 pilihan jawaban.',
    aiPrompt: 'Tambahkan komponen quiz pilihan ganda di tengah papan. Soal: "Apa ibu kota Indonesia?" dengan pilihan jawaban: "Jakarta", "Surabaya", "Bandung", "Medan" dan jawaban benar adalah Jakarta (index 0).'
  },
  {
    id: 't3', title: 'Timer Presentasi', category: 'Pendidikan',
    icon: Clock, color: 'text-orange-600', gradient: 'from-orange-50 to-amber-50 border-orange-200',
    description: 'Timer hitung mundur 10 menit untuk sesi presentasi.',
    aiPrompt: 'Tambahkan timer hitung mundur 10 menit (600 detik) di sudut kanan atas papan tulis untuk sesi presentasi kelas.'
  },
  {
    id: 't4', title: 'Dokumen Materi Pelajaran', category: 'Pendidikan',
    icon: BookOpen, color: 'text-violet-600', gradient: 'from-violet-50 to-purple-50 border-violet-200',
    description: 'Template dokumen dengan judul, tujuan belajar, dan poin materi.',
    aiPrompt: 'Buat dokumen materi pelajaran di tengah papan dengan format Markdown. Isi: Judul "Materi Pelajaran", bagian "Tujuan Belajar" berisi 3 poin placeholder, bagian "Ringkasan Materi" dengan teks contoh, dan bagian "Latihan" dengan 2 soal latihan.'
  },
  {
    id: 't5', title: 'Garis Waktu Sejarah', category: 'Pendidikan',
    icon: TrendingUp, color: 'text-rose-600', gradient: 'from-rose-50 to-pink-50 border-rose-200',
    description: '5 titik waktu berurutan dari kiri ke kanan.',
    aiPrompt: 'Buat garis waktu dengan 5 node persegi panjang berurutan dari kiri ke kanan: "Era 1", "Era 2", "Era 3", "Era 4", "Era 5". Hubungkan setiap node dengan panah ke node berikutnya. Tambahkan judul "Garis Waktu Sejarah" di atas.'
  },
  {
    id: 't6', title: 'Diagram Perbandingan (T-Chart)', category: 'Pendidikan',
    icon: LayoutTemplate, color: 'text-cyan-600', gradient: 'from-cyan-50 to-sky-50 border-cyan-200',
    description: 'Dua kolom untuk membandingkan dua konsep atau pilihan.',
    aiPrompt: 'Buat diagram T-Chart perbandingan dengan judul "Perbandingan" di atas, dua node besar di bawahnya berlabel "Konsep A" dan "Konsep B". Di bawah masing-masing node, tambahkan 3 node detail kecil sebagai poin perbandingan. Hubungkan semuanya.'
  },
  {
    id: 't7', title: 'Flashcard Kosakata', category: 'Pendidikan',
    icon: Lightbulb, color: 'text-yellow-600', gradient: 'from-yellow-50 to-amber-50 border-yellow-200',
    description: 'Kartu memori interaktif depan-belakang untuk belajar kosakata.',
    aiPrompt: 'Tambahkan 3 flashcard di papan: flashcard 1 dengan depan "Photosynthesis" dan belakang "Proses tanaman mengubah cahaya matahari menjadi makanan", flashcard 2 dengan depan "Osmosis" dan belakang "Perpindahan air melalui membran semipermeabel", flashcard 3 dengan depan "Mitosis" dan belakang "Pembelahan sel yang menghasilkan 2 sel anak identik".'
  },

  // ── STEM ────────────────────────────────────────────────────────────────────
  {
    id: 't8', title: 'Kalkulator Saintifik', category: 'STEM',
    icon: Calculator, color: 'text-indigo-600', gradient: 'from-indigo-50 to-blue-50 border-indigo-200',
    description: 'Kalkulator interaktif dengan fungsi saintifik lengkap.',
    aiPrompt: 'Tambahkan kalkulator interaktif di tengah papan tulis.'
  },
  {
    id: 't9', title: 'Rumus Fisika (Dokumen)', category: 'STEM',
    icon: FlaskConical, color: 'text-emerald-600', gradient: 'from-emerald-50 to-green-50 border-emerald-200',
    description: 'Rangkuman rumus fisika dengan rendering LaTeX.',
    aiPrompt: 'Buat dokumen "Rumus Fisika Dasar" di tengah papan dengan Markdown dan LaTeX: \n\n## Gerak\n- Kecepatan: $v = \\frac{s}{t}$\n- Percepatan: $a = \\frac{\\Delta v}{\\Delta t}$\n\n## Gaya\n- Hukum Newton II: $F = m \\cdot a$\n- Berat: $W = m \\cdot g$\n\n## Energi\n- Energi Kinetik: $E_k = \\frac{1}{2}mv^2$\n- Energi Potensial: $E_p = mgh$'
  },
  {
    id: 't10', title: 'Simulasi Interaktif', category: 'STEM',
    icon: Zap, color: 'text-amber-600', gradient: 'from-amber-50 to-yellow-50 border-amber-200',
    description: 'Simulasi fisika: bola yang jatuh dengan gravitasi.',
    aiPrompt: 'Buat simulasi interaktif gerak bola jatuh bebas dengan JavaScript. Ada tombol Play/Pause/Reset, slider untuk mengubah ketinggian awal (10-100m) dan massa bola (1-10kg). Tampilkan nilai kecepatan dan energi kinetik secara real-time. Gunakan Tailwind CSS untuk styling yang bersih.'
  },

  // ── Perencanaan ─────────────────────────────────────────────────────────────
  {
    id: 't11', title: 'Jadwal Harian Guru', category: 'Perencanaan',
    icon: LayoutTemplate, color: 'text-teal-600', gradient: 'from-teal-50 to-cyan-50 border-teal-200',
    description: 'Tabel jadwal 5 hari kerja dengan slot mata pelajaran.',
    aiPrompt: 'Buat aplikasi jadwal harian guru interaktif dengan tabel HTML. Baris = jam pelajaran (07:00, 08:30, 10:00, 11:30, 13:00), Kolom = hari kerja (Senin-Jumat). Setiap sel dapat diklik untuk mengisi nama mata pelajaran. Gunakan warna berbeda per mata pelajaran. Ada tombol Export dan Reset.'
  },
  {
    id: 't12', title: 'Kanban Board Tugas', category: 'Perencanaan',
    icon: LayoutTemplate, color: 'text-purple-600', gradient: 'from-purple-50 to-violet-50 border-purple-200',
    description: 'Board dengan kolom Todo, In Progress, dan Done.',
    aiPrompt: 'Buat Kanban board interaktif dengan 3 kolom: "📋 To Do", "⚡ In Progress", "✅ Done". Setiap kolom bisa menerima drag & drop kartu tugas. Ada tombol "+" di setiap kolom untuk menambah kartu baru. Gunakan warna: Todo=slate, Progress=blue, Done=emerald.'
  },

  // ── Evaluasi ─────────────────────────────────────────────────────────────
  {
    id: 't13', title: 'Quiz Benar/Salah', category: 'Evaluasi',
    icon: Trophy, color: 'text-rose-600', gradient: 'from-rose-50 to-red-50 border-rose-200',
    description: 'Pernyataan yang perlu dijawab benar atau salah oleh siswa.',
    aiPrompt: 'Tambahkan komponen quiz benar/salah di tengah papan dengan pernyataan: "Bumi mengelilingi Matahari dalam waktu 365 hari." Jawaban benar adalah Benar.'
  },
  {
    id: 't14', title: 'Drag & Match Kosakata', category: 'Evaluasi',
    icon: PenTool, color: 'text-indigo-600', gradient: 'from-indigo-50 to-blue-50 border-indigo-200',
    description: 'Pasangkan kata dengan definisinya dengan cara drag and drop.',
    aiPrompt: 'Buat quiz drag and match di tengah papan dengan 4 pasangan: "Fotosintesis" ↔ "Proses membuat makanan dari cahaya", "Respirasi" ↔ "Proses menghasilkan energi dari glukosa", "Transpirasi" ↔ "Penguapan air dari daun", "Reproduksi" ↔ "Proses perkembangbiakan makhluk hidup".'
  },

  // ── Kreatif ─────────────────────────────────────────────────────────────
  {
    id: 't15', title: 'Brainstorming Bebas', category: 'Kreatif',
    icon: Palette, color: 'text-fuchsia-600', gradient: 'from-fuchsia-50 to-pink-50 border-fuchsia-200',
    description: '6 node warna-warni untuk menampung ide awal.',
    aiPrompt: 'Buat 6 node berwarna-warni tersebar di papan untuk brainstorming: node pertama berlabel "Ide Utama" di tengah dengan style MAIN_TOPIC, lalu 5 node dengan style HIGHLIGHT berlabel "Ide 1" sampai "Ide 5" di posisi RIGHT_OF_LAST, BELOW_LAST, LEFT_OF_LAST, ABOVE_LAST, dan RIGHT_OF_LAST.'
  },
  {
    id: 't16', title: 'Ice Breaker: Trivia', category: 'Kreatif',
    icon: Users, color: 'text-orange-600', gradient: 'from-orange-50 to-red-50 border-orange-200',
    description: 'Game trivia interaktif untuk pemanasan kelas.',
    aiPrompt: 'Buat game trivia interaktif untuk ice breaker kelas dengan 5 pertanyaan random tentang pengetahuan umum. Ada sistem poin, timer 15 detik per soal, efek animasi saat menjawab benar/salah, dan leaderboard sederhana di akhir. Gunakan desain yang colorful dan menyenangkan.'
  },
];

const CATEGORIES = ['Semua', 'Pendidikan', 'STEM', 'Perencanaan', 'Evaluasi', 'Kreatif'];

interface TemplatesViewProps {
  onClose: () => void;
  onApplyTemplate?: (prompt: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onClose, onApplyTemplate }) => {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const { addMessage } = useStore();

  const filtered = TEMPLATES.filter(t => {
    const matchCat = activeCategory === 'Semua' || t.category === activeCategory;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleApply = async (template: Template) => {
    setApplying(template.id);
    // Add user message to chat to trigger AI
    addMessage({ role: 'user', text: template.aiPrompt });
    // Let the parent handle actually sending it
    onApplyTemplate?.(template.aiPrompt);
    setTimeout(() => {
      setApplying(null);
      onClose();
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-white shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="h-20 lg:h-24 px-8 lg:px-12 flex justify-between items-center bg-slate-50 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Galeri Templat <Sparkles className="text-blue-500" size={22} />
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-0.5">
            Klik templat untuk langsung diterapkan ke papan tulis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari templat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-64 bg-white border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-52 bg-white border-r border-slate-100 p-5 flex flex-col gap-1 shrink-0 overflow-y-auto">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-2">Kategori</h4>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-left px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
              <span className={`ml-2 text-xs ${activeCategory === cat ? 'text-blue-200' : 'text-slate-400'}`}>
                {TEMPLATES.filter(t => cat === 'Semua' || t.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 bg-slate-50 p-8 lg:p-10 overflow-y-auto">
          {/* Mobile Search */}
          <div className="relative mb-6 md:hidden">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari templat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-5 text-sm font-semibold text-slate-700 outline-none"
            />
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((item, idx) => {
                const Icon = item.icon;
                const isApplying = applying === item.id;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => !applying && handleApply(item)}
                    className={`group flex flex-col bg-white border rounded-3xl p-5 cursor-pointer transition-all relative overflow-hidden ${
                      isApplying
                        ? 'border-blue-500 shadow-xl shadow-blue-500/20 scale-[0.98]'
                        : 'border-slate-200/80 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br ${item.gradient}`}>
                      <Icon size={22} className={item.color} strokeWidth={2.5} />
                    </div>

                    <h3 className={`font-extrabold text-slate-800 text-base leading-tight mb-1.5 transition-colors ${isApplying ? 'text-blue-600' : 'group-hover:text-blue-600'}`}>
                      {item.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mb-4 leading-relaxed line-clamp-2 flex-1">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        {item.category}
                      </span>
                      <motion.div
                        animate={isApplying ? { rotate: 360 } : { rotate: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 transition-all border ${
                          isApplying
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 border-slate-200'
                        }`}
                      >
                        {isApplying ? <Zap size={14} /> : <ChevronRight size={14} strokeWidth={3} />}
                      </motion.div>
                    </div>

                    {/* Overlay shimmer while applying */}
                    {isApplying && (
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent pointer-events-none"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-5">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-700 mb-2">Templat tidak ditemukan</h3>
              <p className="text-slate-500 font-medium">Coba kata kunci pencarian yang lain.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
