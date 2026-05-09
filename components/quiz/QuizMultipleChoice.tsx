import React, { useState } from 'react';

interface QuizMultipleChoiceProps {
  config: {
    question: string;
    options: string[];
    correctIndex?: number;
  };
}

export const QuizMultipleChoice: React.FC<QuizMultipleChoiceProps> = ({ config }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === config.correctIndex;

  return (
    <div className="flex w-full h-full flex-col bg-white p-6 font-sans">
      <h3 className="mb-6 text-xl font-bold text-slate-800 leading-snug">
        {config?.question || 'Question?'}
      </h3>
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {(config?.options || ['Option A', 'Option B']).map((opt, i) => {
          let optClass = "border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50";
          if (submitted) {
            if (i === config.correctIndex) {
              optClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-medium ring-1 ring-emerald-500";
            } else if (selected === i && i !== config.correctIndex) {
              optClass = "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-400";
            } else {
              optClass = "border-slate-100 text-slate-400 opacity-60";
            }
          } else if (selected === i) {
            optClass = "border-indigo-500 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-500";
          }

          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${optClass} group flex items-center gap-3`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                ${submitted && i === config.correctIndex ? 'border-emerald-500 bg-emerald-500 text-white' : 
                  (submitted && selected === i ? 'border-rose-400 bg-rose-400 text-white' : 
                  (selected === i ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'))
                }
              `}>
                {submitted && i === config.correctIndex && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4 text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                {submitted && selected === i && i !== config.correctIndex && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4 text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
              </div>
              <span className="font-medium text-[15px]">{opt}</span>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col gap-2">
        {!submitted ? (
           <button 
             disabled={selected === null}
             onClick={() => setSubmitted(true)}
             className="w-full bg-indigo-600 font-bold text-white py-3 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50 disabled:shadow-none uppercase tracking-widest text-xs"
           >
             Cek Jawaban
           </button>
        ) : (
           <div className="flex flex-col gap-2">
             <div className={`p-3 rounded-xl flex items-center gap-2 mb-1 ${isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
               <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                 {isCorrect ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
               </div>
               <span className="font-black text-sm uppercase tracking-tight">{isCorrect ? 'Bagus! Jawaban Benar' : 'Ups! Coba Lagi'}</span>
             </div>
             
             <div className="flex gap-2">
               <button 
                 onClick={() => { setSelected(null); setSubmitted(false); }}
                 className="flex-1 bg-slate-100 font-bold text-slate-600 py-3 rounded-xl hover:bg-slate-200 transition text-xs uppercase tracking-widest"
               >
                 Ulangi
               </button>
               {isCorrect && (
                 <div className="flex-[2] bg-indigo-50 border border-indigo-100 text-indigo-700 font-black py-3 rounded-xl flex items-center justify-center text-[10px] uppercase tracking-[0.2em] animate-pulse">
                   Siap untuk soal berikutnya? Katakan "Lanjut"
                 </div>
               )}
             </div>
           </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
};
