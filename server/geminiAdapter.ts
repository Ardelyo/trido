import { GoogleGenAI } from "@google/genai";
import { CanvasObjectData } from "../types";
import { tools, buildSystemInstruction, validateFunctionCalls, extractThinking, ViewportBounds } from "./aiTools";
import { CONFIG } from "../constants";
import { createLogger } from "../utils/logger";

const getAiClient = (customKey?: string) => new GoogleGenAI({ apiKey: customKey || process.env.GEMINI_API_KEY || process.env.API_KEY || "dummy" });
const logger = createLogger('gemini-adapter');

export const generateAgentActionsGemini = async (
  prompt: string,
  canvasImageBase64: string,
  canvasObjects: CanvasObjectData[],
  viewport: ViewportBounds,
  highResInputImage?: string | null,
  history: { role: 'user' | 'model'; text: string }[] = [],
  pageContext?: { current: number; total: number },
  domElements: Record<string, any> = {},
  customKey?: string
) => {
  const cleanCanvasBase64 = canvasImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
  const cleanInputImage = highResInputImage?.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  const systemInstruction = buildSystemInstruction(canvasObjects, viewport, pageContext, domElements);

  const contents = [
    ...history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    {
      role: "user" as const,
      parts: [
        { inlineData: { mimeType: "image/png", data: cleanCanvasBase64 } },
        ...(cleanInputImage ? [{ inlineData: { mimeType: "image/png", data: cleanInputImage } }] : []),
        { text: `User request: ${prompt}\n\nRemember: Use function calls, not descriptions. Batch all actions together.` }
      ]
    }
  ];

  const ai = getAiClient(customKey);

  // Use a dedicated generate timeout — 90s is enough for complex multi-tool requests
  const generateTimeoutMs = (CONFIG.ai.gemini as any).generateTimeoutMs ?? 90_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), generateTimeoutMs);

  let response;
  try {
    response = await ai.models.generateContent({
      model: CONFIG.ai.gemini.model,
      contents: contents,
      config: {
        tools: [{ functionDeclarations: tools }],
        systemInstruction: systemInstruction,
        temperature: CONFIG.ai.gemini.generation.temperature,
        maxOutputTokens: CONFIG.ai.gemini.generation.maxOutputTokens
      }
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let functionCalls = response.functionCalls || [];
  const textResponse = response.text || "";
  const thought = extractThinking(response);

  const validation = validateFunctionCalls(functionCalls, canvasObjects, domElements);
  if (!validation.isValid) {
    logger.warn('Function call validation issues', { errors: validation.errors });
    functionCalls = validation.fixedCalls;
  }

  return { 
    functionCalls, 
    textResponse, 
    thought,
    validationErrors: validation.errors
  };
};

export const generateToolContentGemini = async (toolId: string, prompt: string, customKey?: string): Promise<any> => {
  const model = CONFIG.ai.gemini.model;
  let promptText = "";
  
  if (toolId === 'mindmap') {
    promptText = `Generate a JSON array of mindmap nodes for the topic: "${prompt}". 
    Each node must have: text (string), style (MAIN_TOPIC, SUBTOPIC, DETAIL), and relativePosition (CENTER for the first one, then RIGHT_OF_LAST, BELOW_LAST, etc.).
    Example: [{"text": "AI", "style": "MAIN_TOPIC", "relativePosition": "CENTER"}, {"text": "Machine Learning", "style": "SUBTOPIC", "relativePosition": "RIGHT_OF_LAST"}]
    RETURN ONLY RAW VALID JSON ARRAY without markdown formatting.`;
  } else if (toolId === 'quiz') {
    promptText = `Generate a JSON object for a comprehensive quiz about: "${prompt}".
    Format EXACTLY: {
      "title": "string",
      "questions": [
        { "type": "multiple_choice", "question": "string", "options": ["string", "string", "string", "string"], "correctIndex": number },
        { "type": "essay", "question": "string", "expectedAnswer": "string" }
      ]
    }
    Include at least 2 multiple choice questions and 1 essay question.
    RETURN ONLY RAW VALID JSON without markdown formatting.`;
  } else if (toolId === 'website') {
    promptText = `Generate a JSON object for a single-page interactive web app about: "${prompt}".
    Format: { "html": "<div ...>...</div>", "title": "string" }
    Use Tailwind CSS classes. Make it beautiful and functional. Include inline script if needed.
    RETURN ONLY RAW VALID JSON without markdown formatting.`;
  } else if (toolId === 'summary') {
    promptText = `Summarize the following text clearly and concisely, suitable for presentation notes.
    Format your response in Markdown. Text: "${prompt}"`;
  }

  const ai = getAiClient(customKey);
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    config: { temperature: CONFIG.ai.gemini.generation.temperature }
  });

  const text = response.text || "";
  if (toolId === 'summary') return text;
  
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    logger.error("Failed to parse tool JSON", e);
    return null;
  }
};

export const transcribeAudioGemini = async (base64Audio: string, customKey?: string): Promise<string> => {
  const ai = getAiClient(customKey);
  const response = await ai.models.generateContent({
    model: CONFIG.ai.gemini.model,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm",
              data: base64Audio.replace(/^data:audio\/(webm|ogg|wav|mp4|mpeg);base64,/, ""),
            },
          },
          {
            text: "Transcribe this audio exactly as spoken. Detect the language automatically and return the transcript in that same language. Return only the transcribed text — no commentary, no explanation, no punctuation corrections. If there is no human speech, return an empty string.",
          },
        ],
      },
    ],
    config: { temperature: CONFIG.ai.gemini.transcription.temperature },
  });

  return response.text?.trim() || "";
};
