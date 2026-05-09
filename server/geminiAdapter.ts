import { GoogleGenAI } from "@google/genai";
import { CanvasObjectData } from "../types";
import { tools, buildSystemInstruction, validateFunctionCalls, extractThinking, ViewportBounds } from "./aiTools";
import { GEMINI_MODEL } from "../constants";

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "dummy" });

export const generateAgentActionsGemini = async (
  prompt: string,
  canvasImageBase64: string,
  canvasObjects: CanvasObjectData[],
  viewport: ViewportBounds,
  highResInputImage?: string | null,
  history: { role: 'user' | 'model'; text: string }[] = [],
  pageContext?: { current: number; total: number },
  domElements: Record<string, any> = {}
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

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: contents,
    config: {
      tools: [{ functionDeclarations: tools }],
      toolConfig: { includeServerSideToolInvocations: true },
      systemInstruction: systemInstruction,
      temperature: 0.3,
      maxOutputTokens: 2048
    }
  });

  let functionCalls = response.functionCalls || [];
  const textResponse = response.text || "";
  const thought = extractThinking(response);

  const validation = validateFunctionCalls(functionCalls, canvasObjects);
  if (!validation.isValid) {
    functionCalls = validation.fixedCalls;
  }

  return { 
    functionCalls, 
    textResponse, 
    thought,
    validationErrors: validation.errors
  };
};

export const generateToolContentGemini = async (toolId: string, prompt: string): Promise<any> => {
  const model = GEMINI_MODEL;
  let promptText = "";
  
  if (toolId === 'mindmap') {
    promptText = `Generate a JSON array of mindmap nodes for the topic: "${prompt}". 
    Each node must have: text (string), style (MAIN_TOPIC, SUBTOPIC, DETAIL), and relativePosition (CENTER for the first one, then RIGHT_OF_LAST, BELOW_LAST, etc.).
    Example: [{"text": "AI", "style": "MAIN_TOPIC", "relativePosition": "CENTER"}, {"text": "Machine Learning", "style": "SUBTOPIC", "relativePosition": "RIGHT_OF_LAST"}]
    RETURN ONLY RAW VALID JSON ARRAY without markdown formatting.`;
  } else if (toolId === 'quiz') {
    promptText = `Generate a JSON object for a multiple choice quiz about: "${prompt}".
    Format: {"question": "string", "options": ["string", "string", "string"], "correctIndex": number}
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

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    config: { temperature: 0.3 }
  });

  const text = response.text || "";
  if (toolId === 'summary') return text;
  
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse tool JSON", e);
    return null;
  }
};

export const transcribeAudioGemini = async (base64Audio: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm",
              data: base64Audio.replace(/^data:audio\/(webm|ogg|wav);base64,/, ""),
            },
          },
          {
            text: "Transkripsikan audio ini ke teks Bahasa Indonesia. Jangan menambahkan komentar, penjelasan, atau tanda baca tambahan jika tidak perlu. Kembalikan hanya teks hasil transkripsinya saja. Jika tidak ada suara manusia, kembalikan string kosong.",
          },
        ],
      },
    ],
    config: { temperature: 0.1 },
  });

  return response.text?.trim() || "";
};
