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
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [topicInput, setTopicInput] = useState<string>('');
  
  const quizTypes = [
    {
      componentType: 'QUIZ_MULTIPLE_CHOICE',
      icon: CheckSquare,
      title: t('quiz_type_mc', 'Pilihan Ganda'),
      desc: t('quiz_type_mc_desc', 'Satu jawaban benar'),
      color: 'bg-trido/10 text-trido',
      defaultConfig: {
        title: 'Kuis Pilihan Ganda',
        question: 'Manakah di bawah ini yang merupakan fungsi utama klorofil dalam fotosintesis?',
        options: [
          'Menyerap energi cahaya matahari',
          'Mengangkut air dari akar ke daun',
          'Menyimpan cadangan makanan berupa amilum',
          'Mengikat gas oksigen dari udara'
        ],
        correctIndex: 0,
        explanation: 'Klorofil berfungsi menangkap foton cahaya matahari untuk memulai reaksi terang di membran tilakoid.'
      }
    },
    {
      componentType: 'QUIZ_TRUE_FALSE',
      icon: BrainCircuit,
      title: t('quiz_type_tf', 'Benar / Salah'),
      desc: t('quiz_type_tf_desc', 'Evaluasi cepat konsep'),
      color: 'bg-emerald-100 text-emerald-600',
      defaultConfig: {
        title: 'Kuis Benar / Salah',
        statement: 'Reaksi gelap (Siklus Calvin) pada fotosintesis berlangsung di dalam stroma kloroplas.',
        isTrue: true,
        explanation: 'Benar, Siklus Calvin terjadi di stroma, sedangkan reaksi terang terjadi di membran tilakoid.'
      }
    },
    {
      componentType: 'QUIZ_ESSAY',
      icon: ListTodo,
      title: t('quiz_type_essay', 'Esai Pendek'),
      desc: t('quiz_type_essay_desc', 'Uji pemahaman mendalam'),
      color: 'bg-amber-100 text-amber-600',
      defaultConfig: {
        title: 'Soal Esai Reflektif',
        question: 'Jelaskan perbedaan utama antara reaksi terang dan siklus Calvin pada proses fotosintesis!',
        placeholder: 'Tuliskan analisis Anda di sini...'
      }
    },
    {
      componentType: 'QUIZ_DRAG_MATCH',
      icon: LayoutGrid,
      title: t('quiz_type_drag', 'Tarik & Cocok'),
      desc: t('quiz_type_drag_desc', 'Interaktif dan visual'),
      color: 'bg-purple-100 text-purple-600',
      defaultConfig: {
        title: 'Cocokkan Pasangan Konsep',
        pairs: [
          { left: 'Kloroplas', right: 'Tempat berlangsungnya fotosintesis' },
          { left: 'Mitokondria', right: 'Pusat respirasi seluler (ATP)' },
          { left: 'Ribosom', right: 'Tempat sintesis protein' }
        ]
      }
    },
  ];

  const handleSpawnTemplate = (qt: typeof quizTypes[number]) => {
    const id = `quiz_${Date.now()}`;
    const store = useStore.getState();
    store.updateDomElement(id, {
      id,
      html: '<div>Quiz</div>',
      componentType: qt.componentType,
      config: qt.defaultConfig,
      x: 960,
      y: 540,
      width: 480,
      height: 440,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      zIndex: 15
    });
    window.dispatchEvent(new CustomEvent('addCanvasPlaceholder', {
      detail: { id, x: 960, y: 540, width: 480, height: 440 }
    }));
    if (store.isQuizOpen) store.toggleQuiz();
  };

  const handleStartGenerate = () => {
    const store = useStore.getState();
    const topic = topicInput.trim() || store.lessonPlan?.topic || 'materi di papan tulis saat ini';
    store.setChatInputText(`Buatkan kuis interaktif berisi ${questionCount} soal tentang ${topic}`);
    if (!store.isAiDrawerOpen) store.toggleAiDrawer();
    if (store.isQuizOpen) store.toggleQuiz();
  };

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
               <h4 className="font-display text-[14px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('quiz_createNew', 'Buat Baru')}</h4>
               <button 
                 onClick={() => setView('create')}
                 className="w-full h-32 rounded-[1.5rem] bg-trido flex flex-col items-center justify-center text-white shadow-xl shadow-trido/20 hover:scale-[1.02] active:scale-98 transition-all group"
               >
                  <Sparkles size={32} className="mb-2 group-hover:rotate-12 transition-transform" />
                  <span className="font-bold text-[16px]">{t('quiz_generateViaAi', 'Generate Kuis via AI')}</span>
                  <span className="text-[12px] opacity-70">{t('quiz_autoFromBoard', 'Otomatis dari materi papan tulis')}</span>
               </button>
            </div>

            <div>
               <h4 className="font-display text-[14px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('quiz_templates', 'Template Kuis')}</h4>
               <div className="grid grid-cols-1 gap-3">
                  {quizTypes.map((type, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSpawnTemplate(type)}
                      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-trido/70 hover:bg-trido/3 transition-all group text-left cursor-pointer"
                    >
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${type.color} group-hover:scale-110 transition-transform shadow-sm`}>
                          <type.icon size={24} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="font-bold text-ink text-[15px]">{type.title}</div>
                          <div className="text-[12px] text-slate-500 font-medium truncate">{type.desc}</div>
                       </div>
                       <ChevronRight size={18} className="text-slate-300 group-hover:text-trido/50" />
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
             <button onClick={() => setView('hub')} className="text-[12px] font-bold text-slate-500 mb-4 flex items-center gap-1 hover:text-ink cursor-pointer">
               <ChevronRight size={14} className="rotate-180" /> {t('quiz_back', 'Kembali')}
             </button>
             <h3 className="font-display text-xl font-extrabold text-ink mb-2">{t('quiz_automation', 'Automasi Kuis')}</h3>
             <p className="text-[14px] text-slate-500 mb-4 font-medium">{t('quiz_automationDesc', 'Trido AI akan membaca isi papan tulis Anda dan membuat pertanyaan yang relevan.')}</p>
             
             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-wider">Topik Kuis (Opsional)</label>
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Kosongkan untuk otomatis dari papan tulis..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-ink outline-none focus:border-trido/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-wider">{t('quiz_questionCount', 'Jumlah Pertanyaan')}</label>
                  <div className="flex gap-2">
                     {[3, 5, 10].map(n => (
                       <button
                         key={n}
                         type="button"
                         onClick={() => setQuestionCount(n)}
                         className={`flex-1 py-3 border rounded-xl font-bold transition-colors cursor-pointer ${
                           questionCount === n
                             ? 'bg-trido text-white border-trido shadow-sm'
                             : 'bg-white border-slate-200 text-slate-700 hover:bg-trido/5 hover:border-trido/30'
                         }`}
                       >
                         {n}
                       </button>
                     ))}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleStartGenerate}
                  className="w-full py-4 mt-4 bg-trido hover:bg-trido-deep text-white rounded-2xl font-bold shadow-lg shadow-trido/20 active:scale-95 transition-all cursor-pointer"
                >
                   {t('quiz_startGenerate', 'MULAI GENERATE')}
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
