import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Compass, CircleDot } from 'lucide-react';
import { useStore } from '../../store';
import type { SmartboardLayoutMode } from '../../types';
import { spring } from '../../design/motion';

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
      className={`relative inline-flex items-center gap-1 p-1 bg-white/70 backdrop-blur-md rounded-full border border-ink/10 shadow-sm ${className}`}
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
              active ? 'text-white' : 'text-ink/70 hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId="active-layout-pill"
                className="absolute inset-0 -z-10 rounded-full bg-trido shadow-sm"
                transition={spring.snappy}
              />
            )}
            <Icon size={14} className={active ? 'text-sun' : 'text-trido'} />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default LayoutSwitcher;
