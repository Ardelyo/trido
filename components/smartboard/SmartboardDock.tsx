import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useAnimationControls, type MotionValue } from 'framer-motion';
import {
  Clock, PencilRuler, FileText, HelpCircle, Activity, Network, Users,
  CheckSquare, Mic, Sparkles, MousePointer, Pencil, Eraser, Square, Type
} from 'lucide-react';
import { useStore } from '../../store';
import { toast } from '../../utils/toast';

interface DockItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  isActive: (store: any) => boolean;
  onClick: (store: any) => void;
}

const DOCK_ITEMS: DockItemDef[] = [
  // 1. Drawing Essentials
  {
    id: 'select',
    label: 'Pilih & Geser',
    icon: MousePointer,
    color: 'text-slate-800',
    bg: 'bg-slate-100 hover:bg-slate-200',
    isActive: (s) => s.activeTool === 'SELECT',
    onClick: (s) => s.setActiveTool('SELECT'),
  },
  {
    id: 'pencil',
    label: 'Pena Digital',
    icon: Pencil,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100',
    isActive: (s) => s.activeTool === 'PENCIL',
    onClick: (s) => s.setActiveTool('PENCIL'),
  },
  {
    id: 'eraser',
    label: 'Penghapus',
    icon: Eraser,
    color: 'text-rose-600',
    bg: 'bg-rose-50 hover:bg-rose-100',
    isActive: (s) => s.activeTool === 'ERASER',
    onClick: (s) => s.setActiveTool('ERASER'),
  },
  {
    id: 'shape',
    label: 'Bentuk Geometri',
    icon: Square,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 hover:bg-indigo-100',
    isActive: (s) => s.activeTool === 'RECTANGLE' || s.activeTool === 'CIRCLE',
    onClick: (s) => s.setActiveTool('RECTANGLE'),
  },
  {
    id: 'text',
    label: 'Teks & Formula',
    icon: Type,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    isActive: (s) => s.activeTool === 'TEXT',
    onClick: (s) => s.setActiveTool('TEXT'),
  },

  // 2. Interactive Classroom Widgets
  {
    id: 'timer',
    label: 'Timer Kelas',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50 hover:bg-amber-100',
    isActive: (s) => s.isTimerOpen,
    onClick: (s) => s.toggleTimer(),
  },
  {
    id: 'calc',
    label: 'Kalkulator Sains',
    icon: PencilRuler,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 hover:bg-cyan-100',
    isActive: (s) => s.isCalculatorOpen,
    onClick: (s) => s.toggleCalculator(),
  },
  {
    id: 'notes',
    label: 'Catatan & Dokumen',
    icon: FileText,
    color: 'text-violet-600',
    bg: 'bg-violet-50 hover:bg-violet-100',
    isActive: (s) => s.isNotesOpen,
    onClick: (s) => s.toggleNotes(),
  },
  {
    id: 'quiz',
    label: 'Kuis Siswa',
    icon: HelpCircle,
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50 hover:bg-fuchsia-100',
    isActive: (s) => s.isQuizOpen,
    onClick: (s) => s.toggleQuiz(),
  },
  {
    id: 'periodic',
    label: 'Tabel Periodik',
    icon: Network,
    color: 'text-teal-600',
    bg: 'bg-teal-50 hover:bg-teal-100',
    isActive: (s) => s.isPeriodicTableOpen,
    onClick: (s) => s.togglePeriodicTable(),
  },
  {
    id: 'convert',
    label: 'Konversi Satuan',
    icon: Activity,
    color: 'text-orange-600',
    bg: 'bg-orange-50 hover:bg-orange-100',
    isActive: (s) => s.isUnitConverterOpen,
    onClick: (s) => s.toggleUnitConverter(),
  },
  {
    id: 'attendance',
    label: 'Absensi Siswa',
    icon: Users,
    color: 'text-sky-600',
    bg: 'bg-sky-50 hover:bg-sky-100',
    isActive: (s) => s.isAttendanceOpen,
    onClick: (s) => s.toggleAttendance(),
  },
  {
    id: 'todo',
    label: 'Daftar Tugas',
    icon: CheckSquare,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    isActive: (s) => s.isTodoListOpen,
    onClick: (s) => s.toggleTodoList(),
  },
];

