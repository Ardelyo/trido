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
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-colors duration-200 cursor-pointer ${
      active ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-slate-400'} />
    <span className="text-[14px] font-medium">{label}</span>
  </motion.button>
);
