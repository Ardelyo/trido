/**
 * Trido Hands-Free Ambient Classroom Listener Hook
 * Enables hands-free ambient classroom voice interaction for teachers (Pak Damar Standard).
 * Supports zero-touch spoken commands:
 *  - "Trido, buka timer 5 menit"
 *  - "Trido, presensi siswa"
 *  - "Trido, acak giliran" (Spin wheel)
 *  - "Trido, buka kalkulator"
 *  - "Trido, buat kuis"
 *  - "Trido, pusatkan layar"
 *  - "Trido, bersihkan papan"
 *  - "Trido, buat peta konsep [topik]"
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { toast } from '../utils/toast';
import { sounds } from '../utils/sounds';
import { createLogger } from '../utils/logger';
import { normalizeSpokenNumbers, stripConversationalPrefix } from './useGeminiBrain';

const logger = createLogger('ambient-listener');

export interface HandsFreeCommandResult {
  matched: boolean;
  action: string;
  detail?: string;
}

export function matchAndExecuteHandsFreeCommand(rawText: string): HandsFreeCommandResult {
  const normalizedText = normalizeSpokenNumbers(rawText.toLowerCase().trim());
  const store = useStore.getState();

  // Strip wake words & polite prefixes if present
  const clean = stripConversationalPrefix(normalizedText);

  // 1. Timer: "pasang timer 5 menit", "buka timer sepuluh menit", "timer 10 menit"
  const timerMatch = clean.match(/(?:buka\s+|pasang\s+|nyalakan\s+|mulai\s+|set\s+)?timer(?:\s+(\d+))?\s*(?:menit|mnt|min|minutes?)?/i) || normalizedText.match(/timer(?:\s+(\d+))?/i);
  if (timerMatch || clean.includes('hitung mundur')) {
    const minutes = timerMatch && timerMatch[1] ? parseInt(timerMatch[1], 10) : 5;
    const id = `timer_${Date.now()}`;
    store.updateDomElement(id, {
      id,
      html: '<div>Timer</div>',
      componentType: 'TIMER',
      config: { seconds: minutes * 60, mode: 'TIMER' },
      x: 960,
      y: 540,
      width: 320,
      height: 380,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      zIndex: 15
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('addCanvasPlaceholder', {
        detail: { id, x: 960, y: 540, width: 320, height: 380 }
      }));
    }
    sounds.play('success');
    toast.success(`⏱️ Hands-Free: Timer ${minutes} menit aktif di papan!`);
    return { matched: true, action: 'TIMER', detail: `${minutes} menit` };
  }

  // 2. Attendance / Presensi: "buka absen", "presensi siswa", "absensi"
  if (clean.includes('absen') || clean.includes('presensi') || clean.includes('kehadiran')) {
    store.toggleAttendance();
    sounds.play('success');
    toast.success('👥 Hands-Free: Daftar Presensi Siswa dibuka!');
    return { matched: true, action: 'ATTENDANCE' };
  }

  // 3. Random Wheel: "putar roda", "acak giliran", "roda acak", "siapa giliran"
  if (clean.includes('putar roda') || clean.includes('acak giliran') || clean.includes('roda acak') || clean.includes('giliran')) {
    const id = `wheel_${Date.now()}`;
    store.updateDomElement(id, {
      id,
      html: '<div>Roda</div>',
      componentType: 'SPIN_WHEEL',
      config: { title: 'Giliran Menjawab Siswa' },
      x: 960,
      y: 540,
      width: 440,
      height: 480,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      zIndex: 15
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('addCanvasPlaceholder', {
        detail: { id, x: 960, y: 540, width: 440, height: 480 }
      }));
    }
    sounds.play('success');
    toast.success('🎲 Hands-Free: Roda Acak Siswa aktif!');
    return { matched: true, action: 'SPIN_WHEEL' };
  }

  // 4. Calculator: "buka kalkulator", "hitung"
  if (clean.includes('kalkulator') || clean.includes('calculator') || clean.includes('hitung angka')) {
    store.toggleCalculator();
    sounds.play('success');
    toast.success('🧮 Hands-Free: Kalkulator Sains dibuka!');
    return { matched: true, action: 'CALCULATOR' };
  }

  // 5. Quiz modal: "buka kuis", "mulai kuis" (when not asking AI to generate a topic-specific quiz)
  if ((clean.includes('kuis') || clean.includes('quiz') || clean.includes('ulangan')) && !/\b(tentang|mengenai|soal|materi|topik)\b/i.test(clean)) {
    store.toggleQuiz();
    sounds.play('success');
    toast.success('❓ Hands-Free: Kuis Interaktif dibuka!');
    return { matched: true, action: 'QUIZ' };
  }

  // 6. Reset camera / Pusatkan layar: "pusatkan layar", "reset kamera", "tengah"
  if (clean.includes('pusatkan') || clean.includes('reset kamera') || clean.includes('tengah')) {
    store.setViewport(1, [1, 0, 0, 1, 0, 0]);
    sounds.play('success');
    toast.success('🧭 Hands-Free: Tampilan kanvas dipusatkan!');
    return { matched: true, action: 'RESET_VIEWPORT' };
  }

  // 7. Clear canvas: "bersihkan papan", "hapus papan", "hapus coretan"
  if (clean.includes('bersihkan papan') || clean.includes('hapus papan') || clean.includes('hapus semua coretan')) {
    window.dispatchEvent(new CustomEvent('clearCanvas'));
    sounds.play('pop');
    toast.info('🧹 Hands-Free: Papan tulis dibersihkan!');
    return { matched: true, action: 'CLEAR_CANVAS' };
  }

  // 8. Undo / Redo / New Page hands-free
  if (/^(undo|batalkan)(?:\s+aksi)?$/i.test(clean)) {
    store.undoCanvas();
    sounds.play('pop');
    return { matched: true, action: 'UNDO' };
  }
  if (/^(redo|ulangi)(?:\s+aksi)?$/i.test(clean)) {
    store.redoCanvas();
    sounds.play('pop');
    return { matched: true, action: 'REDO' };
  }
  if (/^(halaman baru|tambah halaman|new page|add page)$/i.test(clean)) {
    store.addPage();
    sounds.play('success');
    toast.success('📄 Hands-Free: Halaman baru ditambahkan!');
    return { matched: true, action: 'ADD_PAGE' };
  }

  // 9. General AI Smartboard Command / Mindmap / Question / In-Place Modification
  if (
    clean.includes('peta konsep') ||
    clean.includes('mindmap') ||
    clean.includes('diagram') ||
    clean.includes('kuis') ||
    clean.includes('quiz') ||
    /^(buat|buatkan|gambar|gambarkan|jelaskan|terangkan|ubah|edit|perbarui|tambahkan|rangkum|ringkas|apa|mengapa|kenapa|bagaimana|siapa|create|draw|explain|modify|update|what|how|why)\b/i.test(clean)
  ) {
    store.setChatInputText(rawText);
    if (!store.isAiDrawerOpen) store.toggleAiDrawer();
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('execute-voice-prompt', { detail: { prompt: clean } }));
    }
    sounds.play('pop');
    toast.info(`💡 Hands-Free: Meneruskan ke AI Smartboard: "${clean.slice(0, 36)}..."`);
    return { matched: true, action: 'AI_ASSISTANT', detail: clean };
  }

  return { matched: false, action: 'UNKNOWN' };
}

export interface UseAmbientListenerOptions {
  onTranscriptDetected?: (transcript: string) => void;
  sliceIntervalMs?: number;
}

export function useAmbientListener(options: UseAmbientListenerOptions = {}) {
  const { sliceIntervalMs = 5000 } = options;
  const isHandsFreeListening = useStore((s) => s.isHandsFreeListening);
  const setHandsFreeListening = useStore((s) => s.setHandsFreeListening);
  const setLastVoiceCommand = useStore((s) => s.setLastVoiceCommand);

  const [isProcessingSnippet, setIsProcessingSnippet] = useState(false);
  const [interimCaption, setInterimCaption] = useState('');

  const speechRecognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalTimerRef = useRef<any>(null);
  const isAmbientActiveRef = useRef(isHandsFreeListening);

  useEffect(() => {
    isAmbientActiveRef.current = isHandsFreeListening;
  }, [isHandsFreeListening]);

  // Faster-Whisper slice audio buffer fallback for environments without Web Speech API
  const transcribeAudioSnippet = async (audioBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result as string;
          if (!base64Audio || base64Audio.length < 500) {
            resolve('');
            return;
          }

          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Audio,
              language: useStore.getState().language || 'id',
              model: 'tiny',
              mode: 'faster_whisper'
            })
          });

          if (!res.ok) {
            resolve('');
            return;
          }

          const data = await res.json();
          resolve(data.text?.trim() || '');
        } catch (err) {
          logger.warn('[Ambient Listener] Snippet transcription error', err);
          resolve('');
        }
      };
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(audioBlob);
    });
  };

  const processAudioBuffer = useCallback(async () => {
    if (audioChunksRef.current.length === 0 || isProcessingSnippet) return;

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];

    if (audioBlob.size < 2000) return;

    setIsProcessingSnippet(true);
    try {
      const transcript = await transcribeAudioSnippet(audioBlob);
      if (transcript && transcript.length > 3) {
        logger.info('[Ambient Listener] Faster-Whisper detected:', { transcript });
        setLastVoiceCommand(transcript);
        matchAndExecuteHandsFreeCommand(transcript);
        if (options.onTranscriptDetected) {
          options.onTranscriptDetected(transcript);
        }
      }
    } finally {
      setIsProcessingSnippet(false);
    }
  }, [isProcessingSnippet, options, setLastVoiceCommand]);

  const startAmbient = async () => {
    try {
      // 1. Try real-time Continuous Web Speech API first
      const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        const langLocaleMap: Record<string, string> = {
          id: 'id-ID', en: 'en-US', ar: 'ar-SA', zh: 'zh-CN', fr: 'fr-FR',
          ru: 'ru-RU', es: 'es-ES', ja: 'ja-JP', ko: 'ko-KR', de: 'de-DE', pt: 'pt-BR'
        };
        const activeLang = useStore.getState().language || 'id';
        recognition.lang = langLocaleMap[activeLang] || 'id-ID';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              const final = transcript.trim();
              if (final.length > 2) {
                setLastVoiceCommand(final);
                setInterimCaption('');
                matchAndExecuteHandsFreeCommand(final);
                if (options.onTranscriptDetected) {
                  options.onTranscriptDetected(final);
                }
              }
            } else {
              interim += transcript;
            }
          }
          if (interim) setInterimCaption(interim);
        };

        recognition.onerror = (e: any) => {
          logger.warn('[Ambient Listener] WebSpeech error:', e.error);
        };

        recognition.onend = () => {
          if (isAmbientActiveRef.current) {
            // Keep continuous hands-free active seamlessly
            try {
              setTimeout(() => {
                if (isAmbientActiveRef.current) recognition.start();
              }, 250);
            } catch {}
          }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      }

      // 2. Start background media stream & MediaRecorder only when SpeechRecognition is unavailable (Whisper fallback)
      if (!SpeechRecognition) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        streamRef.current = stream;

        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start(1000);

        intervalTimerRef.current = setInterval(() => {
          processAudioBuffer();
        }, sliceIntervalMs);
      }

      setHandsFreeListening(true);
      sounds.play('mic_on');
      toast.info('🎙️ Mode Bebas Genggam (Hands-Free) Aktif — Ucapkan "Trido, ..."');
    } catch (err) {
      logger.error('[Ambient Listener] Failed to start microphone', err);
      toast.error('Gagal mengakses mikrofon untuk Mode Bebas Genggam.');
      setHandsFreeListening(false);
    }
  };

  const stopAmbient = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    setHandsFreeListening(false);
    setInterimCaption('');
    sounds.play('mic_off');
    toast.info('Mode Bebas Genggam Dinonaktifkan');
  };

  const toggleAmbient = () => {
    if (isHandsFreeListening) {
      stopAmbient();
    } else {
      startAmbient();
    }
  };

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    isAmbientActive: isHandsFreeListening,
    isProcessingSnippet,
    interimCaption,
    startAmbient,
    stopAmbient,
    toggleAmbient
  };
}

export default useAmbientListener;
