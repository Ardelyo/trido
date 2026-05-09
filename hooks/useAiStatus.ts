import { useState, useEffect } from 'react';
import { CONFIG } from '../constants';

export interface AiStatus {
  mode: 'gemini' | 'ollama' | 'unavailable';
  model: string;
  online: boolean;
  reason?: string;
  checkedAt?: number;
  ollamaStatus?: { online: boolean; hasModel: boolean; models: string[] };
  geminiStatus?: { online: boolean; reason: string };
}

export const useAiStatus = () => {
  const [status, setStatus] = useState<AiStatus>({
    mode: 'unavailable',
    model: '',
    online: false
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/ai/status');
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
  }, []);

  return status;
};
