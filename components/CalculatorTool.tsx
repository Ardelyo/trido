
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Delete, X, Divide, Minus, Plus, Equal, Hash, Percent, RotateCcw } from 'lucide-react';

export const CalculatorTool: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleNumber = (num: string) => {
    if (isDone || display === '0') {
      setDisplay(num);
      setIsDone(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
    setIsDone(false);
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      // Using Function constructor as a safer alternative to eval for simple math if needed, 
      // but here we can just parse it simply or use eval if we trust the input source (which is internal state)
      // For a real app, a math parser library is better.
      const result = eval(fullEquation.replace('×', '*').replace('÷', '/'));
      setDisplay(String(Number(result.toFixed(8))));
      setEquation('');
      setIsDone(true);
    } catch (e) {
      setDisplay('Error');
      setEquation('');
      setIsDone(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setIsDone(false);
  };

  const btnClass = "flex items-center justify-center p-4 text-xl font-bold rounded-2xl transition-all active:scale-95 shadow-sm";
  const numClass = `${btnClass} bg-white text-slate-700 hover:bg-slate-50 border border-slate-100`;
  const opClass = `${btnClass} bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-200`;
  const actionClass = `${btnClass} bg-slate-100 text-slate-500 hover:bg-slate-200`;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-4 font-sans">
      <div className="flex-1 flex flex-col justify-end p-6 mb-4 bg-white rounded-3xl shadow-inner border border-slate-100 overflow-hidden">
        <div className="text-right text-slate-400 text-sm h-6 mb-1 font-mono truncate">
          {equation}
        </div>
        <div className="text-right text-4xl font-black text-slate-800 tracking-tighter font-mono truncate">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <button onClick={clear} className={actionClass}><RotateCcw size={20} /></button>
        <button onClick={() => setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display)} className={actionClass}>+/-</button>
        <button onClick={() => handleOperator('%')} className={actionClass}><Percent size={20} /></button>
        <button onClick={() => handleOperator('÷')} className={opClass}><Divide size={24} /></button>

        <button onClick={() => handleNumber('7')} className={numClass}>7</button>
        <button onClick={() => handleNumber('8')} className={numClass}>8</button>
        <button onClick={() => handleNumber('9')} className={numClass}>9</button>
        <button onClick={() => handleOperator('×')} className={opClass}><X size={24} /></button>

        <button onClick={() => handleNumber('4')} className={numClass}>4</button>
        <button onClick={() => handleNumber('5')} className={numClass}>5</button>
        <button onClick={() => handleNumber('6')} className={numClass}>6</button>
        <button onClick={() => handleOperator('-')} className={opClass}><Minus size={24} /></button>

        <button onClick={() => handleNumber('1')} className={numClass}>1</button>
        <button onClick={() => handleNumber('2')} className={numClass}>2</button>
        <button onClick={() => handleNumber('3')} className={numClass}>3</button>
        <button onClick={() => handleOperator('+')} className={opClass}><Plus size={24} /></button>

        <button onClick={() => handleNumber('0')} className={`${numClass} col-span-2`}>0</button>
        <button onClick={() => display.includes('.') ? null : setDisplay(display + '.')} className={numClass}>.</button>
        <button onClick={calculate} className={`${opClass} bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200`}><Equal size={24} /></button>
      </div>
    </div>
  );
};
