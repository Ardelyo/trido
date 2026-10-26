import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, AlertTriangle, Undo2, X } from 'lucide-react';
import { useStore } from '../store';
import { spring } from '../design/motion';

interface AiResultBarProps {
  className?: string;
}

/**
 * Appears after the AI finishes a turn that changed the board: what changed, plus one-tap undo of the
 * whole turn. Failures that could not be applied are shown in amber so nothing fails silently.
 */
export const AiResultBar: React.FC<AiResultBarProps> = ({ className = '' }) => {
  const tx = useStore(s => s.aiTransaction);
  const isBusy = useStore(s => s.isThinking || s.isActing);
  const revert = useStore(s => s.revertAiTransaction);
  const clear = useStore(s => s.setAiTransaction);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  // Auto-hide after a while (kept in store so Undo still works from history/shortcut)
  useEffect(() => {
    if (!tx) return;
    const id = tx.id;
    const timer = setTimeout(() => setDismissedId(id), tx.failures.length ? 30000 : 15000);
    return () => clearTimeout(timer);
  }, [tx]);

  const visible = !!tx && !isBusy && dismissedId !== tx.id;
  const hasFailures = !!tx && tx.failures.length > 0;
  const headline = tx
    ? tx.notes[0]
      ?? (hasFailures ? 'Sebagian perubahan tidak diterapkan' : `${tx.actionCount} perubahan diterapkan`)
    : '';
  const extra = tx ? Math.max(0, tx.notes.length - 1) : 0;

  return (
    <AnimatePresence>
      {visible && tx && (
        <motion.div
          key={tx.id}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={spring.snappy}
          className={`pointer-events-auto flex items-center gap-2 max-w-[min(92vw,460px)] pl-3 pr-1.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xl border shadow-lift ${
            hasFailures ? 'border-amber-300/80' : 'border-emerald-200/80'
          } ${className}`}
        >
          <span className={`grid place-items-center w-6 h-6 rounded-full shrink-0 ${hasFailures ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {hasFailures ? <AlertTriangle size={13} /> : <Check size={13} strokeWidth={3} />}
          </span>
          <span className="text-[12.5px] font-semibold text-slate-700 truncate min-w-0">
            {headline}{extra > 0 && <span className="text-slate-400 font-medium"> · +{extra} lainnya</span>}
          </span>
          <button
            type="button"
            onClick={() => { revert(); setDismissedId(tx.id); }}
            className="touch-target flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-bold text-trido bg-trido/10 hover:bg-trido hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Batalkan semua perubahan dari permintaan AI ini"
          >
            <Undo2 size={13} /> Batalkan
          </button>
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => { setDismissedId(tx.id); if (!hasFailures) clear(null); }}
            className="grid place-items-center w-7 h-7 rounded-full text-slate-400 hover:bg-slate-100 shrink-0 cursor-pointer"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
