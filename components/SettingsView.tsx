import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Key, Cpu, Globe, Moon, Sun, User, Save, CheckCircle2,
  Eye, EyeOff, ExternalLink, Wifi, WifiOff, Zap, Shield,
  ChevronRight, RotateCcw, Trash2, Volume2, VolumeX, Info
} from 'lucide-react';
import { useStore } from '../store';
import { toast } from '../utils/toast';
import { useTranslation } from '../utils/translations';

interface SettingsViewProps {
  onClose: () => void;
}

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-50">
      <h3 className="font-black text-slate-800 text-sm tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{hint}</p>}
  </div>
);

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all";

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    aiPreference, setAiPreference,
    geminiApiKey, setGeminiApiKey,
    ollamaBaseUrl, setOllamaBaseUrl,
    selectedGeminiModel, setSelectedGeminiModel,
    selectedOllamaModel, setSelectedOllamaModel,
    selectedVertexModel, setSelectedVertexModel,
    theme, toggleTheme,
    userName, setUserName,
    language, setLanguage,
  } = useStore();

  // Local state — only commit to store/localStorage on Save
  const [localKey, setLocalKey] = useState(geminiApiKey);
  const [localOllamaUrl, setLocalOllamaUrl] = useState(ollamaBaseUrl || 'http://localhost:11434');
  const [localGeminiModel, setLocalGeminiModel] = useState(selectedGeminiModel);
  const [localOllamaModel, setLocalOllamaModel] = useState(selectedOllamaModel);
  const [localVertexModel, setLocalVertexModel] = useState(selectedVertexModel);
  const [localName, setLocalName] = useState(userName);
  const [localAiPref, setLocalAiPref] = useState(aiPreference);
  const [localLang, setLocalLang] = useState(language);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('trido_sound') !== 'off');

  // AI status probe
  const [aiStatus, setAiStatus] = useState<'checking' | 'online' | 'offline' | null>(null);

  const handleProbe = async () => {
    setAiStatus('checking');
    try {
      const res = await fetch('/api/ai/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          geminiApiKey: localKey, 
          ollamaBaseUrl: localOllamaUrl,
          selectedOllamaModel: localOllamaModel 
        })
      });
      const data = await res.json();
      setAiStatus(data.online !== false && data.mode !== 'unavailable' ? 'online' : 'offline');
    } catch {
      setAiStatus('offline');
    }
  };

  const handleSave = () => {
    setGeminiApiKey(localKey);
    setOllamaBaseUrl(localOllamaUrl);
    setSelectedGeminiModel(localGeminiModel);
    setSelectedOllamaModel(localOllamaModel);
    setSelectedVertexModel(localVertexModel);
    setUserName(localName);
    setAiPreference(localAiPref);
    setLanguage(localLang);
    localStorage.setItem('gemini_api_key', localKey);
    localStorage.setItem('ollama_base_url', localOllamaUrl);
    localStorage.setItem('selected_gemini_model', localGeminiModel);
    localStorage.setItem('selected_ollama_model', localOllamaModel);
    localStorage.setItem('selected_vertex_model', localVertexModel);
    localStorage.setItem('trido_user_name', localName);
    localStorage.setItem('ai_preference', localAiPref);
    localStorage.setItem('trido_sound', soundEnabled ? 'on' : 'off');
    setSaved(true);
    toast.success(t('saved', 'Tersimpan') + '!');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearAllData = () => {
    if (!window.confirm(t('clearDataConfirm', 'Hapus semua data lokal termasuk sesi tersimpan dan kunci API? Tindakan ini tidak bisa dibatalkan.'))) return;
    localStorage.clear();
    toast.success(t('clearDataSuccess', 'Semua data lokal telah dihapus. Memuat ulang...'));
    setTimeout(() => window.location.reload(), 1500);
  };

  const isGeminiMode = localAiPref === 'gemini' || localAiPref === 'auto';
  const isOllamaMode = localAiPref === 'ollama' || localAiPref === 'auto';
  const isVertexMode = localAiPref === 'vertex' || localAiPref === 'auto';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-slate-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="h-20 lg:h-24 px-8 lg:px-12 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('settingsTitle', 'Pengaturan')}</h2>
          <p className="text-sm font-semibold text-slate-400 mt-0.5">{t('settingsSubtitle', 'Konfigurasi AI, tampilan, dan akun Anda')}</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors"
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <CheckCircle2 size={16} /> {t('saved', 'Tersimpan')}
                </motion.span>
              ) : (
                <motion.span key="save" className="flex items-center gap-2">
                  <Save size={16} /> {t('save', 'Simpan')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Profile */}
          <Section title={t('userProfile', 'Profil Pengguna')} subtitle={t('userProfileSubtitle', 'Nama ditampilkan di sudut papan tulis')}>
            <Field label={t('yourName', 'Nama Anda')}>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={localName}
                  onChange={e => setLocalName(e.target.value)}
                  placeholder={t('teacherFacilitator', 'Nama Guru / Fasilitator')}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </Field>
            <Field label={t('interfaceLanguage', 'Bahasa Antarmuka')}>
              <select
                value={localLang}
                onChange={e => setLocalLang(e.target.value as 'id' | 'en')}
                className={inputCls}
              >
                <option value="id">🇮🇩 Bahasa Indonesia</option>
                <option value="en">🇺🇸 English</option>
              </select>
            </Field>
          </Section>

          {/* AI Provider */}
          <Section title={t('aiConfig', 'Konfigurasi AI')} subtitle={t('aiConfigSubtitle', 'Pilih dan konfigurasi penyedia model AI')}>
            <Field label={t('aiMode', 'Mode AI')}>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { val: 'auto', label: t('aiModeAuto', '⚡ Otomatis'), desc: t('aiModeAutoDesc', 'Pilih terbaik yang tersedia') },
                  { val: 'gemini', label: t('aiModeGemini', '✨ Gemini'), desc: t('aiModeGeminiDesc', 'Google AI (Cloud)') },
                  { val: 'ollama', label: t('aiModeOllama', '🏠 Ollama'), desc: t('aiModeOllamaDesc', 'Lokal & privat') },
                  { val: 'vertex', label: t('aiModeVertex', '🌐 Vertex AI'), desc: t('aiModeVertexDesc', 'Google Cloud Enterprise') },
                ] as const).map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setLocalAiPref(opt.val)}
                    className={`flex flex-col items-start p-3.5 rounded-2xl border-2 text-left transition-all ${
                      localAiPref === opt.val
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className={`font-black text-sm ${localAiPref === opt.val ? 'text-blue-700' : 'text-slate-700'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* Gemini Key & Model */}
            {isGeminiMode && (
              <>
                <Field
                  label={t('geminiApiKey', 'Kunci API Gemini')}
                  hint={t('geminiApiKeyHint', 'Kunci disimpan di browser Anda saja — tidak pernah dikirim ke server kami.')}
                >
                  <div className="relative">
                    <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={localKey}
                      onChange={e => setLocalKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className={`${inputCls} pl-10 pr-10`}
                    />
                    <button
                      onClick={() => setShowKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline mt-1"
                  >
                    <ExternalLink size={11} /> {t('getFreeApiKey', 'Dapatkan kunci API gratis di Google AI Studio')}
                  </a>
                </Field>

                <Field
                  label={t('geminiModel', 'Model Gemini / Gemma')}
                  hint={t('geminiModelHint', 'Pilih model yang ingin digunakan saat terhubung ke Google AI Cloud.')}
                >
                  <select
                    value={localGeminiModel}
                    onChange={e => setLocalGeminiModel(e.target.value)}
                    className={inputCls}
                  >
                    <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Default - Recommended)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Capable)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (High Intelligence)</option>
                    <option value="gemma-2-27b-it">gemma-2-27b-it (Open Weights)</option>
                    <option value="gemma-2-9b-it">gemma-2-9b-it (Lightweight Open Weights)</option>
                  </select>
                </Field>
              </>
            )}

            {/* Vertex AI Model */}
            {isVertexMode && (
              <Field
                label={t('vertexModel', 'Model Vertex AI')}
                hint={t('vertexModelHint', 'Pilih model Vertex AI yang digunakan di Google Cloud Project Anda. Project ID dan lokasi dikonfigurasi melalui variabel lingkungan server.')}
              >
                <select
                  value={localVertexModel}
                  onChange={e => setLocalVertexModel(e.target.value)}
                  className={inputCls}
                >
                  <option value="gemma-4-31b-it">gemma-4-31b-it (Next-gen Gemma 4 31B)</option>
                  <option value="gemma-2-27b-it">gemma-2-27b-it (Gemma 2 27B)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Capable)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (High Intelligence)</option>
                </select>
              </Field>
            )}

            {/* Ollama URL & Model */}
            {isOllamaMode && (
              <>
                <Field
                  label={t('localOllamaUrl', 'URL Ollama Lokal')}
                  hint={t('ollamaUrlHint', 'Pastikan Ollama berjalan di latar belakang.')}
                >
                  <div className="relative">
                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={localOllamaUrl}
                      onChange={e => setLocalOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </Field>

                <Field
                  label={t('ollamaModel', 'Model Ollama Lokal')}
                  hint={t('ollamaModelHint', 'Pilih model Ollama lokal Anda. Pastikan model yang dipilih telah diunduh menggunakan perintah: ollama pull [nama-model]')}
                >
                  <select
                    value={localOllamaModel}
                    onChange={e => setLocalOllamaModel(e.target.value)}
                    className={inputCls}
                  >
                    <option value="gemma4:31b">gemma4:31b (Gemma 4 31B IT - Recommended Offline)</option>
                    <option value="gemma-4-31b-it">gemma-4-31b-it (Gemma 4 31B Alternate Name)</option>
                    <option value="gemma4:e2b">gemma4:e2b (Lightweight Gemma 4 - Default)</option>
                    <option value="gemma:7b">gemma:7b (Gemma 1.1 7B)</option>
                    <option value="gemma:2b">gemma:2b (Gemma 1.1 2B)</option>
                  </select>
                </Field>
              </>
            )}

            {/* Connection Test */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleProbe}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
              >
                {aiStatus === 'checking' ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Zap size={16} />
                  </motion.div>
                ) : aiStatus === 'online' ? (
                  <Wifi size={16} className="text-emerald-500" />
                ) : aiStatus === 'offline' ? (
                  <WifiOff size={16} className="text-rose-500" />
                ) : (
                  <Wifi size={16} />
                )}
                {aiStatus === 'checking'
                  ? t('checking', 'Mengecek...')
                  : aiStatus === 'online'
                  ? t('connected', 'Terhubung ✓')
                  : aiStatus === 'offline'
                  ? t('notConnectedStatus', 'Tidak terhubung')
                  : t('testConnection', 'Test Koneksi AI')}
              </button>
            </div>
          </Section>

          {/* Appearance */}
          <Section title={t('appearance', 'Tampilan')} subtitle={t('appearanceSubtitle', 'Tema dan preferensi visual papan tulis')}>
            <Field label={t('theme', 'Tema')}>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${theme === 'light' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Sun size={16} /> {t('light', 'Terang')}
                </button>
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${theme === 'dark' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Moon size={16} /> {t('dark', 'Gelap')}
                </button>
              </div>
            </Field>
            <Field label={t('aiSoundEffects', 'Suara Efek AI')}>
              <button
                onClick={() => setSoundEnabled(v => !v)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all w-full ${soundEnabled ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {soundEnabled ? t('soundEnabled', 'Suara Aktif') : t('soundDisabled', 'Suara Nonaktif')}
              </button>
            </Field>
          </Section>

          {/* About */}
          <Section title={t('aboutTrido', 'Tentang Trido')}>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-2xl">
              <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs font-semibold text-blue-700 leading-relaxed">
                {t('aboutTridoDesc', 'Trido adalah papan tulis AI untuk guru Indonesia yang dirancang bersama Pak Damar — guru Bahasa Indonesia dengan disabilitas fisik di Bandung. Teknologi ini bukan hanya tentang kecerdasan buatan; tapi tentang inklusivitas.')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-slate-800 font-black text-base">v1.0.0</div>
                <div>{t('appVersion', 'Versi Aplikasi')}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-slate-800 font-black text-base">gemma-4-31b-it</div>
                <div>{t('aiModel', 'Model AI')}</div>
              </div>
            </div>
          </Section>

          {/* Danger Zone */}
          <div className="bg-rose-50 border border-rose-200 border-dashed rounded-3xl p-5 space-y-3">
            <h3 className="text-[11px] font-black text-rose-600 uppercase tracking-widest">{t('dangerZone', 'Zona Berbahaya')}</h3>
            <button
              onClick={handleClearAllData}
              className="flex items-center gap-2 w-full px-4 py-3 bg-white text-rose-600 font-bold text-sm rounded-2xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all"
            >
              <Trash2 size={16} /> {t('clearAllLocalData', 'Hapus Semua Data Lokal')}
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
