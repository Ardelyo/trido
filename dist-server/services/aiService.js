import { useStore } from "../store";
import { CONFIG } from "../constants";
export class AiServiceError extends Error {
    constructor(message, code = 'server_error', status = 500, retryable = false) {
        super(message);
        this.name = 'AiServiceError';
        this.code = code;
        this.status = status;
        this.retryable = retryable;
    }
}
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const friendlyMessageForStatus = (status, fallback) => {
    if (fallback)
        return fallback;
    if (status === 401 || status === 403)
        return 'Kunci API atau izin layanan AI tidak valid.';
    if (status === 404)
        return 'Model AI yang dipilih tidak ditemukan.';
    if (status === 429)
        return 'Kuota AI sedang tercapai. Coba lagi sebentar.';
    if (status >= 500)
        return 'Layanan AI sedang bermasalah.';
    return 'Permintaan AI gagal diproses.';
};
const parseAiError = async (response) => {
    let body = null;
    try {
        body = await response.json();
    }
    catch {
        try {
            body = { error: await response.text() };
        }
        catch {
            body = null;
        }
    }
    const code = (body?.code || (response.status === 429 ? 'rate_limited' : response.status === 404 ? 'model_not_found' : response.status === 401 || response.status === 403 ? 'invalid_key' : 'server_error'));
    const message = friendlyMessageForStatus(response.status, body?.error);
    const retryable = Boolean(body?.retryable ?? (response.status === 429 || response.status >= 500 || response.status === 503));
    return new AiServiceError(message, code, response.status, retryable);
};
const requestJson = async (url, init, retries = CONFIG.ai.request.retryCount) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, init);
            if (!response.ok) {
                const error = await parseAiError(response);
                if (!error.retryable || attempt === retries)
                    throw error;
                await wait(CONFIG.ai.request.retryBaseDelayMs * Math.pow(2, attempt));
                continue;
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof AiServiceError)
                throw error;
            const networkError = new AiServiceError('Tidak bisa menghubungi layanan AI. Periksa koneksi internet atau server lokal.', 'no_internet', 0, true);
            if (attempt === retries)
                throw networkError;
            await wait(CONFIG.ai.request.retryBaseDelayMs * Math.pow(2, attempt));
        }
    }
    throw new AiServiceError('Permintaan AI gagal setelah beberapa percobaan.', 'server_error', 500, false);
};
export const generateAgentActions = async (prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history = [], pageContext, domElements = {}) => {
    const { aiPreference, geminiApiKey, ollamaBaseUrl } = useStore.getState();
    return requestJson('/api/ai/generate', {
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
export const generateToolContent = async (toolId, prompt) => {
    const { aiPreference, geminiApiKey, ollamaBaseUrl } = useStore.getState();
    const data = await requestJson('/api/ai/tool-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, prompt, aiPreference, geminiApiKey, ollamaBaseUrl })
    });
    return data.result;
};
export const transcribeAudio = async (base64Audio) => {
    const { aiPreference, geminiApiKey, ollamaBaseUrl } = useStore.getState();
    const data = await requestJson('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Audio, aiPreference, geminiApiKey, ollamaBaseUrl })
    });
    return data.text;
};
