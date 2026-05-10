import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

interface AiStatusBadgeProps {
  status: {
    text: string;
    detail: string;
    color: string;
    dot: string;
    action?: string | null;
  };
  onPullModel: () => void;
}

export const AiStatusBadge: React.FC<AiStatusBadgeProps> = ({ status, onPullModel }) => {
  return (
    <div className={`flex items-center gap-3 ${status.color} backdrop-blur px-5 py-2 rounded-[1.25rem] border shadow-sm transition-colors group relative`}>
      <div className={`w-2 h-2 rounded-full ${status.dot}`} />
      <div className="flex flex-col">
        <span className="font-bold leading-tight">{status.text}</span>
        <span className="text-[10px] opacity-70 font-medium leading-tight">{status.detail}</span>
      </div>

      {status.action === 'PULL_MODEL' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPullModel();
          }}
          className="ml-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95"
        >
          Unduh Model
        </button>
      )}
    </div>
  );
};
