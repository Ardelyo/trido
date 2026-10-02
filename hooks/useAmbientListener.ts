/**
 * Trido Hands-Free Ambient Classroom Listener Hook (Opt-In)
 * Enables ambient passive listening during live classroom teaching.
 * Buffers teacher speech, detects pedagogical topic transitions via Faster-Whisper,
 * and passes proactive suggestions/diagrams hands-free without touching the laptop.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { toast } from '../utils/toast';
import { createLogger } from '../utils/logger';

const logger = createLogger('ambient-listener');

export interface UseAmbientListenerOptions {
  onTranscriptDetected?: (transcript: string) => void;
  minSilenceDurationMs?: number;
  sliceIntervalMs?: number;
}

export function useAmbientListener(options: UseAmbientListenerOptions = {}) {
  const { minSilenceDurationMs = 2500, sliceIntervalMs = 5000 } = options;

  const [isAmbientActive, setIsAmbientActive] = useState(false);
  const [isProcessingSnippet, setIsProcessingSnippet] = useState(false);
  const [lastSnippetText, setLastSnippetText] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalTimerRef = useRef<any>(null);

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
              audio: base64Audio,
              language: 'id',
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

    // Skip tiny buffers (< 2KB)
    if (audioBlob.size < 2000) return;

    setIsProcessingSnippet(true);
    try {
      const transcript = await transcribeAudioSnippet(audioBlob);
      if (transcript && transcript.length > 5) {
        logger.info('[Ambient Listener] Detected speech snippet:', { transcript });
        setLastSnippetText(transcript);
        if (options.onTranscriptDetected) {
          options.onTranscriptDetected(transcript);
        }
      }
    } finally {
      setIsProcessingSnippet(false);
    }
  }, [isProcessingSnippet, options]);

  const startAmbient = async () => {
    try {
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

      recorder.start(1000); // 1-second timeslices
      setIsAmbientActive(true);
      toast.info('Mode Dengar Pasif (Hands-Free) Aktif');

      // Periodic slice buffer processing
      intervalTimerRef.current = setInterval(() => {
        processAudioBuffer();
      }, sliceIntervalMs);
    } catch (err) {
      logger.error('[Ambient Listener] Failed to initialize microphone stream', err);
      toast.error('Gagal mengakses mikrofon untuk Mode Dengar Pasif.');
      setIsAmbientActive(false);
    }
  };

  const stopAmbient = () => {
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    setIsAmbientActive(false);
    setIsProcessingSnippet(false);
    toast.info('Mode Dengar Pasif Dinonaktifkan');
  };

  const toggleAmbient = () => {
    if (isAmbientActive) {
      stopAmbient();
    } else {
      startAmbient();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return {
    isAmbientActive,
    isProcessingSnippet,
    lastSnippetText,
    startAmbient,
    stopAmbient,
    toggleAmbient
  };
}
