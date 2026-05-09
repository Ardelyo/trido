import { CanvasObjectData } from "../types";

export interface ViewportBounds {
  width: number;
  height: number;
}

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
  const response = await fetch('/api/ai/generate', {
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
      domElements 
    })
  });
  
  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${await response.text()}`);
  }
  return await response.json();
};

export const generateToolContent = async (toolId: string, prompt: string): Promise<any> => {
  const response = await fetch('/api/ai/tool-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolId, prompt })
  });
  
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  
  const data = await response.json();
  return data.result;
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const response = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Audio })
  });
  
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  
  const data = await response.json();
  return data.text;
};
