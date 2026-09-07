import { Router } from "express";
import express from "express";
import { generateAgentActionsGemini, generateToolContentGemini, transcribeAudioGemini } from "./geminiAdapter";
import { generateAgentActionsOllama, generateToolContentOllama, transcribeAudioOllama } from "./ollamaAdapter";
import { generateAgentActionsVertex, generateToolContentVertex, transcribeAudioVertex } from "./vertexAdapter";
import { CONFIG } from "../constants";
import { createLogger } from "../utils/logger";
import { telemetryService } from "./telemetryService";
export const aiRouter = Router();
const logger = createLogger('ai-router');
aiRouter.use(express.json({ limit: CONFIG.ai.request.bodyLimit }));
const isAiPreference = (value) => (value === 'auto' || value === 'gemini' || value === 'ollama' || value === 'vertex');
const getConfiguredMode = () => {
    const AI_MODE = isAiPreference(process.env.AI_MODE) ? process.env.AI_MODE : 'auto';
    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const VERTEX_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID || CONFIG.ai.vertex.projectId;
    if (AI_MODE === 'gemini' && !GEMINI_KEY)
        return 'auto';
    if (AI_MODE === 'vertex' && !VERTEX_PROJECT)
        return 'auto';
    return AI_MODE;
};
const getRuntimePreference = (preference) => (isAiPreference(preference) ? preference : getConfiguredMode());
const getPreferredAutoMode = () => {
    if (process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID || CONFIG.ai.vertex.projectId)
        return 'vertex';
    return process.env.GEMINI_API_KEY || process.env.API_KEY ? 'gemini' : 'ollama';
};
const getOllamaUrl = () => process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || CONFIG.ai.ollama.defaultBaseUrl;
const getOllamaModel = () => process.env.OLLAMA_MODEL || CONFIG.ai.ollama.model;
const getGeminiModel = () => process.env.GEMINI_MODEL || CONFIG.ai.gemini.model;
// ── Status probe cache (TTL: 15s) ────────────────────────────────────────────
// Prevents triple-probe (Gemini + Ollama + Vertex) on every /generate request.
const STATUS_CACHE_TTL_MS = 15_000;
const statusCache = new Map();
const probeGemini = async (customKey) => {
    const key = customKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key) {
        return { online: false, reason: 'missing_key' };
    }
    return { online: true, reason: 'ok' };
};
const probeVertex = async () => {
    const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID || CONFIG.ai.vertex.projectId;
    if (!project) {
        return { online: false, reason: 'missing_project' };
    }
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
        return { mode: 'vertex', model: CONFIG.ai.vertex.model, online: true, reason: 'ok', geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo, envGeminiModel: process.env.GEMINI_MODEL || null };
    }
    if (vertex.online) {
        return { mode: 'vertex', model: CONFIG.ai.vertex.model, online: true, reason: 'ok', geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo, envGeminiModel: process.env.GEMINI_MODEL || null };
    }
    if (preferredMode === 'gemini') {
        const key = customGeminiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (gemini.online || key) {
            return { mode: 'gemini', model: getGeminiModel(), online: gemini.online, reason: gemini.reason, geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo, envGeminiModel: process.env.GEMINI_MODEL || null };
        }
        if (ollama.online && ollama.hasRequiredModel) {
            return { mode: 'ollama', model: ollama.activeModel || getOllamaModel(), online: true, reason: 'cloud_key_missing_using_local', geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo, envGeminiModel: process.env.GEMINI_MODEL || null };
        }
        return { mode: 'unavailable', model: getGeminiModel(), online: false, reason: gemini.reason, geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo, envGeminiModel: process.env.GEMINI_MODEL || null };
    }
    if (ollama.online && ollama.hasRequiredModel) {
        return { mode: 'ollama', model: ollama.activeModel || getOllamaModel(), online: true, reason: 'ok', geminiStatus: geminiInfo, ollamaStatus: ollamaInfo, vertexStatus: vertexInfo, envGeminiModel: process.env.GEMINI_MODEL || null };
    }
    return {
        mode: 'unavailable',
        model: ollama.activeModel || getOllamaModel(),
        online: false,
        reason: ollama.online ? 'model_missing' : ollama.reason,
        geminiStatus: geminiInfo,
        ollamaStatus: ollamaInfo,
        vertexStatus: vertexInfo,
        envGeminiModel: process.env.GEMINI_MODEL || null
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
    const { geminiApiKey, ollamaBaseUrl, selectedOllamaModel, selectedVertexModel, selectedGeminiModel } = req.body;
    const status = await getAvailableMode(geminiApiKey, ollamaBaseUrl, selectedOllamaModel);
    if (selectedVertexModel && status.mode === 'vertex') {
        status.model = selectedVertexModel;
    }
    else if (selectedGeminiModel && status.mode === 'gemini') {
        status.model = selectedGeminiModel;
    }
    res.json(status);
});
aiRouter.post("/generate", async (req, res) => {
    const startTime = Date.now();
    const { prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements, aiPreference, geminiApiKey, ollamaBaseUrl, selectedGeminiModel, selectedOllamaModel, selectedVertexModel, intent, forceTools, lessonContext, sessionId } = req.body;
    const activeSessionId = sessionId || req.headers['x-session-id'] || 'session_default';
    let activeMode = 'unknown';
    let activeModel = 'unknown';
    try {
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
            telemetryService.recordEvent({
                sessionId: activeSessionId,
                endpoint: '/api/ai/generate',
                provider: 'unknown',
                model: 'unavailable',
                prompt: prompt || '',
                latencyMs: Date.now() - startTime,
                status: 'error',
                errorCode: reason,
                errorMessage: `Layanan ${serviceName} tidak tersedia.`
            });
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
                    activeMode = mode;
                    if (mode === 'vertex') {
                        activeModel = selectedVertexModel || CONFIG.ai.vertex.model;
                        result = await generateAgentActionsVertex(prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements, intent, forceTools, lessonContext, selectedVertexModel);
                    }
                    else if (mode === 'gemini') {
                        activeModel = selectedGeminiModel || getGeminiModel();
                        result = await generateAgentActionsGemini(prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements, geminiApiKey, intent, forceTools, lessonContext, selectedGeminiModel);
                    }
                    else if (mode === 'ollama') {
                        activeModel = selectedOllamaModel || status.ollamaStatus?.activeModel || getOllamaModel();
                        result = await generateAgentActionsOllama(prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements, ollamaBaseUrl, intent, forceTools, lessonContext, activeModel);
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
            const errDetail = lastError?.message ? ` (${lastError.message})` : '';
            throw lastError || new Error(`Semua penyedia AI yang dikonfigurasi gagal memproses permintaan.${errDetail}`);
        }
        const duration = Date.now() - startTime;
        const usage = result?.usageMetadata || {};
        const promptTokens = usage.promptTokenCount || Math.round((prompt?.length || 0) / 4);
        const outputTokens = usage.candidatesTokenCount || Math.round((result?.textResponse?.length || 0) / 4);
        const teleRecord = telemetryService.recordEvent({
            sessionId: activeSessionId,
            endpoint: '/api/ai/generate',
            provider: activeMode,
            model: activeModel,
            prompt: prompt || '',
            promptTokens,
            outputTokens,
            thinkingTokens: result?.thought ? Math.round(result.thought.length / 4) : 0,
            latencyMs: duration,
            status: 'success',
            functionCalls: result?.functionCalls || [],
            responseText: result?.textResponse || '',
            canvasObjectsCount: Array.isArray(canvasObjects) ? canvasObjects.length : 0,
            domElementsCount: domElements ? Object.keys(domElements).length : 0
        });
        res.json({
            ...result,
            telemetry: {
                id: teleRecord.id,
                promptTokens: teleRecord.promptTokens,
                outputTokens: teleRecord.outputTokens,
                totalTokens: teleRecord.totalTokens,
                costUsd: teleRecord.costUsd,
                costIdr: teleRecord.costIdr,
                latencyMs: teleRecord.latencyMs,
                provider: teleRecord.provider,
                model: teleRecord.model,
                sheetSyncStatus: teleRecord.sheetSyncStatus
            }
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        telemetryService.recordEvent({
            sessionId: activeSessionId,
            endpoint: '/api/ai/generate',
            provider: activeMode,
            model: activeModel,
            prompt: prompt || '',
            latencyMs: duration,
            status: 'error',
            errorCode: error?.code || 'server_error',
            errorMessage: error?.message || String(error)
        });
        logger.error("Generate error", error);
        sendAiError(res, error);
    }
});
aiRouter.post("/tool-content", async (req, res) => {
    const startTime = Date.now();
    const { toolId, prompt, aiPreference, geminiApiKey, ollamaBaseUrl, selectedGeminiModel, selectedOllamaModel, selectedVertexModel, sessionId } = req.body;
    const activeSessionId = sessionId || req.headers['x-session-id'] || 'session_default';
    let activeMode = 'unknown';
    let activeModel = 'unknown';
    try {
        const configuredMode = getRuntimePreference(aiPreference);
        const status = await getAvailableMode(geminiApiKey, ollamaBaseUrl, selectedOllamaModel);
        const candidateModes = getCandidateModes(configuredMode, status, geminiApiKey);
        if (candidateModes.length === 0 || status.mode === 'unavailable') {
            telemetryService.recordEvent({
                sessionId: activeSessionId,
                endpoint: `/api/ai/tool-content?tool=${toolId || ''}`,
                provider: 'unknown',
                model: 'unavailable',
                prompt: prompt || '',
                latencyMs: Date.now() - startTime,
                status: 'error',
                errorCode: 'no_internet',
                errorMessage: 'Layanan AI belum tersedia.'
            });
            return res.status(503).json({ error: 'Layanan AI belum tersedia.', code: 'no_internet', retryable: true });
        }
        let result;
        let lastError = null;
        let success = false;
        for (const mode of candidateModes) {
            try {
                logger.info(`Attempting /tool-content with mode: ${mode}`);
                activeMode = mode;
                if (mode === 'vertex') {
                    activeModel = selectedVertexModel || CONFIG.ai.vertex.model;
                    result = await generateToolContentVertex(toolId, prompt, selectedVertexModel);
                }
                else if (mode === 'gemini') {
                    activeModel = selectedGeminiModel || getGeminiModel();
                    result = await generateToolContentGemini(toolId, prompt, geminiApiKey, selectedGeminiModel);
                }
                else if (mode === 'ollama') {
                    activeModel = selectedOllamaModel || status.ollamaStatus?.activeModel || getOllamaModel();
                    result = await generateToolContentOllama(toolId, prompt, ollamaBaseUrl, activeModel);
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
        const duration = Date.now() - startTime;
        const promptTokens = Math.round((prompt?.length || 0) / 4);
        const outputTokens = Math.round(JSON.stringify(result || '').length / 4);
        const teleRecord = telemetryService.recordEvent({
            sessionId: activeSessionId,
            endpoint: `/api/ai/tool-content?tool=${toolId || ''}`,
            provider: activeMode,
            model: activeModel,
            prompt: `[Tool: ${toolId}] ${prompt}`,
            promptTokens,
            outputTokens,
            latencyMs: duration,
            status: 'success',
            responseText: typeof result === 'string' ? result : JSON.stringify(result)
        });
        res.json({
            result,
            telemetry: {
                id: teleRecord.id,
                totalTokens: teleRecord.totalTokens,
                costUsd: teleRecord.costUsd,
                costIdr: teleRecord.costIdr,
                latencyMs: teleRecord.latencyMs,
                provider: teleRecord.provider,
                model: teleRecord.model
            }
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        telemetryService.recordEvent({
            sessionId: activeSessionId,
            endpoint: `/api/ai/tool-content?tool=${toolId || ''}`,
            provider: activeMode,
            model: activeModel,
            prompt: prompt || '',
            latencyMs: duration,
            status: 'error',
            errorCode: error?.code || 'server_error',
            errorMessage: error?.message || String(error)
        });
        logger.error("Tool content error", error);
        sendAiError(res, error);
    }
});
aiRouter.post("/transcribe", async (req, res) => {
    const startTime = Date.now();
    const { base64Audio, aiPreference, geminiApiKey, ollamaBaseUrl, selectedGeminiModel, selectedOllamaModel, selectedVertexModel, sessionId } = req.body;
    const activeSessionId = sessionId || req.headers['x-session-id'] || 'session_default';
    let activeMode = 'unknown';
    let activeModel = 'unknown';
    try {
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
                activeMode = mode;
                if (mode === 'vertex') {
                    activeModel = selectedVertexModel || CONFIG.ai.vertex.model;
                    text = await transcribeAudioVertex(base64Audio, selectedVertexModel);
                }
                else if (mode === 'gemini') {
                    activeModel = selectedGeminiModel || getGeminiModel();
                    text = await transcribeAudioGemini(base64Audio, geminiApiKey, selectedGeminiModel);
                }
                else if (mode === 'ollama') {
                    activeModel = selectedOllamaModel || status.ollamaStatus?.activeModel || getOllamaModel();
                    text = await transcribeAudioOllama(base64Audio, ollamaBaseUrl, activeModel);
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
        const duration = Date.now() - startTime;
        const approxTokens = Math.round((text.length / 4) + 256);
        const teleRecord = telemetryService.recordEvent({
            sessionId: activeSessionId,
            endpoint: '/api/ai/transcribe',
            provider: activeMode,
            model: activeModel,
            prompt: '[Audio Recording Transcription]',
            promptTokens: 256,
            outputTokens: Math.round(text.length / 4),
            latencyMs: duration,
            status: 'success',
            responseText: text
        });
        res.json({
            text,
            telemetry: {
                id: teleRecord.id,
                totalTokens: approxTokens,
                costUsd: teleRecord.costUsd,
                costIdr: teleRecord.costIdr,
                latencyMs: teleRecord.latencyMs
            }
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        telemetryService.recordEvent({
            sessionId: activeSessionId,
            endpoint: '/api/ai/transcribe',
            provider: activeMode,
            model: activeModel,
            prompt: '[Audio Recording Transcription]',
            latencyMs: duration,
            status: 'error',
            errorCode: error?.code || 'server_error',
            errorMessage: error?.message || String(error)
        });
        logger.error("Transcribe error", error);
        sendAiError(res, error);
    }
});
// ── TELEMETRY & GOOGLE SHEETS API ROUTES ───────────────────────────────────
aiRouter.get("/telemetry", (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    res.json({
        summary: telemetryService.getSummary(),
        recentLogs: telemetryService.getRecentRecords(limit),
        config: telemetryService.getConfig()
    });
});
aiRouter.get("/telemetry/download", (req, res) => {
    const format = req.query.format === 'json' ? 'json' : 'csv';
    const dateStr = new Date().toISOString().slice(0, 10);
    if (format === 'json') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="trido_telemetry_${dateStr}.json"`);
        return res.send(JSON.stringify(telemetryService.getAllRecords(), null, 2));
    }
    else {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="trido_telemetry_${dateStr}.csv"`);
        return res.send(telemetryService.generateCsv());
    }
});
aiRouter.post("/telemetry/feedback", (req, res) => {
    const { logId, rating, feedback } = req.body;
    if (!logId || !rating) {
        return res.status(400).json({ error: 'Missing logId or rating' });
    }
    const ok = telemetryService.recordFeedback(logId, rating, feedback);
    res.json({ success: ok });
});
aiRouter.post("/telemetry/sync", async (req, res) => {
    try {
        const result = await telemetryService.syncPending();
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
aiRouter.get("/telemetry/config", (req, res) => {
    res.json({
        config: telemetryService.getConfig(),
        appsScriptTemplate: telemetryService.getAppsScriptCode()
    });
});
aiRouter.post("/telemetry/config", (req, res) => {
    const { googleSheetId, googleSheetName, googleSheetWebhookUrl, autoSync } = req.body;
    telemetryService.saveConfig({
        ...(googleSheetId !== undefined ? { googleSheetId } : {}),
        ...(googleSheetName !== undefined ? { googleSheetName } : {}),
        ...(googleSheetWebhookUrl !== undefined ? { googleSheetWebhookUrl } : {}),
        ...(autoSync !== undefined ? { autoSync: Boolean(autoSync) } : {})
    });
    res.json({ success: true, config: telemetryService.getConfig() });
});
