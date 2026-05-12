import { Router } from "express";
import express from "express";
import type { Response } from "express";
import {
  generateAgentActionsGemini,
  generateToolContentGemini,
  transcribeAudioGemini
} from "./geminiAdapter";
import {
  generateAgentActionsOllama,
  generateToolContentOllama,
  transcribeAudioOllama
} from "./ollamaAdapter";
import { CONFIG } from "../constants";
import { AiPreference } from "../types";
import { createLogger } from "../utils/logger";

export const aiRouter = Router();
const logger = createLogger('ai-router');

aiRouter.use(express.json({ limit: CONFIG.ai.request.bodyLimit }));

type AiMode = 'gemini' | 'ollama';
type AiErrorCode = 'invalid_key' | 'no_internet' | 'rate_limited' | 'model_not_found' | 'local_unavailable' | 'server_error';

const isAiPreference = (value: unknown): value is AiPreference => (
  value === 'auto' || value === 'gemini' || value === 'ollama'
);

const getConfiguredMode = (): AiPreference => {
  const AI_MODE = isAiPreference(process.env.AI_MODE) ? process.env.AI_MODE : 'auto';
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (AI_MODE === 'gemini' && !GEMINI_KEY) return 'auto';
  return AI_MODE;
};

const getRuntimePreference = (preference?: unknown): AiPreference => (
  isAiPreference(preference) ? preference : getConfiguredMode()
);

const getPreferredAutoMode = (): AiMode => (
  process.env.GEMINI_API_KEY || process.env.API_KEY ? 'gemini' : 'ollama'
);

const getOllamaUrl = () => process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || CONFIG.ai.ollama.defaultBaseUrl;
const getOllamaModel = () => process.env.OLLAMA_MODEL || CONFIG.ai.ollama.model;

const probeGemini = async () => {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key) {
    return { online: false, reason: 'missing_key' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.ai.gemini.probeTimeoutMs);
    const response = await fetch(
      `${CONFIG.ai.gemini.apiBaseUrl}/models/${CONFIG.ai.gemini.model}?key=${key}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (response.ok) return { online: true, reason: 'ok' };
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return { online: false, reason: 'invalid_key' };
    }
    if (response.status === 404) {
      return { online: false, reason: 'model_not_found' };
    }
    if (response.status === 429) {
      return { online: false, reason: 'rate_limited' };
    }
    return { online: false, reason: `http_${response.status}` };
  } catch (e: any) {
    return { online: false, reason: e?.name === 'AbortError' ? 'timeout' : 'network' };
  }
};

const probeOllama = async () => {
  const url = getOllamaUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.ai.ollama.probeTimeoutMs);
    const response = await fetch(`${url}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return { online: false, reason: `http_${response.status}`, models: [] };

    const data = await response.json();
    const models = (data.models || []).map((m: any) => m.name);
    const model = getOllamaModel();
    const hasRequiredModel = models.includes(model) || models.some((m: string) => m.startsWith(model + ':'));

    return {
      online: true,
      reason: hasRequiredModel ? 'ok' : 'model_missing',
      models,
      hasRequiredModel
    };
  } catch (e: any) {
    return { online: false, reason: e?.name === 'AbortError' ? 'timeout' : 'local_unavailable', models: [] };
  }
};

const getAvailableMode = async (): Promise<{
  mode: AiMode | 'unavailable';
  model: string;
  online: boolean;
  reason: string;
  ollamaStatus?: { online: boolean; hasModel: boolean; models: string[] };
  geminiStatus?: { online: boolean; reason: string };
}> => {
  const configuredMode = getConfiguredMode();
  const gemini = await probeGemini();
  const ollama = await probeOllama();

  const geminiInfo = { online: gemini.online, reason: gemini.reason };
  const ollamaInfo = { online: ollama.online, hasModel: !!ollama.hasRequiredModel, models: ollama.models };

  const preferredMode = configuredMode === 'auto' ? getPreferredAutoMode() : configuredMode;

  if (preferredMode === 'gemini') {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (gemini.online || key) {
      return { mode: 'gemini', model: CONFIG.ai.gemini.model, online: gemini.online, reason: gemini.reason, geminiStatus: geminiInfo, ollamaStatus: ollamaInfo };
    }
    if (ollama.online && ollama.hasRequiredModel) {
      return { mode: 'ollama', model: getOllamaModel(), online: true, reason: 'cloud_key_missing_using_local', geminiStatus: geminiInfo, ollamaStatus: ollamaInfo };
    }
    return { mode: 'unavailable', model: CONFIG.ai.gemini.model, online: false, reason: gemini.reason, geminiStatus: geminiInfo, ollamaStatus: ollamaInfo };
  }

  if (ollama.online && ollama.hasRequiredModel) {
    return { mode: 'ollama', model: getOllamaModel(), online: true, reason: 'ok', geminiStatus: geminiInfo, ollamaStatus: ollamaInfo };
  }
  return {
    mode: 'unavailable',
    model: getOllamaModel(),
    online: false,
    reason: ollama.online ? 'model_missing' : ollama.reason,
    geminiStatus: geminiInfo,
    ollamaStatus: ollamaInfo
  };
};

