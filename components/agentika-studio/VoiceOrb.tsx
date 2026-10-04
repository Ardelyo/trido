import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';
import { toast } from '../../utils/toast';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceOrbProps {
  onTranscript: (text: string) => void;
  onVoiceCommand?: (command: string) => void;
  isProcessing?: boolean;
  className?: string;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  onTranscript,
  onVoiceCommand,
  isProcessing = false,
  className = ''
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimText, setInterimText] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isProcessing && voiceState !== 'listening') {
      setVoiceState('processing');
    } else if (!isProcessing && voiceState === 'processing') {
      setVoiceState('idle');
    }
  }, [isProcessing]);

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Browser belum mendukung Web Speech Recognition. Gunakan Google Chrome atau Microsoft Edge.');
      setVoiceState('error');
      setTimeout(() => setVoiceState('idle'), 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setVoiceState('listening');
        setInterimText('');
        toast.success('🎙️ Mendengarkan suara... Ucapkan instruksi pengajaran Anda!');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalStr += trans;
          } else {
            interim += trans;
          }
        }

        if (interim) {
          setInterimText(interim);
        }

        if (finalStr) {
          setInterimText(finalStr);
          onTranscript(finalStr);
          if (onVoiceCommand) {
            onVoiceCommand(finalStr);
          }
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          toast.error(`Kesalahan suara: ${e.error}`);
          setVoiceState('error');
        } else {
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        setVoiceState('idle');
        setInterimText('');
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      toast.error('Gagal memulai mikrofon: ' + err.message);
      setVoiceState('error');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setVoiceState('idle');
    setInterimText('');
  };

  const toggleVoice = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`fixed bottom-24 right-6 z-40 flex items-center gap-3 font-sans ${className}`}>
      {/* Live Interim Transcript Bubble */}
      <AnimatePresence>
        {(voiceState === 'listening' || interimText) && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border-2 border-[#F5C518] shadow-lg max-w-xs text-xs text-slate-800 font-semibold"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-[#1D4ED8] font-black uppercase mb-0.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Mendengarkan Langsung</span>
            </div>
            <p className="italic text-slate-700 truncate">
              {interimText || 'Ucapkan sekarang...'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signature Trido Voice Orb Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={toggleVoice}
        aria-label="Tombol Suara Trido Voice-First"
        className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all cursor-pointer shadow-xl ${
          voiceState === 'listening'
            ? 'bg-[#F5C518] text-[#111827] ring-4 ring-[#F5C518]/40 animate-pulse'
            : voiceState === 'processing'
              ? 'bg-[#F5C518] text-[#111827]'
              : 'bg-[#1D4ED8] text-white border-2 border-[#F5C518]'
        }`}
        title={voiceState === 'listening' ? 'Mendengarkan... Klik untuk berhenti' : 'Bicara untuk memberi instruksi (Voice-First)'}
      >
        {/* Pulsing Outer Waveform Ring when Active */}
        {voiceState === 'listening' && (
          <span className="absolute -inset-2 rounded-full border-2 border-[#1D4ED8] animate-ping opacity-60 pointer-events-none" />
        )}

        {voiceState === 'listening' ? (
          <MicOff size={24} strokeWidth={2.5} />
        ) : voiceState === 'processing' ? (
          <Sparkles size={22} className="animate-spin text-[#1D4ED8]" />
        ) : (
          <Mic size={24} strokeWidth={2.2} />
        )}
      </motion.button>
    </div>
  );
};

export default VoiceOrb;
