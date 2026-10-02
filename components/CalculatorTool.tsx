import React, { useState } from 'react';
import { Delete, X, Divide, Minus, Plus, Equal, Percent, RotateCcw } from 'lucide-react';

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
      const cleanExpr = fullEquation.replace(/×/g, '*').replace(/÷/g, '/');
      // Token-based safe evaluator for basic math
      const sanitized = cleanExpr.replace(/[^0-9+\-*/.%]/g, '');
      // Evaluate basic arithmetic
      const result = new Function(`return (${sanitized})`)();
      if (!isFinite(result) || isNaN(result)) {
        setDisplay('Error');
      } else {
        setDisplay(String(Number(result.toFixed(8))));
      }
      setEquation('');
      setIsDone(true);
    } catch {
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

  const btnClass = "flex items-center justify-center py-2.5 sm:py-3 text-base sm:text-lg font-bold rounded-xl transition-all active:scale-95 shadow-sm select-none cursor-pointer";
  const numClass = `${btnClass} bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80`;
  const opClass = `${btnClass} bg-blue-600 text-white hover:bg-blue-700`;
  const actionClass = `${btnClass} bg-slate-100 text-slate-600 hover:bg-slate-200`;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-3 justify-between font-sans select-none">
      {/* Display Screen */}
      <div className="flex flex-col justify-end p-3.5 mb-2 bg-white rounded-2xl shadow-inner border border-slate-200 overflow-hidden shrink-0">
        <div className="text-right text-slate-400 text-xs h-4 mb-0.5 font-mono truncate">
          {equation}
        </div>
        <div className="text-right text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-mono truncate">
          {display}
        </div>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-4 gap-2 flex-1 items-stretch">
        <button onClick={clear} className={actionClass} title="Reset"><RotateCcw size={16} /></button>
        <button onClick={() => setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display)} className={actionClass}>+/-</button>
        <button onClick={() => handleOperator('%')} className={actionClass}><Percent size={16} /></button>
        <button onClick={() => handleOperator('÷')} className={opClass}><Divide size={18} /></button>

        <button onClick={() => handleNumber('7')} className={numClass}>7</button>
        <button onClick={() => handleNumber('8')} className={numClass}>8</button>
        <button onClick={() => handleNumber('9')} className={numClass}>9</button>
        <button onClick={() => handleOperator('×')} className={opClass}><X size={18} /></button>

        <button onClick={() => handleNumber('4')} className={numClass}>4</button>
        <button onClick={() => handleNumber('5')} className={numClass}>5</button>
        <button onClick={() => handleNumber('6')} className={numClass}>6</button>
        <button onClick={() => handleOperator('-')} className={opClass}><Minus size={18} /></button>

        <button onClick={() => handleNumber('1')} className={numClass}>1</button>
        <button onClick={() => handleNumber('2')} className={numClass}>2</button>
        <button onClick={() => handleNumber('3')} className={numClass}>3</button>
        <button onClick={() => handleOperator('+')} className={opClass}><Plus size={18} /></button>

        <button onClick={() => handleNumber('0')} className={`${numClass} col-span-2`}>0</button>
        <button onClick={() => display.includes('.') ? null : setDisplay(display + '.')} className={numClass}>.</button>
        <button onClick={calculate} className={`${opClass} bg-emerald-600 hover:bg-emerald-700`}><Equal size={18} /></button>
      </div>
    </div>
  );
};
