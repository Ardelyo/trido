import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Cloud, CloudLightning, Pencil, Download, Settings, FilePlus, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../utils/translations';

interface SaveMenuProps {
  onExportClick: () => void;
}

export const SaveMenu: React.FC<SaveMenuProps> = ({ onExportClick }) => {
  const { t } = useTranslation();
  const { currentSessionId, sessions, saveCurrentSession, createNewSession } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedDone, setIsSavedDone] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      setTitle(session?.title || t('untitledBoard', 'Papan Tanpa Judul'));
    } else {
      setTitle(t('untitledBoard', 'Papan Tanpa Judul'));
    }
  }, [currentSessionId, sessions, isOpen, t]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSaving(true);
    await saveCurrentSession(title);
    setTimeout(() => {
      setIsSaving(false);
      setIsSavedDone(true);
      setTimeout(() => setIsSavedDone(false), 2000);
    }, 800);
  };

  const handleNewSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (title || currentSessionId) {
      saveCurrentSession(title).then(() => {
        createNewSession();
        setIsOpen(false);
      });
    } else {
      createNewSession();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-white bg-white/60 hover:bg-white backdrop-blur rounded-[1.25rem] transition-colors shadow-sm active:scale-95"
      >
        <Cloud size={16} className={isSaving ? "animate-pulse text-blue-500" : ""} /> 
        <span className="hidden md:inline">{t('save', 'Simpan')}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mobile view simple button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex sm:hidden p-2.5 text-slate-700 hover:text-slate-900 border border-white bg-white/60 hover:bg-white backdrop-blur rounded-[1.25rem] transition-colors shadow-sm active:scale-95"
      >
        <Cloud size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{t('boardName', 'Nama Papan')}</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('boardTitlePlaceholder', 'Judul Papan...')}
                  className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                  }}
                />
                <Pencil size={14} className="text-slate-400" />
              </div>
            </div>

            <div className="p-2 space-y-1">
              <button 
                onClick={handleSave}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isSaving ? <CloudLightning size={16} className="text-blue-500" /> : isSavedDone ? <Check size={16} className="text-emerald-500" /> : <Cloud size={16} />}
                  <span>{t('saveNow', 'Simpan Sekarang')}</span>
                </div>
                {isSavedDone && <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">{t('saved', 'Tersimpan')}</span>}
              </button>
              
              <button 
                onClick={handleNewSession}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FilePlus size={16} />
                {t('newBoard', 'Papan Baru')}
              </button>

              <div className="h-px w-full bg-slate-100 my-1" />

              <button 
                onClick={() => { setIsOpen(false); onExportClick(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Download size={16} />
                {t('exportBoard', 'Ekspor Papan')}
              </button>

              <button 
                onClick={() => { setIsOpen(false); useStore.getState().toggleBoardSettings(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Settings size={16} />
                {t('settings', 'Pengaturan')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
