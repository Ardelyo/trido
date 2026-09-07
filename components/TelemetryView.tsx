import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Database, RefreshCw, Download, FileSpreadsheet,
  CheckCircle2, AlertCircle, Clock, Zap, DollarSign,
  Search, ExternalLink, Copy, Check, ThumbsUp, ThumbsDown,
  Layers, Cpu, Globe, ArrowDownRight, Settings2, ShieldCheck,
  ChevronRight, Sparkles, MessageSquare
} from 'lucide-react';
import { fetchTelemetryData, fetchTelemetryConfig, updateTelemetryConfig, triggerSheetSync, submitLogFeedback, getTelemetryDownloadUrl, TelemetryResponse } from '../services/aiService';
import { toast } from '../utils/toast';

interface TelemetryViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<TelemetryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'all' | 'vertex' | 'gemini' | 'ollama'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Config modal & fields
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('Trido_Telemetry');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [appsScriptCode, setAppsScriptCode] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchTelemetryData(150);
      setData(res);
      if (res.config) {
        setSheetId(res.config.googleSheetId || '');
        setSheetName(res.config.googleSheetName || 'Trido_Telemetry');
        setWebhookUrl(res.config.googleSheetWebhookUrl || '');
        setAutoSync(res.config.autoSync ?? true);
      }
    } catch (err: any) {
      if (!silent) toast.error('Gagal memuat telemetri: ' + err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadConfigData = async () => {
    try {
      const res = await fetchTelemetryConfig();
      if (res.config) {
        setSheetId(res.config.googleSheetId || '');
        setSheetName(res.config.googleSheetName || 'Trido_Telemetry');
        setWebhookUrl(res.config.googleSheetWebhookUrl || '');
        setAutoSync(res.config.autoSync ?? true);
      }
      setAppsScriptCode(res.appsScriptTemplate || '');
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      loadConfigData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await triggerSheetSync();
      if (res.success) {
        toast.success(`Sinkronisasi selesai: ${res.synced} terkirim, ${res.failed} gagal.`);
        await loadData(true);
      } else {
        toast.error('Gagal melakukan sinkronisasi ke Google Sheet.');
      }
    } catch (err: any) {
      toast.error('Kesalahan sinkronisasi: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await updateTelemetryConfig({
        googleSheetId: sheetId.trim(),
        googleSheetName: sheetName.trim() || 'Trido_Telemetry',
        googleSheetWebhookUrl: webhookUrl.trim(),
        autoSync
      });
      if (res.success) {
        toast.success('Konfigurasi Google Sheet berhasil disimpan!');
        setIsConfigOpen(false);
        await loadData(true);
      }
    } catch (err: any) {
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleFeedback = async (logId: string, rating: 'good' | 'bad', currentFeedback?: string) => {
    try {
      await submitLogFeedback(logId, rating, currentFeedback);
      toast.success(rating === 'good' ? 'Terima kasih atas penilaian positif!' : 'Catatan feedback dicatat untuk perbaikan.');
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          recentLogs: prev.recentLogs.map(l => l.id === logId ? { ...l, userRating: rating } : l)
        };
      });
      if (selectedLog && selectedLog.id === logId) {
        setSelectedLog({ ...selectedLog, userRating: rating });
      }
    } catch (err: any) {
      toast.error('Gagal mengirim rating: ' + err.message);
    }
  };

  const handleCopyScript = () => {
    if (!appsScriptCode) return;
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    toast.success('Kode Apps Script disalin ke clipboard!');
    setTimeout(() => setCopiedScript(false), 2500);
  };

  if (!isOpen) return null;

  const summary = data?.summary || {
    totalRequests: 0,
    totalPromptTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCostUsd: 0,
    totalCostIdr: 0,
    avgLatencyMs: 0,
    successRate: 100,
    providerCounts: {},
    modelCounts: {},
    syncedToSheetCount: 0,
    pendingSheetCount: 0
  };

  const filteredLogs = (data?.recentLogs || []).filter(log => {
    const matchesProvider = selectedProvider === 'all' || log.provider === selectedProvider;
    const matchesSearch = !searchQuery ||
      log.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionsSummary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.responseTextSnippet?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center p-3 lg:p-6"
    >
      <div className="bg-white w-full max-w-7xl h-[92vh] rounded-[2.5rem] shadow-2xl border border-white flex flex-col overflow-hidden relative">

        {/* 1. Header */}
        <div className="h-20 lg:h-22 px-6 lg:px-10 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Data & Telemetri AI</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE SYNC
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                  GCP: gemma4good-494311
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Monitoring real-time token, biaya, prompt, latensi, dan sinkronisasi Google Sheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Auto refresh button */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                autoRefresh ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
              title="Perbarui otomatis setiap 10 detik"
            >
              <RefreshCw size={13} className={autoRefresh && loading ? 'animate-spin' : ''} />
              <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
            </button>

            {/* Manual refresh */}
            <button
              onClick={() => loadData(false)}
              disabled={loading}
              className="p-2.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
              title="Muat Ulang"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Google Sheet Config Button */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-sm"
            >
              <FileSpreadsheet size={15} />
              <span>Pengaturan Google Sheet</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-slate-50/50">

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            {/* Card 1: Total Calls */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Permintaan</span>
                <Sparkles size={16} className="text-blue-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">{summary.totalRequests.toLocaleString()}</div>
                <div className="text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 size={12} /> {summary.successRate}% Berhasil
                </div>
              </div>
            </div>

            {/* Card 2: Tokens */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Token</span>
                <Zap size={16} className="text-amber-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {summary.totalTokens > 1000 ? `${(summary.totalTokens / 1000).toFixed(1)}k` : summary.totalTokens}
                </div>
                <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  In: {summary.totalPromptTokens.toLocaleString()} • Out: {summary.totalOutputTokens.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Card 3: Cost */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Estimasi Biaya</span>
                <DollarSign size={16} className="text-emerald-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  ${summary.totalCostUsd.toFixed(4)}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                  ≈ Rp {summary.totalCostIdr.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Card 4: Latency */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Rata-rata Latensi</span>
                <Clock size={16} className="text-indigo-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {(summary.avgLatencyMs / 1000).toFixed(2)}s
                </div>
                <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  {summary.avgLatencyMs} ms / request
                </div>
              </div>
            </div>

            {/* Card 5: Google Sheets Sync */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Google Sheet</span>
                <FileSpreadsheet size={16} className="text-emerald-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {summary.syncedToSheetCount} <span className="text-sm font-semibold text-slate-400">baris</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>{summary.pendingSheetCount > 0 ? `${summary.pendingSheetCount} antrean` : 'Semua tersinkron'}</span>
                  <button
                    onClick={handleManualSync}
                    disabled={syncing}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    {syncing ? 'Sinkron...' : 'Sync Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Google Sheets Status & Cloud Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-emerald-400">
                <FileSpreadsheet size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base tracking-tight">Integrasi Google Sheets & Google Cloud Live</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {sheetId ? (
                    <span>Tersambung ke Spreadsheet ID: <code className="bg-white/15 px-1.5 py-0.5 rounded text-amber-300">{sheetId.slice(0, 16)}...</code></span>
                  ) : webhookUrl ? (
                    <span>Tersambung via Apps Script Webhook: <code className="bg-white/15 px-1.5 py-0.5 rounded text-amber-300">{webhookUrl.slice(0, 30)}...</code></span>
                  ) : (
                    <span>Penyimpanan lokal aktif. Masukkan Google Sheet ID atau Webhook URL agar data otomatis terkirim live ke Google Sheet Anda!</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {sheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur transition-all"
                >
                  <ExternalLink size={14} /> Buka Google Sheet
                </a>
              )}
              <button
                onClick={() => setIsConfigOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                <Settings2 size={14} /> Atur Google Sheet
              </button>
            </div>
          </div>

          {/* Toolbar: Search, Filters & Download buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari prompt, model, atau aksi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Provider filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['all', 'vertex', 'gemini', 'ollama'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedProvider(p)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${
                      selectedProvider === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Downloads */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <a
                href={getTelemetryDownloadUrl('csv')}
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs transition-all shadow-sm shadow-emerald-600/20"
              >
                <Download size={14} /> <span>Unduh CSV</span>
              </a>
              <a
                href={getTelemetryDownloadUrl('json')}
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-all border border-slate-200"
              >
                <Download size={14} /> <span>Unduh JSON</span>
              </a>
            </div>
          </div>

          {/* Interactive Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Waktu (WIB)</th>
                    <th className="py-3.5 px-4">Provider / Model</th>
                    <th className="py-3.5 px-4">Prompt User</th>
                    <th className="py-3.5 px-4">Aksi / Visual</th>
                    <th className="py-3.5 px-4 text-center">Tokens</th>
                    <th className="py-3.5 px-4 text-right">Biaya</th>
                    <th className="py-3.5 px-4 text-right">Latensi</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Sheet</th>
                    <th className="py-3.5 px-4 text-center">UX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                        {loading ? 'Memuat data telemetri...' : 'Belum ada data telemetri yang sesuai filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.timestampLocal?.split(' ')[1] || log.timestamp?.slice(11, 19)}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              log.provider === 'vertex' ? 'bg-indigo-500' :
                              log.provider === 'gemini' ? 'bg-blue-500' : 'bg-emerald-500'
                            }`} />
                            <span className="font-bold text-slate-800 uppercase text-[11px]">{log.provider}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.model}</div>
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-700" title={log.prompt}>
                          {log.prompt || '—'}
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate text-[11px] font-semibold text-slate-600" title={log.actionsSummary}>
                          {log.actionsSummary || '—'}
                        </td>

                        <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                          <span className="font-bold text-slate-800">{log.totalTokens}</span>
                          <span className="text-[10px] text-slate-400 block">({log.promptTokens}/{log.outputTokens})</span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                          <div className="font-bold text-slate-800">${log.costUsd?.toFixed(4)}</div>
                          <div className="text-[10px] text-emerald-700">Rp {Math.round(log.costIdr || 0)}</div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                          {(log.latencyMs / 1000).toFixed(2)}s
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {log.status === 'success' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Sukses
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={log.errorMessage}>
                              Error
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {log.sheetSyncStatus === 'synced' ? (
                            <span className="text-emerald-600 flex items-center justify-center" title="Tersinkron ke Sheet">
                              <CheckCircle2 size={15} />
                            </span>
                          ) : log.sheetSyncStatus === 'pending' ? (
                            <span className="text-amber-500 text-[10px] font-bold">Pending</span>
                          ) : log.sheetSyncStatus === 'failed' ? (
                            <span className="text-rose-500 text-[10px] font-bold">Gagal</span>
                          ) : (
                            <span className="text-slate-300 text-[10px]">Lokal</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleFeedback(log.id, 'good')}
                              className={`p-1.5 rounded-lg transition-colors ${
                                log.userRating === 'good' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title="Bagus / Puas"
                            >
                              <ThumbsUp size={13} />
                            </button>
                            <button
                              onClick={() => handleFeedback(log.id, 'bad')}
                              className={`p-1.5 rounded-lg transition-colors ${
                                log.userRating === 'bad' ? 'bg-rose-100 text-rose-700 font-bold' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title="Kurang / Perlu Perbaikan"
                            >
                              <ThumbsDown size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Detail Log Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-white space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-800 text-base">Detail Telemetri Log</h3>
                  <span className="text-xs font-mono text-slate-400">({selectedLog.id})</span>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar text-xs">
                {/* Meta badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Provider</span>
                    <span className="font-bold text-slate-800 uppercase">{selectedLog.provider}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Model</span>
                    <span className="font-bold text-slate-800">{selectedLog.model}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Tokens</span>
                    <span className="font-bold text-slate-800">{selectedLog.totalTokens} ({selectedLog.promptTokens} in / {selectedLog.outputTokens} out)</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Biaya</span>
                    <span className="font-bold text-emerald-700">${selectedLog.costUsd?.toFixed(4)} (Rp {Math.round(selectedLog.costIdr || 0)})</span>
                  </div>
                </div>

                {/* Prompt */}
                <div className="space-y-1">
                  <span className="font-black text-[11px] text-slate-400 uppercase tracking-wider">Prompt Pengguna</span>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 font-mono text-slate-800 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedLog.prompt}
                  </div>
                </div>

                {/* Response / Actions */}
                <div className="space-y-1">
                  <span className="font-black text-[11px] text-slate-400 uppercase tracking-wider">Respon AI & Aksi</span>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 font-mono text-slate-800 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedLog.responseTextSnippet || 'Tidak ada teks respon'}
                  </div>
                </div>

                {/* Error info if any */}
                {selectedLog.errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
                    <span className="font-bold block">Error [{selectedLog.errorCode}]:</span>
                    <span>{selectedLog.errorMessage}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-900 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Google Sheets Configuration & Apps Script Modal */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-white space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-emerald-600" />
                  <h3 className="font-black text-slate-800 text-base">Konfigurasi Sinkronisasi Google Sheets</h3>
                </div>
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar text-xs">
                {/* Method 1: Webhook URL (Easiest) */}
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-900 text-xs">Metode 1: Google Apps Script Webhook (Paling Mudah & Rekomendasi)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">REKOMENDASI</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Bisa digunakan dengan akun Google apa pun (pribadi / sekolah). Cukup buat Google Sheet baru, tempel kode Apps Script di bawah, klik Deploy sebagai Web App, lalu tempel URL-nya di sini!
                  </p>
                  <div>
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block mb-1">Webhook URL</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full bg-white border border-emerald-300 rounded-xl py-2 px-3 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Method 2: Direct GCP Service Account Sheets API */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-black text-slate-800 text-xs block">Metode 2: Google Sheets API via Google Cloud Project (gemma4good-494311)</span>
                  <p className="text-[11px] text-slate-500">
                    Gunakan jika service account GCP Anda sudah diberi izin editor ke Spreadsheet Google.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Spreadsheet ID</label>
                      <input
                        type="text"
                        value={sheetId}
                        onChange={e => setSheetId(e.target.value)}
                        placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Nama Tab / Sheet</label>
                      <input
                        type="text"
                        value={sheetName}
                        onChange={e => setSheetName(e.target.value)}
                        placeholder="Trido_Telemetry"
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto sync checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="autosync"
                    checked={autoSync}
                    onChange={e => setAutoSync(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="autosync" className="font-bold text-slate-700 cursor-pointer">
                    Aktifkan sinkronisasi otomatis langsung (Live sync setiap kali AI menjawab)
                  </label>
                </div>

                {/* Code Snippet Box */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[11px] text-slate-500 uppercase tracking-wider">
                      Kode Google Apps Script (Klik untuk Salin)
                    </span>
                    <button
                      onClick={handleCopyScript}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      {copiedScript ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedScript ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-2xl text-[10px] font-mono leading-relaxed overflow-x-auto max-h-44">
                    {appsScriptCode || '// Memuat kode script...'}
                  </pre>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20"
                >
                  <CheckCircle2 size={15} />
                  <span>{savingConfig ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
