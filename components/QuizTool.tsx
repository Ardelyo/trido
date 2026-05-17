import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, Sparkles, Plus, ChevronRight, 
  CheckSquare, ListTodo, FileQuestion, Users, 
  BrainCircuit, LayoutGrid
} from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../utils/translations';

export const QuizTool: React.FC = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'hub' | 'create'>('hub');
  
  const quizTypes = [
    { icon: CheckSquare, title: t('quiz_type_mc', 'Pilihan Ganda'), desc: t('quiz_type_mc_desc', 'Satu jawaban benar'), color: 'bg-blue-100 text-blue-600' },
    { icon: BrainCircuit, title: t('quiz_type_tf', 'Benar / Salah'), desc: t('quiz_type_tf_desc', 'Evaluasi cepat konsep'), color: 'bg-emerald-100 text-emerald-600' },
    { icon: ListTodo, title: t('quiz_type_essay', 'Esai Pendek'), desc: t('quiz_type_essay_desc', 'Uji pemahaman mendalam'), color: 'bg-amber-100 text-amber-600' },
    { icon: LayoutGrid, title: t('quiz_type_drag', 'Tarik & Cocok'), desc: t('quiz_type_drag_desc', 'Interaktif dan visual'), color: 'bg-purple-100 text-purple-600' },
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
               <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('quiz_createNew', 'Buat Baru')}</h4>
               <button 
                 onClick={() => setView('create')}
                 className="w-full h-32 rounded-[1.5rem] bg-indigo-600 flex flex-col items-center justify-center text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-98 transition-all group"
               >
                  <Sparkles size={32} className="mb-2 group-hover:rotate-12 transition-transform" />
                  <span className="font-bold text-[16px]">{t('quiz_generateViaAi', 'Generate Kuis via AI')}</span>
                  <span className="text-[12px] opacity-70">{t('quiz_autoFromBoard', 'Otomatis dari materi papan tulis')}</span>
               </button>
            </div>

            <div>
               <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('quiz_templates', 'Template Kuis')}</h4>
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
               <ChevronRight size={14} className="rotate-180" /> {t('quiz_back', 'Kembali')}
             </button>
             <h3 className="text-xl font-extrabold text-slate-900 mb-2">{t('quiz_automation', 'Automasi Kuis')}</h3>
             <p className="text-[14px] text-slate-500 mb-6 font-medium">{t('quiz_automationDesc', 'Trido AI akan membaca isi papan tulis Anda dan membuat pertanyaan yang relevan.')}</p>
             
             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-wider">{t('quiz_questionCount', 'Jumlah Pertanyaan')}</label>
                  <div className="flex gap-2">
                     {[3, 5, 10].map(n => (
                       <button key={n} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">{n}</button>
                     ))}
                  </div>
                </div>
                
                <button className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                   {t('quiz_startGenerate', 'MULAI GENERATE')}
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
