
import { create } from 'zustand';
import { CONFIG } from './constants';
import { AgentState, AgentAction, Point, ChatMessage, DomElementState, CreatorTool, FontFamily, BoardSession, AiPreference } from './types';
import { saveSessionToDb, getSessionFromDb, deleteSessionFromDb, getAllSessionsFromDb } from './services/db';

interface AppStore extends AgentState {
  actionQueue: AgentAction[];
  messages: ChatMessage[];
  zoom: number;
  viewportTransform: number[];
  domElements: Record<string, DomElementState>;
  lastUploadedImage: string | null; // Base64
  theme: 'dark' | 'light';
  
  // App UI State
  isAiDrawerOpen: boolean;
  toggleAiDrawer: () => void;
  
  isTimerOpen: boolean;
  toggleTimer: () => void;
  
  isCalculatorOpen: boolean;
  toggleCalculator: () => void;
  
  isNotesOpen: boolean;
  toggleNotes: () => void;
  
  isQuizOpen: boolean;
  toggleQuiz: () => void;

  isUnitConverterOpen: boolean;
  toggleUnitConverter: () => void;
  
  isPeriodicTableOpen: boolean;
  togglePeriodicTable: () => void;
  
  isAttendanceOpen: boolean;
  toggleAttendance: () => void;
  
  isTodoListOpen: boolean;
  toggleTodoList: () => void;
  
  isBoardSettingsOpen: boolean;
  toggleBoardSettings: () => void;

  isTemplatesOpen: boolean;
  toggleTemplates: () => void;

  isAiToolsOpen: boolean;
  toggleAiTools: () => void;

  isHistoryOpen: boolean;
  toggleHistory: () => void;

  userName: string;
  setUserName: (name: string) => void;

  language: 'id' | 'en';
  setLanguage: (lang: 'id' | 'en') => void;

  aiPreference: AiPreference;
  setAiPreference: (pref: AiPreference) => void;

  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;

  ollamaBaseUrl: string;
  setOllamaBaseUrl: (url: string) => void;
  
  isViewerUrl: boolean;
  setIsViewerUrl: (v: boolean) => void;
  
  // Voice & Text Input
  inputMode: 'voice' | 'text';
  chatInputText: string;
  setChatInputText: (txt: string) => void;
  interimInputText: string;
  setInterimInputText: (txt: string) => void;
  
  // Creator Mode State
  isCreatorMode: boolean;
  activeTool: CreatorTool;
  isShapeFilled: boolean;
  brushColor: string;
  brushWidth: number;
  fontFamily: FontFamily;
  fontSize: number;
  
  // Actions
  setInputMode: (mode: 'voice' | 'text') => void;
  setShapeFilled: (filled: boolean) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setCursorPosition: (pos: Point) => void;
  setSpatialTarget: (pos: Point | null) => void;
  setAccuracy: (val: number) => void;
  setThinking: (thinking: boolean) => void;
  setActing: (acting: boolean) => void;
  setClicking: (clicking: boolean) => void;
  setCurrentAction: (action: string | null) => void;
  setAgentMessage: (msg: string | null) => void;
  setLastUploadedImage: (img: string | null) => void;
  toggleTheme: () => void;
  
  // Creator Actions
  toggleCreatorMode: () => void;
  setActiveTool: (tool: CreatorTool) => void;
  setBrushColor: (color: string) => void;
  setBrushWidth: (width: number) => void;
  
  // Pages
  pages: Array<{ canvas: object, dom: Record<string, DomElementState>, previewDataUrl?: string }>;
  currentPageIndex: number;
  addPage: (emptyState?: object, previewDataUrl?: string) => void;
  switchPage: (index: number) => void;
  updatePageData: (index: number, canvasData: object, domData: Record<string, DomElementState>, previewDataUrl?: string) => void;
  removePage: (index: number) => void;
  
  addAction: (action: AgentAction) => void;
  addMessage: (msg: ChatMessage) => void;
  popAction: () => AgentAction | undefined;
  addLog: (log: string) => void;
  clearQueue: () => void;
  abortTask: () => void;
  setViewport: (zoom: number, transform: number[]) => void;
  
  // DOM Element Management
  updateDomElement: (id: string, state: Partial<DomElementState>) => void;
  removeDomElement: (id: string) => void;
  setDomElements: (elements: Record<string, DomElementState>) => void;

  undoCanvas: () => void;
  redoCanvas: () => void;
  setUndoRedoFunctions: (undo: () => void, redo: () => void) => void;

  currentSessionId: string | null;
  sessions: BoardSession[];
  
  loadSessions: () => Promise<void>;
  saveCurrentSession: (title?: string) => Promise<void>;
  createNewSession: () => void;
  loadSessionData: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

let autoSaveTimeout: ReturnType<typeof setTimeout>;

const getInitialAiPreference = (): AiPreference => {
  const saved = localStorage.getItem('ai_preference');
  return (saved === 'gemini' || saved === 'ollama' || saved === 'vertex' || saved === 'auto') 
    ? (saved as AiPreference) 
    : 'auto';
};

const getInitialGeminiApiKey = (): string => {
  return localStorage.getItem('gemini_api_key') || '';
};

const getInitialOllamaBaseUrl = (): string => {
  return localStorage.getItem('ollama_base_url') || '';
};

const getInitialUserName = (): string => {
  return localStorage.getItem('trido_user_name') || 'Guru';
};

export const useStore = create<AppStore>((set, get) => ({
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
      } else {
        sessionTitle = 'Papan Tanpa Judul';
      }
    }

    const session: BoardSession = {
      id,
      title: sessionTitle,
      updatedAt: now,
      createdAt: currentSessionId ? (sessions.find(s => s.id === currentSessionId)?.createdAt || now) : now,
      thumbnail: pages[0]?.previewDataUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&q=80',
      sizeBytes: JSON.stringify(pages).length, // simple approximation
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
      messages: [{ role: 'model', text: 'Halo! Papan tulis baru telah disiapkan.' }]
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
        isHistoryOpen: false
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

  language: 'id',
  setLanguage: (lang) => set({ language: lang }),

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

  isViewerUrl: false,

  setIsViewerUrl: (v) => set({ isViewerUrl: v }),
  
  chatInputText: '',
  setChatInputText: (txt: string) => set({ chatInputText: txt }),
  interimInputText: '',
  setInterimInputText: (txt: string) => set({ interimInputText: txt }),
  
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
    if (state.pages.length <= 1) return {};
    const newPages = [...state.pages];
    newPages.splice(index, 1);
    let newIndex = state.currentPageIndex;
    if (newIndex >= newPages.length) newIndex = newPages.length - 1;
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
    if (state.actionQueue.length === 0) return undefined;
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
      [id]: { ...existing, ...newState } as DomElementState
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
  undoCanvas: () => {},
  redoCanvas: () => {},
  setUndoRedoFunctions: (undo, redo) => set({ undoCanvas: undo, redoCanvas: redo }),
}));