aiRouter.post("/pull-model", async (req, res) => {
  const url = getOllamaUrl();
  try {
    const response = await fetch(`${url}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: getOllamaModel(), stream: false })
    });

    if (response.ok) {
      res.json({ success: true, message: `Model ${getOllamaModel()} sedang diunduh atau sudah ada.` });
    } else {
      res.status(response.status).json({ success: false, error: `Gagal menarik model: ${response.statusText}` });
    }
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

const classifyAiError = (error: any): { code: AiErrorCode; status: number; message: string; retryable: boolean } => {
  const raw = String(error?.message || error || '').toLowerCase();
  const status = Number(error?.status || error?.cause?.status || 500);

  if (status === 401 || status === 403 || raw.includes('api key') || raw.includes('permission denied')) {
    return { code: 'invalid_key', status: 401, retryable: false, message: 'Kunci API Gemini tidak valid atau tidak memiliki izin.' };
  }
  if (status === 404 || raw.includes('not found') || raw.includes('model')) {
    return { code: 'model_not_found', status: 404, retryable: false, message: 'Model AI yang dikonfigurasi tidak ditemukan.' };
  }
  if (status === 429 || raw.includes('quota') || raw.includes('rate')) {
    return { code: 'rate_limited', status: 429, retryable: true, message: 'Kuota atau batas permintaan AI sedang tercapai. Coba lagi sebentar.' };
  }
  if (raw.includes('fetch failed') || raw.includes('network') || raw.includes('timeout') || raw.includes('econnrefused')) {
    return { code: raw.includes('localhost') || raw.includes('11434') ? 'local_unavailable' : 'no_internet', status: 503, retryable: true, message: raw.includes('localhost') || raw.includes('11434') ? 'Ollama lokal belum dapat dihubungi.' : 'Koneksi internet ke layanan AI sedang bermasalah.' };
  }

  return { code: 'server_error', status, retryable: false, message: 'Layanan AI mengalami kesalahan tak terduga.' };
};

const sendAiError = (res: Response, error: unknown) => {
  const classified = classifyAiError(error);
  res.status(classified.status).json({
    error: classified.message,
    code: classified.code,
    retryable: classified.retryable,
    detail: process.env.NODE_ENV === 'production' ? undefined : error instanceof Error ? error.message : String(error)
  });
};

aiRouter.get("/status", async (req, res) => {
  res.json(await getAvailableMode());
});

aiRouter.post("/generate", async (req, res) => {
  try {
    const { prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements, aiPreference } = req.body;
    const configuredMode = getRuntimePreference(aiPreference);
    const status = await getAvailableMode();
    const mode = status.mode;

    if (mode === 'unavailable') {
      const reason = configuredMode === 'gemini' ? status.geminiStatus?.reason : (status.ollamaStatus?.online ? 'model_missing' : 'local_unavailable');
      return res.status(503).json({
        error: configuredMode === 'gemini' ? 'Layanan Gemini tidak tersedia.' : 'Layanan Ollama tidak tersedia.',
        code: reason === 'invalid_key' ? 'invalid_key' : 'no_internet',
        retryable: true
      });
    }

    let result;
    if (mode === 'gemini') {
      try {
        result = await generateAgentActionsGemini(
          prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements
        );
      } catch (e) {
        if (configuredMode === 'auto') {
          logger.warn("Gemini failed, falling back to Ollama", e);
          // Reuse status already fetched above — avoid second probe round-trip
          if (status.ollamaStatus?.online && status.ollamaStatus?.hasModel) {
            result = await generateAgentActionsOllama(
              prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements
            );
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }
    } else {
      result = await generateAgentActionsOllama(
        prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements
      );
    }

    res.json(result);
  } catch (error: any) {
    logger.error("Generate error", error);
    sendAiError(res, error);
  }
});

aiRouter.post("/tool-content", async (req, res) => {
  try {
    const { toolId, prompt, aiPreference } = req.body;
    const status = await getAvailableMode();
    const mode = status.mode;

    if (mode === 'unavailable') {
      return res.status(503).json({ error: 'Layanan AI belum tersedia.', code: 'no_internet', retryable: true });
    }
    
    let result;
    if (mode === 'gemini') {
      result = await generateToolContentGemini(toolId, prompt);
    } else {
      result = await generateToolContentOllama(toolId, prompt);
    }

    res.json({ result });
  } catch (error: any) {
    logger.error("Tool content error", error);
    sendAiError(res, error);
  }
});

aiRouter.post("/transcribe", async (req, res) => {
  try {
    const { base64Audio, aiPreference } = req.body;
    const status = await getAvailableMode();
    const mode = status.mode;

    if (mode === 'unavailable') {
      return res.status(503).json({ error: 'Transkripsi suara membutuhkan Gemini atau layanan lokal yang tersedia.', code: 'no_internet', retryable: true });
    }
    
    let text;
    if (mode === 'gemini') {
      text = await transcribeAudioGemini(base64Audio);
    } else {
      text = await transcribeAudioOllama(base64Audio);
    }

    res.json({ text });
  } catch (error: any) {
    logger.error("Transcribe error", error);
    sendAiError(res, error);
  }
});
