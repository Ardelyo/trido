import { GoogleGenAI, FunctionCallingConfigMode } from "@google/genai";
import { CanvasObjectData } from "../types";
import { tools, buildSystemInstruction, validateFunctionCalls, extractThinking, ViewportBounds, getCapability } from "./aiTools";
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
  customKey?: string,
  intent?: string,
  forceTools?: boolean,
  lessonContext?: any,
  modelOverride?: string
) => {
  const cleanCanvasBase64 = canvasImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
  const cleanInputImage = highResInputImage?.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  const selectedModel = modelOverride || CONFIG.ai.gemini.model;
  const capability = getCapability(selectedModel);
  let systemInstruction = buildSystemInstruction(canvasObjects, viewport, pageContext, domElements, lessonContext, capability);

  // Add intent context to system prompt
  const intentInstruction = intent === 'question' 
    ? '\n\nNOTE: User is asking a QUESTION. Prioritize a helpful text answer. Only use tools if visualization would genuinely help.'
    : intent === 'creation'
    ? '\n\nNOTE: User wants to CREATE something. Use tools immediately. Explain briefly what you made in your text response.'
    : '';

  systemInstruction += intentInstruction;

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

  const isCreationRequest = forceTools !== undefined ? forceTools : /buat|create|gambar|draw|add|tambah/i.test(prompt);

  const ai = getAiClient(customKey);

  // Use a dedicated generate timeout — 90s is enough for complex multi-tool requests
  const generateTimeoutMs = (CONFIG.ai.gemini as any).generateTimeoutMs ?? 90_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), generateTimeoutMs);

  let response;
  try {
    response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents,
      config: {
        tools: [{ functionDeclarations: tools }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO
          }
        },
        systemInstruction: systemInstruction,
        temperature: CONFIG.ai.gemini.generation.temperature,
        maxOutputTokens: CONFIG.ai.gemini.generation.maxOutputTokens
      }
    });
  } finally {
    clearTimeout(timeoutId);
  }

  // Extract text AND function calls from raw parts — avoids SDK .text getter warning
  const _candidate = (response as any).candidates?.[0];
  const _parts: any[] = _candidate?.content?.parts || [];
  const textResponse = _parts
    .filter((p: any) => p.text && !p.thought)
    .map((p: any) => p.text)
    .join('') || '';
  // Extract function calls from parts directly (bypasses SDK getter that triggers the warning)
  let functionCalls: any[] = _parts
    .filter((p: any) => p.functionCall)
    .map((p: any) => ({ name: p.functionCall.name, args: p.functionCall.args || {} }));
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

export const generateToolContentGemini = async (toolId: string, prompt: string, customKey?: string, modelOverride?: string): Promise<any> => {
  const model = modelOverride || CONFIG.ai.gemini.model;
  let promptText = "";
  
  if (toolId === 'mindmap') {
    promptText = `Generate a JSON object for a mind map about: "${prompt}".
Return EXACTLY this format:
{
  "nodes": [
    {"text": "string", "style": "MAIN_TOPIC|SUBTOPIC|DETAIL", "parentNodeText": null_or_string}
  ]
}
Rules:
- Maximum 8 nodes: exactly 1 MAIN_TOPIC (root, parentNodeText=null), 4-5 SUBTOPIC, 0-2 DETAIL
- parentNodeText MUST be the EXACT text of an existing node in this list
- RETURN ONLY RAW VALID JSON. NO MARKDOWN. NO EXPLANATION.`;
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

export const transcribeAudioGemini = async (base64Audio: string, customKey?: string, modelOverride?: string): Promise<string> => {
  const model = modelOverride || CONFIG.ai.gemini.model;
  const ai = getAiClient(customKey);
  const response = await ai.models.generateContent({
    model: model,
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
