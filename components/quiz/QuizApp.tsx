import React, { useState } from 'react';
import { toast } from '../../utils/toast';

interface QuizQuestion {
  type: 'multiple_choice' | 'essay';
  question: string;
  options?: string[];
  correctIndex?: number;
  expectedAnswer?: string;
}

interface QuizAppProps {
  config: {
    title?: string;
    questions?: QuizQuestion[];
  };
}

export const QuizApp: React.FC<QuizAppProps> = ({ config }) => {
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions = config.questions || [];
  const title = config.title || 'Kuis Interaktif';

  const handleCopy = () => {
    let text = `${title}\n\n`;
    questions.forEach((q, i) => {
      text += `${i + 1}. ${q.question}\n`;
      if (q.type === 'multiple_choice' && q.options) {
        q.options.forEach((opt, j) => {
          text += `   ${String.fromCharCode(65 + j)}. ${opt}\n`;
        });
      }
      text += '\n';
    });
    navigator.clipboard.writeText(text);
    toast.success('Kuis berhasil disalin!');
  };

  const calculateScore = () => {
    let correct = 0;
    let totalMCQ = 0;
    questions.forEach((q, i) => {
      if (q.type === 'multiple_choice') {
        totalMCQ++;
        if (answers[i] === q.correctIndex) {
          correct++;
        }
      }
    });
    return { correct, total: totalMCQ };
  };

  const { correct, total } = calculateScore();

  return (
    <div className="flex w-full h-full flex-col bg-white p-6 font-sans relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 leading-snug">
          {title}
        </h3>
        <button 
          onClick={handleCopy}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors no-print"
          title="Salin Teks Kuis"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto pr-4 custom-scrollbar pb-10">
        {questions.length === 0 ? (
          <div className="text-center text-slate-500 py-10">Tidak ada soal dalam kuis ini.</div>
        ) : (
          questions.map((q, i) => {
            return (
              <div key={i} className="border-b border-slate-100 pb-6 last:border-0">
                <div className="font-bold text-slate-700 mb-3 flex gap-2">
                  <span className="text-indigo-600">{i + 1}.</span> 
                  <span>{q.question}</span>
                </div>

                {q.type === 'multiple_choice' && (
                  <div className="space-y-2 ml-6">
                    {(q.options || []).map((opt, j) => {
                      const isSelected = answers[i] === j;
                      const isCorrect = submitted && j === q.correctIndex;
                      const isWrong = submitted && isSelected && j !== q.correctIndex;

                      let optClass = "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300";
                      
                      if (submitted) {
                        if (isCorrect) {
                          optClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-medium ring-1 ring-emerald-500";
                        } else if (isWrong) {
                          optClass = "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-400";
                        } else {
                          optClass = "border-slate-100 text-slate-400 opacity-60";
                        }
                      } else if (isSelected) {
                        optClass = "border-indigo-500 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-500";
                      }

                      return (
                        <button
                          key={j}
                          onClick={() => !submitted && setAnswers({ ...answers, [i]: j })}
                          className={`w-full rounded-xl border-2 p-3 text-left transition-all duration-200 ${optClass} flex items-center gap-3`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                            ${submitted && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 
                              (submitted && isWrong ? 'border-rose-400 bg-rose-400 text-white' : 
                              (isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'))
                            }
                          `}>
                            {submitted && isCorrect && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            {submitted && isWrong && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
                          </div>
                          <span className="text-[14px]">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'essay' && (
                  <div className="ml-6">
                    <textarea 
                      placeholder="Ketik jawaban Anda di sini..."
                      value={answers[i] || ''}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      disabled={submitted}
                      className="w-full h-24 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    {submitted && q.expectedAnswer && (
                      <div className="mt-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 block mb-1">Kunci Jawaban Ekspektasi</span>
                        <p className="text-sm font-medium text-indigo-800">{q.expectedAnswer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {questions.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col gap-3 shrink-0">
          {!submitted ? (
            <button 
              onClick={() => setSubmitted(true)}
              className="w-full bg-indigo-600 font-bold text-white py-3 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition uppercase tracking-widest text-xs no-print"
            >
              Selesaikan Kuis
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              {total > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider mb-1">Skor Pilihan Ganda</span>
                  <span className="text-xl font-black text-indigo-600">{correct} / {total}</span>
                </div>
              )}
              <button 
                onClick={() => { setAnswers({}); setSubmitted(false); }}
                className="w-full bg-slate-100 font-bold text-slate-600 py-3 rounded-xl hover:bg-slate-200 transition text-xs uppercase tracking-widest no-print"
              >
                Ulangi Kuis
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
};
