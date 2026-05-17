import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Save, Trash2, List, Type, Bold, Italic, Link } from 'lucide-react';
import { useTranslation } from '../utils/translations';

export const NotesTool: React.FC = () => {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  
  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100 flex-wrap">
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors"><Bold size={16} /></button>
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors"><Italic size={16} /></button>
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors"><List size={16} /></button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors ml-auto"><Save size={16} /></button>
        <button onClick={() => setNote('')} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
      </div>

      {/* Editor */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('notesPlaceholder', 'Tulis catatan pelajaran di sini...')}
        className="flex-1 p-6 text-[15px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none font-medium placeholder:text-slate-300"
      />

      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
         <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{t('autoSaveActive', 'Auto-save aktif')}</span>
         <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-emerald-400" />
            <div className="w-1 h-1 rounded-full bg-emerald-400" />
         </div>
      </div>
    </div>
  );
};
