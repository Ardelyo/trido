import React, { useState } from 'react';
import { UserCheck, UserX, UserMinus } from 'lucide-react';

const students = [
  { id: 1, name: 'Budi Santoso' },
  { id: 2, name: 'Siti Aminah' },
  { id: 3, name: 'Andi Pratama' },
  { id: 4, name: 'Dewi Lestari' },
  { id: 5, name: 'Yoga Permana' },
];

export const AttendanceTool: React.FC = () => {
  const [attendance, setAttendance] = useState<Record<number, 'H' | 'I' | 'A' | 'S'>>({});

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <h4 className="font-extrabold text-slate-800 text-sm">Absensi Kelas</h4>
        <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{students.length} Siswa</span>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar space-y-2">
        {students.map(s => (
          <div key={s.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <span className="font-bold text-sm text-slate-700">{s.name}</span>
            <div className="flex gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button 
                onClick={() => setAttendance({...attendance, [s.id]: 'H'})}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-black transition-all ${attendance[s.id] === 'H' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                H
              </button>
              <button 
                onClick={() => setAttendance({...attendance, [s.id]: 'I'})}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-black transition-all ${attendance[s.id] === 'I' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                I
              </button>
              <button 
                onClick={() => setAttendance({...attendance, [s.id]: 'A'})}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-black transition-all ${attendance[s.id] === 'A' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                A
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-white border-t border-slate-100 flex justify-between text-xs font-bold text-slate-500">
         <span>H: Hadir</span>
         <span>I: Izin / S: Sakit</span>
         <span>A: Alpa</span>
      </div>
    </div>
  );
};
