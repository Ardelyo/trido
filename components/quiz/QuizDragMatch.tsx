import React, { useState } from 'react';

interface QuizDragMatchProps {
  config: {
    pairs: { left: string; right: string }[];
  };
}

export const QuizDragMatch: React.FC<QuizDragMatchProps> = ({ config }) => {
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  
  // Shuffle right items on mount
  const [rightItems] = useState(() => {
    return (config.pairs || []).map((p, i) => ({ text: p.right, originalIndex: i })).sort(() => Math.random() - 0.5);
  });

  const handleLeftClick = (index: number) => {
    if (submitted) return;
    if (selectedLeft === index) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(index);
    }
  };

  const handleRightClick = (rightIdx: number) => {
    if (submitted) return;
    if (selectedLeft !== null) {
      setMatches(prev => {
        const newMatches = { ...prev };
        // Remove if previously matched
        const existingRightMatchKey = Object.keys(newMatches).find(k => newMatches[Number(k)] === rightIdx);
        if (existingRightMatchKey) delete newMatches[Number(existingRightMatchKey)];
        newMatches[selectedLeft] = rightIdx;
        return newMatches;
      });
      setSelectedLeft(null);
    } else {
       // if we click right side without left side selected, perhaps remove match
       setMatches(prev => {
           const newMatches = {...prev};
           const key = Object.keys(newMatches).find(k => newMatches[Number(k)] === rightIdx);
           if (key) { delete newMatches[Number(key)]; return newMatches; }
           return prev;
       });
    }
  };

  const isAllMatched = Object.keys(matches).length === (config.pairs?.length || 0);

  return (
    <div className="flex w-full h-full flex-col bg-slate-50/50 p-6 font-sans">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-fuchsia-100 p-1.5 rounded-md">
            <svg className="w-5 h-5 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
        </div>
        <span className="text-sm font-bold text-fuchsia-600 uppercase tracking-wide">Cocokkan Pasangan</span>
      </div>

      <div className="flex-1 overflow-auto mb-4 custom-scrollbar">
        <div className="flex justify-between gap-6 px-1 h-full">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-3">
            {(config.pairs || []).map((pair, i) => {
              const matchedRightIdx = matches[i];
              let clz = "border-slate-200 bg-white text-slate-700 hover:border-fuchsia-300";
              if (submitted) {
                 const isCorrect = rightItems[matchedRightIdx]?.originalIndex === i;
                 clz = isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-rose-400 bg-rose-50 text-rose-800";
              } else {
                 if (selectedLeft === i) clz = "border-fuchsia-500 ring-2 ring-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 shadow-sm";
                 else if (matchedRightIdx !== undefined) clz = "border-slate-300 bg-slate-100 text-slate-500 opacity-80";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleLeftClick(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-sm leading-relaxed ${clz}`}
                >
                  {pair.left}
                </button>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="flex-1 flex flex-col gap-3">
            {rightItems.map((item, rightIdx) => {
              const isMatchedByLeftIdx = Object.keys(matches).find(k => matches[Number(k)] === rightIdx);
              let clz = "border-slate-200 bg-white text-slate-700 hover:border-slate-400";
              if (submitted) {
                 if (isMatchedByLeftIdx !== undefined) {
                    const isCorrect = Number(isMatchedByLeftIdx) === item.originalIndex;
                    clz = isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-rose-400 bg-rose-50 text-rose-800";
                 } else {
                    clz = "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
                 }
              } else {
                 if (isMatchedByLeftIdx !== undefined) clz = "border-slate-800 bg-slate-800 text-white font-medium shadow-md scale-95";
                 else if (selectedLeft !== null) clz = "border-fuchsia-300 border-dashed bg-fuchsia-50/50 hover:bg-fuchsia-100 cursor-pointer";
              }

              return (
                <button
                  key={rightIdx}
                  onClick={() => handleRightClick(rightIdx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-sm leading-relaxed block ${clz}`}
                >
                  <span className="pointer-events-none">{item.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-200 pt-4 mt-2">
        {!submitted ? (
           <button 
             disabled={!isAllMatched}
             onClick={() => setSubmitted(true)}
             className="w-full bg-slate-800 font-bold text-white py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] hover:bg-slate-900 transition disabled:opacity-50 disabled:shadow-none no-print"
           >
             Cek Jawaban
           </button>
        ) : (
           <button 
             onClick={() => { setMatches({}); setSubmitted(false); setSelectedLeft(null); }}
             className="w-full bg-white border border-slate-200 font-bold text-slate-600 py-3 block text-center rounded-xl hover:bg-slate-50 transition drop-shadow-sm no-print"
           >
             Ulangi
           </button>
        )}
      </div>
    </div>
  );
};
