import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, WifiOff, Cloud, HardDrive, AlertTriangle, Settings } from 'lucide-react';

interface AiStatusBadgeProps {
  status: {
    mode?: 'gemini' | 'ollama' | 'vertex' | 'unavailable';
    text: string;
    detail: string;
    color: string;
    dot: string;
    action?: string | null;
  };
  onPullModel: () => void;
  onClick?: () => void;
}

export const AiStatusBadge: React.FC<AiStatusBadgeProps> = ({ status, onPullModel, onClick }) => {
  const isOffline = status.mode === 'ollama' || status.text.toLowerCase().includes('offline');

  return (
    <div
      onClick={onClick}
      title="Klik untuk membuka pengaturan model AI / beralih ke Ollama offline"
      className={`flex items-center gap-3 ${status.color} backdrop-blur px-4 py-2 rounded-[1.25rem] border shadow-sm transition-all group relative cursor-pointer hover:shadow-md hover:scale-[1.01] select-none`}
    >
      {/* Icon Badge */}
      <div className="flex items-center justify-center shrink-0">
        {isOffline ? (
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-700">
            <WifiOff size={14} className="stroke-[2.5]" />
          </div>
        ) : status.mode === 'vertex' ? (
          <div className="p-1 rounded-lg bg-purple-500/10 text-purple-700">
            <Sparkles size={14} className="stroke-[2.5]" />
          </div>
        ) : status.mode === 'gemini' ? (
          <div className="p-1 rounded-lg bg-blue-500/10 text-blue-700">
            <Cloud size={14} className="stroke-[2.5]" />
          </div>
        ) : (
          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-700">
            <AlertTriangle size={14} className="stroke-[2.5]" />
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${status.dot}`} />
          <span className="font-bold text-xs leading-tight">{status.text}</span>
        </div>
        <span className="text-[10px] opacity-75 font-medium leading-tight mt-0.5 max-w-[220px] truncate">
          {status.detail}
        </span>
      </div>

      {status.action === 'PULL_MODEL' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPullModel();
          }}
          className="ml-1 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          Unduh Model
        </button>
      )}

      {status.action === 'OPEN_SETTINGS' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
          className="ml-1 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <Settings size={11} /> Opsi Ollama
        </button>
      )}
    </div>
  );
};
