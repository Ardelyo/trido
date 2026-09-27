import { z } from "zod";
import { CanvasObjectData } from "../types";
import { tools, buildSystemInstruction, validateFunctionCalls, ViewportBounds, extractThinking, getCapability } from "./aiTools.js";
import { CONFIG } from "../constants";
import { createLogger } from "../utils/logger";

const logger = createLogger('ollama-adapter');
const getOllamaUrl = (customUrl?: string) => customUrl || process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || CONFIG.ai.ollama.defaultBaseUrl;

function toOllamaJsonSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(toOllamaJsonSchema);

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'type' && typeof value === 'string') {
      result[key] = value.toLowerCase();
    } else {
      result[key] = toOllamaJsonSchema(value);
    }
  }
  return result;
}

// Lenient JSON parser for small SLMs that output literal newlines or trailing commas
function parseLenientJson(jsonStr: string): any {
  if (!jsonStr || typeof jsonStr !== 'string') return null;
  // 1. Direct parse attempt
  try {
    return JSON.parse(jsonStr.trim());
  } catch (_) {}

  // 2. Escape literal unescaped control characters inside string quotes
  try {
    let inString = false;
    let escaped = false;
    let sanitized = "";
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      if (inString) {
        if (char === '\n') {
          sanitized += '\\n';
          continue;
        } else if (char === '\r') {
          sanitized += '\\r';
          continue;
        } else if (char === '\t') {
          sanitized += '\\t';
          continue;
        }
      }
      escaped = (char === '\\' && !escaped);
      sanitized += char;
    }
    // Remove trailing commas before } or ]
    sanitized = sanitized.replace(/,\s*([\}\]])/g, '$1');
    return JSON.parse(sanitized.trim());
  } catch (_) {}

  return null;
}

// Extracts functionCalls and purges raw JSON/code blocks from chat textResponse
function extractToolsAndCleanText(rawText: string): { functionCalls: any[]; cleanText: string } {
  if (!rawText) return { functionCalls: [], cleanText: "" };
  
  let cleanText = rawText
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<thought>[\s\S]*?<\/thought>/g, '')
    .trim();

  const functionCalls: any[] = [];
  let extractedConversationalText = "";

  const inspectParsedObject = (parsed: any) => {
    if (!parsed) return;
    if (parsed.textResponse && typeof parsed.textResponse === 'string') {
      extractedConversationalText = parsed.textResponse.trim();
    }
    if (Array.isArray(parsed.functionCalls)) {
      functionCalls.push(...parsed.functionCalls);
    } else if (Array.isArray(parsed.calls)) {
      functionCalls.push(...parsed.calls);
    } else if (parsed.name && parsed.args) {
      functionCalls.push(parsed);
    } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.name) {
      functionCalls.push(...parsed);
    }
  };

  // Case A: Fenced markdown blocks ```json ... ```
  const fencedMatches = [...cleanText.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)];
  for (const match of fencedMatches) {
    const parsed = parseLenientJson(match[1]);
    inspectParsedObject(parsed);
  }

  // Case B: Bare JSON object or array { ... }
  if (functionCalls.length === 0) {
    const jsonMatch = cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = parseLenientJson(jsonMatch[0]);
      inspectParsedObject(parsed);
    }
  }

  // If function calls were extracted, purge technical JSON and schemas from user-facing text
  if (functionCalls.length > 0) {
    if (extractedConversationalText) {
      cleanText = extractedConversationalText;
    } else {
      cleanText = cleanText
        .replace(/```(?:json)?[\s\S]*?```/gi, '')
        .replace(/\{[\s\S]*\}/g, '')
        .replace(/\[[\s\S]*\]/g, '')
        .replace(/Explanation:[\s\S]*$/gi, '')
        .replace(/Note: I've included JSON format[\s\S]*$/gi, '')
        .trim();
    }

    if (!cleanText) {
      cleanText = "Tentu! Saya telah menyiapkan komponen di papan tulis pintar untuk Anda.";
    }
  }

  return { functionCalls, cleanText };
}

