import { create } from 'zustand';
import { CONFIG } from './constants';
import { saveSessionToDb, getSessionFromDb, deleteSessionFromDb, getAllSessionsFromDb } from './services/db';
let autoSaveTimeout;
const getInitialAiPreference = () => {
    const saved = localStorage.getItem('ai_preference');
    return (saved === 'gemini' || saved === 'ollama' || saved === 'vertex' || saved === 'auto')
        ? saved
        : 'auto';
};
const getInitialGeminiApiKey = () => {
    return localStorage.getItem('gemini_api_key') || '';
};
const getInitialOllamaBaseUrl = () => {
    return localStorage.getItem('ollama_base_url') || '';
};
const getInitialSelectedGeminiModel = () => {
    return localStorage.getItem('selected_gemini_model') || 'gemini-3.5-flash-lite';
};
const getInitialSelectedOllamaModel = () => {
    return localStorage.getItem('selected_ollama_model') || 'gemma4:e2b';
};
const getInitialSelectedVertexModel = () => {
    return localStorage.getItem('selected_vertex_model') || 'gemma-4-31b-it';
};
const getInitialLanguage = () => {
    const saved = localStorage.getItem('trido_language');
    return (saved === 'id' || saved === 'en') ? saved : 'id';
};
const getInitialUserName = () => {
    return localStorage.getItem('trido_user_name') || 'Guru';
};
// ============================================================================
// ZERO-COST SIZE ESTIMATOR (Replaces JSON.stringify)
// ============================================================================
const estimateSessionSize = (pages) => {
    let bytes = 0;
    for (const page of pages) {
        // Canvas objects estimation
        const canvasObj = page.canvas;
        if (canvasObj && canvasObj.objects) {
            bytes += canvasObj.objects.length * 180; // avg 180 bytes/object
        }
        // DOM elements estimation
        if (page.dom) {
            bytes += Object.keys(page.dom).length * 420;
        }
        // Preview image (base64 overhead ~33%)
        if (page.previewDataUrl) {
            bytes += page.previewDataUrl.length * 0.75;
        }
        // Viewport transform (negligible)
        bytes += 48;
    }
    return Math.max(bytes, 512); // Minimum 512 bytes
};
export const useStore = create((set, get) => ({
    currentSessionId: null,
    sessions: [],
    loadSessions: async () => {
        const sessions = await getAllSessionsFromDb();
        set({ sessions });
    },
    saveCurrentSession: async (title) => {
        const { currentSessionId, pages, domElements, sessions } = get();
        const id = currentSessionId || Date.now().toString();
        const now = Date.now();
        // Attempt to get a title
        let sessionTitle = title;
        if (!sessionTitle) {
            if (currentSessionId) {
                const existing = sessions.find(s => s.id === currentSessionId);
                sessionTitle = existing?.title || 'Papan Tanpa Judul';
            }
            else {
                sessionTitle = 'Papan Tanpa Judul';
            }
        }
        const session = {
            id,
            title: sessionTitle,
            updatedAt: now,
            createdAt: currentSessionId ? (sessions.find(s => s.id === currentSessionId)?.createdAt || now) : now,
            thumbnail: pages[0]?.previewDataUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&q=80',
            sizeBytes: estimateSessionSize(pages), // ⚡ INSTANT
            pages: pages
        };
        await saveSessionToDb(session);
        set({ currentSessionId: id });
        await get().loadSessions();
    },
    createNewSession: () => {
        set({
            currentSessionId: null,
            pages: [{ canvas: {}, dom: {}, previewDataUrl: '' }],
            currentPageIndex: 0,
            domElements: {},
            messages: [{ role: 'model', text: 'Halo! Papan tulis baru telah disiapkan.' }],
            lessonPlan: null,
            activeMindmapNodes: []
        });
    },
    loadSessionData: async (id) => {
        const session = await getSessionFromDb(id);
        if (session) {
            set({
                currentSessionId: session.id,
                pages: session.pages,
                currentPageIndex: 0,
                domElements: session.pages[0]?.dom || {},
                isHistoryOpen: false,
                lessonPlan: null,
                activeMindmapNodes: []
            });
            // the canvas engine will need to detect this change and load
        }
    },
    deleteSession: async (id) => {
        await deleteSessionFromDb(id);
        await get().loadSessions();
        if (get().currentSessionId === id) {
            get().createNewSession();
        }
    },
    // ── Lesson Engine State ────────────────────────────────────────────────
    lessonPlan: null,
    activeMindmapNodes: [],
    startLesson: (subject, topic, gradeLevel) => {
        const plan = {
            id: `lesson_${Date.now()}`,
            subject,
            topic,
            gradeLevel,
            phase: 'planning',
            plannedSteps: [],
            completedSteps: [],
            createdAt: Date.now()
        };
        set({ lessonPlan: plan });
    },
    advanceLessonPhase: () => {
        const { lessonPlan } = get();
        if (!lessonPlan)
            return;
        const phases = ['planning', 'intro', 'core', 'practice', 'closing'];
        const currentIdx = phases.indexOf(lessonPlan.phase);
        const nextPhase = phases[currentIdx + 1] || 'closing';
        set({
            lessonPlan: { ...lessonPlan, phase: nextPhase }
        });
    },
    completeLessonStep: (stepId, objectIds) => {
        const { lessonPlan } = get();
        if (!lessonPlan)
            return;
        const updatedSteps = lessonPlan.plannedSteps.map(step => step.id === stepId
            ? { ...step, status: 'created', canvasObjectIds: objectIds }
            : step);
        set({
            lessonPlan: {
                ...lessonPlan,
                plannedSteps: updatedSteps,
                completedSteps: [...lessonPlan.completedSteps, stepId]
            }
        });
    },
    clearLesson: () => set({
        lessonPlan: null,
        activeMindmapNodes: []
    }),
    // Mindmap node registry
    registerMindmapNode: (node) => set((state) => ({
        activeMindmapNodes: [
            // Replace if same text exists
            ...state.activeMindmapNodes.filter(n => n.text !== node.text),
            node
        ]
    })),
    clearMindmapNodes: () => set({ activeMindmapNodes: [] }),
    getMindmapNodeByText: (text) => {
        const { activeMindmapNodes } = get();
        return activeMindmapNodes.find(n => n.text.toLowerCase().trim() === text.toLowerCase().trim());
    },
    cursorPosition: { x: 0, y: 0 },
    spatialTarget: null,
    accuracy: 100,
    isThinking: false,
    isActing: false,
    isClicking: false,
    currentAction: null,
    agentMessage: null,
    actionQueue: [],
    messages: [{ role: 'model', text: 'Halo! Saya Trido AI. Ada yang bisa dibantu?' }],
    logs: [],
    inputMode: 'voice',
    zoom: 1,
    viewportTransform: [1, 0, 0, 1, 0, 0],
    domElements: {},
    lastUploadedImage: null,
    theme: 'light',
    isAiDrawerOpen: false,
    toggleAiDrawer: () => set((state) => ({ isAiDrawerOpen: !state.isAiDrawerOpen })),
    isTimerOpen: false,
    toggleTimer: () => set((state) => ({ isTimerOpen: !state.isTimerOpen })),
    isCalculatorOpen: false,
    toggleCalculator: () => set((state) => ({ isCalculatorOpen: !state.isCalculatorOpen })),
    isNotesOpen: false,
    toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),
    isQuizOpen: false,
    toggleQuiz: () => set((state) => ({ isQuizOpen: !state.isQuizOpen })),
    isUnitConverterOpen: false,
    toggleUnitConverter: () => set((state) => ({ isUnitConverterOpen: !state.isUnitConverterOpen })),
    isPeriodicTableOpen: false,
    togglePeriodicTable: () => set((state) => ({ isPeriodicTableOpen: !state.isPeriodicTableOpen })),
    isAttendanceOpen: false,
    toggleAttendance: () => set((state) => ({ isAttendanceOpen: !state.isAttendanceOpen })),
    isTodoListOpen: false,
    toggleTodoList: () => set((state) => ({ isTodoListOpen: !state.isTodoListOpen })),
    isBoardSettingsOpen: false,
    toggleBoardSettings: () => set((state) => ({ isBoardSettingsOpen: !state.isBoardSettingsOpen })),
    isTemplatesOpen: false,
    toggleTemplates: () => set((state) => ({ isTemplatesOpen: !state.isTemplatesOpen })),
    isAiToolsOpen: false,
    toggleAiTools: () => set((state) => ({ isAiToolsOpen: !state.isAiToolsOpen })),
    isHistoryOpen: false,
    toggleHistory: () => set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),
    userName: getInitialUserName(),
    setUserName: (name) => {
        const trimmed = name.trim() || 'Guru';
        localStorage.setItem('trido_user_name', trimmed);
        set({ userName: trimmed });
    },
    language: getInitialLanguage(),
    setLanguage: (lang) => {
        localStorage.setItem('trido_language', lang);
        set({ language: lang });
    },
    aiPreference: getInitialAiPreference(),
    setAiPreference: (pref) => {
        localStorage.setItem('ai_preference', pref);
        set({ aiPreference: pref });
    },
    geminiApiKey: getInitialGeminiApiKey(),
    setGeminiApiKey: (key) => {
        localStorage.setItem('gemini_api_key', key);
        set({ geminiApiKey: key });
    },
    ollamaBaseUrl: getInitialOllamaBaseUrl(),
    setOllamaBaseUrl: (url) => {
        localStorage.setItem('ollama_base_url', url);
        set({ ollamaBaseUrl: url });
    },
    selectedGeminiModel: getInitialSelectedGeminiModel(),
    setSelectedGeminiModel: (model) => {
        localStorage.setItem('selected_gemini_model', model);
        set({ selectedGeminiModel: model });
    },
    selectedOllamaModel: getInitialSelectedOllamaModel(),
    setSelectedOllamaModel: (model) => {
        localStorage.setItem('selected_ollama_model', model);
        set({ selectedOllamaModel: model });
    },
    selectedVertexModel: getInitialSelectedVertexModel(),
    setSelectedVertexModel: (model) => {
        localStorage.setItem('selected_vertex_model', model);
        set({ selectedVertexModel: model });
    },
    isViewerUrl: false,
    setIsViewerUrl: (v) => set({ isViewerUrl: v }),
    chatInputText: '',
    setChatInputText: (txt) => set({ chatInputText: txt }),
    interimInputText: '',
    setInterimInputText: (txt) => set({ interimInputText: txt }),
    // Creator Defaults
    isCreatorMode: false,
    activeTool: 'SELECT',
    isShapeFilled: false,
    brushColor: '#3b82f6',
    brushWidth: 3,
    fontFamily: 'Inter',
    fontSize: 24,
    pages: [{ canvas: {}, dom: {}, previewDataUrl: '' }],
    currentPageIndex: 0,
    addPage: (emptyState, previewDataUrl) => set((state) => {
        const newPages = [...state.pages, { canvas: emptyState || {}, dom: {}, previewDataUrl: previewDataUrl || '' }];
        return { pages: newPages, currentPageIndex: newPages.length - 1 };
    }),
    switchPage: (index) => set((state) => {
        if (index >= 0 && index < state.pages.length) {
            return { currentPageIndex: index };
        }
        return {};
    }),
    updatePageData: (index, canvasData, domData, previewDataUrl) => set((state) => {
        const newPages = [...state.pages];
        const oldUrl = newPages[index]?.previewDataUrl;
        newPages[index] = { canvas: canvasData, dom: domData, previewDataUrl: previewDataUrl !== undefined ? previewDataUrl : oldUrl };
        // Auto-save logic
        if (state.currentSessionId) {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                get().saveCurrentSession();
            }, CONFIG.ui.autoSaveDebounceMs);
        }
        return { pages: newPages };
    }),
    removePage: (index) => set((state) => {
        if (state.pages.length <= 1)
            return {};
        const newPages = [...state.pages];
        newPages.splice(index, 1);
        let newIndex = state.currentPageIndex;
        if (newIndex >= newPages.length)
            newIndex = newPages.length - 1;
        return { pages: newPages, currentPageIndex: newIndex };
    }),
    setInputMode: (mode) => set({ inputMode: mode }),
    setCursorPosition: (pos) => set({ cursorPosition: pos }),
    setSpatialTarget: (pos) => set({ spatialTarget: pos }),
    setAccuracy: (val) => set({ accuracy: val }),
    setThinking: (thinking) => set({ isThinking: thinking }),
    setActing: (acting) => set({ isActing: acting }),
    setClicking: (clicking) => set({ isClicking: clicking }),
    setCurrentAction: (action) => set({ currentAction: action }),
    setAgentMessage: (msg) => set({ agentMessage: msg }),
    setLastUploadedImage: (img) => set({ lastUploadedImage: img }),
    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.className = newTheme;
        return { theme: newTheme };
    }),
    toggleCreatorMode: () => set((state) => ({ isCreatorMode: !state.isCreatorMode })),
    setActiveTool: (tool) => set({ activeTool: tool }),
    setShapeFilled: (filled) => set({ isShapeFilled: filled }),
    setFontFamily: (font) => set({ fontFamily: font }),
    setFontSize: (size) => set({ fontSize: size }),
    setBrushColor: (color) => set({ brushColor: color }),
    setBrushWidth: (width) => set({ brushWidth: width }),
    addAction: (action) => set((state) => ({ actionQueue: [...state.actionQueue, action] })),
    popAction: () => {
        const state = get();
        if (state.actionQueue.length === 0)
            return undefined;
        const [next, ...rest] = state.actionQueue;
        set({ actionQueue: rest });
        return next;
    },
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    addLog: (log) => set((state) => {
        const newLogs = [log, ...state.logs].slice(0, 50);
        return { logs: newLogs };
    }),
    clearQueue: () => set({ actionQueue: [] }),
    abortTask: () => {
        window.speechSynthesis.cancel();
        set({
            actionQueue: [],
            isThinking: false,
            isActing: false,
            currentAction: null,
            agentMessage: 'Task aborted by user.'
        });
    },
    setViewport: (zoom, transform) => set({ zoom, viewportTransform: transform }),
    updateDomElement: (id, newState) => set((state) => {
        const existing = state.domElements[id] || {};
        const newDomElements = {
            ...state.domElements,
            [id]: { ...existing, ...newState }
        };
        const newPages = [...state.pages];
        if (newPages[state.currentPageIndex]) {
            newPages[state.currentPageIndex] = {
                ...newPages[state.currentPageIndex],
                dom: newDomElements
            };
        }
        return {
            domElements: newDomElements,
            pages: newPages
        };
    }),
    removeDomElement: (id) => set((state) => {
        const newElements = { ...state.domElements };
        delete newElements[id];
        const newPages = [...state.pages];
        if (newPages[state.currentPageIndex]) {
            newPages[state.currentPageIndex] = {
                ...newPages[state.currentPageIndex],
                dom: newElements
            };
        }
        return { domElements: newElements, pages: newPages };
    }),
    setDomElements: (elements) => set({ domElements: elements }),
    undoCanvas: () => { },
    redoCanvas: () => { },
    setUndoRedoFunctions: (undo, redo) => set({ undoCanvas: undo, redoCanvas: redo }),
}));
