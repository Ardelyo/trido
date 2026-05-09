import { useState, useEffect } from 'react';

export interface AiStatus {
  mode: 'gemini' | 'ollama' | 'unavailable';
  model: string;
  online: boolean;
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
          setStatus(data);
        }
      } catch (e) {
        setStatus(s => ({ ...s, online: false, mode: 'unavailable' }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return status;
};
