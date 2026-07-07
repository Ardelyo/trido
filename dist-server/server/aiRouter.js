import { Router } from "express";
import express from "express";
import { generateAgentActionsGemini, generateToolContentGemini, transcribeAudioGemini } from "./geminiAdapter";
import { generateAgentActionsOllama, generateToolContentOllama, transcribeAudioOllama } from "./ollamaAdapter";
import { generateAgentActionsVertex, generateToolContentVertex, transcribeAudioVertex } from "./vertexAdapter";
import { CONFIG } from "../constants";
import { createLogger } from "../utils/logger";
export const aiRouter = Router();
const logger = createLogger('ai-router');
aiRouter.use(express.json({ limit: CONFIG.ai.request.bodyLimit }));
const isAiPreference = (value) => (value === 'auto' || value === 'gemini' || value === 'ollama' || value === 'vertex');
const getConfiguredMode = () => {
    const AI_MODE = isAiPreference(process.env.AI_MODE) ? process.env.AI_MODE : 'auto';
    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const VERTEX_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID;
    if (AI_MODE === 'gemini' && !GEMINI_KEY)
        return 'auto';
    if (AI_MODE === 'vertex' && !VERTEX_PROJECT)
        return 'auto';
    return AI_MODE;
};
const getRuntimePreference = (preference) => (isAiPreference(preference) ? preference : getConfiguredMode());
const getPreferredAutoMode = () => {
    if (process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID)
        return 'vertex';
    return process.env.GEMINI_API_KEY || process.env.API_KEY ? 'gemini' : 'ollama';
};
const getOllamaUrl = () => process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || CONFIG.ai.ollama.defaultBaseUrl;
const getOllamaModel = () => process.env.OLLAMA_MODEL || CONFIG.ai.ollama.model;
// ── Status probe cache (TTL: 15s) ────────────────────────────────────────────
// Prevents triple-probe (Gemini + Ollama + Vertex) on every /generate request.
const STATUS_CACHE_TTL_MS = 15_000;
const statusCache = new Map();
const probeGemini = async (customKey) => {
    const key = customKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key) {
        return { online: false, reason: 'missing_key' };
    }
    // gemma-4-31b-it is accessed via the @google/genai SDK, not the REST
    // models discovery endpoint (which only lists standard Gemini models).
    // Key presence is the correct readiness check; auth errors surface at call time.
    return { online: true, reason: 'ok' };
};
const probeVertex = async () => {
    const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID;
    if (!project) {
        return { online: false, reason: 'missing_project' };
    }
    // Vertex AI SDK doesn't have a simple probe, we just check if config is present
    // A real probe would involve a small request, but for now we assume online if configured
    return { online: true, reason: 'configured' };
};
const probeOllama = async (customUrl, customModel) => {
    const url = customUrl || getOllamaUrl();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CONFIG.ai.ollama.probeTimeoutMs);
        const response = await fetch(`${url}/api/tags`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok)
            return { online: false, reason: `http_${response.status}`, models: [] };
        const data = await response.json();
        const models = (data.models || []).map((m) => m.name);
        const configuredModel = customModel || getOllamaModel();
        // Check configured model, and alternative fallbacks requested by user: gemma-4-31b-it or gemma4:31b, or default gemma4:e2b
        const candidateModels = [configuredModel, 'gemma-4-31b-it', 'gemma4:31b', 'gemma4:e2b'];
        const activeModel = candidateModels.find(candidate => models.includes(candidate) || models.some((m) => m.startsWith(candidate + ':')));
        const hasRequiredModel = !!activeModel;
        return {
            online: true,
            reason: hasRequiredModel ? 'ok' : 'model_missing',
            models,
            hasRequiredModel,
            activeModel: activeModel || configuredModel
        };
    }
    catch (e) {
        return { online: false, reason: e?.name === 'AbortError' ? 'timeout' : 'local_unavailable', models: [] };
    }
};
// Internal uncached implementation
const _getAvailableMode = async (customGeminiKey, customOllamaUrl, customOllamaModel) => {
    const configuredMode = getConfiguredMode();
    const gemini = await probeGemini(customGeminiKey);
    const ollama = await probeOllama(customOllamaUrl, customOllamaModel);
    const vertex = await probeVertex();
    const geminiInfo = { online: gemini.online, reason: gemini.reason };
    const ollamaInfo = { online: ollama.online, hasModel: !!ollama.hasRequiredModel, models: ollama.models, activeModel: ollama.activeModel };
    const vertexInfo = { online: vertex.online, reason: vertex.reason };
    const preferredMode = configuredMode === 'auto' ? getPreferredAutoMode() : configuredMode;
    if (preferredMode === 'vertex' && vertex.online) {
        return { mode: 'vertex', model: CONFIG.ai.vertex.model, online: true, reason: 'ok', geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo };
    }
    if (preferredMode === 'gemini') {
        const key = customGeminiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (gemini.online || key) {
            return { mode: 'gemini', model: CONFIG.ai.gemini.model, online: gemini.online, reason: gemini.reason, geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo };
        }
        if (ollama.online && ollama.hasRequiredModel) {
            return { mode: 'ollama', model: ollama.activeModel || getOllamaModel(), online: true, reason: 'cloud_key_missing_using_local', geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo };
        }
        return { mode: 'unavailable', model: CONFIG.ai.gemini.model, online: false, reason: gemini.reason, geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo };
    }
    if (ollama.online && ollama.hasRequiredModel) {
        return { mode: 'ollama', model: ollama.activeModel || getOllamaModel(), online: true, reason: 'ok', geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo };
    }
    return {
        mode: 'unavailable',
        model: ollama.activeModel || getOllamaModel(),
        online: false,
        reason: ollama.online ? 'model_missing' : ollama.reason,
        geminiStatus: geminiInfo,
        ollamaStatus: ollamaInfo,
        vertexStatus: vertexInfo
    };
};
// Cached wrapper
const getAvailableMode = async (customGeminiKey, customOllamaUrl, customOllamaModel) => {
    const cacheKey = `${customGeminiKey || ''}|${customOllamaUrl || ''}|${customOllamaModel || ''}`;
    const cached = statusCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < STATUS_CACHE_TTL_MS) {
        return cached.value;
    }
    const value = await _getAvailableMode(customGeminiKey, customOllamaUrl, customOllamaModel);
    statusCache.set(cacheKey, { ts: Date.now(), value });
    return value;
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
        }
        else {
            res.status(response.status).json({ success: false, error: `Gagal menarik model: ${response.statusText}` });
        }
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
const classifyAiError = (error) => {
    const raw = String(error?.message || error || '').toLowerCase();
    const status = Number(error?.status || error?.cause?.status || 500);
    if (status === 401 || status === 403 || raw.includes('api key') || raw.includes('permission denied')) {
        return { code: 'invalid_key', status: 401, retryable: false, message: 'Kunci API Gemini tidak valid atau tidak memiliki izin.' };
    }
    if (status === 404 || raw.includes('not found') || raw.includes('model')) {
        return { code: 'model_not_found', status: 404, retryable: false, message: 'Model AI yang dikonfigurasi tidak ditemukan.' };
    }
    if (raw.includes('spending cap') || raw.includes('spend cap') || raw.includes('resource_exhausted')) {
        return {
            code: 'rate_limited',
            status: 429,
            retryable: false,
            message: 'Batas anggaran bulanan (spending cap) untuk kunci API Gemini Anda di Google AI Studio telah terlampaui. Silakan gunakan penyedia AI lain (seperti Vertex AI atau Ollama lokal) di menu Pengaturan, atau perbarui kunci API Anda.'
        };
    }
    if (status === 429 || raw.includes('quota') || raw.includes('rate')) {
        return { code: 'rate_limited', status: 429, retryable: true, message: 'Kuota atau batas permintaan AI sedang tercapai. Coba lagi sebentar.' };
    }
    if (raw.includes('fetch failed') || raw.includes('network') || raw.includes('timeout') || raw.includes('econnrefused')) {
        return { code: raw.includes('localhost') || raw.includes('11434') ? 'local_unavailable' : 'no_internet', status: 503, retryable: true, message: raw.includes('localhost') || raw.includes('11434') ? 'Ollama lokal belum dapat dihubungi.' : 'Koneksi internet ke layanan AI sedang bermasalah.' };
    }
    return { code: 'server_error', status, retryable: false, message: 'Layanan AI mengalami kesalahan tak terduga.' };
};
const sendAiError = (res, error) => {
    const classified = classifyAiError(error);
    res.status(classified.status).json({
        error: classified.message,
        code: classified.code,
        retryable: classified.retryable,
        detail: process.env.NODE_ENV === 'production' ? undefined : error instanceof Error ? error.message : String(error)
    });
};
const getCandidateModes = (configuredMode, status, customGeminiKey) => {
    const candidateModes = [];
    const geminiKeyExists = !!(customGeminiKey || process.env.GEMINI_API_KEY || process.env.API_KEY);
    if (configuredMode !== 'auto') {
        candidateModes.push(configuredMode);
        // Add other modes as fallbacks if configured/online
        if (configuredMode !== 'vertex' && status.vertexStatus?.online) {
            candidateModes.push('vertex');
        }
        if (configuredMode !== 'gemini' && (status.geminiStatus?.online || geminiKeyExists)) {
            candidateModes.push('gemini');
        }
        if (configuredMode !== 'ollama' && status.ollamaStatus?.online && status.ollamaStatus?.hasModel) {
            candidateModes.push('ollama');
        }
    }
    else {
        // Under 'auto', start with the probed preferred mode, then others
        if (status.mode !== 'unavailable') {
            candidateModes.push(status.mode);
        }
        if (status.vertexStatus?.online && !candidateModes.includes('vertex')) {
            candidateModes.push('vertex');
        }
        if ((status.geminiStatus?.online || geminiKeyExists) && !candidateModes.includes('gemini')) {
            candidateModes.push('gemini');
        }
        if (status.ollamaStatus?.online && status.ollamaStatus?.hasModel && !candidateModes.includes('ollama')) {
            candidateModes.push('ollama');
        }
    }
    return candidateModes;
};
aiRouter.get("/status", async (req, res) => {
    res.json(await getAvailableMode());
});
aiRouter.post("/status", async (req, res) => {
    const { geminiApiKey, ollamaBaseUrl, selectedOllamaModel } = req.body;
    res.json(await getAvailableMode(geminiApiKey, ollamaBaseUrl, selectedOllamaModel));
});
aiRouter.post("/generate", async (req, res) => {
    try {
        const { prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements, aiPreference, geminiApiKey, ollamaBaseUrl, selectedGeminiModel, selectedOllamaModel, selectedVertexModel, intent, forceTools, lessonContext } = req.body;
        const configuredMode = getRuntimePreference(aiPreference);
        const status = await getAvailableMode(geminiApiKey, ollamaBaseUrl, selectedOllamaModel);
        const candidateModes = getCandidateModes(configuredMode, status, geminiApiKey);
        if (candidateModes.length === 0 || status.mode === 'unavailable') {
            let reason = 'no_internet';
            let serviceName = 'AI';
            if (configuredMode === 'gemini') {
                reason = status.geminiStatus?.reason || 'no_internet';
                serviceName = 'Gemini';
            }
            else if (configuredMode === 'vertex') {
                reason = status.vertexStatus?.reason || 'no_internet';
                serviceName = 'Vertex AI';
            }
            else {
                reason = status.ollamaStatus?.online ? 'model_missing' : 'local_unavailable';
                serviceName = 'Ollama';
            }
            return res.status(503).json({
                error: `Layanan ${serviceName} tidak tersedia.`,
                code: reason === 'invalid_key' || reason === 'missing_project' ? 'invalid_key' : 'no_internet',
                retryable: true
            });
        }
        let result;
        let lastError = null;
        let success = false;
        for (const mode of candidateModes) {
            let modeSuccess = false;
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    logger.info(`Attempting /generate with mode: ${mode}${attempt > 0 ? ' (retry)' : ''}`);
                    if (mode === 'vertex') {
                        result = await generateAgentActionsVertex(prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements, intent, forceTools, lessonContext, selectedVertexModel);
                    }
                    else if (mode === 'gemini') {
                        result = await generateAgentActionsGemini(prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements, geminiApiKey, intent, forceTools, lessonContext, selectedGeminiModel);
                    }
                    else if (mode === 'ollama') {
                        result = await generateAgentActionsOllama(prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements, ollamaBaseUrl, intent, forceTools, lessonContext, selectedOllamaModel || status.ollamaStatus?.activeModel);
                    }
                    modeSuccess = true;
                    break;
                }
                catch (err) {
                    const is500 = err?.status === 500 || err?.message?.includes('"code":500');
                    if (attempt === 0 && is500) {
                        logger.warn(`[Retry] 500 from ${mode}, retrying in 1.2s...`);
                        await new Promise(r => setTimeout(r, 1200));
                        continue;
                    }
                    logger.warn(`Generate failed with mode: ${mode}. Error: ${JSON.stringify({ error: err.message || err })}`);
                    lastError = err;
                    break;
                }
            }
            if (modeSuccess) {
                success = true;
                break;
            }
        }
        if (!success) {
            throw lastError || new Error("Semua penyedia AI yang dikonfigurasi gagal memproses permintaan.");
        }
        res.json(result);
    }
    catch (error) {
        logger.error("Generate error", error);
        sendAiError(res, error);
    }
});
aiRouter.post("/tool-content", async (req, res) => {
    try {
        const { toolId, prompt, aiPreference, geminiApiKey, ollamaBaseUrl, selectedGeminiModel, selectedOllamaModel, selectedVertexModel } = req.body;
        const configuredMode = getRuntimePreference(aiPreference);
        const status = await getAvailableMode(geminiApiKey, ollamaBaseUrl, selectedOllamaModel);
        const candidateModes = getCandidateModes(configuredMode, status, geminiApiKey);
        if (candidateModes.length === 0 || status.mode === 'unavailable') {
            return res.status(503).json({ error: 'Layanan AI belum tersedia.', code: 'no_internet', retryable: true });
        }
        let result;
        let lastError = null;
        let success = false;
        for (const mode of candidateModes) {
            try {
                logger.info(`Attempting /tool-content with mode: ${mode}`);
                if (mode === 'vertex') {
                    result = await generateToolContentVertex(toolId, prompt, selectedVertexModel);
                }
                else if (mode === 'gemini') {
                    result = await generateToolContentGemini(toolId, prompt, geminiApiKey, selectedGeminiModel);
                }
                else if (mode === 'ollama') {
                    result = await generateToolContentOllama(toolId, prompt, ollamaBaseUrl, selectedOllamaModel || status.ollamaStatus?.activeModel);
                }
                success = true;
                break;
            }
            catch (err) {
                logger.warn(`Tool-content failed with mode: ${mode}. Error: ${err.message || err}`);
                lastError = err;
            }
        }
        if (!success) {
            throw lastError || new Error("Semua penyedia AI yang dikonfigurasi gagal memproses konten alat.");
        }
        res.json({ result });
    }
    catch (error) {
        logger.error("Tool content error", error);
        sendAiError(res, error);
    }
});
aiRouter.post("/transcribe", async (req, res) => {
    try {
        const { base64Audio, aiPreference, geminiApiKey, ollamaBaseUrl, selectedGeminiModel, selectedOllamaModel, selectedVertexModel } = req.body;
        const configuredMode = getRuntimePreference(aiPreference);
        const status = await getAvailableMode(geminiApiKey, ollamaBaseUrl, selectedOllamaModel);
        const candidateModes = getCandidateModes(configuredMode, status, geminiApiKey);
        if (candidateModes.length === 0 || status.mode === 'unavailable') {
            return res.status(503).json({ error: 'Transkripsi suara membutuhkan Gemini atau layanan lokal yang tersedia.', code: 'no_internet', retryable: true });
        }
        let text = "";
        let lastError = null;
        let success = false;
        for (const mode of candidateModes) {
            try {
                logger.info(`Attempting /transcribe with mode: ${mode}`);
                if (mode === 'vertex') {
                    text = await transcribeAudioVertex(base64Audio, selectedVertexModel);
                }
                else if (mode === 'gemini') {
                    text = await transcribeAudioGemini(base64Audio, geminiApiKey, selectedGeminiModel);
                }
                else if (mode === 'ollama') {
                    text = await transcribeAudioOllama(base64Audio, ollamaBaseUrl, selectedOllamaModel || status.ollamaStatus?.activeModel);
                }
                success = true;
                break;
            }
            catch (err) {
                logger.warn(`Transcribe failed with mode: ${mode}. Error: ${err.message || err}`);
                lastError = err;
            }
        }
        if (!success) {
            throw lastError || new Error("Semua penyedia AI yang dikonfigurasi gagal melakukan transkripsi.");
        }
        res.json({ text });
    }
    catch (error) {
        logger.error("Transcribe error", error);
        sendAiError(res, error);
    }
});
