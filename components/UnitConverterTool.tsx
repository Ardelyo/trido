import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRightLeft } from 'lucide-react';
import { useTranslation } from '../utils/translations';

const categories = {
  Length: {
    label: { id: 'Panjang', en: 'Length' },
    units: {
      id: ['Meter', 'Kilometer', 'Centimeter', 'Milimeter', 'Mil', 'Yard', 'Kaki', 'Inci'],
      en: ['Meter', 'Kilometer', 'Centimeter', 'Millimeter', 'Mile', 'Yard', 'Foot', 'Inch']
    }
  },
  Weight: {
    label: { id: 'Berat', en: 'Weight' },
    units: {
      id: ['Kilogram', 'Gram', 'Milligram', 'Ton', 'Pound', 'Ounce'],
      en: ['Kilogram', 'Gram', 'Milligram', 'Ton', 'Pound', 'Ounce']
    }
  },
  Temperature: {
    label: { id: 'Suhu', en: 'Temperature' },
    units: {
      id: ['Celsius', 'Fahrenheit', 'Kelvin'],
      en: ['Celsius', 'Fahrenheit', 'Kelvin']
    }
  },
  Volume: {
    label: { id: 'Volume', en: 'Volume' },
    units: {
      id: ['Liter', 'Mililiter', 'Galon (US)', 'Meter Kubik'],
      en: ['Liter', 'Milliliter', 'Gallon (US)', 'Cubic Meter']
    }
  }
};

export const UnitConverterTool: React.FC = () => {
  const { t, language } = useTranslation();
  const [category, setCategory] = useState<keyof typeof categories>('Length');
  const [fromUnitIndex, setFromUnitIndex] = useState(0);
  const [toUnitIndex, setToUnitIndex] = useState(1);
  const [value, setValue] = useState('1');

  // Basic mock conversion for demo
  const convert = (val: string) => {
    if (!val) return '';
    return (parseFloat(val) * 1.5).toFixed(2); // Mock logic just for visuals
  };

  const activeLang = language === 'en' ? 'en' : 'id';
  const currentUnitsList = categories[category].units[activeLang];

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-4">
      <div className="mb-4">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">
          {t('unitConverterCategory', 'Kategori Set')}
        </label>
        <select 
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
          value={category}
          onChange={(e) => {
            const cat = e.target.value as keyof typeof categories;
            setCategory(cat);
            setFromUnitIndex(0);
            setToUnitIndex(1);
          }}
        >
          {(Object.keys(categories) as Array<keyof typeof categories>).map(catKey => (
            <option key={catKey} value={catKey}>
              {categories[catKey].label[activeLang]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <select 
            className="bg-transparent font-bold text-slate-500 text-sm mb-2 outline-none" 
            value={fromUnitIndex} 
            onChange={e => setFromUnitIndex(parseInt(e.target.value))}
          >
            {currentUnitsList.map((unitName, index) => (
              <option key={index} value={index}>{unitName}</option>
            ))}
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
          <select 
            className="bg-transparent font-bold text-slate-500 text-sm mb-2 outline-none" 
            value={toUnitIndex} 
            onChange={e => setToUnitIndex(parseInt(e.target.value))}
          >
            {currentUnitsList.map((unitName, index) => (
              <option key={index} value={index}>{unitName}</option>
            ))}
          </select>
          <div className="w-full text-3xl font-black text-slate-800">
            {convert(value)}
          </div>
        </div>
      </div>
    </div>
  );
};
