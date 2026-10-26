import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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

  // Contextual phase & step index (0, 1, 2) based on elapsed time and attached document
  const currentStepIndex = elapsedSecs < 2.0 ? 0 : elapsedSecs < 4.5 ? 1 : 2;

  const pedagogicalInsights = language === 'en'
    ? [
        'Tip: Say "Expand the branch on..." to update existing mindmaps in-place without recreating.',
        'Tip: Combine multiple tasks in one sentence — e.g. "Create a mindmap and start a 10m timer".',
        'Tip: Double-click any widget header to enter distraction-free Fullscreen Focus Mode.'
      ]
    : [
        'Tips: Ucapkan "Tambahkan cabang..." untuk memperbarui peta konsep secara in-place tanpa duplikasi.',
        'Tips: Gabungkan beberapa instruksi sekaligus — misal "Buat mindmap dan pasang timer 10 menit".',
        'Tips: Klik ganda judul widget apa pun untuk membuka Mode Fokus Layar Penuh.'
      ];
  const activeInsight = pedagogicalInsights[Math.floor(elapsedSecs / 3.2) % pedagogicalInsights.length];

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

  const steps = language === 'en'
    ? ['1. Understand', '2. Plan Board', '3. Render']
    : ['1. Pahami Konteks', '2. Tata Spasial', '3. Render Papan'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-md bg-white rounded-sheet border-2 border-trido/15 shadow-md p-4 flex flex-col gap-3 font-sans select-none pointer-events-auto ${className}`}
    >
      {/* Top Header: Model, Status & Cancel Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-trido text-white shrink-0 shadow-xs">
            <Sparkles size={16} className="animate-pulse" />
            <span className="absolute -inset-1 rounded-full border border-sun/50 animate-ping opacity-40 pointer-events-none" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[13px] text-ink tracking-tight truncate">
                {language === 'en' ? 'Trido AI Processing' : 'Trido Sedang Berpikir'}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-trido/5 text-trido border border-trido/12 truncate">
                {activeModel}
              </span>
            </div>
          </div>
        </div>

        {/* Live Elapsed Timer & Cancel Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 font-semibold bg-slate-50 px-2 py-1 rounded-full border border-slate-200/70">
            <Clock size={12} className="text-trido" />
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
          <div className="flex items-center gap-2 px-2.5 py-1 bg-trido/4 rounded-xl border border-trido/10 text-xs text-trido font-semibold truncate">
            <FileText size={13} className="shrink-0" />
            <span className="truncate">{attachedDocument.name}</span>
          </div>
        )}
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-trido animate-ping" />
          <span>{getPhaseText()}</span>
        </div>
      </div>

      {/* Horizontal Step Progress Trace (IKEA Manual Style) */}
      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
        {steps.map((label, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div
              key={label}
              className={`px-2 py-1 rounded-full text-[10px] font-bold text-center transition-colors border ${
                isCurrent
                  ? 'bg-trido text-white border-trido'
                  : isDone
                  ? 'bg-sun text-ink border-sun'
                  : 'bg-slate-50 text-slate-400 border-slate-200/70'
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Rotating Pedagogical Insight */}
      <div className="text-[11px] text-slate-500 font-medium bg-paper/40 px-3 py-1.5 rounded-2xl border border-ink/5 leading-snug">
        {activeInsight}
      </div>

      {/* Bottom: Solid Indeterminate Progress Line (Strictly Zero Gradient) */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ left: "-35%", width: "35%" }}
          animate={{ left: "100%", width: "45%" }}
          transition={{ duration: 1.1, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 bg-sun rounded-full"
        />
      </div>
    </motion.div>
  );
};

export default ProcessingStatusHud;
