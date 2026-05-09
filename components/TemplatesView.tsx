import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Sparkles, BookOpen, Clock, PenTool, LayoutTemplate, 
  Map, Lightbulb, Image as ImageIcon, ChevronRight 
} from 'lucide-react';

interface Template {
  id: string;
  title: string;
  category: string;
  icon: any;
  color: string;
  description: string;
}

const TEMPLATES: Template[] = [
  // Pendidikan
  { id: 't1', title: 'Peta Konsep (Mind Map)', category: 'Pendidikan', icon: Map, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', description: 'Template mind map dasar untuk curah pendapat.' },
  { id: 't2', title: 'Diagram Fasa Cairan', category: 'Pendidikan', icon: BookOpen, color: 'bg-blue-50 text-blue-600 border-blue-200', description: 'Diagram struktur kimia fase cairan.' },
  { id: 't3', title: 'Grafik Persamaan Linear', category: 'Pendidikan', icon: PenTool, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', description: 'Grid Cartesian untuk matematika.' },
  { id: 't4', title: 'Struktur Sel Hewan', category: 'Pendidikan', icon: BookOpen, color: 'bg-rose-50 text-rose-600 border-rose-200', description: 'Ilustrasi dan label biologi dasar.' },
  { id: 't5', title: 'Garis Waktu Sejarah', category: 'Pendidikan', icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-200', description: 'Timeline sejarah interaktif.' },
  
  // Perencanaan
  { id: 't6', title: 'Jadwal Kelas Mingguan', category: 'Perencanaan', icon: Clock, color: 'bg-blue-50 text-blue-600 border-blue-200', description: 'Tabel lengkap untuk jadwal pelajaran.' },
  { id: 't7', title: 'Kanban Board', category: 'Perencanaan', icon: LayoutTemplate, color: 'bg-violet-50 text-violet-600 border-violet-200', description: 'Papan Trello style untuk tugas kelompok.' },
  { id: 't8', title: 'Kalender Bulanan', category: 'Perencanaan', icon: LayoutTemplate, color: 'bg-teal-50 text-teal-600 border-teal-200', description: 'Kalender kosong untuk penjadwalan.' },
  
  // Evaluasi
  { id: 't9', title: 'Rubrik Penilaian', category: 'Evaluasi', icon: PenTool, color: 'bg-orange-50 text-orange-600 border-orange-200', description: 'Tabel evaluasi proyek ujian.' },
  { id: 't10', title: 'Matriks SWOT', category: 'Evaluasi', icon: LayoutTemplate, color: 'bg-cyan-50 text-cyan-600 border-cyan-200', description: 'Analisis Kekuatan, Kelemahan, Peluang, Ancaman.' },
  
  // Permainan / Ice Breaker
  { id: 't11', title: 'Teka-Teki Silang', category: 'Ice Breaker', icon: Lightbulb, color: 'bg-pink-50 text-pink-600 border-pink-200', description: 'Game tebak kata untuk relaksasi.' },
  { id: 't12', title: 'Papan Catur', category: 'Ice Breaker', icon: LayoutTemplate, color: 'bg-gray-100 text-gray-700 border-gray-300', description: 'Grid 8x8 papan catur klasik.' },
  
  // Kreatif
  { id: 't13', title: 'Moodboard Kosong', category: 'Kreatif', icon: ImageIcon, color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200', description: 'Grid tidak beraturan untuk penumpukan gambar.' },
  { id: 't14', title: 'Kertas Musik', category: 'Kreatif', icon: PenTool, color: 'bg-slate-100 text-slate-700 border-slate-300', description: 'Garis paranada untuk guru seni musik.' },
];

const CATEGORIES = ['Semua', 'Pendidikan', 'Perencanaan', 'Evaluasi', 'Ice Breaker', 'Kreatif'];

interface TemplatesViewProps {
  onClose: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = TEMPLATES.filter(t => {
    const matchCat = activeCategory === 'Semua' || t.category === activeCategory;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-white shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="h-20 lg:h-24 px-8 lg:px-12 flex justify-between items-center bg-slate-50 border-b border-slate-100 shrink-0">
         <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
               Galeri Templat <Sparkles className="text-blue-500" size={24} />
            </h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">
               Pilih templat interaktif siap pakai untuk papan tulis.
            </p>
         </div>
         
         <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Cari templat..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-64 bg-white border border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
               />
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
            >
               <X size={24} />
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* Sidebar Categories */}
         <div className="w-56 bg-white border-r border-slate-100 p-6 flex flex-col gap-2 shrink-0 overflow-y-auto">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 px-3">Kategori</h4>
            {CATEGORIES.map(cat => (
               <button
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={`text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all focus:outline-none ${
                   activeCategory === cat 
                     ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                     : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                 }`}
               >
                  {cat}
               </button>
            ))}
         </div>

         {/* Content Area */}
         <div className="flex-1 bg-slate-50 p-8 lg:p-12 overflow-y-auto w-full relative">
            
            {/* Search Input for Mobile */}
            <div className="relative mb-8 md:hidden">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Cari templat..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full bg-white border border-slate-200 rounded-full py-3.5 pl-12 pr-6 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
               />
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {filtered.map((item, idx) => {
                     const Icon = item.icon;
                     return (
                        <motion.div 
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: idx * 0.05 }}
                           key={item.id} 
                           className="group flex flex-col bg-white border border-slate-200/60 rounded-3xl p-6 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                           onClick={() => {
                             alert(`Menerapkan templat: ${item.title}`);
                             onClose();
                           }}
                        >
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 ${item.color}`}>
                              <Icon size={26} strokeWidth={2.5} />
                           </div>
                           
                           <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                              {item.title}
                           </h3>
                           <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed line-clamp-2">
                              {item.description}
                           </p>

                           <div className="mt-auto flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full inline-block">
                                 {item.category}
                              </span>

                              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-all group-active:scale-95 border border-slate-200 group-hover:border-blue-600">
                                 <ChevronRight size={16} strokeWidth={3} />
                              </div>
                           </div>
                        </motion.div>
                     );
                   })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                   <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                      <Search size={40} />
                   </div>
                   <h3 className="text-xl font-black text-slate-700 mb-2">Templat tidak ditemukan</h3>
                   <p className="text-slate-500 font-medium">Coba gunakan kata kunci pencarian yang lain.</p>
                </div>
            )}
         </div>
      </div>
    </motion.div>
  );
};
