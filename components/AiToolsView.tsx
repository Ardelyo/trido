import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Search, Sparkles, BookOpen, Layers,
  MessageSquare, Wand2, Calculator, SpellCheck,
  Puzzle, FileText, ChevronRight, BrainCircuit, Globe, Edit3, Camera, CheckSquare,
  ArrowLeft, Loader2, Send
} from 'lucide-react';
import { useStore } from '../store';
import { AiServiceError, generateToolContent } from '../services/aiService';

interface AiToolDef {
  id: string;
  title: string;
  category: string;
  icon: any;
  color: string;
  description: string;
  actionText?: string;
  placeholder?: string;
}

const AI_TOOLS: AiToolDef[] = [
  { id: 'mindmap', title: 'Generator Mindmap', category: 'Pemahaman', icon: BrainCircuit, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', description: 'Buat peta konsep otomatis dari topik apa pun.', placeholder: 'Contoh: Sistem Pencernaan Manusia' },
  { id: 'summary', title: 'Ringkas Materi', category: 'Pemahaman', icon: FileText, color: 'bg-blue-50 text-blue-600 border-blue-200', description: 'Tambahkan teks panjang dan AI akan membuat ringkasan singkat.', placeholder: 'Tempel teks panjang di sini...' },
  { id: 'quiz', title: 'Generator Soal Ujian', category: 'Pembuatan Konten', icon: Edit3, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', description: 'Buat soal pilihan ganda lengkap dengan jawaban.', placeholder: 'Topik soal (misal: Sejarah Kemerdekaan RI)' },
  { id: 'website', title: 'Generator Aplikasi Mini', category: 'Pembuatan Konten', icon: Globe, color: 'bg-purple-50 text-purple-600 border-purple-200', description: 'Buat aplikasi web mini atau komponen interaktif.', placeholder: 'Deskripsikan aplikasi (misal: Kalkulator BMI)' },
  { id: 'image', title: 'Generator Gambar', category: 'Kreativitas', icon: Camera, color: 'bg-pink-50 text-pink-600 border-pink-200', description: 'Hasilkan gambar ilustrasi untuk pelajaran.', placeholder: 'Misal: Ilustrasi 3D dari sel tumbuhan' },
];

const CATEGORIES = ['Semua', 'Pemahaman', 'Pembuatan Konten', 'Penilaian', 'Kreativitas'];

interface AiToolsViewProps {
  onClose: () => void;
}

export const AiToolsView: React.FC<AiToolsViewProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTool, setActiveTool] = useState<AiToolDef | null>(null);
  const [toolInput, setToolInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toolError, setToolError] = useState<string | null>(null);
  const { addAction } = useStore();

  const filtered = AI_TOOLS.filter(t => {
    const matchCat = activeCategory === 'Semua' || t.category === activeCategory;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleGenerate = async () => {
    if (!toolInput.trim() || !activeTool) return;
    setIsGenerating(true);
    setToolError(null);

    try {
      if (activeTool.id === 'image') {
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(toolInput)}`;
        addAction({
          id: `action_${Date.now()}`,
          type: 'RENDER_HTML',
          payload: {
            html: `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f8fafc"><img src="${imageUrl}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:12px" /></div>`,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            width: 400, height: 400,
            componentType: 'IMAGE_URL'
          },
          status: 'PENDING'
        });
        onClose();
        return;
      }

      const result = await generateToolContent(activeTool.id, toolInput);

      let centerX = window.innerWidth / 2 || 400;
      let centerY = window.innerHeight / 2 || 300;

      let lastX = centerX;
      let lastY = centerY;

      if (activeTool.id === 'mindmap' && Array.isArray(result)) {
        result.forEach((node: any, idx: number) => {
           let fill = '#3B82F6';
           let width = 200;
           let height = 80;
           if (node.style === 'MAIN_TOPIC') { fill = '#1D4ED8'; width = 250; height = 100; }
           else if (node.style === 'DETAIL') { fill = '#93C5FD'; width = 150; height = 60; }

           if (node.relativePosition === 'CENTER') {
             lastX = centerX;
             lastY = centerY;
           } else if (node.relativePosition === 'RIGHT_OF_LAST') {
             lastX += width + 60;
           } else if (node.relativePosition === 'BELOW_LAST') {
             lastY += height + 40;
           } else if (node.relativePosition === 'LEFT_OF_LAST') {
             lastX -= width + 60;
           } else if (node.relativePosition === 'ABOVE_LAST') {
             lastY -= height + 40;
           }

           addAction({
             id: `action_${Date.now()}_${idx}`,
             type: 'CREATE_SHAPE',
             payload: {
               shapeType: 'RECTANGLE',
               x: lastX, y: lastY,
               text: node.text,
               fill, width, height,
               textColor: '#FFFFFF'
             },
             status: 'PENDING'
           });
        });
      } else if (activeTool.id === 'quiz') {
         addAction({
           id: `action_${Date.now()}`,
           type: 'RENDER_HTML',
           payload: { html: '', config: result, x: centerX, y: centerY, width: 520, height: 640, componentType: 'QUIZ_APP' },
           status: 'PENDING'
         });
      } else if (activeTool.id === 'website') {
         const webConfig = result || {};
         addAction({
           id: `action_${Date.now()}`,
           type: 'RENDER_HTML',
           payload: {
             html: '',
             x: centerX, y: centerY,
             width: 700, height: 520,
             componentType: 'INTERACTIVE_APP',
             config: {
               html: webConfig.html || `<div class="p-8 text-center text-gray-500">App loaded</div>`,
               css: webConfig.css || '',
               js: webConfig.js || '',
               title: webConfig.title || toolInput
             }
           },
           status: 'PENDING'
         });
      } else if (activeTool.id === 'summary') {
         addAction({
           id: `action_${Date.now()}`,
           type: 'RENDER_HTML',
           payload: {
             html: '',
             x: centerX, y: centerY,
             width: 600, height: 700,
             componentType: 'DOCUMENT_PAGE',
             config: {
               title: `Ringkasan: ${toolInput.slice(0, 40)}...`,
               markdown: typeof result === 'string' ? result : ''
             }
           },
           status: 'PENDING'
         });
      }
      onClose(); // auto close when done
    } catch (e) {
      console.error(e);
      setToolError(e instanceof AiServiceError ? e.message : 'Gagal mengeksekusi alat AI. Coba lagi nanti.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-zinc-50 shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="h-20 lg:h-24 px-8 lg:px-12 flex justify-between items-center bg-white border-b border-zinc-200 shrink-0">
         <div>
            {activeTool ? (
              <div className="flex items-center gap-4">
                 <button
                   onClick={() => setActiveTool(null)}
                   className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
                 >
                   <ArrowLeft size={20} />
                 </button>
                 <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                   {activeTool.title}
                 </h2>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                   Koleksi Alat Agentic AI <Wand2 className="text-violet-500" size={24} />
                </h2>
                <p className="text-sm font-semibold text-zinc-500 mt-1">
                   Pusat alat AI all-in-one untuk papan tulis pintar Anda.
                </p>
              </>
            )}
         </div>

         <div className="flex items-center gap-4">
            {!activeTool && (
              <div className="relative hidden md:block">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                 <input
                   type="text"
                   placeholder="Cari alat AI..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="w-64 bg-zinc-50 border border-zinc-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-semibold text-zinc-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-zinc-400"
                 />
              </div>
            )}
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-sm"
            >
               <X size={24} />
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* Sidebar Categories (only when no tool selected) */}
         {!activeTool && (
           <div className="w-56 bg-white border-r border-zinc-200 p-6 flex flex-col gap-2 shrink-0 overflow-y-auto">
              <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-2 px-3">Kategori</h4>
              {CATEGORIES.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   className={`text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all focus:outline-none ${
                     activeCategory === cat
                       ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                       : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                   }`}
                 >
                    {cat}
                 </button>
              ))}
           </div>
         )}

         {/* Content Area */}
         <div className="flex-1 p-8 lg:p-12 overflow-y-auto w-full relative">
            <AnimatePresence mode="wait">
              {activeTool ? (
                <motion.div
                  key="tool-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl"
                >
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border mb-6 ${activeTool.color}`}>
                     {React.createElement(activeTool.icon, { size: 32, strokeWidth: 2.5 })}
                   </div>
                   <h3 className="text-xl font-bold text-zinc-800 mb-2">{activeTool.title}</h3>
                   <p className="text-zinc-500 mb-8">{activeTool.description}</p>

                   <textarea
                     value={toolInput}
                     onChange={(e) => {
                       setToolInput(e.target.value);
                       if (toolError) setToolError(null);
                     }}
                     placeholder={activeTool.placeholder || "Masukkan instruksi atau topik di sini..."}
                     className="w-full h-40 p-4 border border-zinc-300 rounded-2xl mb-4 focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 outline-none resize-none font-medium text-zinc-700"
                   />

                   {toolError && (
                     <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] font-semibold text-amber-800">
                       {toolError}
                     </div>
                   )}

                   <div className="flex justify-end gap-3">
                     <button
                       onClick={() => setActiveTool(null)}
                       className="px-6 py-3 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition-colors border border-zinc-200"
                     >
                       Batal
                     </button>
                     <button
                       onClick={handleGenerate}
                       disabled={isGenerating || !toolInput.trim()}
                       className="px-8 py-3 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                       {isGenerating ? 'Memproses...' : 'Generate & Tambah'}
                     </button>
                   </div>
                </motion.div>
              ) : (
                <motion.div key="grid-view" className="h-full">
                  {/* Search Input for Mobile */}
                  <div className="relative mb-8 md:hidden">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                     <input
                       type="text"
                       placeholder="Cari alat AI..."
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="w-full bg-white border border-zinc-200 rounded-full py-3.5 pl-12 pr-6 text-sm font-semibold text-zinc-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all"
                     />
                  </div>

                  {filtered.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                         {filtered.map((item, idx) => {
                           const Icon = item.icon;
                           return (
                              <motion.div
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 transition={{ delay: idx * 0.05, type: "spring", stiffness: 200 }}
                                 key={item.id}
                                 className="group flex flex-col bg-white border border-zinc-200/80 rounded-3xl p-6 hover:shadow-2xl hover:shadow-violet-900/10 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                                 onClick={() => {
                                   setActiveTool(item);
                                   setToolInput('');
                                 }}
                              >
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 ${item.color}`}>
                                    <Icon size={26} strokeWidth={2.5} />
                                 </div>

                                 <h3 className="font-extrabold text-zinc-800 text-lg leading-tight mb-2 group-hover:text-violet-600 transition-colors">
                                    {item.title}
                                 </h3>
                                 <p className="text-sm font-medium text-zinc-500 mb-6 leading-relaxed line-clamp-3">
                                    {item.description}
                                 </p>

                                 <div className="mt-auto flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full inline-block">
                                       {item.category}
                                    </span>

                                    <div className="w-8 h-8 rounded-full bg-zinc-50 group-hover:bg-violet-600 group-hover:text-white flex items-center justify-center text-zinc-400 transition-all group-active:scale-95 border border-zinc-200 group-hover:border-violet-600">
                                       <ChevronRight size={16} strokeWidth={3} />
                                    </div>
                                 </div>
                              </motion.div>
                           );
                         })}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-20">
                         <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-300 mb-6">
                            <Search size={40} />
                         </div>
                         <h3 className="text-xl font-black text-zinc-700 mb-2">Alat AI tidak ditemukan</h3>
                         <p className="text-zinc-500 font-medium">Coba gunakan kata kunci pencarian yang lain.</p>
                      </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
         </div>
      </div>
    </motion.div>
  );
};
