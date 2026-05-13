import React, { useState } from 'react';

interface QuizTrueFalseProps {
  config: {
    statement: string;
    isTrue?: boolean;
  };
}

export const QuizTrueFalse: React.FC<QuizTrueFalseProps> = ({ config }) => {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const getBtnClass = (val: boolean) => {
    if (submitted) {
      if (val === config.isTrue) {
        return "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500";
      } else if (selected === val && val !== config.isTrue) {
        return "border-rose-400 bg-rose-50 text-rose-800 ring-2 ring-rose-400";
      } else {
        return "border-slate-100 bg-slate-50 text-slate-400 opacity-60";
      }
    } else if (selected === val) {
      return "border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500";
    }
    return "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50";
  };

  return (
    <div className="flex w-full h-full flex-col bg-white p-6 font-sans">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <span className="text-xs font-bold tracking-wider text-indigo-500 uppercase mb-4 bg-indigo-50 px-3 py-1 rounded-full">Benar atau Salah</span>
        <h3 className="mb-8 text-2xl font-bold text-slate-700 leading-relaxed max-w-sm">
          {config?.statement || 'Pernyataan ini adalah...'}
        </h3>
        
        <div className="flex gap-4 w-full px-4">
          <button
            onClick={() => !submitted && setSelected(true)}
            className={`flex-1 rounded-2xl border-2 py-6 flex flex-col justify-center items-center gap-3 transition-all duration-300 ${getBtnClass(true)}`}
          >
            <div className="bg-white p-3 rounded-full shadow-sm">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-emerald-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span className="font-bold text-lg">BENAR</span>
          </button>
          
          <button
            onClick={() => !submitted && setSelected(false)}
            className={`flex-1 rounded-2xl border-2 py-6 flex flex-col justify-center items-center gap-3 transition-all duration-300 ${getBtnClass(false)}`}
          >
            <div className="bg-white p-3 rounded-full shadow-sm">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-rose-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <span className="font-bold text-lg">SALAH</span>
          </button>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col gap-2">
        {!submitted ? (
           <button 
             disabled={selected === null}
             onClick={() => setSubmitted(true)}
             className="w-full bg-indigo-600 font-bold text-white py-3.5 rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] hover:bg-indigo-700 focus:ring-4 ring-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none uppercase tracking-widest text-xs no-print"
           >
             Periksa
           </button>
        ) : (
           <div className="flex flex-col gap-2">
             <div className="flex gap-2">
               <button 
                 onClick={() => { setSelected(null); setSubmitted(false); }}
                 className="flex-1 bg-white border border-slate-200 font-bold text-slate-600 py-3 rounded-xl hover:bg-slate-50 transition text-xs uppercase tracking-widest no-print"
               >
                 Ulangi
               </button>
               {selected === config.isTrue && (
                 <div className="flex-[2] bg-indigo-50 border border-indigo-100 text-indigo-700 font-black py-3 rounded-xl flex items-center justify-center text-[10px] uppercase tracking-[0.2em] animate-pulse">
                   Lanjut Soal Berikutnya?
                 </div>
               )}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
