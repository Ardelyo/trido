import { Router } from "express";
import express from "express";
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

export const aiRouter = Router();

aiRouter.use(express.json({ limit: "50mb" }));

const getMode = () => {
  const AI_MODE = process.env.AI_MODE || 'auto';
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (AI_MODE === 'ollama') return 'ollama';
  if (AI_MODE === 'gemini' && GEMINI_KEY) return 'gemini';
  
  // auto
  if (GEMINI_KEY) return 'gemini';
  return 'ollama';
};

aiRouter.get("/status", async (req, res) => {
  const mode = getMode();
  let online = false;
  let model = "";

  if (mode === 'gemini') {
    model = 'gemini-2.0-flash';
    online = true; // assume online if using gemini
  } else {
    model = process.env.OLLAMA_MODEL || 'gemma4:e2b';
    try {
      const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        online = true;
      }
    } catch (e) {
      online = false;
    }
  }

  res.json({
    mode: online ? mode : 'unavailable',
    model,
    online
  });
});

aiRouter.post("/generate", async (req, res) => {
  try {
    const { prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements } = req.body;
    
    const mode = getMode();
    let result;
    
    if (mode === 'gemini') {
      try {
        result = await generateAgentActionsGemini(
          prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements
        );
      } catch (e) {
        console.error("Gemini failed, fallback to Ollama", e);
        result = await generateAgentActionsOllama(
          prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements
        );
      }
    } else {
      result = await generateAgentActionsOllama(
        prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history, pageContext, domElements
      );
    }
    
    res.json(result);
  } catch (error: any) {
    console.error("Generate error:", error);
    res.status(500).json({ error: error.message });
  }
});

aiRouter.post("/tool-content", async (req, res) => {
  try {
    const { toolId, prompt } = req.body;
    const mode = getMode();
    let result;
    
    if (mode === 'gemini') {
      result = await generateToolContentGemini(toolId, prompt);
    } else {
      result = await generateToolContentOllama(toolId, prompt);
    }
    
    res.json({ result });
  } catch (error: any) {
    console.error("Tool content error:", error);
    res.status(500).json({ error: error.message });
  }
});

aiRouter.post("/transcribe", async (req, res) => {
  try {
    const { base64Audio } = req.body;
    const mode = getMode();
    let text;
    
    if (mode === 'gemini') {
      text = await transcribeAudioGemini(base64Audio);
    } else {
      text = await transcribeAudioOllama(base64Audio);
    }
    
    res.json({ text });
  } catch (error: any) {
    console.error("Transcribe error:", error);
    res.status(500).json({ error: error.message });
  }
});