function DockIcon({
  item,
  mouseX,
  store,
}: {
  item: DockItemDef;
  mouseX: MotionValue<number>;
  store: any;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const bounce = useAnimationControls();
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (v) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return 999;
    return v - box.x - box.width / 2;
  });

  // Smooth magnification spring (50px -> 74px)
  const size = useSpring(
    useTransform(distance, [-140, 0, 140], [50, 74, 50]),
    { mass: 0.1, stiffness: 220, damping: 14 }
  );

  const iconScale = useTransform(size, [50, 74], [22, 32]);
  const active = item.isActive(store);

  const handleClick = () => {
    // Energetic bounce animation
    bounce.start({
      y: [0, -22, 0, -10, 0],
      transition: { duration: 0.5, ease: 'easeOut' },
    });
    item.onClick(store);
  };

  const Icon = item.icon;

  return (
    <div className="relative flex flex-col items-center">
      {/* Tooltip on hover */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: -8, scale: 1 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute -top-9 px-2.5 py-1 rounded-full bg-[#0a1a3a] text-white text-[11px] font-bold whitespace-nowrap shadow-md pointer-events-none z-50"
        >
          {item.label}
        </motion.div>
      )}

      <motion.button
        ref={ref}
        animate={bounce}
        style={{ width: size, height: size }}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative flex items-center justify-center rounded-2xl border transition-all cursor-pointer select-none ${
          active
            ? 'bg-[#1550aa] text-white border-[#1550aa] shadow-md ring-2 ring-[#ffcc00]'
            : `${item.bg} ${item.color} border-slate-200/80 shadow-xs hover:shadow-md`
        }`}
      >
        <motion.div style={{ width: iconScale, height: iconScale }} className="flex items-center justify-center">
          <Icon size={22} className={active ? 'text-white' : item.color} />
        </motion.div>
      </motion.button>

      {/* Running active dot indicator */}
      <span
        className={`h-1.5 w-1.5 rounded-full mt-1 transition-all ${
          active ? 'bg-[#1550aa] scale-100 shadow-[0_0_6px_rgba(21,80,170,0.6)]' : 'bg-transparent scale-0'
        }`}
      />
    </div>
  );
}

export const SmartboardDock: React.FC = () => {
  const store = useStore();
  const mouseX = useMotionValue(Infinity);
  const micBounce = useAnimationControls();

  const handleMicClick = () => {
    micBounce.start({
      y: [0, -22, 0, -10, 0],
      transition: { duration: 0.5, ease: 'easeOut' },
    });
    if (!store.isAiDrawerOpen) {
      store.toggleAiDrawer();
    }
    toast.success('🎤 Asisten Suara Trido Siap!');
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-auto select-none">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="flex items-end gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-[#1550aa]/15 shadow-[0_16px_48px_rgba(10,26,58,0.14)]"
      >
        {/* Drawing Tools & Classroom Tools */}
        {DOCK_ITEMS.map((item) => (
          <DockIcon key={item.id} item={item} mouseX={mouseX} store={store} />
        ))}

        {/* Separator */}
        <div className="h-10 w-px bg-[#0a1a3a]/15 mx-1 mb-2 self-center" />

        {/* AI Voice Assistant Mic & Assistant Trigger */}
        <div className="relative flex flex-col items-center">
          <motion.button
            animate={micBounce}
            onClick={handleMicClick}
            className={`w-[52px] h-[52px] flex items-center justify-center rounded-2xl border transition-all cursor-pointer shadow-md ${
              store.isAiDrawerOpen
                ? 'bg-[#1550aa] text-white border-[#1550aa] ring-2 ring-[#ffcc00]'
                : 'bg-[#ffcc00] text-[#0a1a3a] hover:bg-[#ffd633] border-[#ffcc00]'
            }`}
            title="Asisten AI Suara (Bicara atau Buka Asisten)"
          >
            {store.isThinking ? (
              <Sparkles size={24} className="animate-spin text-[#1550aa]" />
            ) : (
              <Mic size={24} className={store.isAiDrawerOpen ? 'text-white' : 'text-[#0a1a3a]'} />
            )}
          </motion.button>
          <span
            className={`h-1.5 w-1.5 rounded-full mt-1 transition-all ${
              store.isAiDrawerOpen ? 'bg-[#ffcc00] scale-100' : 'bg-transparent scale-0'
            }`}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SmartboardDock;
