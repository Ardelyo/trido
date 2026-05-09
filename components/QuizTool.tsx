import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, Sparkles, Plus, ChevronRight, 
  CheckSquare, ListTodo, FileQuestion, Users, 
  BrainCircuit, LayoutGrid
} from 'lucide-react';
import { useStore } from '../store';

export const QuizTool: React.FC = () => {
  const [view, setView] = useState<'hub' | 'create'>('hub');
  
  const quizTypes = [
    { icon: CheckSquare, title: 'Pilihan Ganda', desc: 'Satu jawaban benar', color: 'bg-blue-100 text-blue-600' },
    { icon: BrainCircuit, title: 'Benar / Salah', desc: 'Evaluasi cepat konsep', color: 'bg-emerald-100 text-emerald-600' },
    { icon: ListTodo, title: 'Esai Pendek', desc: 'Uji pemahaman mendalam', color: 'bg-amber-100 text-amber-600' },
    { icon: LayoutGrid, title: 'Tarik & Cocok', desc: 'Interaktif dan visual', color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      <AnimatePresence mode="wait">
        {view === 'hub' ? (
          <motion.div 
            key="hub"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 p-6 overflow-y-auto custom-scrollbar"
          >
            <div className="mb-6">
               <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-4">Buat Baru</h4>
               <button 
                 onClick={() => setView('create')}
                 className="w-full h-32 rounded-[1.5rem] bg-indigo-600 flex flex-col items-center justify-center text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-98 transition-all group"
               >
                  <Sparkles size={32} className="mb-2 group-hover:rotate-12 transition-transform" />
                  <span className="font-bold text-[16px]">Generate Kuis via AI</span>
                  <span className="text-[12px] opacity-70">Otomatis dari materi papan tulis</span>
               </button>
            </div>

            <div>
               <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-4">Template Kuis</h4>
               <div className="grid grid-cols-1 gap-3">
                  {quizTypes.map((type, i) => (
                    <button key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group text-left">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${type.color} group-hover:scale-110 transition-transform shadow-sm`}>
                          <type.icon size={24} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 text-[15px]">{type.title}</div>
                          <div className="text-[12px] text-slate-500 font-medium truncate">{type.desc}</div>
                       </div>
                       <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500" />
                    </button>
                  ))}
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 p-6 flex flex-col"
          >
             <button onClick={() => setView('hub')} className="text-[12px] font-bold text-slate-500 mb-4 flex items-center gap-1 hover:text-slate-800">
               <ChevronRight size={14} className="rotate-180" /> Kembali
             </button>
             <h3 className="text-xl font-extrabold text-slate-900 mb-2">Automasi Kuis</h3>
             <p className="text-[14px] text-slate-500 mb-6 font-medium">Trido AI akan membaca isi papan tulis Anda dan membuat pertanyaan yang relevan.</p>
             
             <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[12px] font-black text-slate-400 uppercase tracking-wider">Jumlah Pertanyaan</label>
                 <div className="flex gap-2">
                    {[3, 5, 10].map(n => (
                      <button key={n} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">{n}</button>
                    ))}
                 </div>
               </div>
               
               <button className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                  MULAI GENERATE
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
