import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { useGeminiBrain } from '../hooks/useGeminiBrain';
import { CreatorTool } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { AiServiceError } from '../services/aiService';
import {
  MousePointer2, Pencil, Type, Square, Circle, Trash2, Triangle, PaintBucket,
  Mic, Image as ImageIcon, Send, Layers, ChevronUp, ChevronDown, X,
  Activity, Cpu, MessageSquare, Sun, Moon, Minus, Plus, Maximize, ChevronLeft, ChevronRight, Undo2, Redo2, Sparkles, Network, Star,
  Square as StopIcon,
  CircleStop,
  Loader2,
  FileText, Clock, MoreHorizontal, PencilRuler, HelpCircle, Users, Settings, CheckSquare
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { FileUploadButton } from './FileUploadButton';
import { DrawingToolbar } from './DrawingToolbar';
import { sounds } from '../utils/sounds';
import { useTranslation } from '../utils/translations';

interface ChatInterfaceProps {
  canvasRef: React.MutableRefObject<any>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ canvasRef }) => {
  const { t, language } = useTranslation();
  const [input, setInput] = useState('');
  const [interimInput, setInterimInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);

  const transcriptBufferRef = useRef('');
  const interimBufferRef = useRef('');
  const isListeningRef = useRef(isListening);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastShape, setLastShape] = useState<CreatorTool>('RECTANGLE');

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const {
    isThinking, isActing, actionQueue, logs,
    lastUploadedImage, setLastUploadedImage, abortTask, zoom, setViewport,
    isCreatorMode, toggleCreatorMode, activeTool, setActiveTool, setBrushColor, brushColor,
    removeDomElement, agentMessage, theme, toggleTheme, undoCanvas, redoCanvas, inputMode, setInputMode,
    isShapeFilled, setShapeFilled,
    fontFamily, setFontFamily, fontSize, setFontSize,
    pages, currentPageIndex, switchPage, addPage, removePage,
    isAiDrawerOpen, isViewerUrl,
    toggleTimer, toggleCalculator, toggleNotes, toggleQuiz,
    toggleUnitConverter, togglePeriodicTable, toggleAttendance, toggleTodoList, toggleBoardSettings
  } = useStore();

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let newZoom = canvas.getZoom();
    if (direction === 'in') newZoom = Math.min(newZoom * 1.1, 20);
    else if (direction === 'out') newZoom = Math.max(newZoom / 1.1, 0.01);
    else newZoom = 1;

    if (direction === 'reset') {
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.setZoom(1);
    } else {
      canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, newZoom);
    }
    setViewport(newZoom, [...canvas.viewportTransform]);
  };
  const { processUserPrompt } = useGeminiBrain();

  if (isViewerUrl) {
    return (
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        <div className="absolute bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto z-40">
           <div className="bg-slate-900/80 backdrop-blur-md text-white text-[13px] font-medium px-4 py-2.5 rounded-2xl shadow-lg border border-white/10 flex items-center gap-3">
             <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="tracking-wide">{t('watchingTeacher', 'Anda sedang menonton layar guru')}</span>
           </div>
        </div>
      </div>
    );
  }

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioVolume, setAudioVolume] = useState(0);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));

  const startVisualizer = useCallback((stream: MediaStream) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }
      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        context.resume();
      }
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 128; // Higher detail for visualizer
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Boost sensitivity for visualization
        const boostedData = new Uint8Array(dataArray.length);
        for(let i=0; i<dataArray.length; i++) {
          boostedData[i] = Math.min(255, dataArray[i] * 2);
        }
        setAudioData(boostedData);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioVolume(average);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.error("Visualizer setup failed:", e);
    }
  }, []);

  const stopVisualizer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
      });
    }
    setAudioVolume(0);
    setAudioData(new Uint8Array(0));
  }, []);

  useEffect(() => {
    return () => {
      stopVisualizer();
    };
  }, [stopVisualizer]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, agentMessage]);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      return true;
    } catch (err) {
      console.error("Mic permission error:", err);
      setMicPermission('denied');
      return false;
    }
  };

  useEffect(() => {
    // Check permission on mount if possible
    navigator.permissions?.query?.({ name: 'microphone' as any }).then(status => {
      setMicPermission(status.state as any);
      status.onchange = () => setMicPermission(status.state as any);
    }).catch(() => {
      // Fallback if permissions API not supported
    });

    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Use continuous for better experience
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'en' ? 'en-US' : 'id-ID';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          const trimmed = finalTranscript.trim();
          if (trimmed) {
            const currentBase = transcriptBufferRef.current;
            const updated = currentBase ? currentBase + ' ' + trimmed : trimmed;
            transcriptBufferRef.current = updated;
            setInput(updated);
            useStore.getState().setChatInputText(updated);
            interimBufferRef.current = '';
            setInterimInput('');
            useStore.getState().setInterimInputText('');
          }
        } else {
          interimBufferRef.current = interimTranscript;
          setInterimInput(interimTranscript);
          useStore.getState().setInterimInputText(interimTranscript);
        }
      };

      recognitionRef.current.onspeechend = () => {
        console.log("Speech ended detected");
      };

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("STT Error detailed:", event.error, event.message);
        if (event.error === 'not-allowed') {
          setMicPermission('denied');
        }
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setIsListening(false);
          stopVisualizer();
        }
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        // Don't auto-restart if we are transcribing via Gemini
        if (isListeningRef.current && !isTranscribing) {
          try {
            recognitionRef.current.start();
          } catch(e) {
            console.error("Reconnect failed:", e);
            setIsListening(false);
            stopVisualizer();
          }
        }
      };
    } else {
      setSpeechSupported(false);
      recognitionRef.current = null;
    }
  }, [isListening, isTranscribing, language]);

  useEffect(() => {
    const handleStartMic = () => {
      if (!isListening) toggleListening();
    };
    window.addEventListener('start-mic', handleStartMic);
    return () => window.removeEventListener('start-mic', handleStartMic);
  }, [isListening]);

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
      sounds.play('mic_off');
      stopVisualizer();

      // Wait up to 600ms for final SpeechRecognition results to flush
      await new Promise(r => setTimeout(r, 600));
      const finalLocalTranscript = transcriptBufferRef.current.trim() || interimBufferRef.current.trim();
      if (finalLocalTranscript || useStore.getState().lastUploadedImage) {
        handleSubmitInternal(finalLocalTranscript);
      }
      transcriptBufferRef.current = '';
      interimBufferRef.current = '';
      setInput('');
      setInterimInput('');
      useStore.getState().setChatInputText('');
      useStore.getState().setInterimInputText('');
    } else {
      if (!speechSupported) {
        const fallbackMessage = t('voiceUnsupported', 'Browser ini belum mendukung fitur pengenalan suara lokal (Web Speech API). Silakan gunakan kolom teks.');
        setVoiceNotice(fallbackMessage);
        if (!isAiDrawerOpen) useStore.getState().toggleAiDrawer();
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setVoiceNotice("Akses mikrofon tidak didukung di peramban ini.");
        return;
      }

      try {
        setVoiceNotice(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setMicPermission('granted');

        sounds.play('mic_on');
        setIsListening(true);
        setInput('');
        setInterimInput('');
        transcriptBufferRef.current = '';
        interimBufferRef.current = '';

        startVisualizer(stream);

        if (recognitionRef.current) {
          recognitionRef.current.lang = language === 'en' ? 'en-US' : 'id-ID';
          try { recognitionRef.current.stop(); } catch(e) {}

          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch(e) {
              setIsListening(false);
              stopVisualizer();
            }
          }, 100);
        }
      } catch (err) {
        setMicPermission('denied');
        setVoiceNotice("Mohon izinkan akses mikrofon, atau gunakan input teks di Copilot.");
        if (!isAiDrawerOpen) useStore.getState().toggleAiDrawer();
      }
    }
  };

  const handleSendVoice = () => {
    const finalInput = transcriptBufferRef.current.trim() || interimBufferRef.current.trim();
    if (finalInput || useStore.getState().lastUploadedImage) {
      handleSubmitInternal(finalInput);
      transcriptBufferRef.current = '';
      interimBufferRef.current = '';
      setInput('');
      setInterimInput('');
      useStore.getState().setChatInputText('');
      useStore.getState().setInterimInputText('');
    }

    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
      stopVisualizer();
    }
  };


  const handleCanvasImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      useStore.getState().addLog(`Gambar dimasukkan ke kanvas: ${file.name}`);

      if (canvasRef.current) {
        window.fabric.Image.fromURL(base64, (img: any) => {
          const id = `img_${Date.now()}`;
          img.scaleToWidth(250);
          img.set({
            left: window.innerWidth/2, top: window.innerHeight/2, originX: 'center', originY: 'center', id: id,
            cornerColor: '#00f0ff', cornerSize: 10, transparentCorners: false
          });
          canvasRef.current.add(img);
          canvasRef.current.requestRenderAll();
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitInternal(input);
  };

  const handleSubmitInternal = async (text: string) => {
    const finalTxt = text.trim() || (useStore.getState().lastUploadedImage ? t('pleaseAnalyzeImage', 'Tolong analisa gambar ini.') : '');
    if (!finalTxt || isThinking) return;
    setInput('');
    useStore.getState().addMessage({ role: 'user', text: finalTxt });
    await processUserPrompt(finalTxt, canvasRef);
  };

  const handleDeleteSelection = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj: any) => {
        canvas.remove(obj);
        if (obj.isDomPlaceholder) removeDomElement(obj.id);
      });
      canvas.discardActiveObject().requestRenderAll();
      useStore.getState().addLog(`Menghapus ${activeObjects.length} objek.`);
    }
  };

  const isBusy = isThinking || isActing || actionQueue.length > 0;

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const ToolBtn = ({ tool, icon: Icon, isAction, onClick, className = '' }: { tool?: CreatorTool, icon: any, isAction?: boolean, onClick?: () => void, className?: string }) => {
    const isActive = tool && activeTool === tool;
    return (
      <motion.button
        whileHover={{ scale: isActive ? 1.05 : 1.02, backgroundColor: isActive ? '' : 'rgb(241 245 249)' }}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          if (tool) setActiveTool(tool);
          if (onClick) onClick();
        }}
        className={`flex items-center justify-center w-9.5 h-9.5 lg:w-10.5 lg:h-10.5 rounded-xl lg:rounded-[1.1rem] transition-colors ${
          isActive
            ? 'text-white bg-blue-600 shadow-[0_8px_16px_rgba(37,99,235,0.25)] ring-4 ring-blue-600/10'
            : 'text-slate-500 hover:text-blue-600'
        } ${className}`}
      >
        <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} />
      </motion.button>
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">

      {/* Left Drawing Toolbar */}
      <DrawingToolbar
        canvasRef={canvasRef}
        onImageUpload={() => document.getElementById('canvas-upload')?.click()}
        onDeleteSelection={handleDeleteSelection}
        onZoom={handleZoom}
      />
      <input id="canvas-upload" type="file" className="hidden" accept="image/*" onChange={handleCanvasImageUpload} />

      {/* ====== BOTTOM CONTROLS ====== */}
      <div className="absolute bottom-4 lg:bottom-6 left-3 lg:left-6 right-3 lg:right-6 pointer-events-none flex flex-col md:flex-row items-center md:items-end md:justify-between z-40 gap-4">

        {/* Left: Empty for flex space */}
        <div className="flex-1 hidden md:block"></div>

        {/* Center: AI Status & Voice Control */}
        <div className="relative flex flex-col items-center gap-2">

          {/* Transcript bubble — expands UPWARD above the bar */}
          <AnimatePresence>
            {isListening && showTranscript && (input || interimInput || voiceNotice) && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95, pointerEvents: 'none' }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="pointer-events-auto w-[min(88vw,520px)] bg-white/97 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-blue-100 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    Transkripsi
                  </span>
                  <button
                    onClick={() => setShowTranscript(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    title="Sembunyikan"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto">
                  <p className="text-[13.5px] leading-relaxed text-slate-800">
                    {input}
                    {interimInput && <span className="text-slate-400 italic"> {interimInput}</span>}
                    {voiceNotice && !input && !interimInput && <span className="text-amber-600">{voiceNotice}</span>}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Show-transcript button when collapsed */}
          <AnimatePresence>
            {isListening && !showTranscript && (input || interimInput) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setShowTranscript(true)}
                className="pointer-events-auto text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
              >
                <ChevronUp size={12} /> Tampilkan transkripsi
              </motion.button>
            )}
          </AnimatePresence>

          {/* Voice island bar — stays compact, never stretches sideways */}
          <AnimatePresence>
            {!isAiDrawerOpen && (
              <motion.div
                 initial={{ opacity: 0, y: 20, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 20, scale: 0.95, pointerEvents: 'none' }}
                 transition={{ type: "spring", stiffness: 400, damping: 25 }}
                 className="pointer-events-auto flex items-center gap-3 px-3 py-3 bg-white/95 backdrop-blur-xl rounded-4xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-white/80 origin-bottom"
              >
                 <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center text-blue-600 transition-all ${isListening ? '' : 'w-11 h-11 rounded-[1.2rem] bg-blue-50/80 border border-blue-100 shadow-sm'}`}>
                       {isListening ? <AudioVisualizer isListening={isListening} audioData={audioData} /> :
                        isThinking ? <Loader2 size={20} className="animate-spin" /> :
                        isTranscribing ? <Activity size={20} className="animate-pulse" /> :
                        <Sparkles size={20} />}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[13.5px] font-bold text-slate-800 leading-tight whitespace-nowrap">
                         {isThinking ? t('processingWithModel', 'Memproses...') :
                          isTranscribing ? t('transcribingVoice', 'Menerjemahkan...') :
                          isListening ? (speechSupported ? t('listening', 'Mendengarkan...') : t('recordingVoice', 'Merekam...')) :
                          voiceNotice ? '⚠️ Perhatian' :
                          t('allSystemsReady', 'Semua Sistem Siap')}
                       </span>
                       <span className="text-[11.5px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                         {isListening || isThinking ? (
                            <span className="flex gap-1.5 items-center">
                              {t('tridoAiActive', 'Trido AI Aktif')}
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                              </div>
                            </span>
                         ) : voiceNotice ? (
                            <span className="text-amber-500">{voiceNotice.slice(0, 40)}{voiceNotice.length > 40 ? '…' : ''}</span>
                         ) : speechSupported ? t('standbyMode', 'Mode Siaga') : t('limitedVoiceDesc', 'Gunakan teks')}
                       </span>
                    </div>
                 </div>

                 <div className="flex items-center gap-1.5 border-l-2 border-slate-200/60 pl-4">
                    {lastUploadedImage && (
                      <div className="relative mr-2">
                         <img src={lastUploadedImage} alt="Uploaded" className="h-10 w-10 object-cover rounded-[0.85rem] border-2 border-white shadow-sm" />
                         <button
                           onClick={() => setLastUploadedImage(null)}
                           className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-md hover:bg-rose-600 active:scale-95 transition-transform"
                         >
                           <X size={12} strokeWidth={3} />
                         </button>
                      </div>
                    )}
                    <FileUploadButton
                      className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-[1.2rem] transition-colors active:scale-95"
                      icon={<Plus size={22} />}
                      title={t('uploadImage', 'Unggah Gambar')}
                    />

                    <button
                      onClick={() => { setShowTranscript(true); toggleListening(); }}
                      disabled={isTranscribing || isThinking}
                      title={speechSupported ? t('startVoiceInput', 'Mulai input suara') : t('recordVoiceForTranscription', 'Rekam suara')}
                      className={`w-12 h-12 flex items-center justify-center rounded-[1.3rem] text-white shadow-lg transition-all duration-300 ${isListening ? 'bg-red-500 shadow-red-500/25 animate-pulse scale-105 ring-4 ring-red-500/10' : 'bg-blue-600 shadow-blue-600/30 hover:scale-105 hover:bg-blue-500'} disabled:opacity-50 disabled:pointer-events-none active:scale-95 shrink-0`}
                    >
                      <Mic size={20} />
                    </button>

                    {(isThinking || isActing || actionQueue.length > 0) && (
                      <button
                        onClick={() => abortTask()}
                        className="w-12 h-12 flex items-center justify-center bg-rose-50 text-red-500 rounded-[1.3rem] hover:bg-red-100 hover:text-red-600 transition-all font-bold group active:scale-95 border border-red-100 shrink-0"
                        title={t('cancelProcess', 'Batalkan Proses')}
                      >
                        <Square size={16} className="fill-current group-hover:scale-90 transition-transform" />
                      </button>
                    )}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Zoom Controls & History Controls */}
        <div className="pointer-events-auto flex-1 hidden md:flex justify-end gap-3">
           {/* Sleek History & Action Card */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.05 }}
             className="flex items-center gap-1 px-2.5 py-1.5 bg-white/95 backdrop-blur-xl rounded-full border border-slate-200/80 shadow-[0_20px_40px_rgb(0,0,0,0.08)]"
           >
             <button
               onClick={() => undoCanvas()}
               title={language === 'en' ? 'Undo' : 'Batal (Undo)'}
               className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors active:scale-90"
             >
               <Undo2 size={16} />
             </button>
             <button
               onClick={() => redoCanvas()}
               title={language === 'en' ? 'Redo' : 'Ulangi (Redo)'}
               className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors active:scale-90"
             >
               <Redo2 size={16} />
             </button>
             <div className="w-px h-5 bg-slate-200/80 mx-1.5" />
             <button
               onClick={handleDeleteSelection}
               title={language === 'en' ? 'Delete Selected Element' : 'Hapus Elemen Terpilih'}
               className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-90"
             >
               <Trash2 size={16} />
             </button>
           </motion.div>

           {/* Zoom Controls Card */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.1 }}
             className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-xl rounded-4xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-white/80"
           >
             <button onClick={() => handleZoom('out')} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-[1.1rem] transition-colors active:scale-95">
               <Minus size={18} />
             </button>
             <span className="text-[13.5px] font-extrabold text-slate-700 min-w-14 text-center tracking-tight">
                {Math.round(zoom * 100)}%
             </span>
             <button onClick={() => handleZoom('in')} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-[1.1rem] transition-colors active:scale-95">
               <Plus size={18} />
             </button>
             <div className="w-0.5 h-5 bg-slate-200/80 mx-1.5 rounded-full" />
             <button onClick={() => handleZoom('reset')} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-[1.1rem] transition-colors active:scale-95" title={t('fitToScreen', 'Paskan ke Layar')}>
               <Maximize size={18} />
             </button>
           </motion.div>
        </div>


      </div>
    </div>
  );
};
