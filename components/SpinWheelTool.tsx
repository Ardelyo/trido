import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, Sparkles, Trophy, Plus, Trash2 } from 'lucide-react';
import { toast } from '../utils/toast';

interface SpinWheelProps {
  config?: {
    title?: string;
    items?: string[];
  };
}

const DEFAULT_ITEMS = [
  'Budi Santoso',
  'Siti Aminah',
  'Andi Pratama',
  'Dewi Lestari',
  'Yoga Permana',
  'Rina Kusuma',
  'Fajar Nugraha',
  'Nadia Putri'
];

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'
];

export const SpinWheelTool: React.FC<SpinWheelProps> = ({ config }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [items, setItems] = useState<string[]>(config?.items || DEFAULT_ITEMS);
  const [newItemName, setNewItemName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const title = config?.title || 'Roda Acak Siswa';

  // Play subtle ticking sound using Web Audio API
  const playTick = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, width, height);

    if (items.length === 0) return;

    const sliceAngle = (2 * Math.PI) / items.length;

    // Outer Glow Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();

    // Wheel Segments
    items.forEach((item, i) => {
      const startAngle = angleRef.current + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Text Labels
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(item.slice(0, 16), radius - 24, 4);
      ctx.restore();
    });

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pointer Indicator at Right
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 15, centerY);
    ctx.lineTo(centerX + radius - 10, centerY - 12);
    ctx.lineTo(centerX + radius - 10, centerY + 12);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
    ctx.shadowBlur = 8;
    ctx.fill();
  };

  useEffect(() => {
    drawWheel();
  }, [items]);

  const spin = () => {
    if (isSpinning || items.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
    velocityRef.current = 0.35 + Math.random() * 0.25;

    let lastTickAngle = angleRef.current;
    const sliceAngle = (2 * Math.PI) / items.length;

    const animate = () => {
      velocityRef.current *= 0.985; // Deceleration factor
      angleRef.current = (angleRef.current + velocityRef.current) % (2 * Math.PI);

      // Play tick on segment passing pointer
      if (Math.abs(angleRef.current - lastTickAngle) >= sliceAngle) {
        playTick();
        lastTickAngle = angleRef.current;
      }

      drawWheel();

      if (velocityRef.current > 0.002) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Calculate winner under pointer (pointer is at angle 0 / right side)
        const normalizedAngle = (2 * Math.PI - (angleRef.current % (2 * Math.PI))) % (2 * Math.PI);
        const winningIndex = Math.floor(normalizedAngle / sliceAngle) % items.length;
        const chosen = items[winningIndex];
        setWinner(chosen);

        // Celebration Confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    setItems(prev => [...prev, newItemName.trim()]);
    setNewItemName('');
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans select-none text-slate-800 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200/90 text-xs shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-extrabold text-slate-800 text-sm tracking-tight">{title}</span>
          <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">
            {items.length} Opsi
          </span>
        </div>

        <button
          onClick={spin}
          disabled={isSpinning || items.length === 0}
          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Play size={13} fill="currentColor" /> {isSpinning ? 'Memutar...' : 'Putar Roda'}
        </button>
      </div>

      {/* Main Wheel Canvas Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-3 bg-radial from-white via-slate-50 to-slate-100/50">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="max-w-full max-h-full drop-shadow-md"
        />

        {/* Winner Spotlight Banner */}
        {winner && (
          <div className="absolute inset-x-4 top-4 p-3 bg-white/95 backdrop-blur border-2 border-amber-400 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Trophy size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-600">Siswa / Opsi Terpilih</div>
                <div className="text-base font-black text-slate-900">{winner}</div>
              </div>
            </div>
            <button
              onClick={() => setWinner(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Item Quick Add Bar */}
      <div className="p-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Tambah nama..."
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-amber-500"
        />
        <button
          onClick={addItem}
          className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
