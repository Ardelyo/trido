import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, FileText, Cpu, Clock } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../utils/translations';

interface ProcessingStatusHudProps {
  onCancel: () => void;
  className?: string;
}

export const ProcessingStatusHud: React.FC<ProcessingStatusHudProps> = ({ onCancel, className = '' }) => {
  const { t, language } = useTranslation();
  const { 
    isThinking, 
    attachedDocument, 
    selectedGeminiModel, 
    selectedOllamaModel, 
    selectedVertexModel, 
    aiPreference 
  } = useStore();

  const [elapsedSecs, setElapsedSecs] = useState<number>(0);

  useEffect(() => {
    if (!isThinking) {
      setElapsedSecs(0);
      return;
    }
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedSecs(Number(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(interval);
  }, [isThinking]);

  if (!isThinking) return null;

  const activeModel = 
    aiPreference === 'ollama' 
      ? (selectedOllamaModel || 'Ollama (Lokal)') 
      : (aiPreference === 'vertex' ? (selectedVertexModel || 'Vertex AI') : (selectedGeminiModel || 'gemini-3.8-flash'));

  // Contextual phase based on elapsed time and attached document
  const getPhaseText = () => {
    if (attachedDocument) {
      if (elapsedSecs < 2.5) {
        return language === 'en' 
          ? `Analyzing ${attachedDocument.name} (${(attachedDocument.size / 1024).toFixed(0)} KB)...` 
          : `Membaca & menganalisis ${attachedDocument.name} (${(attachedDocument.size / 1024).toFixed(0)} KB)...`;
      }
      if (elapsedSecs < 5.0) {
        return language === 'en'
          ? 'Synthesizing key topics & classroom structure...'
          : 'Merancang struktur materi & peta konsep...';
      }
      return language === 'en'
        ? 'Generating whiteboard diagrams & responses...'
        : 'Menyiapkan visualisasi & catatan di kanvas...';
    }

    if (elapsedSecs < 2.0) {
      return language === 'en' 
        ? 'Analyzing pedagogical prompt & instructions...' 
        : 'Menganalisis instruksi & konteks materi...';
    }
    if (elapsedSecs < 4.5) {
      return language === 'en'
        ? 'Structuring whiteboard tools & mindmap branches...'
        : 'Merancang tata letak visual & diagram interaktif...';
    }
    return language === 'en'
      ? 'Finalizing response & drawing to board...'
      : 'Menyusun penjelasan & menyiapkan papan tulis...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-md bg-white rounded-3xl border-2 border-[#1550aa]/15 shadow-md p-4 flex flex-col gap-3 font-sans select-none pointer-events-auto ${className}`}
    >
      {/* Top Header: Model, Status & Cancel Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#1550aa] text-white shrink-0 shadow-xs">
            <Sparkles size={16} className="animate-pulse" />
            <span className="absolute -inset-1 rounded-full border border-[#ffcc00]/50 animate-ping opacity-40 pointer-events-none" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[13px] text-[#0a1a3a] tracking-tight truncate">
                {language === 'en' ? 'Trido AI Processing' : 'Trido Sedang Berpikir'}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1550aa] border border-blue-200/60 truncate">
                {activeModel}
              </span>
            </div>
          </div>
        </div>

        {/* Live Elapsed Timer & Cancel Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 font-semibold bg-slate-50 px-2 py-1 rounded-full border border-slate-200/70">
            <Clock size={12} className="text-[#1550aa]" />
            <span>{elapsedSecs.toFixed(1)}s</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Batalkan Tugas AI"
          >
            <X size={13} strokeWidth={2.5} />
            <span className="hidden sm:inline">{language === 'en' ? 'Cancel' : 'Batal'}</span>
          </button>
        </div>
      </div>

      {/* Middle: Active Phase & Document Indicator */}
      <div className="space-y-1.5">
        {attachedDocument && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-[#1550aa] font-semibold truncate">
            <FileText size={13} className="shrink-0" />
            <span className="truncate">{attachedDocument.name}</span>
          </div>
        )}
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1550aa] animate-ping" />
          <span>{getPhaseText()}</span>
        </div>
      </div>

      {/* Bottom: Solid Indeterminate Progress Line (Strictly Zero Gradient) */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ left: "-35%", width: "35%" }}
          animate={{ left: "100%", width: "45%" }}
          transition={{ duration: 1.1, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 bg-[#ffcc00] rounded-full"
        />
      </div>
    </motion.div>
  );
};

export default ProcessingStatusHud;
