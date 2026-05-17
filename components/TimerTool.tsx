import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Clock, Timer as TimerIcon, StopCircle, Bell } from 'lucide-react';
import { toast } from '../utils/toast';
import { useTranslation } from '../utils/translations';

interface TimerToolProps {
  config: any;
}

type Mode = 'TIMER' | 'STOPWATCH' | 'CLOCK' | 'ALARM';

export const TimerTool: React.FC<TimerToolProps> = ({ config }) => {
  const { t, language } = useTranslation();
  const parsedConfig = typeof config === 'string' ? JSON.parse(config) : config;
  const [mode, setMode] = useState<Mode>(parsedConfig.mode || 'TIMER');
  
  // States
  const [timeLeft, setTimeLeft] = useState(parsedConfig.seconds || 300);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarmTime, setAlarmTime] = useState(parsedConfig.alarmAt || '');
  const [isAlarmActive, setIsAlarmActive] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clock Update
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Check Alarm — use < 2 to be robust against browser event loop lag
      if (mode === 'ALARM' && isAlarmActive && alarmTime) {
        const now = new Date();
        const [hours, minutes] = alarmTime.split(':').map(Number);
        if (
          now.getHours() === hours &&
          now.getMinutes() === minutes &&
          now.getSeconds() < 2
        ) {
          toast.warning(t('timerAlarmRinging', '⏰ Alarm berbunyi! Waktunya telah tiba!'));
          setIsAlarmActive(false);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, isAlarmActive, alarmTime, t]);

  // Timer Logic
  useEffect(() => {
    if (isActive && mode === 'TIMER') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 0) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isActive && mode === 'STOPWATCH') {
      timerRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setIsActive(false);
    if (mode === 'TIMER') setTimeLeft(parsedConfig.seconds || 300);
    if (mode === 'STOPWATCH') setStopwatchTime(0);
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        {(['CLOCK', 'TIMER', 'STOPWATCH', 'ALARM'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === m ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Main Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-slate-50/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="flex flex-col items-center w-full"
          >
            {mode === 'CLOCK' && (
              <div className="text-center">
                <div className="text-5xl font-black text-slate-800 tracking-tighter font-mono">
                  {currentTime.toLocaleTimeString(language === 'en' ? 'en-US' : 'id-ID', { hour12: false })}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                  {currentTime.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
            )}

            {mode === 'TIMER' && (
              <div className="flex flex-col items-center">
                <div className={`text-6xl font-black tracking-tighter font-mono ${timeLeft === 0 ? 'text-rose-500 animate-pulse' : 'text-slate-800'}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="mt-6 flex gap-4">
                  <button onClick={() => setIsActive(!isActive)} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}>
                    {isActive ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                  </button>
                  <button onClick={reset} className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-600 shadow-lg transition-all active:scale-90">
                    <RotateCcw size={20} />
                  </button>
                </div>
              </div>
            )}

            {mode === 'STOPWATCH' && (
              <div className="flex flex-col items-center">
                <div className="text-6xl font-black tracking-tighter text-slate-800 font-mono">
                  {formatTime(stopwatchTime)}
                </div>
                <div className="mt-6 flex gap-4">
                  <button onClick={() => setIsActive(!isActive)} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}>
                    {isActive ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                  </button>
                  <button onClick={reset} className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-600 shadow-lg transition-all active:scale-90">
                    <RotateCcw size={20} />
                  </button>
                </div>
              </div>
            )}

            {mode === 'ALARM' && (
              <div className="flex flex-col items-center w-full max-w-[200px]">
                <Bell size={40} className={`mb-4 ${isAlarmActive ? 'text-indigo-600 animate-bounce' : 'text-slate-300'}`} />
                <input
                  type="time"
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  className="w-full text-2xl font-black text-center border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 bg-transparent text-slate-800"
                />
                <button
                  onClick={() => setIsAlarmActive(!isAlarmActive)}
                  className={`mt-6 w-full py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 ${
                    isAlarmActive ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isAlarmActive ? t('cancelAlarm', 'BATALKAN ALARM') : t('setAlarm', 'SETEL ALARM')}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Decorative footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
         <div className="w-1 h-1 rounded-full bg-slate-300" />
         <div className="w-1 h-1 rounded-full bg-slate-300" />
         <div className="w-1 h-1 rounded-full bg-slate-300" />
      </div>
    </div>
  );
};
