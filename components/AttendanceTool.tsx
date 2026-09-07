import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  UserCheck, UserX, UserMinus, Users, Plus, CheckCheck, RotateCcw,
  Copy, Check, QrCode, Dices, Download, Upload, Trophy, X
} from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { toast } from '../utils/toast';
import { downloadFile, slugify } from '../utils/smartExport';

export interface StudentRecord {
  id: string | number;
  nis?: string;
  name: string;
  status?: 'H' | 'I' | 'S' | 'A';
  note?: string;
}

export interface AttendanceConfig {
  title?: string;
  className?: string;
  date?: string;
  students?: StudentRecord[];
}

const DEFAULT_STUDENTS: StudentRecord[] = [
  { id: 1, nis: '1001', name: 'Budi Santoso', status: 'H' },
  { id: 2, nis: '1002', name: 'Siti Aminah', status: 'H' },
  { id: 3, nis: '1003', name: 'Andi Pratama', status: 'H' },
  { id: 4, nis: '1004', name: 'Dewi Lestari', status: 'I' },
  { id: 5, nis: '1005', name: 'Yoga Permana', status: 'H' },
  { id: 6, nis: '1006', name: 'Rina Kusuma', status: 'H' },
  { id: 7, nis: '1007', name: 'Fajar Nugraha', status: 'S' },
  { id: 8, nis: '1008', name: 'Nadia Putri', status: 'H' }
];

interface AttendanceToolProps {
  config?: any;
}