export const generateAgentActionsOllama = async (
  prompt: string,
  canvasImageBase64: string,
  canvasObjects: CanvasObjectData[],
  viewport: ViewportBounds,
  highResInputImage?: string | null,
  history: { role: 'user' | 'model'; text: string }[] = [],
  pageContext?: { current: number; total: number },
  domElements: Record<string, any> = {},
  customUrl?: string,
  intent?: string,
  forceTools?: boolean,
  lessonContext?: any,
  modelOverride?: string
) => {
  const cleanCanvasBase64 = canvasImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
  
  const modelName = modelOverride || process.env.OLLAMA_MODEL || CONFIG.ai.ollama.model;
  const capability = getCapability(modelName);
  let systemInstruction = buildSystemInstruction(canvasObjects, viewport, pageContext, domElements, lessonContext, capability);

  // Add intent context to system prompt
  const intentInstruction = intent === 'question' 
    ? '\n\nNOTE: User is asking a QUESTION. Prioritize a helpful text answer. Only use tools if visualization would genuinely help.'
    : intent === 'creation'
    ? '\n\nNOTE: User wants to CREATE something. Use tools immediately. Explain briefly what you made in your text response.'
    : '';

  systemInstruction += intentInstruction;
  
  const mappedTools = tools.map(t => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description || "",
      parameters: toOllamaJsonSchema(t.parameters)
    }
  }));

  const isVisionModel = /vision|llava|bakllava|moondream|minicpm-v|cogvlm|qwen-vl/i.test(modelName);

  // Jev System 1 Reflex Guard: In-Place Mutation Enforcement
  const isModification = /(ubah|edit|ganti|tambah|update|modify|expand|lanjutkan|cabang|masukkan|hapus)/i.test(prompt);
  const existingDiagramKeys = Object.keys(domElements).filter(k => {
    const el = domElements[k];
    const type = el?.componentType || el?.type || '';
    return type === 'MERMAID_DIAGRAM' || type === 'MARKMAP_MINDMAP';
  });

  let reflexDirective = "";
  if (isModification && existingDiagramKeys.length > 0) {
    reflexDirective = `\n\n[JEV SYSTEM 1 DECISION: IN-PLACE MUTATION ONLY]\nAn existing diagram is already on the canvas (ID: "${existingDiagramKeys[0]}"). DO NOT call render_mermaid or create a duplicate widget. You MUST call update_component with objectId="${existingDiagramKeys[0]}", action="REPLACE" or "APPEND", and provide the updated complete Mermaid code.`;
  }

  const userMessage: any = {
    role: "user",
    content: `User request: ${prompt}${reflexDirective}\n\nRemember: Thoroughly address the entire request. Use function calls for all visual artifacts, batching actions together, and explain in clear text.`
  };

  if (isVisionModel && (cleanCanvasBase64 || highResInputImage)) {
    userMessage.images = [];
    if (cleanCanvasBase64) userMessage.images.push(cleanCanvasBase64);
    if (highResInputImage) {
      userMessage.images.push(highResInputImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""));
    }
  }

  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(h => ({ role: h.role === "model" ? "assistant" : "user", content: h.text })),
    userMessage
  ];

  const payload = {
    model: modelName,
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

  const controller = new AbortController();
  const timeoutMs = (CONFIG.ai.ollama as any).generateTimeoutMs || 180_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${getOllamaUrl(customUrl)}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json();

  let textResponse = "";
  let functionCalls: any[] = [];
  let thought = "";

  if (data.error) {
    // If the model does not support native function calling tools in Ollama (e.g. gemma2),
    // automatically fall back to prompt-based JSON tool generation without failing or jumping to cloud!
    if (typeof data.error === 'string' && data.error.includes("does not support tools")) {
      logger.warn(`Model ${modelName} does not support native tools. Retrying with prompt-based JSON tool calling...`);
      const fallbackPayload: any = {
        model: modelName,
        messages: [
          {
            role: "system",
            content: `${systemInstruction}\n\nCRITICAL OUTPUT REQUIREMENT:\nYou MUST output your actions as a JSON block formatted exactly like this:\n\`\`\`json\n{\n  "textResponse": "Penjelasan singkat",\n  "functionCalls": [\n    {"name": "render_mermaid", "args": {"title": "Judul", "code": "mindmap\\n  root((Topik))\\n    Cabang"}}\n  ]\n}\n\`\`\``
          },
          ...history.map(h => ({ role: h.role === "model" ? "assistant" : "user", content: h.text })),
          userMessage
        ],
        stream: false,
        options: {
          num_ctx: 16384,
          temperature: 0.15,
          repeat_penalty: 1.05
        }
      };

      const fallbackRes = await fetch(`${getOllamaUrl(customUrl)}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(fallbackPayload)
      });
      const fallbackData = await fallbackRes.json();
      if (!fallbackData.error && fallbackData.message?.content) {
        const { functionCalls: extractedCalls, cleanText } = extractToolsAndCleanText(fallbackData.message.content);
        return {
          functionCalls: extractedCalls,
          textResponse: cleanText,
          thought: "",
          telemetry: {
            id: `tel_ollama_${Date.now()}`,
            promptTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            costUsd: 0,
            costIdr: 0,
            latencyMs: 1200,
            provider: "ollama",
            model: modelName,
            sheetSyncStatus: "disabled"
          }
        };
      }
    }

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
      // Fallback: extract JSON tool calls from text and clean conversational message
      const { functionCalls: extractedCalls, cleanText } = extractToolsAndCleanText(textResponse);
      functionCalls = extractedCalls;
      textResponse = cleanText;
    }
  }

  const validation = validateFunctionCalls(functionCalls, canvasObjects, domElements);
  if (!validation.isValid) {
    logger.warn('[Ollama] Validation issues', { errors: validation.errors });
    functionCalls = validation.fixedCalls;
  }

  return {
    functionCalls,
    textResponse,
    thought,
    validationErrors: validation.errors,
    usageMetadata: {
      promptTokenCount: data.prompt_eval_count || 0,
      candidatesTokenCount: data.eval_count || 0,
      totalTokenCount: (data.prompt_eval_count || 0) + (data.eval_count || 0)
    }
  };
};

export const generateToolContentOllama = async (toolId: string, prompt: string, customUrl?: string, modelOverride?: string): Promise<any> => {
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
    model: modelOverride || process.env.OLLAMA_MODEL || CONFIG.ai.ollama.model,
    messages: [{ role: "user", content: promptText }],
    stream: false
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.OLLAMA_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  const response = await fetch(`${getOllamaUrl(customUrl)}/api/chat`, {
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

export const transcribeAudioOllama = async (base64Audio: string, customUrl?: string, modelOverride?: string): Promise<string> => {
  const model = modelOverride || process.env.OLLAMA_MODEL || CONFIG.ai.ollama.model;
  // Only vision-capable models can process audio — for text models, return graceful fallback
  // Ollama doesn't support native audio input yet; we return a localised prompt
  logger.warn(`[Ollama] Audio transcription not natively supported by ${model}. Returning fallback.`);
  return '';
};
