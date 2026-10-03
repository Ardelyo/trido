import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active = false, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.025 }}
    whileTap={{ scale: 0.975 }}
    onClick={onClick}
    className={`relative flex items-center gap-3 w-full px-4 py-3 rounded-full transition-colors cursor-pointer select-none ${
      active ? 'text-white font-bold' : 'text-[#0a1a3a]/70 hover:text-[#0a1a3a] hover:bg-slate-100/60 font-medium'
    }`}
  >
    {active && (
      <motion.span
        layoutId="active-sidebar-pill"
        className="absolute inset-0 rounded-full bg-[#1550aa] shadow-md shadow-[#1550aa]/25"
        transition={{ type: 'spring', stiffness: 440, damping: 32 }}
      />
    )}
    <Icon size={19} className={`relative z-10 transition-colors ${active ? 'text-[#ffcc00]' : 'text-[#1550aa]/80'}`} />
    <span className="relative z-10 text-[14px] tracking-tight">{label}</span>
  </motion.button>
);
