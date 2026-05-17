import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MousePointer2, Pencil, Eraser, Type, Square, MoveRight,
  PaintBucket, ImageIcon, MoreHorizontal, Undo2, Redo2, Trash2,
  ChevronRight, Star, Diamond, Heart, MessageSquare,
  Minus, Circle, Triangle, Pentagon, Hexagon,
  Calculator, Clock, FileText, HelpCircle, Activity,
  FlaskConical, Users, CheckSquare, Bold,
} from 'lucide-react';
import { useStore } from '../store';
import { CreatorTool, FontFamily } from '../types';

// ── Palette & sizes ──────────────────────────────────────────────────────────
const PALETTE = [
  '#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e',
  '#3b82f6','#8b5cf6','#ec4899','#14b8a6','#64748b','#d97706',
  '#6366f1','#84cc16','#f43f5e','#0ea5e9','#a855f7','#10b981',
];
const BRUSH_SIZES = [2, 5, 10, 18];
const FONTS: { value: FontFamily; label: string }[] = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Source Serif 4', label: 'Serif' },
  { value: 'JetBrains Mono', label: 'Mono' },
  { value: 'Bricolage Grotesque', label: 'Grotesque' },
  { value: 'Playfair Display', label: 'Playfair' },
];

const ALL_SHAPES: { tool: CreatorTool; icon: any; label: string }[] = [
  { tool: 'RECTANGLE',    icon: Square,        label: 'Kotak' },
  { tool: 'CIRCLE',       icon: Circle,        label: 'Lingkaran' },
  { tool: 'TRIANGLE',     icon: Triangle,      label: 'Segitiga' },
  { tool: 'LINE',         icon: Minus,         label: 'Garis' },
  { tool: 'ARROW',        icon: MoveRight,     label: 'Panah' },
  { tool: 'STAR',         icon: Star,          label: 'Bintang' },
  { tool: 'DIAMOND',      icon: Diamond,       label: 'Berlian' },
  { tool: 'HEART',        icon: Heart,         label: 'Hati' },
  { tool: 'PENTAGON',     icon: Pentagon,      label: 'Pentagon' },
  { tool: 'POLYGON',      icon: Hexagon,       label: 'Heksagon' },
  { tool: 'SPEECH_BUBBLE',icon: MessageSquare, label: 'Balon Kata' },
];

const APPS = [
  { label: 'Kalkulator', icon: Calculator,  key: 'toggleCalculator' as const },
  { label: 'Timer',      icon: Clock,       key: 'toggleTimer' as const },
  { label: 'Catatan',    icon: FileText,    key: 'toggleNotes' as const },
  { label: 'Kuis AI',   icon: HelpCircle,  key: 'toggleQuiz' as const },
  { label: 'Konversi',   icon: Activity,    key: 'toggleUnitConverter' as const },
  { label: 'Periodik',   icon: FlaskConical,key: 'togglePeriodicTable' as const },
  { label: 'Presensi',   icon: Users,       key: 'toggleAttendance' as const },
  { label: 'To-Do',      icon: CheckSquare, key: 'toggleTodoList' as const },
];

type PanelId = 'draw' | 'shapes' | 'text' | 'apps';

