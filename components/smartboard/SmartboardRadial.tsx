import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Clock, PencilRuler, FileText, HelpCircle, Activity, Network,
  Users, CheckSquare, Mic, Pencil, Eraser, Square, Type, Sparkles
} from 'lucide-react';
import { useStore } from '../../store';
import { toast } from '../../utils/toast';

interface RadialItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  onClick: (store: any) => void;
}

const INNER_RING_ITEMS: RadialItemDef[] = [
  { id: 'timer', label: 'Timer', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', onClick: (s) => s.toggleTimer() },
  { id: 'calc', label: 'Kalkulator', icon: PencilRuler, color: 'text-cyan-600', bg: 'bg-cyan-100', onClick: (s) => s.toggleCalculator() },
  { id: 'notes', label: 'Catatan', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-100', onClick: (s) => s.toggleNotes() },
  { id: 'quiz', label: 'Kuis', icon: HelpCircle, color: 'text-fuchsia-600', bg: 'bg-fuchsia-100', onClick: (s) => s.toggleQuiz() },
  { id: 'pencil', label: 'Pena', icon: Pencil, color: 'text-blue-600', bg: 'bg-blue-100', onClick: (s) => s.setActiveTool('PENCIL') },
  { id: 'ai', label: 'Asisten', icon: Sparkles, color: 'text-[#1550aa]', bg: 'bg-[#ffcc00]', onClick: (s) => s.toggleAiDrawer() },
];

const OUTER_RING_ITEMS: RadialItemDef[] = [
  { id: 'periodic', label: 'Periodik', icon: Network, color: 'text-teal-600', bg: 'bg-teal-100', onClick: (s) => s.togglePeriodicTable() },
  { id: 'convert', label: 'Konversi', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100', onClick: (s) => s.toggleUnitConverter() },
  { id: 'attendance', label: 'Absensi', icon: Users, color: 'text-sky-600', bg: 'bg-sky-100', onClick: (s) => s.toggleAttendance() },
  { id: 'todo', label: 'Tugas', icon: CheckSquare, color: 'text-emerald-700', bg: 'bg-emerald-100', onClick: (s) => s.toggleTodoList() },
  { id: 'shape', label: 'Bentuk', icon: Square, color: 'text-indigo-600', bg: 'bg-indigo-100', onClick: (s) => s.setActiveTool('RECTANGLE') },
  { id: 'text', label: 'Teks', icon: Type, color: 'text-emerald-600', bg: 'bg-emerald-100', onClick: (s) => s.setActiveTool('TEXT') },
  { id: 'eraser', label: 'Penghapus', icon: Eraser, color: 'text-rose-600', bg: 'bg-rose-100', onClick: (s) => s.setActiveTool('ERASER') },
];

export const SmartboardRadial: React.FC = () => {
  const store = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const handlePick = (item: RadialItemDef) => {
    setHighlighted(item.id);
    setTimeout(() => {
      item.onClick(store);
      setIsOpen(false);
      setHighlighted(null);
    }, 180);
  };

  const toggleOpen = () => setIsOpen((prev) => !prev);

  return (
    <>
      {/* Dimmed backdrop when radial is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-[#0a1a3a]/25 backdrop-blur-[2px] pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Floating Center-Bottom Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none">
        {/* Radial Arc Menu */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-0 left-0 h-0 w-0 pointer-events-none">
              {/* Inner Ring (r: 120px) */}
              {INNER_RING_ITEMS.map((item, i) => {
                const total = INNER_RING_ITEMS.length;
                // Semicircle from PI to 2*PI (angle above the button)
                const angle = Math.PI + ((i + 0.5) / total) * Math.PI;
                const radius = 126;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const Icon = item.icon;
                const isHl = highlighted === item.id;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{
                      x,
                      y,
                      scale: isHl ? 1.25 : 1,
                      opacity: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 380,
                        damping: 22,
                        delay: i * 0.026,
                      },
                    }}
                    exit={{
                      x: 0,
                      y: 0,
                      scale: 0,
                      opacity: 0,
                      transition: { duration: 0.18, delay: (total - i) * 0.012 },
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePick(item)}
                    style={{ marginLeft: -32, marginTop: -32 }}
                    className={`pointer-events-auto absolute w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-white transition-shadow cursor-pointer ${
                      item.bg
                    } ${isHl ? 'ring-4 ring-[#ffcc00]' : 'hover:shadow-xl'}`}
                  >
                    <Icon size={24} className={item.color} />
                    <span className="absolute -bottom-5 px-2 py-0.5 rounded-full bg-[#0a1a3a] text-white text-[10px] font-bold whitespace-nowrap shadow-xs pointer-events-none">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}

              {/* Outer Ring (r: 215px) */}
              {OUTER_RING_ITEMS.map((item, i) => {
                const total = OUTER_RING_ITEMS.length;
                const angle = Math.PI + ((i + 0.5) / total) * Math.PI;
                const radius = 225;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const Icon = item.icon;
                const isHl = highlighted === item.id;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{
                      x,
                      y,
                      scale: isHl ? 1.25 : 1,
                      opacity: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 360,
                        damping: 22,
                        delay: 0.08 + i * 0.024,
                      },
                    }}
                    exit={{
                      x: 0,
                      y: 0,
                      scale: 0,
                      opacity: 0,
                      transition: { duration: 0.18, delay: (total - i) * 0.01 },
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePick(item)}
                    style={{ marginLeft: -28, marginTop: -28 }}
                    className={`pointer-events-auto absolute w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-white transition-shadow cursor-pointer ${
                      item.bg
                    } ${isHl ? 'ring-4 ring-[#ffcc00]' : 'hover:shadow-xl'}`}
                  >
                    <Icon size={20} className={item.color} />
                    <span className="absolute -bottom-5 px-2 py-0.5 rounded-full bg-[#0a1a3a] text-white text-[10px] font-bold whitespace-nowrap shadow-xs pointer-events-none">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Center Main Radial Trigger FAB */}
        <div className="relative pointer-events-auto">
          {/* Subtle pulsating halo when closed */}
          {!isOpen && (
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-2 rounded-full border-2 border-[#ffcc00]"
            />
          )}

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleOpen}
            className={`w-18 h-18 rounded-full flex items-center justify-center shadow-[0_12px_36px_rgba(21,80,170,0.35)] transition-colors cursor-pointer border-3 border-white ${
              isOpen ? 'bg-[#0a1a3a] text-white' : 'bg-[#1550aa] text-white'
            }`}
            title="Buka Menu Alat Lingkaran (Radial Quick-Menu)"
          >
            <motion.div
              animate={{ rotate: isOpen ? 135 : 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
            >
              <Plus size={34} className={isOpen ? 'text-[#ffcc00]' : 'text-white'} />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </>
  );
};

export default SmartboardRadial;
