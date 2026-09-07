import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Plus, Minus, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from '../utils/toast';

interface TeamRecord {
  id: string | number;
  name: string;
  score: number;
  color: string;
}

interface ScoreboardProps {
  config?: {
    title?: string;
    teams?: { name: string; score?: number }[];
  };
}

const DEFAULT_TEAMS: TeamRecord[] = [
  { id: 1, name: 'Kelompok 1 (Garuda)', score: 0, color: '#3b82f6' },
  { id: 2, name: 'Kelompok 2 (Rajawali)', score: 0, color: '#10b981' },
  { id: 3, name: 'Kelompok 3 (Elang)', score: 0, color: '#f59e0b' },
  { id: 4, name: 'Kelompok 4 (Kancil)', score: 0, color: '#8b5cf6' }
];

export const ScoreboardTool: React.FC<ScoreboardProps> = ({ config }) => {
  const [teams, setTeams] = useState<TeamRecord[]>(() => {
    if (config?.teams && Array.isArray(config.teams) && config.teams.length > 0) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
      return config.teams.map((t, idx) => ({
        id: idx + 1,
        name: t.name,
        score: t.score || 0,
        color: colors[idx % colors.length]
      }));
    }
    return DEFAULT_TEAMS;
  });

  const title = config?.title || 'Papan Skor & Poin Kelompok';

  const playScoreSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  const updateScore = (id: string | number, delta: number) => {
    setTeams(prev => prev.map(t => {
      if (t.id === id) {
        const newScore = Math.max(0, t.score + delta);
        if (newScore >= 50 && t.score < 50) {
          confetti({ particleCount: 50, spread: 60 });
          toast.success(`🎉 ${t.name} mencapai 50 poin!`);
        }
        return { ...t, score: newScore };
      }
      return t;
    }));
    playScoreSound();
  };

  const resetAll = () => {
    setTeams(prev => prev.map(t => ({ ...t, score: 0 })));
    toast.success('Papan skor di-reset ke 0');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans select-none text-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200/90 text-xs shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Trophy size={16} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{title}</h4>
            <span className="text-[10px] text-slate-400 font-bold">{teams.length} Kelompok Bertanding</span>
          </div>
        </div>

        <button
          onClick={resetAll}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          title="Reset Semua Skor"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Teams Grid */}
      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 custom-scrollbar">
        {teams.map(team => (
          <div
            key={team.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: team.color }}
            />

            <div className="flex items-start justify-between gap-2 pt-1">
              <span className="font-extrabold text-sm text-slate-800 line-clamp-1">
                {team.name}
              </span>
              <span
                className="font-black text-2xl font-mono tracking-tight"
                style={{ color: team.color }}
              >
                {team.score}
              </span>
            </div>

            {/* Score Increment Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => updateScore(team.id, -5)}
                className="py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
                title="-5 Poin"
              >
                -5
              </button>
              <button
                onClick={() => updateScore(team.id, 1)}
                className="py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs font-bold transition cursor-pointer"
                title="+1 Poin"
              >
                +1
              </button>
              <button
                onClick={() => updateScore(team.id, 5)}
                className="py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 text-xs font-bold transition cursor-pointer"
                title="+5 Poin"
              >
                +5
              </button>
              <button
                onClick={() => updateScore(team.id, 10)}
                className="py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                title="+10 Poin"
              >
                +10
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