interface FlyoutProps { open: boolean; children: React.ReactNode; align?: 'top' | 'bottom' | 'center'; }
const Flyout: React.FC<FlyoutProps> = ({ open, children, align = 'top' }) => {
  let positionClass = 'top-0';
  if (align === 'bottom') positionClass = 'bottom-0';
  if (align === 'center') positionClass = 'top-1/2 -translate-y-1/2';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: -8, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className={`absolute left-full ml-3 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 rounded-2xl p-3 w-52 ${positionClass}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};


const Btn: React.FC<{
  icon: any; active?: boolean; title?: string;
  onClick: () => void; children?: React.ReactNode;
}> = ({ icon: Icon, active, title, onClick, children }) => (
  <motion.button
    whileTap={{ scale: 0.86 }}
    title={title}
    onClick={onClick}
    className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors touch-manipulation ${
      active
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
        : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600'
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    {children}
  </motion.button>
);

interface DrawingToolbarProps {
  canvasRef: React.MutableRefObject<any>;
  onImageUpload: () => void;
  onDeleteSelection: () => void;
  onZoom: (dir: 'in' | 'out' | 'reset') => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  onImageUpload,
}) => {
  const {
    activeTool, setActiveTool,
    brushColor, setBrushColor, brushWidth, setBrushWidth,
    isShapeFilled, setShapeFilled,
    fontFamily, setFontFamily, fontSize, setFontSize,
    toggleCalculator, toggleTimer, toggleNotes, toggleQuiz,
    toggleUnitConverter, togglePeriodicTable, toggleAttendance, toggleTodoList,
  } = useStore();

  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const toggle = (p: PanelId) => setOpenPanel(prev => prev === p ? null : p);
  const close = () => setOpenPanel(null);

  const activeShape = ALL_SHAPES.find(s => s.tool === activeTool);
  const ShapeIcon = activeShape?.icon ?? Square;

  const appActions: Record<string, () => void> = {
    toggleCalculator, toggleTimer, toggleNotes, toggleQuiz,
    toggleUnitConverter, togglePeriodicTable, toggleAttendance, toggleTodoList,
  };

  const isDrawingMode = activeTool === 'PENCIL' || activeTool === 'ERASER';

  return (
    <div className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 pointer-events-auto z-50">
      {/* ── Vertical Pill (Only 6 Clustered Buttons) ── */}
      <motion.div
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative flex flex-col items-center gap-1 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-slate-900/8 rounded-2xl p-1.5"
      >
        {/* 1. SELECT */}
        <Btn icon={MousePointer2} active={activeTool === 'SELECT'} title="Pilih Elemen" onClick={() => { setActiveTool('SELECT'); close(); }} />

        <div className="w-5 h-px bg-slate-200/80" />

        {/* 2. DRAWING (Pencil, Eraser, Colors, Thickness combined) */}
        <div className="relative">
          <Btn
            icon={activeTool === 'ERASER' ? Eraser : Pencil}
            active={openPanel === 'draw' || isDrawingMode}
            title="Coret & Hapus"
            onClick={() => {
              if (!isDrawingMode) {
                setActiveTool('PENCIL');
              }
              toggle('draw');
            }}
          >
            <ChevronRight size={7} className="absolute right-0.5 bottom-0.5 opacity-50" />
          </Btn>
          <Flyout open={openPanel === 'draw'}>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Mode Coret</div>
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => setActiveTool('PENCIL')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  activeTool === 'PENCIL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Pencil size={12} /> Pensil
              </button>
              <button
                onClick={() => setActiveTool('ERASER')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  activeTool === 'ERASER' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Eraser size={12} /> Penghapus
              </button>
            </div>

            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Pilihan Warna</div>
            <div className="grid grid-cols-6 gap-1 mb-2">
              {PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setBrushColor(c)}
                  className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 ${
                    brushColor === c ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'ring-1 ring-slate-200'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <input
              type="color"
              value={brushColor}
              onChange={e => setBrushColor(e.target.value)}
              className="w-full h-8 rounded-lg cursor-pointer border border-slate-200 mb-3"
            />

            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ketebalan Brush</div>
            <div className="flex gap-1">
              {BRUSH_SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setBrushWidth(s)}
                  className={`flex-1 h-8 flex items-center justify-center rounded-lg transition-colors ${
                    brushWidth === s ? 'bg-blue-600' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <div
                    className={`rounded-full ${brushWidth === s ? 'bg-white' : 'bg-slate-500'}`}
                    style={{ width: Math.min(s + 3, 14), height: Math.min(s + 3, 14) }}
                  />
                </button>
              ))}
            </div>
          </Flyout>
        </div>

        {/* 3. SHAPES (All Shapes + Fill options combined) */}
        <div className="relative">
          <Btn
            icon={ShapeIcon}
            active={openPanel === 'shapes' || !!activeShape}
            title="Bentuk & Garis"
            onClick={() => toggle('shapes')}
          >
            <ChevronRight size={7} className="absolute right-0.5 bottom-0.5 opacity-50" />
          </Btn>
          <Flyout open={openPanel === 'shapes'} align="center">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Pilih Bentuk</div>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {ALL_SHAPES.map(s => (
                <motion.button
                  key={s.tool}
                  whileTap={{ scale: 0.85 }}
                  title={s.label}
                  onClick={() => { setActiveTool(s.tool); close(); }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                    activeTool === s.tool ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <s.icon size={15} />
                </motion.button>
              ))}
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Gaya Isian</div>
            <button
              onClick={() => setShapeFilled(!isShapeFilled)}
              className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isShapeFilled ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <PaintBucket size={12} />
              {isShapeFilled ? 'Isian Aktif' : 'Garis Tepi Saja'}
            </button>
          </Flyout>
        </div>

        {/* 4. TEXT (Text Tool + Font & Typography options combined) */}
        <div className="relative">
          <Btn
            icon={Type}
            active={openPanel === 'text' || activeTool === 'TEXT'}
            title="Teks & Tipografi"
            onClick={() => {
              if (activeTool !== 'TEXT') {
                setActiveTool('TEXT');
              }
              toggle('text');
            }}
          >
            <ChevronRight size={7} className="absolute right-0.5 bottom-0.5 opacity-50" />
          </Btn>
          <Flyout open={openPanel === 'text'} align="center">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Gaya Huruf</div>
            {FONTS.map(f => (
              <button
                key={f.value}
                onClick={() => setFontFamily(f.value)}
                style={{ fontFamily: f.value }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold mb-0.5 transition-colors ${
                  fontFamily === f.value ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-3 mb-1.5">Ukuran Teks</div>
            <div className="flex gap-1 flex-wrap">
              {[14, 20, 28, 40, 56].map(s => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                    fontSize === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Flyout>
        </div>

        {/* 5. IMAGE */}
        <Btn icon={ImageIcon} title="Sisipkan Gambar" onClick={onImageUpload} />

        <div className="w-5 h-px bg-slate-200/80" />

        {/* 6. APPS & WIDGETS */}
        <div className="relative">
          <Btn icon={MoreHorizontal} active={openPanel === 'apps'} title="Alat & Aplikasi" onClick={() => toggle('apps')} />
          <Flyout open={openPanel === 'apps'} align="bottom">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Alat Kelas & Widget</div>
            <div className="grid grid-cols-2 gap-1.5">
              {APPS.map(app => (
                <button
                  key={app.key}
                  onClick={() => { appActions[app.key](); close(); }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors text-[10px] font-bold touch-manipulation"
                >
                  <app.icon size={16} />
                  {app.label}
                </button>
              ))}
            </div>
          </Flyout>
        </div>

      </motion.div>
    </div>
  );
};
