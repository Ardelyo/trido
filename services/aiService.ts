import { CanvasObjectData } from "../types";
import { useStore } from "../store";
import { CONFIG } from "../constants";

export interface ViewportBounds {
  width: number;
  height: number;
}

export type AiErrorCode = 'invalid_key' | 'no_internet' | 'rate_limited' | 'model_not_found' | 'local_unavailable' | 'server_error';

export class AiServiceError extends Error {
  code: AiErrorCode;
  retryable: boolean;
  status: number;

  constructor(message: string, code: AiErrorCode = 'server_error', status = 500, retryable = false) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const friendlyMessageForStatus = (status: number, fallback?: string) => {
  if (fallback) return fallback;
  if (status === 401 || status === 403) return 'Kunci API atau izin layanan AI tidak valid.';
  if (status === 404) return 'Model AI yang dipilih tidak ditemukan.';
  if (status === 429) return 'Kuota AI sedang tercapai. Coba lagi sebentar.';
  if (status >= 500) return 'Layanan AI sedang bermasalah.';
  return 'Permintaan AI gagal diproses.';
};

const parseAiError = async (response: Response): Promise<AiServiceError> => {
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    try {
      body = { error: await response.text() };
    } catch {
      body = null;
    }
  }

  const code = (body?.code || (response.status === 429 ? 'rate_limited' : response.status === 404 ? 'model_not_found' : response.status === 401 || response.status === 403 ? 'invalid_key' : 'server_error')) as AiErrorCode;
  const message = friendlyMessageForStatus(response.status, body?.error);
  const retryable = Boolean(body?.retryable ?? (response.status === 429 || response.status >= 500 || response.status === 503));
  return new AiServiceError(message, code, response.status, retryable);
};

const requestJson = async <T>(url: string, init: RequestInit, retries = CONFIG.ai.request.retryCount): Promise<T> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        const error = await parseAiError(response);
        if (!error.retryable || attempt === retries) throw error;
        await wait(CONFIG.ai.request.retryBaseDelayMs * Math.pow(2, attempt));
        continue;
      }
      return await response.json();
    } catch (error: any) {
      if (error instanceof AiServiceError) throw error;
      const networkError = new AiServiceError(
        'Tidak bisa menghubungi layanan AI. Periksa koneksi internet atau server lokal.',
        'no_internet',
        0,
        true
      );
      if (attempt === retries) throw networkError;
      await wait(CONFIG.ai.request.retryBaseDelayMs * Math.pow(2, attempt));
    }
  }

  throw new AiServiceError('Permintaan AI gagal setelah beberapa percobaan.', 'server_error', 500, false);
};

export const generateAgentActions = async (
  prompt: string,
  canvasImageBase64: string,
  canvasObjects: CanvasObjectData[],
  viewport: ViewportBounds,
  highResInputImage?: string | null,
  history: { role: 'user' | 'model'; text: string }[] = [],
  pageContext?: { current: number; total: number },
  domElements: Record<string, any> = {}
) => {
  const { aiPreference, geminiApiKey, ollamaBaseUrl } = useStore.getState();
  const apiUrl = (import.meta as any).env.VITE_API_URL || '';
  return requestJson<any>(`${apiUrl}/api/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      canvasImageBase64,
      canvasObjects,
      viewport,
      highResInputImage,
      history,
      pageContext,
      domElements,
      aiPreference,
      geminiApiKey,
      ollamaBaseUrl
    })
  });
};

export const generateToolContent = async (toolId: string, prompt: string): Promise<any> => {
  const { aiPreference, geminiApiKey, ollamaBaseUrl } = useStore.getState();
  const apiUrl = (import.meta as any).env.VITE_API_URL || '';
  const data = await requestJson<{ result: any }>(`${apiUrl}/api/ai/tool-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolId, prompt, aiPreference, geminiApiKey, ollamaBaseUrl })
  });

  return data.result;
};

