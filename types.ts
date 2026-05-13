
export interface Point {
  x: number;
  y: number;
}

export enum ShapeType {
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  TRIANGLE = 'TRIANGLE',
  STAR = 'STAR',
  POLYGON = 'POLYGON',
  TEXT = 'TEXT',
}

export type FontFamily = 'Inter' | 'Source Serif 4' | 'JetBrains Mono' | 'Bricolage Grotesque' | 'Playfair Display';

export type CreatorTool = 'SELECT' | 'PENCIL' | 'TEXT' | 'RECTANGLE' | 'CIRCLE' | 'TRIANGLE' | 'STAR' | 'POLYGON' | 'LINE';
export type AiPreference = 'auto' | 'gemini' | 'ollama' | 'vertex';
export type AiRuntimeMode = 'gemini' | 'ollama' | 'vertex' | 'unavailable';
export type CanvasJson = Record<string, unknown> | unknown[];
export type ViewportTransform = number[];

export interface CanvasObjectData {
  id: string;
  type: string;
  left: number;
  top: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
  angle?: number;
  // Metadata for AI context
  htmlContent?: string; 
  svgContent?: string;
  imageUrl?: string; // For images on canvas
  textContent?: string; // For reading text on canvas
  zIndex?: number;
}

export interface DomElementState {
  id: string;
  html: string;
  componentType?: string;
  config?: any;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  zIndex: number;
}

export interface BoardSession {
  id: string;
  title: string;
  updatedAt: number;
  createdAt: number;
  thumbnail: string;
  sizeBytes: number;
  pages: Array<{ canvas: object; dom: Record<string, DomElementState>; previewDataUrl?: string }>;
}

export interface AgentAction {
  id: string;
  type: 'MOVE_CURSOR' | 'CREATE_SHAPE' | 'CREATE_SVG' | 'EDIT_SVG' | 'RENDER_HTML' | 'EDIT_HTML' | 'CREATE_IMAGE' | 'WRITE_TEXT' | 'DRAW_PATH' | 'DRAG_OBJECT' | 'RESIZE_OBJECT' | 'MODIFY_PROPERTY' | 'DELETE_OBJECT' | 'REORDER_OBJECT' | 'SELECT_OBJECTS' | 'PAN_CAMERA';
  payload: any;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
}

export interface AgentState {
  cursorPosition: Point;
  spatialTarget: Point | null;
  accuracy: number; // 0-100
  isThinking: boolean;
  isActing: boolean;
  isClicking: boolean;
  currentAction: string | null;
  logs: string[];
  agentMessage: string | null; // What the agent is currently "saying"
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface RoomState {
  state: CanvasJson;
  viewports: Record<string, ViewportTransform>;
  lastViewport?: ViewportTransform | null;
  domElements: Record<string, DomElementState>;
}

// Socket.IO contract for board collaboration. Hosts emit updates; viewers receive
// current canvas, viewport, and DOM overlay state for the joined room.
export interface ClientToServerEvents {
  // Join or create a collaboration room.
  'join-room': (roomId: string) => void;
  // Replace the room canvas snapshot after a host-side canvas mutation.
  'canvas-update': (payload: { roomId: string; data: CanvasJson }) => void;
  // Broadcast camera movement from the host to viewers.
  'viewport-update': (payload: { roomId: string; viewport: ViewportTransform }) => void;
  // Broadcast interactive DOM overlay state from the host to viewers.
  'dom-elements-update': (payload: { roomId: string; domElements: Record<string, DomElementState> }) => void;
}

export interface ServerToClientEvents {
  // Initial room canvas snapshot sent after joining.
  'canvas-init': (data: CanvasJson) => void;
  // Incremental canvas snapshot broadcast to viewers.
  'canvas-update': (data: CanvasJson) => void;
  // Camera transform broadcast; socketId identifies the emitting host/client.
  'viewport-update': (payload: { socketId: string; viewport: ViewportTransform }) => void;
  // Initial DOM overlay state sent after joining.
  'dom-elements-init': (data: Record<string, DomElementState>) => void;
  // DOM overlay updates broadcast to viewers.
  'dom-elements-update': (data: Record<string, DomElementState>) => void;
  // Reserved for server-side sync validation/reporting failures.
  'sync-error': (payload: { message: string }) => void;
}

export interface SocketInterServerEvents {}
export interface SocketData {}

// Global window extension for Fabric
declare global {
  interface Window {
    fabric: any;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
