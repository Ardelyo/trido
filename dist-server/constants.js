export const GEMINI_MODEL = 'gemini-3.7-flash';
export const OLLAMA_MODEL = 'gemma4:e2b';
export const OLLAMA_THINKING_MODE = 'nothink';
export const DEFAULT_CANVAS_COLOR = 'transparent';
export const AGENT_THINKING_BUDGET = 2000;
export const CONFIG = {
    ai: {
        gemini: {
            model: GEMINI_MODEL,
            apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            probeTimeoutMs: 3000,
            generateTimeoutMs: 90000,
            generation: {
                temperature: 0.2,
                maxOutputTokens: 8192,
            },
            transcription: {
                temperature: 0.1,
            },
        },
        ollama: {
            model: OLLAMA_MODEL,
            thinkingMode: OLLAMA_THINKING_MODE,
            defaultBaseUrl: 'http://localhost:11434',
            probeTimeoutMs: 1500,
            numCtx: 8192,
        },
        vertex: {
            model: 'gemini-3.7-flash',
            location: 'global',
            projectId: 'gemma4good-494311',
            probeTimeoutMs: 3000,
            generation: {
                temperature: 0.2,
                maxOutputTokens: 8192,
            },
        },
        request: {
            retryCount: 2,
            retryBaseDelayMs: 400,
            bodyLimit: '50mb',
        },
    },
    server: {
        defaultPort: 3000,
        host: '0.0.0.0',
        roomsPersistenceFile: 'rooms_persistence.json',
    },
    ui: {
        mobileBreakpointPx: 1024,
        aiStatusPollIntervalMs: 30000,
        socketSyncDebounceMs: 300,
        autoSaveDebounceMs: 3000,
    },
};
