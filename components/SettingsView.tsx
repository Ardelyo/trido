import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Key, Cpu, Globe, Moon, Sun, User, Save, CheckCircle2,
  Eye, EyeOff, ExternalLink, Wifi, WifiOff, Zap, Shield, HardDrive,
  ChevronRight, RotateCcw, Trash2, Volume2, VolumeX, Info,
  Mic, Radio, Upload, Sparkles, Database, FileSpreadsheet, Download,
  Shapes, Users, Flame, Workflow, HeartHandshake, AlertCircle
} from 'lucide-react';
import { useStore } from '../store';
import { toast } from '../utils/toast';
import { useTranslation, SUPPORTED_LANGUAGES } from '../utils/translations';
import { SupportedLanguage } from '../types';
import { getTelemetryDownloadUrl } from '../services/aiService';
import { useAiStatus } from '../hooks/useAiStatus';

interface SettingsViewProps {
  onClose: () => void;
}

type SettingsTab = 'ai' | 'features' | 'audio' | 'language' | 'data';

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{hint}</p>}
  </div>
);

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all";

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
    transcribeMode, setTranscribeMode,
    voiceConfig, setVoiceConfig,
    experimentalConfig, setExperimentalConfig,
    isAssistiveMode, toggleAssistiveMode,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');

  // Local state — only commit to store/localStorage on Save
  const [localKey, setLocalKey] = useState(geminiApiKey);
  const [localOllamaUrl, setLocalOllamaUrl] = useState(ollamaBaseUrl || 'http://localhost:11434');
  const [localGeminiModel, setLocalGeminiModel] = useState(() => {
    return (!selectedGeminiModel || selectedGeminiModel === 'gemini-3.7-flash') ? 'gemini-3.8-flash' : selectedGeminiModel;
  });
  const [localOllamaModel, setLocalOllamaModel] = useState(selectedOllamaModel);
  const [localVertexModel, setLocalVertexModel] = useState(() => {
    return (!selectedVertexModel || selectedVertexModel === 'gemini-3.7-flash') ? 'gemini-3.8-flash' : selectedVertexModel;
  });
  const [localTranscribeMode, setLocalTranscribeMode] = useState(transcribeMode);
  const [localVoiceConfig, setLocalVoiceConfig] = useState(voiceConfig);
  const [localExpConfig, setLocalExpConfig] = useState(experimentalConfig);
  const [localName, setLocalName] = useState(userName);
  const [localAiPref, setLocalAiPref] = useState(aiPreference);
  const [localLang, setLocalLang] = useState(language);
  const [showKey, setShowKey] = useState(false);
  const liveAiStatus = useAiStatus();
  const detectedOllamaModels = liveAiStatus.ollamaStatus?.models || [];
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
          selectedOllamaModel: localOllamaModel,
          aiPreference: localAiPref
        })
      });
      const data = await res.json();
      setAiStatus(data.online !== false && data.mode !== 'unavailable' ? 'online' : 'offline');
    } catch {
      setAiStatus('offline');
    }
  };

  useEffect(() => {
    handleProbe();
  }, [localAiPref, localOllamaModel]);

  const handleSave = () => {
    setGeminiApiKey(localKey);
    setOllamaBaseUrl(localOllamaUrl);
    setSelectedGeminiModel(localGeminiModel);
    setSelectedOllamaModel(localOllamaModel);
    setSelectedVertexModel(localVertexModel);
    setTranscribeMode(localTranscribeMode);
    setVoiceConfig(localVoiceConfig);
    setExperimentalConfig(localExpConfig);
    setUserName(localName);
    setAiPreference(localAiPref);
    setLanguage(localLang);
    localStorage.setItem('gemini_api_key', localKey);
    localStorage.setItem('ollama_base_url', localOllamaUrl);
    localStorage.setItem('selected_gemini_model', localGeminiModel);
    localStorage.setItem('selected_ollama_model', localOllamaModel);
    localStorage.setItem('selected_vertex_model', localVertexModel);
    localStorage.setItem('trido_transcribe_mode', localTranscribeMode);
    localStorage.setItem('trido_voice_config', JSON.stringify(localVoiceConfig));
    localStorage.setItem('trido_experimental_config', JSON.stringify(localExpConfig));
    localStorage.setItem('trido_user_name', localName);
    localStorage.setItem('ai_preference', localAiPref);
    localStorage.setItem('trido_sound', soundEnabled ? 'on' : 'off');
    setSaved(true);
    toast.success(t('saved', 'Pengaturan berhasil disimpan') + '!');
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

  const TABS: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'ai', label: 'Kecerdasan AI', icon: Cpu },
    { id: 'features', label: 'Fitur Smartboard', icon: Sparkles },
    { id: 'audio', label: 'Audio & Inklusif', icon: Mic },
    { id: 'language', label: 'Bahasa & Tema', icon: Globe },
    { id: 'data', label: 'Data & Hak Cipta', icon: Database },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.99 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="absolute inset-0 z-40 bg-[#f8fafc] flex flex-col overflow-hidden font-sans"
    >
      {/* Header */}
      <div className="h-20 lg:h-22 px-6 lg:px-12 flex justify-between items-center bg-white border-b border-slate-200/80 shrink-0">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{t('settingsTitle', 'Pengaturan')}</h2>
          <p className="text-xs lg:text-sm font-semibold text-slate-500 mt-0.5">{t('settingsSubtitle', 'Konfigurasi AI cerdas, fitur kelas, dan preferensi smartboard')}</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors cursor-pointer"
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
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="bg-white border-b border-slate-200/80 px-6 lg:px-12 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 custom-scrollbar">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ════════ TAB 1: KECERDASAN AI ════════ */}
          {activeTab === 'ai' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Section title={t('aiConfig', 'Penyedia Model AI (Dualitas Lokal & Cloud)')} subtitle={t('aiConfigSubtitle', 'Pilih antara mode offline privat lokal (Ollama) atau mode cloud berkecepatan tinggi')}>
                
                {/* AI Mode Selector */}
                <Field label={t('aiMode', 'Mode AI')}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([
                      { val: 'ollama', label: '🏠 Ollama Lokal', desc: '100% Offline & Privat' },
                      { val: 'auto', label: '⚡ Otomatis', desc: 'Pilih yang tersedia' },
                      { val: 'gemini', label: '✨ Gemini Cloud', desc: 'Google AI Studio' },
                      { val: 'vertex', label: '🌐 Vertex Cloud', desc: 'Google Enterprise' },
                    ] as const).map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setLocalAiPref(opt.val)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          localAiPref === opt.val
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`font-bold text-xs ${localAiPref === opt.val ? 'text-blue-700' : 'text-slate-800'}`}>
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Status Indicator */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      aiStatus === 'online' ? 'bg-emerald-500' : aiStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                    }`} />
                    <span className="text-xs font-bold text-slate-700">
                      {aiStatus === 'online' ? 'Layanan AI Terhubung & Siap' : aiStatus === 'checking' ? 'Memeriksa koneksi...' : 'Layanan AI Tidak Terhubung'}
                    </span>
                  </div>
                  <button
                    onClick={handleProbe}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Uji Ulang Koneksi
                  </button>
                </div>

                {/* Ollama Section */}
                {isOllamaMode && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                        <HardDrive size={15} className="text-emerald-600" />
                        Konfigurasi Model Lokal (Ollama)
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        100% Offline
                      </span>
                    </div>

                    <Field label="URL Server Ollama" hint="Default URL Ollama pada mesin lokal (http://localhost:11434)">
                      <input
                        type="text"
                        value={localOllamaUrl}
                        onChange={e => setLocalOllamaUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        className={inputCls}
                      />
                    </Field>

                    <Field label="Pilihan Model Ollama Terdaftar" hint="Model lokal yang digunakan untuk eksekusi perintah dan visualisasi smartboard">
                      <select
                        value={localOllamaModel}
                        onChange={e => setLocalOllamaModel(e.target.value)}
                        className={inputCls}
                      >
                        <optgroup label="Model Rekomendasi Trido">
                          <option value="trido-model:latest">trido-model:latest (Flagship 9B - 256K Context & Multimodal Vision)</option>
                          <option value="trido-gemma:2b">trido-gemma:2b (Gemma 4 E2B - Ringan, Cepat & Hemat VRAM)</option>
                        </optgroup>
                        {detectedOllamaModels.length > 0 && (
                          <optgroup label="Model Lain Terdeteksi di Laptop">
                            {detectedOllamaModels.map(m => (
                              <option key={m} value={m}>{m} (Lokal Terpasang)</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </Field>
                  </div>
                )}

                {/* Gemini / Vertex Cloud Section */}
                {(isGeminiMode || isVertexMode) && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                      <Sparkles size={15} className="text-blue-600" />
                      Konfigurasi Cloud Frontier (Google AI)
                    </div>

                    {isGeminiMode && (
                      <Field label="Google AI Studio API Key" hint="Kunci API Gemini untuk mode cloud publik (tersimpan aman di browser lokal Anda)">
                        <div className="relative">
                          <input
                            type={showKey ? "text" : "password"}
                            value={localKey}
                            onChange={e => setLocalKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className={`${inputCls} pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </Field>
                    )}

                    <Field label="Model Cloud Aktif">
                      <select
                        value={isVertexMode ? localVertexModel : localGeminiModel}
                        onChange={e => isVertexMode ? setLocalVertexModel(e.target.value) : setLocalGeminiModel(e.target.value)}
                        className={inputCls}
                      >
                        <option value="gemini-3.8-flash">gemini-3.8-flash (Frontier Ultra-Fast Multimodal)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                      </select>
                    </Field>
                  </div>
                )}
              </Section>
            </motion.div>
          )}

          {/* ════════ TAB 2: FITUR CERDAS SMARTBOARD (CORE ENGINE) ════════ */}
          {activeTab === 'features' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Section
                title="✨ Fitur Cerdas Smartboard (Core Engine)"
                subtitle="Kemampuan bawaan papan tulis: Diagram Mermaid, Jev System 1 Reflex, Inking Halus, Timer Visual, Presensi, dan Otomasi Multi-Task"
              >
                <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-blue-950">
                      Seluruh Fitur Smartboard Aktif Penuh (Full Production Core)
                    </h5>
                    <p className="text-[11px] text-blue-800 font-medium leading-tight mt-0.5">
                      Trido dirancang dengan kemampuan spasial lengkap: mutasi in-place, formula LaTeX KaTeX, presensi kelas, dan pembuatan materi otomatis tanpa batas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* 1. Mermaid.js Diagram */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Mermaid Diagram & Mindmap
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                        Peta konsep dan diagram alur dirender murni dalam format SVG tajam dengan zoom, pan, dan ekspor instan.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalExpConfig({ ...localExpConfig, mermaidEnabled: !localExpConfig.mermaidEnabled })}
                      className={`py-1.5 px-3 rounded-xl text-[11px] font-bold border transition flex items-center justify-between cursor-pointer ${
                        localExpConfig.mermaidEnabled
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>Status Engine</span>
                      <span>{localExpConfig.mermaidEnabled ? 'Aktif ✓' : 'Nonaktif ✕'}</span>
                    </button>
                  </div>

                  {/* 2. Jev-Mode System 1 Reflex */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-500" />
                        Jev-Mode (System 1 Reflex & In-Place Mutation)
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                        Pengambilan keputusan sub-15ms: mengunci pengeditan diagram in-place agar tidak menduplikasi widget saat guru meminta revisi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalExpConfig({ ...localExpConfig, jevModeEnabled: !localExpConfig.jevModeEnabled })}
                      className={`py-1.5 px-3 rounded-xl text-[11px] font-bold border transition flex items-center justify-between cursor-pointer ${
                        localExpConfig.jevModeEnabled
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>Status Jev-Mode</span>
                      <span>{localExpConfig.jevModeEnabled ? 'Aktif ✓' : 'Nonaktif ✕'}</span>
                    </button>
                  </div>

                  {/* 3. Smooth Inking */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        Smooth Inking (Goresan Halus)
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                        Goresan pena realistis dengan interpolasi kurva halus berujung lancip (tapering) untuk smartboard sentuh.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalExpConfig({ ...localExpConfig, smoothInkingEnabled: !localExpConfig.smoothInkingEnabled })}
                      className={`py-1.5 px-3 rounded-xl text-[11px] font-bold border transition flex items-center justify-between cursor-pointer ${
                        localExpConfig.smoothInkingEnabled
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>Status Inking</span>
                      <span>{localExpConfig.smoothInkingEnabled ? 'Aktif ✓' : 'Nonaktif ✕'}</span>
                    </button>
                  </div>

                  {/* 4. Visual Pie Timer */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        Visual Countdown Timer
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                        Timer lingkaran visual interaktif untuk manajemen fokus kelas dan pengerjaan tugas siswa.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalExpConfig({ ...localExpConfig, visualTimerEnabled: !localExpConfig.visualTimerEnabled })}
                      className={`py-1.5 px-3 rounded-xl text-[11px] font-bold border transition flex items-center justify-between cursor-pointer ${
                        localExpConfig.visualTimerEnabled
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>Status Timer</span>
                      <span>{localExpConfig.visualTimerEnabled ? 'Aktif ✓' : 'Nonaktif ✕'}</span>
                    </button>
                  </div>

                  {/* 5. Smart Presensi */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Users size={14} className="text-blue-600" />
                        Presensi & Absensi Kelas
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                        Widget kehadiran siswa interaktif di kanvas dengan rekapitulasi Hadir, Izin, Sakit, Alpa, dan persentase.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalExpConfig({ ...localExpConfig, attendanceEnabled: !localExpConfig.attendanceEnabled })}
                      className={`py-1.5 px-3 rounded-xl text-[11px] font-bold border transition flex items-center justify-between cursor-pointer ${
                        localExpConfig.attendanceEnabled
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>Status Presensi</span>
                      <span>{localExpConfig.attendanceEnabled ? 'Aktif ✓' : 'Nonaktif ✕'}</span>
                    </button>
                  </div>

                  {/* 6. Multi-Task Orchestration */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Workflow size={14} className="text-violet-600" />
                        Orkestrasi Alur Multi-Tasking
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                        Memungkinkan AI mengeksekusi instruksi majemuk (Absensi + Timer + Mindmap + Rumus LaTeX) dalam satu putaran simultan.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalExpConfig({ ...localExpConfig, autoTaskAutomation: !localExpConfig.autoTaskAutomation })}
                      className={`py-1.5 px-3 rounded-xl text-[11px] font-bold border transition flex items-center justify-between cursor-pointer ${
                        localExpConfig.autoTaskAutomation
                          ? 'bg-violet-50 border-violet-300 text-violet-700'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>Status Multi-Task</span>
                      <span>{localExpConfig.autoTaskAutomation ? 'Aktif ✓' : 'Nonaktif ✕'}</span>
                    </button>
                  </div>
                </div>
              </Section>
            </motion.div>
          )}

          {/* ════════ TAB 3: AUDIO & AKSESIBILITAS INKLUSIF ════════ */}
          {activeTab === 'audio' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Section title="🎙️ Speech-to-Text (STT) & Transkripsi Offline" subtitle="Pengenalan suara guru otomatis untuk kendali papan tulis tanpa mengetik">
                <Field label="Mesin Transkripsi Suara (Speech-to-Text)">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLocalTranscribeMode('faster_whisper')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        localTranscribeMode === 'faster_whisper'
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Mic size={14} className="text-emerald-600" />
                        Faster-Whisper (100% Offline Lokal)
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        CTranslate2 INT8, VAD peredam bising, mendukung 99+ bahasa offline
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLocalTranscribeMode('webspeech')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        localTranscribeMode === 'webspeech'
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-blue-600" />
                        Web Speech Standard
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Engine perekam audio bawaan browser standar
                      </div>
                    </button>
                  </div>
                </Field>
              </Section>

              <Section
                title="♿ Aksesibilitas & Mode Guru Inklusif (Pak Damar Suite)"
                subtitle="Dermaga tombol sentuh besar untuk guru dan siswa dengan keterbatasan motorik fisik"
              >
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HeartHandshake size={20} className={isAssistiveMode ? 'text-amber-600' : 'text-slate-400'} />
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        Large-Target Assistive Dock (56px)
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Menampilkan dermaga tombol besar di sudut layar untuk presensi, timer, dan roda acak tanpa gerakan motorik halus.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAssistiveMode()}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition ${
                      isAssistiveMode
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    {isAssistiveMode ? 'Aktif ✓' : 'Nonaktif ✕'}
                  </button>
                </div>
              </Section>
            </motion.div>
          )}

          {/* ════════ TAB 4: BAHASA & TEMA ════════ */}
          {activeTab === 'language' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Section title="🌐 Bahasa & Internasionalisasi (UN & Global Languages)" subtitle="Dukungan 6 bahasa resmi PBB serta bahasa nasional dan regional">
                <Field label={t('interfaceLanguage', 'Bahasa Antarmuka & Dialog AI')}>
                  <select
                    value={localLang}
                    onChange={e => setLocalLang(e.target.value as SupportedLanguage)}
                    className={inputCls}
                  >
                    <optgroup label="United Nations (UN) Official Languages">
                      {SUPPORTED_LANGUAGES.filter(l => l.isUN).map(l => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.nativeName} ({l.name}) - UN Official
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Global & Regional Languages">
                      {SUPPORTED_LANGUAGES.filter(l => !l.isUN).map(l => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.nativeName} ({l.name})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </Field>
              </Section>

              <Section title={t('appearance', 'Tampilan & Suara')} subtitle="Tema kanvas dan efek audio interaksi">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={t('theme', 'Tema Kanvas')}>
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1 border border-slate-200/80">
                      <button
                        onClick={() => theme === 'dark' && toggleTheme()}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${theme === 'light' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Sun size={15} /> {t('light', 'Terang')}
                      </button>
                      <button
                        onClick={() => theme === 'light' && toggleTheme()}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${theme === 'dark' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Moon size={15} /> {t('dark', 'Gelap')}
                      </button>
                    </div>
                  </Field>

                  <Field label={t('aiSoundEffects', 'Efek Suara Audio')}>
                    <button
                      onClick={() => setSoundEnabled(v => !v)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-xs transition-all w-full cursor-pointer ${soundEnabled ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-500 bg-white'}`}
                    >
                      {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                      {soundEnabled ? t('soundEnabled', 'Suara Interaksi Aktif') : t('soundDisabled', 'Suara Nonaktif')}
                    </button>
                  </Field>
                </div>
              </Section>
            </motion.div>
          )}

          {/* ════════ TAB 5: DATA & HAK CIPTA ════════ */}
          {activeTab === 'data' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Section title="💾 Profil Guru & Identitas Kelas" subtitle="Nama pengguna yang dicantumkan pada sesi papan tulis">
                <Field label={t('yourName', 'Nama Pengajar / Fasilitator')}>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={localName}
                      onChange={e => setLocalName(e.target.value)}
                      placeholder="Nama Guru"
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </Field>
              </Section>

              <Section
                title="📊 Telemetri & Analisis Sesi Pembelajaran"
                subtitle="Ekspor log riwayat aksi, estimasi token, latensi, dan statistik interaksi siswa"
              >
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-blue-600" />
                      <span className="font-extrabold text-slate-800 text-xs">Live Analytics & Offline Telemetry</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-700">
                      gemma4good-494311
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Aktivitas papan tulis (kuis, pemanggilan alat visual, token, estimasi biaya, dan masukan pengalaman guru) tercatat dan dapat diunduh langsung untuk arsip sekolah.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={getTelemetryDownloadUrl('csv')}
                      download
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      <Download size={13} /> Unduh Data (CSV / Excel)
                    </a>
                    <a
                      href={getTelemetryDownloadUrl('json')}
                      download
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                    >
                      <Download size={13} /> Unduh Data (JSON)
                    </a>
                  </div>
                </div>
              </Section>

              <Section title="⚖️ Hak Cipta & Informasi Resmi Trido">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] leading-relaxed text-slate-600 font-medium space-y-1">
                  <div className="font-black text-slate-900 text-xs">TRIDO 2026</div>
                  <div className="font-bold text-slate-800">Hak Cipta Terdaftar Kementerian Hukum Republik Indonesia</div>
                  <div className="text-[10px] text-slate-400">(Ministry of Law, Republic of Indonesia)</div>
                  <div className="text-[10px] text-slate-500 font-semibold pt-1">Copyright © 2026 TRIDO by Ardellio Satria Anindito. All rights reserved.</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500 pt-1">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                    <div className="text-slate-900 font-black text-sm">v1.0.0 Production</div>
                    <div className="text-[11px] text-slate-400 font-medium">Versi Aplikasi</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                    <div className="text-slate-900 font-black text-sm">Trido AI Spatial Core</div>
                    <div className="text-[11px] text-slate-400 font-medium">Engine Cerdas</div>
                  </div>
                </div>
              </Section>

              {/* Danger Zone */}
              <div className="bg-rose-50/60 border border-rose-200 border-dashed rounded-3xl p-5 space-y-2">
                <h3 className="text-[11px] font-black text-rose-600 uppercase tracking-widest">{t('dangerZone', 'Zona Berbahaya')}</h3>
                <button
                  onClick={handleClearAllData}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white text-rose-600 font-bold text-xs rounded-xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                >
                  <Trash2 size={14} /> {t('clearAllLocalData', 'Hapus Semua Data Lokal & Reset')}
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
};
