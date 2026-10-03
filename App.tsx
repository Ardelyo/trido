import React, { useRef, useState, useEffect } from 'react';
import { CanvasManager } from './components/CanvasManager';
import { ChatInterface } from './components/ChatInterface';
import { useGeminiBrain } from './hooks/useGeminiBrain';
import { FileUploadButton } from './components/FileUploadButton';
import { AttachedDocumentBadge } from './components/AttachedDocumentBadge';
import { ShareDialog } from './components/ShareDialog';
import { ExportDialog } from './components/ExportDialog';
import { ToolOverlay } from './components/ToolOverlay';
import { AssistiveDock } from './components/AssistiveDock';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { QuickGuideModal } from './components/QuickGuideModal';
import { GsapInteractionEffects } from './components/GsapInteractionEffects';
import { SaveMenu } from './components/SaveMenu';
import { useSocketSync } from './hooks/useSocketSync';
import { useAiStatus } from './hooks/useAiStatus';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2, Users, LayoutDashboard, Home, Square, Layers, FileText,
  Image as ImageIcon, File, History, Settings, Mic, Monitor, Share, Download, Sparkles,
  CheckCircle2, ChevronDown, ChevronRight, Keyboard, Menu,
  Clock, CheckSquare, PencilRuler, ShieldCheck, HelpCircle, User,
  MoreHorizontal, Plus, X, Check, Pencil, Send, Trash2, Archive, Database
} from 'lucide-react';
import { SidebarItem } from './components/SidebarItem';
import { AiStatusBadge } from './components/AiStatusBadge';
import { ChatMessageItem } from './components/ChatMessageItem';
import { useStore } from './store';
import { toast } from './utils/toast';
import { ToastContainer } from './components/Toast';
import { useTranslation } from './utils/translations';
import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  const { t } = useTranslation();
  const canvasRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [, setReady] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  // Responsive sidebar detection
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  const { roomId, isViewer } = useSocketSync(canvasRef);
  const { loadSessions } = useStore();

  const {
    logs, inputMode, setInputMode, messages, isAiDrawerOpen, toggleAiDrawer,
    language, chatInputText, setChatInputText, lastUploadedImage, setLastUploadedImage,
    attachedDocument, setAttachedDocument,
    userName, setUserName,
    pages, currentPageIndex, switchPage, addPage, isThinking, isActing,
    smartboardLayoutMode
  } = useStore();

  useEffect(() => {
    loadSessions();
  }, []); // Only run once on mount

  useEffect(() => {
    if ((import.meta as any).env?.DEV || (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')) {
      import('./utils/debugHelpers').then(({ attachDebugTools }) => attachDebugTools());
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileLayout(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  useEffect(() => {
    if (isAiDrawerOpen && chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isAiDrawerOpen]);

  const { processUserPrompt } = useGeminiBrain();
  const aiStatus = useAiStatus();
  const [isBrowserOnline, setIsBrowserOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isWeb = typeof window !== 'undefined' &&
    !((window as any).electronAPI || (window as any).process?.type === 'renderer' || navigator.userAgent.toLowerCase().includes('electron')) &&
    !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) &&
    !window.location.hostname.endsWith('.local') &&
    !['3000', '3030', '5173'].includes(window.location.port);

  const navigateToLanding = () => {
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ tridoView: 'landing' }, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch {
        window.location.href = '/';
      }
    }
  };

  const getStatusConfig = () => {
    const storeState = useStore.getState();
    const isUsingOllama = aiStatus.mode === 'ollama' || storeState.aiPreference === 'ollama';

    // 1. Explicit Ollama mode OR browser is offline but local Ollama is ready
    if (isUsingOllama || (!isBrowserOnline && aiStatus.ollamaStatus?.online && aiStatus.ollamaStatus?.hasModel)) {
      const activeModel = storeState.selectedOllamaModel || aiStatus.ollamaStatus?.activeModel || aiStatus.model || 'trido-model:latest';
      return {
        mode: 'ollama' as const,
        text: !isBrowserOnline ? 'Mode Offline (Ollama Aktif)' : t('modeLuring', 'Mode Offline (Ollama)'),
        detail: `Ollama: ${activeModel} • Tanpa Internet & 100% Privat`,
        color: 'text-emerald-800 bg-emerald-100/90 border-emerald-300',
        dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
        statusColor: 'text-emerald-600',
        action: null
      };
    }

    // 2. Browser is offline and local Ollama is NOT running / ready
    if (!isBrowserOnline) {
      return {
        mode: 'unavailable' as const,
        text: t('modeOfflineWarning', 'Offline (Gunakan Opsi Ollama)'),
        detail: 'Internet terputus. Klik di sini untuk mengaktifkan opsi Ollama lokal di laptop.',
        color: 'text-amber-800 bg-amber-100/90 border-amber-300',
        dot: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse',
        statusColor: 'text-amber-600',
        action: 'OPEN_SETTINGS'
      };
    }

    if (aiStatus.mode === 'gemini') {
      const activeModel = storeState.selectedGeminiModel || (aiStatus.model === 'gemini-3.7-flash' ? 'gemini-3.8-flash' : aiStatus.model) || 'gemini-3.8-flash';
      return {
        mode: 'gemini' as const,
        text: t('modeCloud', 'Mode Cloud'),
        detail: `Gemini: ${activeModel}`,
        color: 'text-blue-700 bg-blue-100/80 border-blue-200/50',
        dot: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]',
        statusColor: 'text-blue-600',
        action: null
      };
    }
    if (aiStatus.mode === 'vertex') {
      const activeModel = storeState.selectedVertexModel || (aiStatus.model === 'gemini-3.7-flash' ? 'gemini-3.8-flash' : aiStatus.model) || 'gemini-3.8-flash';
      return {
        mode: 'vertex' as const,
        text: t('modeCloudVertex', 'Mode Cloud (Vertex AI)'),
        detail: `Vertex: ${activeModel}`,
        color: 'text-purple-700 bg-purple-100/80 border-purple-200/50',
        dot: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
        statusColor: 'text-purple-600',
        action: null
      };
    }

    // Unavailable cases
    if (aiStatus.ollamaStatus?.online && !aiStatus.ollamaStatus?.hasModel) {
      return {
        mode: 'unavailable' as const,
        text: t('localModelMissing', 'Model Lokal Hilang'),
        detail: t('localModelMissingDetail', 'Ollama aktif tapi model belum diunduh'),
        color: 'text-amber-700 bg-amber-100/80 border-amber-200/50',
        dot: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse',
        statusColor: 'text-amber-600',
        action: 'PULL_MODEL'
      };
    }

    return {
      mode: 'unavailable' as const,
      text: t('aiUnavailable', 'AI Tidak Tersedia'),
      detail: aiStatus.reason === 'invalid_key' ? t('invalidApiKey', 'Kunci API perlu diperiksa') : aiStatus.reason === 'missing_project' ? t('missingProject', 'Project ID Vertex belum diatur') : t('notConnected', 'Gemini/Ollama/Vertex belum terhubung'),
      color: 'text-amber-700 bg-amber-100/80 border-amber-200/50',
      dot: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      statusColor: 'text-amber-600',
      action: 'OPEN_SETTINGS'
    };
  };

  const pullOllamaModel = async () => {
    try {
      const res = await fetch('/api/ai/pull-model', { method: 'POST' });
      if (res.ok) {
        toast.info(t('downloadingBackground', 'Proses pengunduhan model dimulai di latar belakang. Silakan tunggu beberapa menit.'));
      } else {
        toast.error(t('failedDownload', 'Gagal memulai pengunduhan model.'));
      }
    } catch (e) {
      toast.error(t('failedDownload', 'Gagal memulai pengunduhan model.'));
    }
  };

  const statusConfig = getStatusConfig();

  const handleCanvasReady = (ref: any) => {
    canvasRef.current = ref.current;
    setReady(true);
  };

  const {
    isTimerOpen, toggleTimer,
    isCalculatorOpen, toggleCalculator,
    isNotesOpen, toggleNotes,
    isQuizOpen, toggleQuiz,
    isHistoryOpen, toggleHistory
  } = useStore();

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#e4e3e0] font-sans text-[#0a1a3a] selection:bg-[#ffcc00] selection:text-[#0a1a3a]">

      {/* VIEWER MODE (CINEMA MODE) */}
      {isViewer ? (
        <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] relative overflow-hidden">
          {/* Minimal Viewer Header */}
          <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-white">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[12px] font-black text-slate-800 tracking-tight">{t('liveSession', 'Sesi Live')} {userName}</span>
              </div>
             <div className="flex items-center gap-1 bg-blue-600 px-3 py-2 rounded-2xl shadow-lg shadow-blue-600/20 text-white border border-blue-500">
                <Users size={14} />
                <span className="text-[11px] font-bold tracking-tight">{t('checkSession', 'Cek Sesi')}: {roomId}</span>
             </div>
          </div>

          {/* Clean Whiteboard Stage */}
          <main className="flex-1 flex flex-col m-2 lg:m-4 rounded-[2.5rem] bg-white shadow-2xl border border-white relative overflow-hidden group">
             <div className="absolute inset-0 z-10">
                <CanvasManager onCanvasReady={handleCanvasReady} />
             </div>
          </main>

          {/* Minimal Branding */}
          <div className="absolute bottom-10 right-10 opacity-25 flex items-center gap-2 pointer-events-none select-none z-50">
             <img src="/logo.png" alt="Trido Logo" className="w-7 h-7 object-contain" />
             <span className="text-xl font-black text-slate-900 tracking-tighter">Trido</span>
          </div>


          <AnimatePresence>
            {!canvasRef.current && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#f8fafc] z-60"
              >
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-[12px] font-black tracking-[0.2em] text-slate-400 uppercase">{t('connectingToBoard', 'Menghubungkan ke Papan')} {userName}...</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* TEACHER MODE (FULL SUITE) */
        <>
          {/* 1. TOP BAR (HEADER) */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-16 lg:h-20 bg-white/80 backdrop-blur-xl border-b border-[#0a1a3a]/10 flex items-center justify-between px-3 sm:px-4 lg:px-6 shrink-0 z-20 relative gap-2 sm:gap-4 select-none shadow-xs"
          >
            {/* Left Section: Menu & Brand */}
            <div className="flex items-center gap-2 lg:gap-3 shrink-0 z-10">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="w-11 h-11 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-[#1550aa] border border-slate-200/80 shadow-xs flex items-center justify-center transition-all cursor-pointer"
              >
                <Menu size={20} />
              </motion.button>
              {/* Logo & Product Name */}
              <div 
                onClick={isWeb ? navigateToLanding : undefined}
                className={`flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xs border border-slate-200/80 ${isWeb ? 'cursor-pointer hover:bg-white transition-all' : ''}`}
                title={isWeb ? (language === 'id' ? 'Kembali ke Beranda' : 'Return to Landing Page') : undefined}
              >
                <img src="/logo.png" alt="Trido Logo" className="w-6 h-6 object-contain" />
                <span className="font-extrabold text-xl text-[#0a1a3a] tracking-tight">Trido</span>
                <span className="hidden xl:inline ml-2 font-semibold text-[14px] pl-3 border-l border-slate-300 text-slate-700">Digital <span className="font-medium text-slate-500">Classroom</span></span>
              </div>
            </div>

            {/* Center Section: Mode Indicator (In-flow flex child, NEVER overlaps with buttons) */}
            <div className="hidden md:flex flex-1 items-center justify-center px-2 min-w-0 pointer-events-auto">
              <AiStatusBadge status={statusConfig} onPullModel={pullOllamaModel} onClick={() => setIsSettingsOpen(true)} />
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center justify-end gap-2 shrink-0 z-10">
              {/* Asisten Button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={toggleAiDrawer}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all shadow-xs cursor-pointer ${
                  isAiDrawerOpen 
                    ? 'bg-[#1550aa] text-white shadow-[#1550aa]/30 ring-4 ring-[#1550aa]/15' 
                    : 'text-[#1550aa] bg-white hover:bg-slate-50 border border-[#1550aa]/25'
                }`}
              >
                <Sparkles size={16} /> <span className="hidden sm:inline">Asisten</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsShareOpen(true)} 
                className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-[#0a1a3a] border border-slate-200/80 bg-white/80 hover:bg-white backdrop-blur rounded-full transition-all shadow-xs cursor-pointer"
              >
                <Share2 size={16} /> <span className="hidden lg:inline">{t('share', 'Bagikan')}</span>
              </motion.button>

              <SaveMenu onExportClick={() => setIsExportOpen(true)} />

              {/* Panduan Penggunaan / Help Center Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsGuideOpen(true)}
                className="w-11 h-11 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-[#1550aa] shadow-xs transition-all cursor-pointer"
                title="Panduan Cara Penggunaan Trido (Bantuan)"
              >
                <HelpCircle size={18} />
              </motion.button>

              {/* User Avatar */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 cursor-pointer" 
                title={t('userMenu', 'Menu Pengguna')} 
                onClick={() => { setEditNameValue(userName); setIsEditingName(true); }}
              >
                <div className="w-full h-full bg-[#1550aa] flex items-center justify-center text-white font-black text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </motion.button>
            </div>
          </motion.header>

          {/* LOWER SECTION */}
          <div className="flex-1 flex min-h-0 relative bg-transparent p-2 lg:p-4 pt-0 gap-4 overflow-hidden">

            {/* Modals & Overlays */}
            <GsapInteractionEffects />
            <ShareDialog isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} roomId={roomId} />
            <ExportDialog isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} canvasRef={canvasRef} />
            <QuickGuideModal 
              isOpen={isGuideOpen} 
              onClose={() => setIsGuideOpen(false)} 
              onSamplePromptClick={(prompt) => {
                setChatInputText(prompt);
                if (!isAiDrawerOpen) toggleAiDrawer();
              }}
            />
            <ToolOverlay />
            <AssistiveDock />

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
              {isSidebarOpen && isMobileLayout && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
                />
              )}
            </AnimatePresence>

            {/* 2. LEFT SIDEBAR (NAVIGATION) */}
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.aside
                  initial={{ width: 0, opacity: 0, x: -20 }}
                  animate={{ width: 260, opacity: 1, x: 0 }}
                  exit={{ width: 0, opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute lg:relative left-2 top-0 bottom-2 lg:left-0 lg:bottom-0 max-h-full bg-white/95 backdrop-blur-xl rounded-4xl flex flex-col z-40 lg:z-10 shrink-0 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
                >
                  <div className="w-65 h-full flex flex-col">
                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
                      {/* 1. Whiteboard Core */}
                      <SidebarItem
                        icon={Square}
                        label={t('whiteboard', 'Papan Tulis')}
                        active={!isHistoryOpen && !isSettingsOpen && !isExportOpen}
                        onClick={() => {
                          if (isHistoryOpen) toggleHistory();
                          setIsSettingsOpen(false);
                          setIsExportOpen(false);
                        }}
                      />

                      {/* 2. History */}
                      <SidebarItem
                        icon={Clock}
                        label={t('history', 'Riwayat Sesi')}
                        active={isHistoryOpen}
                        onClick={() => {
                          toggleHistory();
                          setIsSettingsOpen(false);
                          setIsExportOpen(false);
                        }}
                      />

                      {/* 3. Export & Import */}
                      <SidebarItem
                        icon={Download}
                        label="Ekspor & Impor"
                        active={isExportOpen}
                        onClick={() => {
                          setIsExportOpen(true);
                          if (isHistoryOpen) toggleHistory();
                          setIsSettingsOpen(false);
                        }}
                      />

                      {/* 4. Settings */}
                      <SidebarItem
                        icon={Settings}
                        label={t('settings', 'Pengaturan')}
                        active={isSettingsOpen}
                        onClick={() => {
                          setIsSettingsOpen(v => !v);
                          if (isHistoryOpen) toggleHistory();
                          setIsExportOpen(false);
                          setIsGuideOpen(false);
                        }}
                      />

                      {/* 5. Guide */}
                      <SidebarItem
                        icon={HelpCircle}
                        label={language === 'id' ? 'Panduan Guru' : 'User Guide'}
                        active={isGuideOpen}
                        onClick={() => {
                          setIsGuideOpen(true);
                          if (isHistoryOpen) toggleHistory();
                          setIsSettingsOpen(false);
                          setIsExportOpen(false);
                        }}
                      />

                      {/* 6. Landing / About (Web Only) */}
                      {isWeb && (
                        <SidebarItem
                          icon={Home}
                          label={language === 'id' ? 'Beranda / Info' : 'About / Home'}
                          active={false}
                          onClick={navigateToLanding}
                        />
                      )}
                    </nav>

                    <div className="p-5 border-t border-slate-100/80 space-y-4 bg-slate-50/50">
                      <div className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-white hover:shadow-sm transition-all cursor-pointer group">
                        <div className="w-11 h-11 rounded-[1.1rem] shadow-sm bg-blue-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          {isEditingName ? (
                            <form 
                              onSubmit={(e) => { 
                                e.preventDefault(); 
                                if (editNameValue.trim()) setUserName(editNameValue); 
                                setIsEditingName(false); 
                              }}
                              className="flex items-center gap-1"
                            >
                              <input
                                autoFocus
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                className="text-[14px] font-bold text-slate-900 border-b border-blue-400 outline-none bg-transparent w-full"
                                onBlur={() => { if (editNameValue.trim()) setUserName(editNameValue); setIsEditingName(false); }}
                              />
                              <button type="submit" className="text-blue-600"><Check size={14} /></button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-1.5" onClick={() => { setEditNameValue(userName); setIsEditingName(true); }}>
                              <div className="text-[14px] font-bold text-slate-900 truncate">{userName}</div>
                              <Pencil size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                          <div className="text-[12px] text-slate-500 font-medium">Pengajar Kelas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* 3 & 4. CANVAS AREA & VERTICAL TOOLBAR */}
            <main className="flex-1 min-w-0 relative h-full bg-white rounded-3xl lg:rounded-[2.5rem] border-2 border-[#1550aa]/15 shadow-[0_16px_48px_rgba(10,26,58,0.08)] overflow-hidden flex flex-col">

               {/* Dot Grid Background */}
               <div
                 className="absolute inset-0 pointer-events-none opacity-50 z-0"
                 style={{
                   backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
                   backgroundSize: '24px 24px'
                 }}
               />

               {/* Canvas Container */}
               <div className="absolute inset-0 z-0 flex rounded-4xl overflow-hidden">
                   <CanvasManager onCanvasReady={handleCanvasReady} />
               </div>

               {/* Page Navigation Indicator */}
               <div className="absolute bottom-6 left-6 z-10 flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-xl rounded-full shadow-lg border-2 border-[#1550aa]/15">
                {pages.map((_, idx) => (
                  <button
                    key={idx}
                    disabled={isThinking || isActing}
                    onClick={() => switchPage(idx)}
                    className={`min-w-[34px] h-8 px-2.5 rounded-full text-[13px] font-black transition-all cursor-pointer ${
                      isThinking || isActing ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      currentPageIndex === idx 
                        ? 'bg-[#1550aa] text-white shadow-sm ring-2 ring-[#ffcc00]' 
                        : 'text-slate-500 hover:bg-slate-100 hover:text-[#0a1a3a]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <div className="w-px h-4 bg-[#0a1a3a]/15 mx-1" />
                <button 
                  disabled={isThinking || isActing}
                  onClick={() => addPage()}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-slate-500 transition-all cursor-pointer ${
                    isThinking || isActing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 hover:text-[#1550aa]'
                  }`}
                  title="Tambah Halaman Baru"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>

               {/* UI Overlay for Toolbar/Controls (mapped in ChatInterface) */}
               {canvasRef.current && (
                 <ChatInterface canvasRef={canvasRef} />
               )}

               <AnimatePresence>
                 {isHistoryOpen && (
                   <HistoryView onClose={toggleHistory} />
                 )}
               </AnimatePresence>

               <AnimatePresence>
                 {isSettingsOpen && (
                   <SettingsView onClose={() => setIsSettingsOpen(false)} />
                 )}
               </AnimatePresence>

               {/* Loading State */}
               <AnimatePresence>
                 {!canvasRef.current && (
                   <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#f8fafc]/80 backdrop-blur-sm z-10"
                   >
                     <div className="relative w-16 h-16">
                       <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                       <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                     </div>
                     <div className="text-[13px] font-bold tracking-[0.2em] text-slate-600 uppercase">{t('loadingCanvas', 'Memuat Kanvas...')}</div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </main>

            {/* AI Assistant Sidebar (Right) */}
            <AnimatePresence>
              {isAiDrawerOpen && (
                <motion.aside
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`absolute right-4 lg:right-8 top-4 lg:top-8 bottom-4 lg:bottom-8 w-[calc(100%-2rem)] sm:w-95 bg-white/95 backdrop-blur-2xl rounded-4xl border border-white flex flex-col z-50 shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden`}
                >
                  {/* Header */}
                  <div className="h-16 lg:h-18 border-b border-slate-100 flex items-center justify-between px-5 font-sans bg-white/70">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1.5">
                          <img src="/logo.png" alt="Trido Logo" className="w-5 h-5 object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-[15px]">Trido Assistant</span>
                            <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} title={statusConfig.text} />
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium tracking-tight">
                            {statusConfig.mode === 'ollama' ? 'Mode Offline Lokal' : 'Cloud Assistant'}
                          </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          useStore.getState().clearMessages();
                          toast.info('Riwayat percakapan dibersihkan.');
                        }}
                        title="Bersihkan percakapan"
                        className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-2.5 rounded-2xl transition-colors active:scale-95 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button onClick={toggleAiDrawer} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-2xl transition-colors active:scale-95 cursor-pointer">
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Chat Content */}
                  <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 custom-scrollbar scroll-smooth">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                           <Sparkles size={28} className="text-slate-400" />
                        </div>
                        <p className="text-[15px] font-medium text-slate-500">{t('emptyChatPrompt', 'Tanyakan apapun atau unggah gambar untuk memulai percakapan dengan AI.')}</p>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        key={i}
                        className="w-full"
                      >
                        <ChatMessageItem
                          message={msg}
                          isLatest={i === messages.length - 1}
                          isThinking={isThinking}
                        />
                      </motion.div>
                    ))}
                    {isThinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex flex-col items-start w-full"
                      >
                        <div className="bg-white text-slate-800 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-3xl rounded-tl-sm p-4 max-w-[90%] flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                          <span className="text-sm font-semibold text-slate-600">Trido sedang memproses secara instan...</span>
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Bar */}
                  <div className="p-4 lg:p-5 border-t border-slate-100 bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10 font-sans relative shrink-0">
                    <AttachedDocumentBadge className="mb-2" />
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (isThinking) return;
                        if (!chatInputText.trim() && !attachedDocument && !lastUploadedImage) return;
                        const defaultText = attachedDocument
                          ? (attachedDocument.category === 'image'
                              ? t('pleaseAnalyzeImage', 'Tolong analisa gambar ini.')
                              : t('pleaseAnalyzeDocument', 'Tolong analisa dokumen ini dan jelaskan poin-poin pentingnya di whiteboard.'))
                          : (lastUploadedImage ? t('pleaseAnalyzeImage', 'Tolong analisa gambar ini.') : '');
                        const text = chatInputText.trim() || defaultText;
                        setChatInputText('');
                        useStore.getState().addMessage({ role: 'user', text });
                        await processUserPrompt(text, canvasRef);
                      }}
                      className="flex items-end gap-2 w-full border-[1.5px] border-slate-200 rounded-3xl p-1.5 bg-slate-50/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 transition-all shadow-inner"
                    >
                        <div className="flex items-center pb-0.5">
                          <FileUploadButton
                            className="text-slate-400 hover:text-blue-600 transition-colors p-2.5 rounded-[1.1rem] hover:bg-blue-50 ml-0.5 active:scale-95"
                            icon={<Plus size={20} />}
                            title={t('uploadFileOrImage', 'Unggah file / dokumen / gambar')}
                            disabled={isThinking}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              useStore.getState().toggleAiDrawer();
                              setTimeout(() => window.dispatchEvent(new Event('start-mic')), 300);
                            }}
                            disabled={isThinking}
                            className={`text-slate-400 hover:text-blue-600 transition-colors p-2.5 rounded-[1.1rem] hover:bg-blue-50 active:scale-95 ${isThinking ? 'opacity-40 pointer-events-none' : ''}`}
                            title={t('switchToVoice', 'Beralih ke mode suara')}
                          >
                            <Mic size={20} />
                          </button>
                        </div>
                        <textarea
                          value={chatInputText}
                          onChange={(e) => {
                            setChatInputText(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              e.currentTarget.form?.requestSubmit();
                            }
                          }}
                          rows={1}
                          disabled={isThinking}
                          placeholder={isThinking 
                            ? t('tridoIsThinking', 'Trido sedang berpikir...') 
                            : (attachedDocument 
                                ? (attachedDocument.category === 'pdf' 
                                    ? 'Tanya tentang PDF ini...' 
                                    : 'Tanya tentang dokumen ini...') 
                                : t('askSomething', 'Tanya sesuatu atau masukkan instruksi lengkap...'))}
                          className="flex-1 w-full bg-transparent border-none outline-none text-[14.5px] font-semibold text-slate-800 placeholder-slate-400 px-2 py-2 resize-none max-h-40 min-h-[38px] leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
                        />
                         <div className="pb-0.5">
                           <button
                             type="submit"
                             disabled={isThinking || (!chatInputText.trim() && !attachedDocument && !lastUploadedImage)}
                             className={`p-3 rounded-[1.2rem] transition-all duration-200 mr-0.5 ${isThinking ? 'bg-slate-100 text-slate-400 scale-95 pointer-events-none opacity-50' : (chatInputText.trim() || attachedDocument || lastUploadedImage ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 active:scale-90 scale-100' : 'bg-slate-100 text-slate-400 scale-95 pointer-events-none')}`}
                           >
                             <Send size={18} />
                           </button>
                         </div>
                    </form>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};

const Layout: React.FC = () => {
  return (
    <ErrorBoundary>
      <App />
      <ToastContainer />
    </ErrorBoundary>
  );
};

export default Layout;
