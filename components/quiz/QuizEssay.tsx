import React, { useState } from 'react';

interface QuizEssayProps {
  config: {
    question: string;
    placeholder?: string;
  };
}

export const QuizEssay: React.FC<QuizEssayProps> = ({ config }) => {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex w-full h-full flex-col bg-white p-6 font-sans">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-amber-100 p-1.5 rounded-md">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </div>
        <span className="text-sm font-bold text-amber-600 uppercase tracking-wide">Esai</span>
      </div>

      <h3 className="mb-4 text-lg font-bold text-slate-800">
        {config?.question || 'Tuliskan jawaban Anda di bawah ini.'}
      </h3>
      
      <div className="flex-1 min-h-[150px] relative">
        <textarea
           disabled={submitted}
           value={answer}
           onChange={(e) => setAnswer(e.target.value)}
           placeholder={config?.placeholder || "Ketik jawaban Anda..."}
           className="w-full h-full resize-none rounded-xl border-2 border-slate-200 p-4 text-slate-700 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
        />
        {submitted && (
           <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded shadow-sm text-xs font-bold border border-emerald-200 flex items-center gap-1">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
             Terkirim
           </div>
        )}
      </div>
      
      <div className="mt-5 flex gap-3">
        {!submitted ? (
           <button 
             disabled={!answer.trim()}
             onClick={() => setSubmitted(true)}
             className="w-full bg-slate-800 font-bold text-white py-3 rounded-xl shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] hover:bg-slate-900 transition disabled:opacity-50 disabled:shadow-none no-print"
           >
             Kumpulkan Jawaban
           </button>
        ) : (
           <button 
             onClick={() => { setAnswer(""); setSubmitted(false); }}
             className="w-full bg-white border-2 border-slate-200 font-bold text-slate-600 py-3 rounded-xl hover:bg-slate-50 transition no-print"
           >
             Tulis Ulang
           </button>
        )}
      </div>
    </div>
  );
};
