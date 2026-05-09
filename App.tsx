import React, { useRef, useState, useEffect } from 'react';
import { CanvasManager } from './components/CanvasManager';
import { ChatInterface } from './components/ChatInterface';
import { useGeminiBrain } from './hooks/useGeminiBrain';
import { FileUploadButton } from './components/FileUploadButton';
import { ShareDialog } from './components/ShareDialog';
import { ExportDialog } from './components/ExportDialog';
import { ToolOverlay } from './components/ToolOverlay';
import { TemplatesView } from './components/TemplatesView';
import { AiToolsView } from './components/AiToolsView';
import { HistoryView } from './components/HistoryView';
import { SaveMenu } from './components/SaveMenu';
import { useSocketSync } from './hooks/useSocketSync';
import { useAiStatus } from './hooks/useAiStatus';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, Users, LayoutDashboard, Home, Square, Layers, FileText, 
  Image as ImageIcon, File, History, Settings, Mic, Monitor, Share, Download, Sparkles,
  CheckCircle2, ChevronDown, Keyboard, Menu,
  Clock, CheckSquare, PencilRuler, ShieldCheck, HelpCircle, User,
  MoreHorizontal, Plus, X
} from 'lucide-react';
import { useStore } from './store';

const App: React.FC = () => {
  const canvasRef = useRef<any>(null);
  const [, setReady] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // Responsive sidebar detection
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const { roomId, isViewer } = useSocketSync(canvasRef);
  const { loadSessions } = useStore();
  
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { 
    logs, inputMode, setInputMode, messages, isAiDrawerOpen, toggleAiDrawer, 
    language, chatInputText, setChatInputText, lastUploadedImage, setLastUploadedImage 
  } = useStore();
  const { processUserPrompt } = useGeminiBrain();
  const aiStatus = useAiStatus();

  const getStatusConfig = () => {
    if (aiStatus.mode === 'gemini') {
      return { text: 'Daring (Gemini)', color: 'text-blue-700 bg-blue-100/80 border-blue-200/50', dot: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]', statusColor: 'text-blue-600' };
    }
    if (aiStatus.mode === 'ollama') {
      return { text: 'Lokal (Ollama)', color: 'text-emerald-700 bg-emerald-100/80 border-emerald-200/50', dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]', statusColor: 'text-emerald-600' };
    }
    return { text: 'Terputus', color: 'text-amber-700 bg-amber-100/80 border-amber-200/50', dot: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]', statusColor: 'text-amber-600' };
  };

  const statusConfig = getStatusConfig();

  const handleCanvasReady = (ref: any) => {
    canvasRef.current = ref.current;
    setReady(true);
  };

  const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-colors duration-200 cursor-pointer ${
        active ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
      }`}
    >
      <Icon size={20} className={active ? 'text-white' : 'text-slate-400'} />
      <span className="text-[14px] font-medium">{label}</span>
    </motion.button>
  );

  const {
    isTimerOpen, toggleTimer,
    isCalculatorOpen, toggleCalculator,
    isNotesOpen, toggleNotes,
    isQuizOpen, toggleQuiz,
    isTemplatesOpen, toggleTemplates,
    isAiToolsOpen, toggleAiTools,
    isHistoryOpen, toggleHistory
  } = useStore();

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#e2e8f0] font-sans text-slate-900 selection:bg-blue-200">
      
      {/* VIEWER MODE (CINEMA MODE) */}
      {isViewer ? (
        <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] relative overflow-hidden">
          {/* Minimal Viewer Header */}
          <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-white">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[12px] font-black text-slate-800 tracking-tight">Sesi Live Pak Lio</span>
             </div>
             <div className="flex items-center gap-1 bg-blue-600 px-3 py-2 rounded-2xl shadow-lg shadow-blue-600/20 text-white border border-blue-500">
                <Users size={14} />
                <span className="text-[11px] font-bold tracking-tight">Cek Sesi: {roomId}</span>
             </div>
          </div>

          {/* Clean Whiteboard Stage */}
          <main className="flex-1 flex flex-col m-2 lg:m-4 rounded-[2.5rem] bg-white shadow-2xl border border-white relative overflow-hidden group">
             <div className="absolute inset-0 z-10">
                <CanvasManager onCanvasReady={handleCanvasReady} />
             </div>
          </main>

          {/* Minimal Branding */}
          <div className="absolute bottom-10 right-10 opacity-20 flex items-center gap-2 pointer-events-none select-none z-50">
             <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">
               <Square size={18} fill="white" />
             </div>
             <span className="text-xl font-black text-slate-900 tracking-tighter">Trido ++</span>
          </div>

          <AnimatePresence>
            {!canvasRef.current && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#f8fafc] z-[60]"
              >
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-[12px] font-black tracking-[0.2em] text-slate-400 uppercase">Menghubungkan ke Papan Pak Lio...</div>
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
            className="h-16 lg:h-20 bg-[#e2e8f0] flex items-center justify-between px-4 lg:px-6 shrink-0 z-20 relative"
          >
            <div className="flex flex-1 items-center gap-2 lg:gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-500 hover:text-slate-800 transition-colors p-2.5 rounded-[1.25rem] hover:bg-white/50 backdrop-blur active:scale-95">
                <Menu size={22} />
              </button>
              {/* Logo & Product Name */}
              <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md px-4 py-2 lg:py-2.5 rounded-[1.25rem] shadow-sm border border-white">
                <span className="font-extrabold text-xl text-[#0f172a] tracking-tight">Trido</span>
                <span className="font-extrabold text-xl text-blue-600 tracking-tighter">++</span>
                <span className="hidden md:inline ml-3 font-medium text-[15px] pl-4 border-l border-slate-300 text-slate-700">Smartboard <span className="font-medium text-slate-500">Teach AI</span></span>
              </div>
            </div>

            {/* Mode Indicator (Center) */}
            <div className="flex-none hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className={`flex items-center gap-2 text-[13px] font-bold ${statusConfig.color} backdrop-blur px-5 py-2 rounded-[1.25rem] border shadow-sm transition-colors`}>
                <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                {statusConfig.text}
              </div>
            </div>

            <div className="flex flex-1 justify-end items-center gap-2 lg:gap-3">
              {/* Actions (Right) */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleAiDrawer}
                className={`flex items-center gap-2 px-4 py-2 lg:py-2.5 text-sm font-bold rounded-[1.25rem] transition-colors shadow-sm ${isAiDrawerOpen ? 'bg-blue-600 text-white shadow-blue-600/30 ring-4 ring-blue-600/10' : 'text-blue-700 bg-white hover:bg-blue-50 border border-white'}`}
              >
                <Sparkles size={16} /> <span className="hidden sm:inline">Copilot Trido</span>
              </motion.button>
              
              <div className="hidden sm:block w-px h-6 bg-slate-300/50 mx-1" />

              <button onClick={() => setIsShareOpen(true)} className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-white bg-white/60 hover:bg-white backdrop-blur rounded-[1.25rem] transition-colors shadow-sm active:scale-95">
                <Share2 size={16} /> <span className="hidden md:inline">Bagikan</span>
              </button>
              
              <SaveMenu onExportClick={() => setIsExportOpen(true)} />

              <button className="w-10 h-10 rounded-[1.25rem] overflow-hidden border-[2.5px] border-white hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-[#e2e8f0] transition-all ml-1 shadow-sm shrink-0" title="User Menu">
                <img src="https://i.pravatar.cc/100?img=11" alt="User Avatar" className="w-full h-full object-cover" />
              </button>
            </div>
          </motion.header>

          {/* LOWER SECTION */}
          <div className="flex-1 flex min-h-0 relative bg-transparent p-2 lg:p-4 pt-0 gap-4 overflow-hidden">
            
            {/* Modals & Overlays */}
            <ShareDialog isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} roomId={roomId} />
            <ExportDialog isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} canvasRef={canvasRef} />
            <ToolOverlay />
            
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
              {isSidebarOpen && window.innerWidth < 1024 && (
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
                  className="absolute lg:relative left-2 top-0 bottom-2 lg:left-0 lg:bottom-0 bg-white/95 backdrop-blur-xl rounded-[2rem] flex flex-col z-40 lg:z-10 shrink-0 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
                >
                  <div className="w-[260px] h-full flex flex-col">
                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
                      <SidebarItem icon={Square} label="Papan Tulis" active={!isTemplatesOpen && !isAiToolsOpen && !isHistoryOpen} onClick={() => { if (isTemplatesOpen) toggleTemplates(); if (isAiToolsOpen) toggleAiTools(); if (isHistoryOpen) toggleHistory(); }} />
                      <SidebarItem icon={Layers} label="Templat" active={isTemplatesOpen} onClick={toggleTemplates} />
                      <div className="h-5" />
                      <SidebarItem icon={Sparkles} label="Alat AI Agentic" active={isAiToolsOpen} onClick={toggleAiTools} />
                      <SidebarItem icon={History} label="Riwayat" active={isHistoryOpen} onClick={toggleHistory} />
                    </nav>

                    <div className="p-5 border-t border-slate-100/80 space-y-4 bg-slate-50/50">
                      <div className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                        <img src="https://i.pravatar.cc/100?img=11" alt="User" className="w-11 h-11 rounded-[1.1rem] shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-bold text-slate-900 truncate">Pak Lio, Guru Indo</div>
                          <div className="text-[12px] text-slate-500 font-medium">Guru</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-3xl bg-white border border-slate-200/60 shadow-sm">
                        <div className="text-[13px] font-bold text-slate-800 mb-1.5">Status AI</div>
                        <div className={`text-[12px] ${statusConfig.statusColor} font-semibold flex items-center gap-1.5`}>
                            {statusConfig.text}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* 3 & 4. CANVAS AREA & VERTICAL TOOLBAR */}
            <main className="flex-1 min-w-0 relative h-full bg-[#f8fafc] rounded-[2rem] lg:rounded-[2.5rem] border-[4px] border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
               
               {/* Dot Grid Background */}
               <div 
                 className="absolute inset-0 pointer-events-none opacity-50 z-0"
                 style={{
                   backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
                   backgroundSize: '24px 24px'
                 }}
               />

               {/* Canvas Container */}
               <div className="absolute inset-0 z-0 flex rounded-[2rem] overflow-hidden">
                   <CanvasManager onCanvasReady={handleCanvasReady} />
               </div>
               
               {/* UI Overlay for Toolbar/Controls (mapped in ChatInterface) */}
               {canvasRef.current && (
                 <ChatInterface canvasRef={canvasRef} />
               )}

               <AnimatePresence>
                 {isTemplatesOpen && (
                   <TemplatesView onClose={toggleTemplates} />
                 )}
               </AnimatePresence>

               <AnimatePresence>
                 {isAiToolsOpen && (
                   <AiToolsView onClose={toggleAiTools} />
                 )}
               </AnimatePresence>

               <AnimatePresence>
                 {isHistoryOpen && (
                   <HistoryView onClose={toggleHistory} />
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
                     <div className="text-[13px] font-bold tracking-[0.2em] text-slate-600 uppercase">Memuat Kanvas...</div>
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
                  className={`absolute right-4 lg:right-8 top-4 lg:top-8 bottom-4 lg:bottom-8 w-[calc(100%-2rem)] sm:w-[380px] bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white flex flex-col z-50 shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden`}
                >
                  {/* Header */}
                  <div className="h-16 lg:h-20 border-b border-slate-100/80 flex items-center justify-between px-6 font-sans bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[1.1rem] bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-[16px]">Copilot Trido</div>
                          <div className="text-[12px] text-blue-600 font-bold">Asisten AI Cerdas</div>
                        </div>
                    </div>
                    <button onClick={toggleAiDrawer} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-[1rem] transition-colors active:scale-95">
                        <X size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Chat Content */}
                  <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar scroll-smooth">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 flex items-center justify-center mb-4">
                           <Sparkles size={28} className="text-slate-400" />
                        </div>
                        <p className="text-[15px] font-medium text-slate-500">Tanyakan apapun atau unggah gambar untuk memulai percakapan dengan AI.</p>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        key={i} 
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                          <div className={`p-4 rounded-[1.5rem] max-w-[90%] text-[14.5px] font-medium leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-600/10' 
                              : 'bg-white text-slate-800 border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-tl-sm'
                          }`}>
                            {msg.text}
                          </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Input Bar */}
                  <div className="p-4 lg:p-5 border-t border-slate-100 bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10 font-sans relative shrink-0">
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if(!chatInputText.trim() && !lastUploadedImage) return;
                        const text = chatInputText.trim() || 'Tolong analisa gambar ini.';
                        setChatInputText('');
                        useStore.getState().addMessage({ role: 'user', text });
                        await processUserPrompt(text, canvasRef);
                      }}
                      className="flex items-center gap-2 w-full border-[1.5px] border-slate-200 rounded-[1.5rem] p-1.5 bg-slate-50/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 transition-all shadow-inner"
                    >
                        <FileUploadButton 
                          className="text-slate-400 hover:text-blue-600 transition-colors p-2.5 rounded-[1.1rem] hover:bg-blue-50 ml-0.5 active:scale-95"
                          icon={<Plus size={20} />} 
                          title="Unggah file / gambar"
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            useStore.getState().toggleAiDrawer();
                            setTimeout(() => window.dispatchEvent(new Event('start-mic')), 300);
                          }} 
                          className="text-slate-400 hover:text-blue-600 transition-colors p-2.5 rounded-[1.1rem] hover:bg-blue-50 active:scale-95" 
                          title="Beralih ke mode suara"
                        >
                          <Mic size={20} />
                        </button>
                        <input 
                          type="text"
                          value={chatInputText}
                          onChange={(e) => setChatInputText(e.target.value)}
                          placeholder="Tanya sesuatu..."
                          className="flex-1 w-full bg-transparent border-none outline-none text-[14.5px] font-semibold text-slate-800 placeholder-slate-400 h-10 px-2"
                        />
                        <button 
                          type="submit"
                          disabled={!chatInputText.trim() && !lastUploadedImage}
                          className={`p-3 rounded-[1.2rem] transition-all duration-200 mr-0.5 ${chatInputText.trim() || lastUploadedImage ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 active:scale-90 scale-100' : 'bg-slate-100 text-slate-400 scale-95 pointer-events-none'}`}
                        >
                          <Share size={18} className={chatInputText.trim() || lastUploadedImage ? '' : 'translate-x-[-1px]'} />
                        </button>
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

export default App;