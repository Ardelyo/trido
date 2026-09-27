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
  const userMessage: any = {
    role: "user",
    content: `User request: ${prompt}\n\nRemember: Thoroughly address the entire request. Use function calls for all visual artifacts, batching actions together, and explain in clear text.`
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
      const fallbackPayload = {
        model: modelName,
        messages: [
          {
            role: "system",
            content: `${systemInstruction}\n\nCRITICAL: You must output ONLY a valid JSON object with your response and tool calls in this format:\n{"textResponse": "Your explanation here", "functionCalls": [{"name": "tool_name", "args": {...}}]}`
          },
          ...history.map(h => ({ role: h.role === "model" ? "assistant" : "user", content: h.text })),
          userMessage
        ],
        stream: false,
        format: "json",
        options: {
          num_ctx: CONFIG.ai.ollama.numCtx
        }
      };

      const fallbackRes = await fetch(`${getOllamaUrl(customUrl)}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(fallbackPayload)
      });
      const fallbackData = await fallbackRes.json();
      if (!fallbackData.error && fallbackData.message?.content) {
        try {
          const parsed = JSON.parse(fallbackData.message.content);
          return {
            functionCalls: Array.isArray(parsed.functionCalls) ? parsed.functionCalls : [],
            textResponse: parsed.textResponse || fallbackData.message.content,
            thought: "",
            telemetry: {
              id: `tel_ollama_${Date.now()}`,
              promptTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              costUsd: 0,
              costIdr: 0,
              latencyMs: 1000,
              provider: "ollama",
              model: modelName,
              sheetSyncStatus: "disabled"
            }
          };
        } catch (_) {}
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
      // Fallback: extract JSON tool calls from text (model didn't use native tool_calls)
      // Only attempt extraction on reasonably short responses to avoid catastrophic regex
      if (textResponse.length < 8000) {
        try {
          // Strip thinking tags first
          const cleanText = textResponse
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/<thought>[\s\S]*?<\/thought>/g, '')
            .trim();

          // Match fenced JSON blocks first (safest)
          const fencedMatches = [...cleanText.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
          for (const match of fencedMatches) {
            try {
              const rawJson = JSON.parse(match[1]);
              // Case: { "calls": [...] }
              const legacyResult = LegacyResponseSchema.safeParse(rawJson);
              if (legacyResult.success) { functionCalls.push(...legacyResult.data.calls); continue; }
              // Case: single tool call object
              const singleResult = ToolCallSchema.safeParse(rawJson);
              if (singleResult.success) { functionCalls.push(singleResult.data); continue; }
              // Case: array of tool calls
              const arrayResult = z.array(ToolCallSchema).safeParse(rawJson);
              if (arrayResult.success) { functionCalls.push(...arrayResult.data); continue; }
            } catch { /* skip invalid JSON */ }
          }

          // Only try bare JSON if no fenced blocks found and response looks JSON-like
          if (functionCalls.length === 0) {
            const trimmed = cleanText.trim();
            if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length < 4000) {
              try {
                const rawJson = JSON.parse(trimmed);
                const legacyResult = LegacyResponseSchema.safeParse(rawJson);
                if (legacyResult.success) { functionCalls.push(...legacyResult.data.calls); }
                else {
                  const arrayResult = z.array(ToolCallSchema).safeParse(rawJson);
                  if (arrayResult.success) { functionCalls.push(...arrayResult.data); }
                  else {
                    const singleResult = ToolCallSchema.safeParse(rawJson);
                    if (singleResult.success) { functionCalls.push(singleResult.data); }
                  }
                }
              } catch { /* not valid JSON */ }
            }
          }
        } catch (e) {
          logger.warn('[Ollama Adapter] JSON extraction failed', e);
        }
      }
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
