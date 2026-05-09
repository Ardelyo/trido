import React from 'react';

const elements = [
  { num: 1, symbol: 'H', name: 'Hydrogen', type: 'nonmetal', col: 1, row: 1 },
  { num: 2, symbol: 'He', name: 'Helium', type: 'noble', col: 18, row: 1 },
  { num: 3, symbol: 'Li', name: 'Lithium', type: 'alkali', col: 1, row: 2 },
  { num: 4, symbol: 'Be', name: 'Beryllium', type: 'alkaline', col: 2, row: 2 },
  { num: 5, symbol: 'B', name: 'Boron', type: 'metalloid', col: 13, row: 2 },
  { num: 6, symbol: 'C', name: 'Carbon', type: 'nonmetal', col: 14, row: 2 },
  { num: 7, symbol: 'N', name: 'Nitrogen', type: 'nonmetal', col: 15, row: 2 },
  { num: 8, symbol: 'O', name: 'Oxygen', type: 'nonmetal', col: 16, row: 2 },
  { num: 9, symbol: 'F', name: 'Fluorine', type: 'halogen', col: 17, row: 2 },
  { num: 10, symbol: 'Ne', name: 'Neon', type: 'noble', col: 18, row: 2 },
  // A tiny subset for illustration
];

const getTypeColor = (type: string) => {
  switch(type) {
    case 'nonmetal': return 'bg-lime-100 text-lime-800 border-lime-200';
    case 'noble': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'alkali': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'alkaline': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'metalloid': return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'halogen': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export const PeriodicTableTool: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-auto p-4 custom-scrollbar">
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 text-center">
         <div className="font-extrabold text-slate-800 text-lg">Tabel Periodik Mini</div>
         <div className="text-xs text-slate-500 mt-1">Interaktif (Sampel Data)</div>
      </div>
      <div className="grid grid-cols-8 gap-2">
         {elements.map(el => (
           <div key={el.num} className={`p-2 rounded-xl border flex flex-col items-center justify-center aspect-square shadow-sm cursor-pointer hover:scale-105 transition-transform ${getTypeColor(el.type)}`}>
             <span className="text-[9px] font-bold opacity-50 absolute top-1 left-1.5">{el.num}</span>
             <span className="text-xl font-black">{el.symbol}</span>
             <span className="text-[8px] font-bold uppercase tracking-tighter truncate w-full text-center mt-1">{el.name}</span>
           </div>
         ))}
      </div>
    </div>
  );
};
