import { CanvasObjectData } from "../types";
import { tools, buildSystemInstruction, validateFunctionCalls, ViewportBounds } from "./aiTools";
import { OLLAMA_MODEL } from "../constants";

const getOllamaUrl = () => process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

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
    model: OLLAMA_MODEL || "gemma4:e2b",
    messages: messages,
    tools: mappedTools,
    stream: false,
    options: {
      num_ctx: 4096
    }
  };

  const response = await fetch(`${getOllamaUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  
  let functionCalls: any[] = [];
  let textResponse = "";
  let thought = "";

  if (data.message) {
    textResponse = data.message.content || "";
    if (data.message.tool_calls) {
      functionCalls = data.message.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        args: tc.function.arguments
      }));
    } else {
      try {
        const jsonMatch = textResponse.match(/```json\\n(.*)\\n```/s);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1]);
            if (Array.isArray(parsed.calls)) {
                functionCalls = parsed.calls;
            }
        } else {
            const parsed = JSON.parse(textResponse);
            if (Array.isArray(parsed.calls)) {
                functionCalls = parsed.calls;
            }
        }
      } catch (e) {
          // ignore
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

  const payload = {
    model: OLLAMA_MODEL || "gemma4:e2b",
    messages: [{ role: "user", content: promptText }],
    stream: false
  };

  const response = await fetch(`${getOllamaUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  const text = data.message?.content || "";
  if (toolId === 'summary') return text;
  
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse tool JSON", e);
    return null;
  }
};

export const transcribeAudioOllama = async (base64Audio: string): Promise<string> => {
  console.warn("Audio transcription via Ollama is not fully supported with gemma4:e2b yet.");
  return "Fitur voice command belum tersedia di mode lokal penuh.";
};
