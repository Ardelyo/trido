import { useState, useEffect } from 'react';
import { CONFIG } from '../constants';
import { useStore } from '../store';

export interface AiStatus {
  mode: 'gemini' | 'ollama' | 'vertex' | 'unavailable';
  model: string;
  online: boolean;
  reason?: string;
  checkedAt?: number;
  ollamaStatus?: { online: boolean; hasModel: boolean; models: string[] };
  geminiStatus?: { online: boolean; reason: string };
  vertexStatus?: { online: boolean; reason: string };
}

export const useAiStatus = () => {
  const { geminiApiKey, ollamaBaseUrl } = useStore();
  const [status, setStatus] = useState<AiStatus>({
    mode: 'unavailable',
    model: '',
    online: false
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || '';
        const res = await fetch(`${apiUrl}/api/ai/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ geminiApiKey, ollamaBaseUrl })
        });

        if (res.ok) {
          const data = await res.json();
          setStatus({ ...data, checkedAt: Date.now() });
        } else {
          setStatus(s => ({ ...s, online: false, mode: 'unavailable', reason: `http_${res.status}`, checkedAt: Date.now() }));
        }
      } catch (e) {
        setStatus(s => ({ ...s, online: false, mode: 'unavailable', reason: 'network', checkedAt: Date.now() }));
      }
    };

    fetchStatus();
    window.addEventListener('online', fetchStatus);
    window.addEventListener('offline', fetchStatus);
    const interval = setInterval(fetchStatus, CONFIG.ui.aiStatusPollIntervalMs);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', fetchStatus);
      window.removeEventListener('offline', fetchStatus);
    };
  }, [geminiApiKey, ollamaBaseUrl]);

  return status;
};