export const AttendanceTool: React.FC<AttendanceToolProps> = ({ config }) => {
  const { t } = useTranslation();

  const parseConfig = (cfg: any): AttendanceConfig => {
    if (!cfg) return {};
    if (typeof cfg === 'string') {
      try {
        return JSON.parse(cfg);
      } catch {
        return {};
      }
    }
    return cfg;
  };

  const initialCfg = parseConfig(config);

  const [title, setTitle] = useState(initialCfg.title || 'Presensi Kelas');
  const [className, setClassName] = useState(initialCfg.className || 'Kelas XII');
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    if (initialCfg.students && Array.isArray(initialCfg.students) && initialCfg.students.length > 0) {
      return initialCfg.students;
    }
    return DEFAULT_STUDENTS;
  });
  const [newStudentName, setNewStudentName] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [selectedRandomStudent, setSelectedRandomStudent] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when AI updates component config
  useEffect(() => {
    if (!config) return;
    const updated = parseConfig(config);
    if (updated.title) setTitle(updated.title);
    if (updated.className) setClassName(updated.className);
    if (updated.students && Array.isArray(updated.students)) {
      setStudents(updated.students);
    }
  }, [config]);

  const updateStatus = (id: string | number, status: 'H' | 'I' | 'S' | 'A') => {
    setStudents(prev => prev.map(s => (s.id === id ? { ...s, status } : s)));
  };

  const markAll = (status: 'H' | 'I' | 'S' | 'A') => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
    toast.success(status === 'H' ? 'Semua siswa ditandai Hadir!' : 'Presensi diperbarui!');
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const newStudent: StudentRecord = {
      id: `std_${Date.now()}`,
      nis: `${1000 + students.length + 1}`,
      name: newStudentName.trim(),
      status: 'H'
    };
    setStudents(prev => [...prev, newStudent]);
    setNewStudentName('');
    toast.success(`Siswa "${newStudent.name}" ditambahkan`);
  };

  // 🎲 Random Student Fair Picker with Sound & Confetti
  const pickRandomStudent = () => {
    const presentStudents = students.filter(s => s.status === 'H');
    const pool = presentStudents.length > 0 ? presentStudents : students;
    if (pool.length === 0) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}

    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex].name;
    setSelectedRandomStudent(chosen);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  // Stats calculation
  const total = students.length;
  const countH = students.filter(s => s.status === 'H').length;
  const countI = students.filter(s => s.status === 'I').length;
  const countS = students.filter(s => s.status === 'S').length;
  const countA = students.filter(s => s.status === 'A').length;
  const presentRate = total > 0 ? Math.round((countH / total) * 100) : 0;

  // CSV Export (Dapodik / Excel Standard)
  const handleExportCSV = () => {
    let csv = 'No,NIS,Nama Lengkap,Status,Keterangan\n';
    students.forEach((s, idx) => {
      const statusLabel = s.status === 'H' ? 'Hadir' : (s.status === 'I' ? 'Izin' : (s.status === 'S' ? 'Sakit' : 'Alpa'));
      csv += `${idx + 1},"${s.nis || ''}","${s.name.replace(/"/g, '""')}","${statusLabel}","${(s.note || '').replace(/"/g, '""')}"\n`;
    });
    downloadFile(csv, `presensi_${slugify(className)}_${Date.now()}.csv`, 'text/csv;charset=utf-8');
    toast.success('Roster presensi CSV berhasil diunduh.');
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const parsed: StudentRecord[] = [];

      // Skip header if line 0 contains "Nama" or "NIS"
      const startIndex = lines[0].toLowerCase().includes('nama') ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.replace(/"/g, '').trim());
        if (parts.length >= 2) {
          const name = parts[1] || parts[0];
          if (name) {
            parsed.push({
              id: `csv_${Date.now()}_${i}`,
              nis: parts[0] || `${1000 + i}`,
              name,
              status: 'H'
            });
          }
        }
      }

      if (parsed.length > 0) {
        setStudents(parsed);
        toast.success(`Berhasil mengimpor ${parsed.length} siswa dari CSV!`);
      } else {
        toast.error('Gagal membaca format data CSV.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyReport = () => {
    const lines = [
      `📋 LAPORAN PRESENSI - ${title.toUpperCase()}`,
      `Kelas: ${className}`,
      `Total Siswa: ${total}`,
      `----------------------------------------`,
      `✅ Hadir (H): ${countH} (${presentRate}%)`,
      `⚠️ Izin  (I): ${countI}`,
      `🏥 Sakit (S): ${countS}`,
      `❌ Alpa  (A): ${countA}`,
      `----------------------------------------`,
      `DAFTAR SISWA:`,
      ...students.map((s, idx) => `${idx + 1}. ${s.name} [${s.status || 'H'}]${s.note ? ` - ${s.note}` : ''}`)
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setIsCopied(true);
    toast.success('Laporan presensi disalin ke clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const checkinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?attend=true&class=${encodeURIComponent(className)}`
    : 'https://trido.vercel.app';

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans select-none text-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={16} />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate leading-tight">
              {title}
            </h4>
            <span className="text-[10px] font-bold text-slate-400 block truncate">
              {className} • {total} {t('studentsCount', 'Siswa')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
            presentRate >= 85 ? 'bg-emerald-100 text-emerald-700' :
            presentRate >= 70 ? 'bg-amber-100 text-amber-700' :
            'bg-rose-100 text-rose-700'
          }`}>
            {presentRate}% Hadir
          </span>
          <button
            onClick={() => setShowQr(!showQr)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${showQr ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
            title="Tampilkan QR Check-in Mandiri Siswa"
          >
            <QrCode size={14} />
          </button>
          <button
            onClick={pickRandomStudent}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
            title="Pilih Siswa Acak (Fair Turn)"
          >
            <Dices size={14} />
          </button>
          <button
            onClick={handleCopyReport}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
            title="Salin ringkasan laporan presensi"
          >
            {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* QR Self-Check-in Slide-Down Banner */}
      {showQr && (
        <div className="p-4 bg-white border-b border-slate-200 flex flex-col items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-700">
            Pindai QR untuk Check-in Siswa
          </div>
          <div className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <QRCodeSVG value={checkinUrl} size={130} />
          </div>
          <span className="text-[10px] text-slate-400 font-mono text-center">
            {checkinUrl.slice(0, 36)}...
          </span>
        </div>
      )}

      {/* Random Winner Spotlight */}
      {selectedRandomStudent && (
        <div className="mx-3 mt-3 p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-md flex items-center justify-between gap-3 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Trophy size={16} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-100">Giliran Menjawab</div>
              <div className="text-sm font-black">{selectedRandomStudent}</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedRandomStudent(null)}
            className="p-1 rounded-lg hover:bg-white/20 text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Progress & Stat Bar */}
      <div className="bg-slate-100/70 p-2.5 border-b border-slate-200/60 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> H: {countH}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> I: {countI}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> S: {countS}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> A: {countA}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
          <div style={{ width: `${total ? (countH / total) * 100 : 0}%` }} className="bg-emerald-500 h-full transition-all" />
          <div style={{ width: `${total ? (countI / total) * 100 : 0}%` }} className="bg-amber-500 h-full transition-all" />
          <div style={{ width: `${total ? (countS / total) * 100 : 0}%` }} className="bg-sky-500 h-full transition-all" />
          <div style={{ width: `${total ? (countA / total) * 100 : 0}%` }} className="bg-rose-500 h-full transition-all" />
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="px-3 py-1.5 bg-white border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => markAll('H')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
          >
            <CheckCheck size={12} /> Semua Hadir
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Ekspor CSV Roster"
          >
            <Download size={12} /> CSV
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Impor CSV Roster"
          >
            <Upload size={12} /> Impor
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleImportCSV}
        />

        <div className="flex gap-1 items-center">
          <input
            type="text"
            placeholder="Tambah nama..."
            value={newStudentName}
            onChange={e => setNewStudentName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddStudent()}
            className="w-24 sm:w-28 text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAddStudent}
            className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            title="Tambah siswa"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-auto p-3 custom-scrollbar space-y-1.5">
        {students.map((s, idx) => (
          <div
            key={s.id}
            className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs flex items-center justify-between gap-2 hover:border-slate-200 transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 w-4 text-center shrink-0">
                {idx + 1}
              </span>
              <span className="font-bold text-xs text-slate-700 truncate" title={s.name}>
                {s.name}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => updateStatus(s.id, 'H')}
                className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[11px] font-black transition-all cursor-pointer ${
                  s.status === 'H' || !s.status
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
                title="Hadir"
              >
                H
              </button>
              <button
                onClick={() => updateStatus(s.id, 'I')}
                className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[11px] font-black transition-all cursor-pointer ${
                  s.status === 'I'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
                title="Izin"
              >
                I
              </button>
              <button
                onClick={() => updateStatus(s.id, 'S')}
                className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[11px] font-black transition-all cursor-pointer ${
                  s.status === 'S'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
                title="Sakit"
              >
                S
              </button>
              <button
                onClick={() => updateStatus(s.id, 'A')}
                className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[11px] font-black transition-all cursor-pointer ${
                  s.status === 'A'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
                title="Alpa / Tanpa Keterangan"
              >
                A
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
