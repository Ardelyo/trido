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

  const convert = (val: string) => {
    if (!val) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    if (fromUnitIndex === toUnitIndex) return num.toFixed(2);

    if (category === 'Length') {
      const toMeter = [1, 1000, 0.01, 0.001, 1609.344, 0.9144, 0.3048, 0.0254];
      const meters = num * (toMeter[fromUnitIndex] ?? 1);
      const res = meters / (toMeter[toUnitIndex] ?? 1);
      return Number(res.toPrecision(6)).toString();
    }
    if (category === 'Weight') {
      const toGram = [1000, 1, 0.001, 1000000, 453.59237, 28.349523125];
      const grams = num * (toGram[fromUnitIndex] ?? 1);
      const res = grams / (toGram[toUnitIndex] ?? 1);
      return Number(res.toPrecision(6)).toString();
    }
    if (category === 'Volume') {
      const toLiter = [1, 0.001, 3.785411784, 1000];
      const liters = num * (toLiter[fromUnitIndex] ?? 1);
      const res = liters / (toLiter[toUnitIndex] ?? 1);
      return Number(res.toPrecision(6)).toString();
    }
    if (category === 'Temperature') {
      // 0: Celsius, 1: Fahrenheit, 2: Kelvin
      let celsius = num;
      if (fromUnitIndex === 1) celsius = (num - 32) * (5 / 9);
      else if (fromUnitIndex === 2) celsius = num - 273.15;

      let out = celsius;
      if (toUnitIndex === 1) out = (celsius * 9) / 5 + 32;
      else if (toUnitIndex === 2) out = celsius + 273.15;
      return out.toFixed(2);
    }
    return num.toFixed(2);
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
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-trido/50"
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
            className="w-full text-3xl font-black text-ink bg-transparent outline-none"
          />
        </div>

        <div className="flex justify-center -my-3 z-10">
          <button
            type="button"
            onClick={() => {
              setFromUnitIndex(toUnitIndex);
              setToUnitIndex(fromUnitIndex);
            }}
            className="w-10 h-10 rounded-full bg-trido/50 text-white flex items-center justify-center shadow-lg hover:bg-trido active:scale-95 transition-all cursor-pointer"
            title="Tukar Satuan"
          >
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
          <div className="w-full text-3xl font-black text-ink">
            {convert(value)}
          </div>
        </div>
      </div>
    </div>
  );
};
