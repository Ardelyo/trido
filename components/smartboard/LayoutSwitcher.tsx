import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Compass, CircleDot } from 'lucide-react';
import { useStore } from '../../store';
import type { SmartboardLayoutMode } from '../../types';

interface LayoutOption {
  id: SmartboardLayoutMode;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const OPTIONS: LayoutOption[] = [
  { id: 'classic', label: 'Klasik', icon: LayoutDashboard },
  { id: 'dock', label: 'Dok Pintar', icon: Compass },
  { id: 'radial', label: 'Radial', icon: CircleDot },
];

export const LayoutSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { smartboardLayoutMode, setSmartboardLayoutMode } = useStore();

  return (
    <div
      role="radiogroup"
      aria-label="Mode Tampilan Smartboard"
      className={`relative inline-flex items-center gap-1 p-1 bg-white/70 backdrop-blur-md rounded-full border border-[#0a1a3a]/10 shadow-sm ${className}`}
    >
      {OPTIONS.map((opt) => {
        const active = smartboardLayoutMode === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            onClick={() => setSmartboardLayoutMode(opt.id)}
            role="radio"
            aria-checked={active}
            className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer select-none ${
              active ? 'text-white' : 'text-[#0a1a3a]/70 hover:text-[#0a1a3a]'
            }`}
          >
            {active && (
              <motion.span
                layoutId="active-layout-pill"
                className="absolute inset-0 -z-10 rounded-full bg-[#1550aa] shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              />
            )}
            <Icon size={14} className={active ? 'text-[#ffcc00]' : 'text-[#1550aa]'} />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default LayoutSwitcher;
