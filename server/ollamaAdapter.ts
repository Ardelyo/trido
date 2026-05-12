import { z } from "zod";
import { CanvasObjectData } from "../types";
import { tools, buildSystemInstruction, validateFunctionCalls, ViewportBounds, extractThinking } from "./aiTools";
import { CONFIG } from "../constants";
import { createLogger } from "../utils/logger";

const logger = createLogger('ollama-adapter');
const getOllamaUrl = () => process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || CONFIG.ai.ollama.defaultBaseUrl;

export const generateAgentActionsOllama = async (
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
  
  const systemInstruction = buildSystemInstruction(canvasObjects, viewport, pageContext, domElements);
  
  const mappedTools = tools.map(t => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description || "",
      parameters: t.parameters as any
    }
  }));

  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(h => ({ role: h.role === "model" ? "assistant" : "user", content: h.text })),
    { 
      role: "user", 
      content: `User request: ${prompt}\n\nRemember: Use function calls, not descriptions. Batch all actions together.`,
      images: [cleanCanvasBase64]
    }
  ];

  if (highResInputImage) {
      messages[messages.length - 1].images.push(highResInputImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""));
  }

  const payload = {
    model: process.env.OLLAMA_MODEL || CONFIG.ai.ollama.model,
    messages: messages,
    tools: mappedTools,
    stream: false,
    options: {
      num_ctx: CONFIG.ai.ollama.numCtx
    }
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.OLLAMA_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  const response = await fetch(`${getOllamaUrl()}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  let textResponse = "";
  let functionCalls: any[] = [];
  let thought = "";

  if (data.error) {
    logger.error("Ollama API Error", { error: data.error });
    throw new Error(`Ollama Error: ${data.error}`);
  }

  // --- Schema Definitions for Tool Calls ---
  const ToolCallSchema = z.object({
    name: z.string(),
    args: z.record(z.string(), z.any())
  });

  const LegacyResponseSchema = z.object({
    calls: z.array(ToolCallSchema)
  });

  if (data.message) {
    textResponse = data.message.content || "";
    thought = extractThinking(data.message);
    logger.info(`[Ollama Raw Response]: ${textResponse}`);

    if (data.message.tool_calls && data.message.tool_calls.length > 0) {
      functionCalls = data.message.tool_calls.map((tc: any) => {
        const parsed = ToolCallSchema.safeParse({
          name: tc.function.name,
          args: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments
        });
        return parsed.success ? parsed.data : null;
      }).filter(Boolean);
    } else {
      // Fallback: Manual JSON extraction from text
      try {
        const jsonPatterns = [
            /```json\s*([\s\S]*?)\s*```/g,
            /({[\s\S]*})/g,
            /(\[[\s\S]*\])/g
        ];

        for (const pattern of jsonPatterns) {
            const matches = textResponse.matchAll(pattern);
            for (const match of matches) {
                try {
                    const rawJson = JSON.parse(match[1]);

                    // Case 1: { "calls": [...] }
                    const legacyResult = LegacyResponseSchema.safeParse(rawJson);
                    if (legacyResult.success) {
                        functionCalls = [...functionCalls, ...legacyResult.data.calls];
                        continue;
                    }

                    // Case 2: { "name": "...", "args": {...} }
                    const singleResult = ToolCallSchema.safeParse(rawJson);
                    if (singleResult.success) {
                        functionCalls.push(singleResult.data);
                        continue;
                    }

                    // Case 3: [ { "name": "...", "args": {...} }, ... ]
                    const arrayResult = z.array(ToolCallSchema).safeParse(rawJson);
                    if (arrayResult.success) {
                        functionCalls = [...functionCalls, ...arrayResult.data];
                        continue;
                    }
                } catch (e) {}
            }
            if (functionCalls.length > 0) break;
        }
      } catch (e) {
          logger.warn("[Ollama Adapter] Manual JSON extraction failed", e);
      }
    }
  }

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

export const generateToolContentOllama = async (toolId: string, prompt: string): Promise<any> => {
  let promptText = "";
  if (toolId === 'mindmap') {
    promptText = `Generate a JSON array of mindmap nodes for the topic: "${prompt}". 
    Each node must have EXACTLY these fields: text (string), style (MAIN_TOPIC, SUBTOPIC, DETAIL), and relativePosition (CENTER for the first one, then RIGHT_OF_LAST, BELOW_LAST, etc.).
    Example: [{"text": "AI", "style": "MAIN_TOPIC", "relativePosition": "CENTER"}, {"text": "Machine Learning", "style": "SUBTOPIC", "relativePosition": "RIGHT_OF_LAST"}]
    RETURN ONLY THE JSON ARRAY. NO PREAMBLE. NO MARKDOWN. JUST [ ... ]`;
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
    RETURN ONLY THE JSON OBJECT. NO PREAMBLE. NO MARKDOWN. JUST { ... }`;
  } else if (toolId === 'website') {
    promptText = `Generate a JSON object for a single-page interactive web app about: "${prompt}".
    Format EXACTLY: { "html": "<div ...>...</div>", "title": "string" }
    Use Tailwind CSS classes.
    RETURN ONLY THE JSON OBJECT. NO PREAMBLE. NO MARKDOWN. JUST { ... }`;
  } else if (toolId === 'summary') {
    promptText = `Summarize the following text clearly and concisely, suitable for presentation notes.
    Format your response in Markdown. Text: "${prompt}"`;
  }

  const payload = {
    model: process.env.OLLAMA_MODEL || CONFIG.ai.ollama.model,
    messages: [{ role: "user", content: promptText }],
    stream: false
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.OLLAMA_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  const response = await fetch(`${getOllamaUrl()}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  
  if (data.error) {
    logger.error("Ollama Tool Content Error", { error: data.error });
    throw new Error(`Ollama Error: ${data.error}`);
  }

  const text = data.message?.content || "";
  if (toolId === 'summary') return text;
  
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    logger.error("Failed to parse tool JSON", e);
    return null;
  }
};

export const transcribeAudioOllama = async (base64Audio: string): Promise<string> => {
  logger.warn(`Audio transcription via Ollama is not fully supported with ${CONFIG.ai.ollama.model} yet.`);
  return "Fitur voice command belum tersedia di mode lokal penuh.";
};
