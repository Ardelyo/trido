import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, GripVertical, Maximize2, Minimize2 } from 'lucide-react';

interface FloatingToolContainerProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  icon: any;
  defaultPosition?: { x: number, y: number };
  width?: number;
  height?: number;
}

export const FloatingToolContainer: React.FC<FloatingToolContainerProps> = ({ 
  title, isOpen, onClose, children, icon: Icon, 
  defaultPosition = { x: 100, y: 100 },
  width = 340,
  height = 500
}) => {
  const safeLeft = typeof window !== 'undefined' ? Math.min(Math.max(16, defaultPosition.x), Math.max(16, window.innerWidth - width - 20)) : defaultPosition.x;
  const safeTop = typeof window !== 'undefined' ? Math.min(Math.max(60, defaultPosition.y), Math.max(60, window.innerHeight - height - 20)) : defaultPosition.y;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{ 
            left: 10, 
            top: 50, 
            right: typeof window !== 'undefined' ? Math.max(50, window.innerWidth - width - 20) : 1000, 
            bottom: typeof window !== 'undefined' ? Math.max(50, window.innerHeight - height - 20) : 1000 
          }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          style={{ 
            width, 
            maxHeight: 'calc(100vh - 80px)',
            height,
            top: safeTop,
            left: safeLeft,
          }}
          className="fixed z-[60] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing shrink-0 select-none">
             <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                   <Icon size={15} />
                </div>
                <span className="text-[13px] font-bold text-slate-800 tracking-tight">{title}</span>
             </div>
             <div className="flex items-center gap-1">
                <button 
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
             {children}
          </div>

          {/* Grip Indicator */}
          <div className="absolute right-1 bottom-1 w-3.5 h-3.5 cursor-nwse-resize opacity-25 pointer-events-none">
             <svg viewBox="0 0 10 10" className="fill-slate-400">
               <path d="M10 10H8V8H10V10ZM10 6H8V4H10V6ZM6 10H4V8H6V10ZM6 6H4V4H6V6ZM10 2H8V0H10V2ZM2 10H0V8H2V10Z" />
             </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
