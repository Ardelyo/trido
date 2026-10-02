import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, HelpCircle, Sparkles, BookOpen, PenTool, Mic, 
  Wrench, Atom, CheckCircle2, ChevronRight, Copy, Check, Lightbulb
} from 'lucide-react';
import { useStore } from '../store';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSamplePromptClick?: (prompt: string) => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ 
  isOpen, 
  onClose,
  onSamplePromptClick 
}) => {
  const { language } = useStore();
  const [activeTab, setActiveTab] = useState<'basics' | 'mindmap' | 'stem' | 'voice' | 'tools'>('basics');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
    if (onSamplePromptClick) {
      onSamplePromptClick(text);
      onClose();
    }
  };

  const isIndo = language === 'id';

  const tabs = [
    { id: 'basics' as const, label: isIndo ? '🎨 Kanvas & Gambar' : '🎨 Canvas & Draw', icon: PenTool },
    { id: 'mindmap' as const, label: isIndo ? '🧠 AI & Mindmap' : '🧠 AI & Mindmap', icon: Sparkles },
    { id: 'stem' as const, label: isIndo ? '🔬 Simulasi STEM' : '🔬 STEM Simulation', icon: Atom },
    { id: 'voice' as const, label: isIndo ? '🎙️ Suara Offline' : '🎙️ Offline Voice', icon: Mic },
    { id: 'tools' as const, label: isIndo ? '🛠️ Alat Mengajar' : '🛠️ Classroom Tools', icon: Wrench },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                    {isIndo ? 'Panduan Penggunaan Trido' : 'Trido User Guide'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {isIndo ? 'Panduan cepat & praktis untuk guru dan pengajar kelas' : 'Quick & easy guide for classroom educators'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title={isIndo ? 'Tutup' : 'Close'}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1 overflow-x-auto shrink-0 select-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 font-sans">
              
              {/* TAB 1: KANVAS & GAMBAR */}
              {activeTab === 'basics' && (
                <div className="space-y-6">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
                    <Lightbulb className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-xs sm:text-sm text-blue-900 leading-relaxed font-medium">
                      {isIndo 
                        ? 'Kanvas Trido dirancang untuk kenyamanan mengajar di layar sentuh maupun laptop. Anda bisa menggambar bebas, meletakkan bentuk, dan mengatur ukuran tanpa distorsi.'
                        : 'Trido whiteboard is tailored for interactive touchscreens and desktop teaching with crisp vector shapes and zero distortion.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">1</span>
                        {isIndo ? 'Alat Gambar Utama' : 'Core Drawing Tools'}
                      </h4>
                      <ul className="text-xs space-y-2 text-slate-600">
                        <li className="flex items-center justify-between">
                          <span>👆 <b>Pilih / Pointer</b>: Geser & pilih objek</span>
                          <kbd className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[10px]">V</kbd>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>✏️ <b>Pensil</b>: Coretan tangan bebas</span>
                          <kbd className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[10px]">P</kbd>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>📐 <b>Bentuk Vektor</b>: Persegi, Lingkaran, Garis</span>
                          <kbd className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[10px]">R</kbd>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>🔤 <b>Teks Judul & Materi</b></span>
                          <kbd className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[10px]">T</kbd>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>🧹 <b>Penghapus</b></span>
                          <kbd className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[10px]">E</kbd>
                        </li>
                      </ul>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">2</span>
                        {isIndo ? 'Trik Skalasi & Navigasi' : 'Scaling & Navigation'}
                      </h4>
                      <ul className="text-xs space-y-2 text-slate-600">
                        <li>• <b>Tarik Sudut Kotak:</b> Bentuk akan membesar proporsional tanpa ketebalan garis yang melar (*non-stretch vector*).</li>
                        <li>• <b>Zoom & Geser:</b> Gunakan pinch pada touchpad/layar sentuh atau tombol zoom di kanan bawah.</li>
                        <li>• <b>Multi Halaman:</b> Tambah halaman papan baru dengan menekan tanda <b>+</b> di pojok kiri bawah.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AI & MINDMAP */}
              {activeTab === 'mindmap' && (
                <div className="space-y-6">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
                    <Sparkles className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-xs sm:text-sm text-blue-900 leading-relaxed font-medium">
                      {isIndo 
                        ? 'Trido AI menggunakan format diagram Mermaid murni. Anda cukup mengetik atau berbicara, dan diagram konsep yang rapi akan muncul di papan.'
                        : 'Trido AI generates pure Mermaid mindmaps with in-place live editing and multi-branch exploration.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-3">
                      {isIndo ? '💡 Contoh Perintah yang Siap Dicoba (Klik untuk Coba):' : '💡 Example Prompts (Click to Try):'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        'Buatkan mindmap tentang Bahasa Indonesia',
                        'Buatkan peta konsep Fotosintesis pada tumbuhan',
                        'Buatkan diagram alur Siklus Air Hidrologi',
                        'Buatkan mindmap Rumus Usaha dan Energi Fisika',
                      ].map((prompt, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleCopyPrompt(prompt)}
                          className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all group"
                        >
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">{prompt}</span>
                          <button className="text-slate-400 group-hover:text-blue-600 shrink-0 p-1">
                            {copiedText === prompt ? <Check size={16} className="text-emerald-600" /> : <ChevronRight size={16} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {isIndo ? '🔄 Cara Mengedit Mindmap yang Sudah Ada (Mutasi In-Place)' : '🔄 In-Place Mindmap Mutation'}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {isIndo 
                        ? 'Jika ingin menambah materi, Anda TIDAK PERLU membuat mindmap baru dari awal. Cukup katakan ke AI:'
                        : 'To extend your lesson, instruct the AI to update existing nodes without redrawing:'}
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs text-blue-800">
                      "Tambahkan subtopik tentang Reaksi Terang dan Reaksi Gelap pada cabang Fotosintesis"
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SIMULASI STEM */}
              {activeTab === 'stem' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex gap-3 items-start">
                    <Atom className="text-indigo-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed font-medium">
                      {isIndo 
                        ? 'Trido dapat menghasilkan aplikasi simulasi sains interaktif (HTML5 Canvas) langsung di papan tulis untuk dicoba bersama siswa!'
                        : 'Trido generates interactive sandboxed STEM simulations (physics, chemistry, math) right on the whiteboard.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-3">
                      {isIndo ? '🧪 Contoh Simulasi yang Bisa Dibuat:' : '🧪 Ready-to-use STEM Simulations:'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        'Buatkan simulasi gerak parabola fisika interaktif',
                        'Buatkan simulasi pH asam basa dan indikator kimia',
                        'Buatkan simulasi hukum gravitasi Newton dan orbit',
                        'Buatkan simulasi gas ideal PV=nRT dengan piston',
                      ].map((prompt, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleCopyPrompt(prompt)}
                          className="p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all group"
                        >
                          <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700">{prompt}</span>
                          <button className="text-slate-400 group-hover:text-indigo-600 shrink-0 p-1">
                            {copiedText === prompt ? <Check size={16} className="text-emerald-600" /> : <ChevronRight size={16} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
                    <p>• <b>Interaktif:</b> Siswa dapat menggeser slider kecepatan, gravitasi, atau massa dan melihat perubahan grafik seketika.</p>
                    <p>• <b>Mandiri:</b> Berjalan di dalam kotak aman (*sandboxed iframe*) tanpa mengganggu gambar lain di papan.</p>
                  </div>
                </div>
              )}

              {/* TAB 4: SUARA OFFLINE */}
              {activeTab === 'voice' && (
                <div className="space-y-6">
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start">
                    <Mic className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
                      {isIndo 
                        ? 'Trido dilengkapi Faster-Whisper yang bekerja 100% offline di laptop Anda. Suara tidak pernah dikirim ke internet, hemat kuota dan menjaga privasi kelas.'
                        : 'Trido features Faster-Whisper offline speech recognition running entirely on-device with zero internet required.'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {isIndo ? '🎙️ Cara Menggunakan Perintah Suara:' : '🎙️ How to Use Voice Input:'}
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3 text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">1</span>
                        <span>Klik ikon <b>Mikrofon Biru</b> di kapsul bawah layar atau di dalam panel chat asisten.</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3 text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">2</span>
                        <span>Bicaralah dengan wajar dalam Bahasa Indonesia (contoh: <i>"Buatkan mindmap tentang sistem pernapasan"</i>).</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3 text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">3</span>
                        <span>Setelah selesai bicara, AI akan langsung memproses instruksi Anda ke papan tulis.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ALAT MENGAJAR */}
              {activeTab === 'tools' && (
                <div className="space-y-6">
                  <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
                    <Wrench className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                      {isIndo 
                        ? 'Akses cepat ke alat bantu kelas tanpa perlu meninggalkan papan tulis. Klik tombol (...) di toolbar kiri untuk membuka alat.'
                        : 'Quick-access classroom floating widgets right on the board.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { icon: '🧮', name: 'Kalkulator', desc: 'Hitung cepat rumus & angka di kelas' },
                      { icon: '⏱️', name: 'Timer & Waktu', desc: 'Hitung mundur waktu kuis atau diskusi' },
                      { icon: '🎡', name: 'Roda Acak Siswa', desc: 'Pilih siswa secara acak untuk maju' },
                      { icon: '🏆', name: 'Papan Skor', desc: 'Catat poin kelompok saat lomba / cerdas cermat' },
                      { icon: '📋', name: 'Presensi Kelas', desc: 'Cek kehadiran murid dengan cepat' },
                      { icon: '📈', name: 'Grafik Matematika', desc: 'Plot kurva kuadrat & fungsi interaktif' },
                    ].map((tool, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                        <div className="text-xl">{tool.icon}</div>
                        <div className="font-bold text-slate-800 text-xs">{tool.name}</div>
                        <div className="text-[11px] text-slate-500 leading-tight">{tool.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {isIndo ? 'Trido Smartboard • Siap untuk Kelas Inklusif' : 'Trido Smartboard • Ready for Inclusive Classrooms'}
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                {isIndo ? 'Mengerti, Mulai Mengajar' : 'Got it, Start Teaching'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
