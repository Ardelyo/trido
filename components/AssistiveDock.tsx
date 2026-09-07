import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic, Clock, Users, Dices, RotateCcw, Compass, Sparkles,
  ChevronUp, ChevronDown, Check, Volume2, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { useStore } from '../store';
import { toast } from '../utils/toast';

export const AssistiveDock: React.FC = () => {
  const {
    isAssistiveMode,
    toggleAssistiveMode,
    toggleAttendance,
    setViewport,
    updateDomElement
  } = useStore();

  const [isExpanded, setIsExpanded] = useState(true);

  if (!isAssistiveMode) return null;

  const handleLaunchQuickTimer = () => {
    const id = `timer_${Date.now()}`;
    updateDomElement(id, {
      id,
      html: '<div>Timer</div>',
      componentType: 'TIMER',
      config: { seconds: 300, mode: 'TIMER' },
      x: 960,
      y: 540,
      width: 320,
      height: 380,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      zIndex: 10
    });
    toast.success('⏱️ Timer 5 menit aktif di papan!');
  };

  const handleLaunchRandomWheel = () => {
    const id = `wheel_${Date.now()}`;
    updateDomElement(id, {
      id,
      html: '<div>Roda</div>',
      componentType: 'SPIN_WHEEL',
      config: { title: 'Giliran Menjawab Siswa' },
      x: 960,
      y: 540,
      width: 440,
      height: 480,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      zIndex: 10
    });
    toast.success('🎲 Roda acak giliran siswa aktif!');
  };

  const handleResetCamera = () => {
    setViewport(1, [1, 0, 0, 1, 0, 0]);
    toast.success('🧭 Tampilan kanvas dipusatkan');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 font-sans select-none pointer-events-auto">
      {/* Assistive Mode Indicator Badge */}
      <div className="flex items-center gap-2 px-3 py-1 bg-amber-500 text-slate-950 rounded-full font-black text-[11px] shadow-lg shadow-amber-500/20">
        <HeartHandshake size={14} />
        <span>MODE INKLUSIF (PAK DAMAR)</span>
        <button
          onClick={() => toggleAssistiveMode(false)}
          className="ml-1 text-[10px] bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 px-1.5 py-0.5 rounded-full cursor-pointer"
          title="Tutup Mode Inklusif"
        >
          ✕
        </button>
      </div>

      {/* Large-Target Assistive Dock (56px touch buttons) */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-slate-700/80 p-2.5 rounded-3xl shadow-2xl flex items-center gap-2.5">
        {/* 1. Quick Attendance */}
        <button
          onClick={() => {
            toggleAttendance();
            toast.info('Daftar presensi dibuka');
          }}
          className="w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-90 text-white flex flex-col items-center justify-center gap-0.5 shadow-md transition cursor-pointer"
          title="Presensi Siswa Cepat"
        >
          <Users size={22} />
          <span className="text-[9px] font-black uppercase">Absen</span>
        </button>

        {/* 2. Quick Timer 5m */}
        <button
          onClick={handleLaunchQuickTimer}
          className="w-14 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white flex flex-col items-center justify-center gap-0.5 shadow-md transition cursor-pointer"
          title="Mulai Timer 5 Menit"
        >
          <Clock size={22} />
          <span className="text-[9px] font-black uppercase">5 Mnt</span>
        </button>

        {/* 3. Random Student Wheel */}
        <button
          onClick={handleLaunchRandomWheel}
          className="w-14 h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 flex flex-col items-center justify-center gap-0.5 shadow-md transition cursor-pointer"
          title="Roda Acak Siswa"
        >
          <Dices size={22} />
          <span className="text-[9px] font-black uppercase">Giliran</span>
        </button>

        {/* 4. Reset Viewport Camera */}
        <button
          onClick={handleResetCamera}
          className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-200 flex flex-col items-center justify-center gap-0.5 shadow-md transition cursor-pointer"
          title="Pusatkan Layar"
        >
          <Compass size={22} />
          <span className="text-[9px] font-black uppercase">Pusat</span>
        </button>
      </div>
    </div>
  );
};
