import React, { useState } from 'react';
import { useStore } from '../store';
import { Moon, Sun, Monitor, Unlock } from 'lucide-react';
import { useTranslation } from '../utils/translations';

export const BoardSettingsTool: React.FC = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme, aiPreference, setAiPreference, createNewSession } = useStore();

  const [geminiApiKey, setGeminiApiKeyLocal] = useState(
    () => localStorage.getItem('gemini_api_key_override') || ''
  );
  const [ollamaBaseUrl, setOllamaBaseUrlLocal] = useState(
    () => localStorage.getItem('ollama_base_url_override') || ''
  );

  const handleGeminiKeyChange = (val: string) => {
    setGeminiApiKeyLocal(val);
    localStorage.setItem('gemini_api_key_override', val);
  };

  const handleOllamaUrlChange = (val: string) => {
    setOllamaBaseUrlLocal(val);
    localStorage.setItem('ollama_base_url_override', val);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-4 space-y-4 overflow-auto custom-scrollbar">
      
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('boardAppearance', 'Tampilan Papan')}</h4>
        <div className="flex bg-slate-50 p-1 rounded-xl">
          <button 
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${theme === 'light' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Sun size={16} /> {t('light', 'Terang')}
          </button>
          <button 
            onClick={() => theme === 'light' && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${theme === 'dark' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Moon size={16} /> {t('dark', 'Gelap')}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('aiProvider', 'Penyedia AI')}</h4>
          <select 
            value={aiPreference}
            onChange={(e) => setAiPreference(e.target.value as any)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="auto">{t('aiModeAuto', 'Otomatis (Rekomendasi)')}</option>
            <option value="gemini">Google Gemini API</option>
            <option value="vertex">Google Vertex AI</option>
            <option value="ollama">Ollama (Lokal)</option>
          </select>
          <p className="mt-2 text-[10px] text-slate-400 font-medium leading-relaxed">
            {t('aiProviderDesc', 'Pilih Vertex AI untuk performa enterprise atau Ollama untuk privasi total tanpa internet.')}
          </p>
        </div>

        {/* Gemini API Key Input */}
        {(aiPreference === 'gemini' || aiPreference === 'auto') && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('geminiApiKeyOverride', 'Kunci API Gemini')}</label>
            <input 
              type="password"
              value={geminiApiKey}
              onChange={(e) => handleGeminiKeyChange(e.target.value)}
              placeholder={t('geminiApiKeyPlaceholder', 'Masukkan Kunci API Gemini...')}
              className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <p className="text-[9px] text-slate-400">
              {t('geminiApiKeyLocalDesc', 'Kunci API disimpan secara lokal. Menggunakan model')} <code className="bg-slate-100 px-1 rounded text-slate-600 font-bold">gemma-4-31b-it</code>.
            </p>
          </div>
        )}

        {/* Ollama Base URL Input */}
        {(aiPreference === 'ollama' || aiPreference === 'auto') && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('localOllamaUrlLabel', 'URL Ollama Lokal')}</label>
            <input 
              type="text"
              value={ollamaBaseUrl}
              onChange={(e) => handleOllamaUrlChange(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <p className="text-[9px] text-slate-400">
              {t('localOllamaUrlDesc', 'URL default: http://localhost:11434. Menggunakan model')} <code className="bg-slate-100 px-1 rounded text-slate-600 font-bold">gemma4:e2b</code>.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('studentPermissions', 'Izin Murid (Viewer)')}</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Monitor size={16} />
              </div>
              <span className="text-sm font-bold text-slate-700">{t('allowDrawing', 'Izinkan Coret-Coret')}</span>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-0 cursor-pointer" />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Unlock size={16} />
              </div>
              <span className="text-sm font-bold text-slate-700">{t('unlockCamera', 'Buka Kunci Kamera')}</span>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded text-emerald-600 focus:ring-0 cursor-pointer" />
          </label>
        </div>
      </div>

      <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 border-dashed">
         <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-2">{t('dangerZone', 'Zona Berbahaya')}</h4>
         <button 
           onClick={() => {
             if (window.confirm(t('dangerZoneConfirmClear', 'Yakin ingin menghapus seluruh papan? Tindakan ini tidak bisa dibatalkan.'))) {
               createNewSession();
               window.dispatchEvent(new CustomEvent('clearCanvas'));
             }
           }}
           className="w-full py-2 bg-white text-rose-600 font-bold text-sm rounded-xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
         >
           {t('clearEntireBoard', 'Hapus Seluruh Papan')}
         </button>
      </div>

    </div>
  );
};
