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
      title={`${status.text}: ${status.detail} (Klik untuk pengaturan)`}
      className={`flex items-center gap-2.5 ${status.color} backdrop-blur px-3.5 py-1.5 rounded-full border shadow-xs transition-all group relative cursor-pointer hover:shadow-sm hover:scale-[1.01] select-none`}
    >
      {/* Icon Badge */}
      <div className="flex items-center justify-center shrink-0">
        {isOffline ? (
          <div className="p-0.5 text-emerald-700">
            <WifiOff size={13} className="stroke-[2.5]" />
          </div>
        ) : status.mode === 'vertex' ? (
          <div className="p-0.5 text-purple-700">
            <Sparkles size={13} className="stroke-[2.5]" />
          </div>
        ) : status.mode === 'gemini' ? (
          <div className="p-0.5 text-blue-700">
            <Cloud size={13} className="stroke-[2.5]" />
          </div>
        ) : (
          <div className="p-0.5 text-amber-700">
            <AlertTriangle size={13} className="stroke-[2.5]" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
        <span className="font-bold text-xs tracking-tight">{status.text}</span>
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
