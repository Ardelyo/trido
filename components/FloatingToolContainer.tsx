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
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{ 
            left: 0, 
            top: 0, 
            right: typeof window !== 'undefined' ? window.innerWidth - width : 1000, 
            bottom: typeof window !== 'undefined' ? window.innerHeight - height : 1000 
          }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{ 
            width, 
            height,
            top: defaultPosition.y,
            left: defaultPosition.x,
          }}
          className="fixed z-[60] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="h-14 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing shrink-0 group">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                   <Icon size={16} />
                </div>
                <span className="text-[14px] font-extrabold text-slate-800 tracking-tight">{title}</span>
             </div>
             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden relative">
             {children}
          </div>

          {/* Grip Indicator */}
          <div className="absolute right-1 bottom-1 w-4 h-4 cursor-nwse-resize opacity-20">
             <svg viewBox="0 0 10 10" className="fill-slate-400">
               <path d="M10 10H8V8H10V10ZM10 6H8V4H10V6ZM6 10H4V8H6V10ZM6 6H4V4H6V6ZM10 2H8V0H10V2ZM2 10H0V8H2V10Z" />
             </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
