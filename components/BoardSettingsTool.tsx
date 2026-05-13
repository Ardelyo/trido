import React from 'react';
import { useStore } from '../store';
import { Moon, Sun, Monitor, Lock, Unlock } from 'lucide-react';

export const BoardSettingsTool: React.FC = () => {
  const { theme, toggleTheme } = useStore();

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-4 space-y-4 overflow-auto custom-scrollbar">
      
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Tampilan Papan</h4>
        <div className="flex bg-slate-50 p-1 rounded-xl">
          <button 
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${theme === 'light' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Sun size={16} /> Terang
          </button>
          <button 
            onClick={() => theme === 'light' && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${theme === 'dark' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Moon size={16} /> Gelap
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Penyedia AI</h4>
        <select 
          value={useStore.getState().aiPreference}
          onChange={(e) => useStore.getState().setAiPreference(e.target.value as any)}
          className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        >
          <option value="auto">Otomatis (Rekomendasi)</option>
          <option value="gemini">Google Gemini API</option>
          <option value="vertex">Google Vertex AI</option>
          <option value="ollama">Ollama (Lokal)</option>
        </select>
        <p className="mt-2 text-[10px] text-slate-400 font-medium leading-relaxed">
          Pilih Vertex AI untuk performa enterprise atau Ollama untuk privasi total tanpa internet.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Izin Murid (Viewer)</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Monitor size={16} />
              </div>
              <span className="text-sm font-bold text-slate-700">Izinkan Coret-Coret</span>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-0 cursor-pointer" />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Unlock size={16} />
              </div>
              <span className="text-sm font-bold text-slate-700">Buka Kunci Kamera</span>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded text-emerald-600 focus:ring-0 cursor-pointer" />
          </label>
        </div>
      </div>

      <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 border-dashed">
         <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-2">Zona Berbahaya</h4>
         <button className="w-full py-2 bg-white text-rose-600 font-bold text-sm rounded-xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
           Hapus Seluruh Papan
         </button>
      </div>

    </div>
  );
};
