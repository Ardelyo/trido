import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { toast, ToastEvent } from '../utils/toast';

interface ToastItem extends ToastEvent {}

const ICON_MAP = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
};

const COLOR_MAP = {
  success: { bg: 'bg-emerald-50/98 border-emerald-100', icon: 'text-emerald-500', bar: 'bg-emerald-400' },
  error:   { bg: 'bg-rose-50/98 border-rose-100',      icon: 'text-rose-500',    bar: 'bg-rose-400' },
  info:    { bg: 'bg-blue-50/98 border-blue-100',       icon: 'text-blue-500',    bar: 'bg-blue-400' },
  warning: { bg: 'bg-amber-50/98 border-amber-100',     icon: 'text-amber-500',   bar: 'bg-amber-400' },
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    return toast.subscribe((event) => {
      setToasts(prev => [...prev.slice(-4), event]); // max 5 toasts
      setTimeout(() => remove(event.id), event.duration);
    });
  }, [remove]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col-reverse gap-2 pointer-events-none items-center min-w-0 w-full px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => {
          const Icon = ICON_MAP[t.type];
          const colors = COLOR_MAP[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl shadow-black/8 backdrop-blur-2xl ${colors.bg} min-w-[280px] max-w-[400px] relative overflow-hidden`}
            >
              {/* Progress bar */}
              <motion.div
                className={`absolute bottom-0 left-0 h-[2.5px] ${colors.bar}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: t.duration / 1000, ease: 'linear' }}
              />
              <Icon size={18} className={`${colors.icon} shrink-0 mt-0.5`} />
              <span className="flex-1 text-[13.5px] font-semibold text-slate-800 leading-snug">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 -mt-0.5 -mr-0.5 p-0.5 rounded-md hover:bg-slate-100"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
