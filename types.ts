
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

// Global window extension for Fabric
declare global {
  interface Window {
    fabric: any;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
