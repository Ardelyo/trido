import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRightLeft } from 'lucide-react';

const units = {
  Panjang: ['Meter', 'Kilometer', 'Centimeter', 'Milimeter', 'Mil', 'Yard', 'Kaki', 'Inci'],
  Berat: ['Kilogram', 'Gram', 'Milligram', 'Ton', 'Pound', 'Ounce'],
  Suhu: ['Celsius', 'Fahrenheit', 'Kelvin'],
  Volume: ['Liter', 'Mililiter', 'Galon (US)', 'Meter Kubik']
};

export const UnitConverterTool: React.FC = () => {
  const [category, setCategory] = useState<keyof typeof units>('Panjang');
  const [fromUnit, setFromUnit] = useState(units['Panjang'][0]);
  const [toUnit, setToUnit] = useState(units['Panjang'][1]);
  const [value, setValue] = useState('1');

  // Basic mock conversion for demo
  const convert = (val: string) => {
    if (!val) return '';
    return (parseFloat(val) * 1.5).toFixed(2); // Mock logic just for visuals
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-4">
      <div className="mb-4">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Kategori Set</label>
        <select 
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
          value={category}
          onChange={(e) => {
            const cat = e.target.value as keyof typeof units;
            setCategory(cat);
            setFromUnit(units[cat][0]);
            setToUnit(units[cat][1]);
          }}
        >
          {Object.keys(units).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <select className="bg-transparent font-bold text-slate-500 text-sm mb-2 outline-none" value={fromUnit} onChange={e => setFromUnit(e.target.value)}>
            {units[category].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <input 
            type="number" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full text-3xl font-black text-slate-800 bg-transparent outline-none"
          />
        </div>

        <div className="flex justify-center -my-3 z-10">
          <button className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:scale-95 transition-all">
            <ArrowRightLeft size={18} />
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <select className="bg-transparent font-bold text-slate-500 text-sm mb-2 outline-none" value={toUnit} onChange={e => setToUnit(e.target.value)}>
            {units[category].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <div className="w-full text-3xl font-black text-slate-800">
            {convert(value)}
          </div>
        </div>
      </div>
    </div>
  );
};
