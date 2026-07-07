import { VertexAI, GenerativeModel } from "@google-cloud/vertexai";
import { CanvasObjectData } from "../types";
import { tools, buildSystemInstruction, validateFunctionCalls, extractThinking, ViewportBounds, getCapability } from "./aiTools";
import { CONFIG } from "../constants";
import { createLogger } from "../utils/logger";

const logger = createLogger('vertex-adapter');

let vertexClient: VertexAI | null = null;

const getVertexClient = () => {
  if (!vertexClient) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || CONFIG.ai.vertex.location;
    
    if (!projectId) {
      logger.error("GOOGLE_CLOUD_PROJECT is not set for Vertex AI");
    }

    vertexClient = new VertexAI({ project: projectId || 'dummy', location });
  }
  return vertexClient;
};

export const generateAgentActionsVertex = async (
  prompt: string,
  canvasImageBase64: string,
  canvasObjects: CanvasObjectData[],
  viewport: ViewportBounds,
  highResInputImage?: string | null,
  history: { role: 'user' | 'model'; text: string }[] = [],
  pageContext?: { current: number; total: number },
  domElements: Record<string, any> = {},
  intent?: string,
  forceTools?: boolean,
  lessonContext?: any,
  modelOverride?: string
) => {
  const cleanCanvasBase64 = canvasImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
  const cleanInputImage = highResInputImage?.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  const selectedModel = modelOverride || CONFIG.ai.vertex.model;
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
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    })),
    {
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/png", data: cleanCanvasBase64 } },
        ...(cleanInputImage ? [{ inlineData: { mimeType: "image/png", data: cleanInputImage } }] : []),
        { text: `User request: ${prompt}\n\nRemember: Use function calls, not descriptions. Batch all actions together.` }
      ]
    }
  ];

  const isCreationRequest = forceTools !== undefined ? forceTools : /buat|create|gambar|draw|add|tambah/i.test(prompt);

  const vertex = getVertexClient();
  const model = vertex.getGenerativeModel({
    model: selectedModel,
    generationConfig: {
      temperature: CONFIG.ai.vertex.generation.temperature,
      maxOutputTokens: CONFIG.ai.vertex.generation.maxOutputTokens,
    },
    systemInstruction: {
      role: 'system',
      parts: [{ text: systemInstruction }]
    },
    tools: [{ functionDeclarations: tools as any }],
    toolConfig: {
      functionCallingConfig: {
        mode: 'AUTO' as any
      }
    }
  });

  const result = await model.generateContent({ contents: contents as any });
  const response = result.response;
  
  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  
  let functionCalls: any[] = [];
  let textResponse = "";
  
  for (const part of parts) {
    if (part.functionCall) {
      functionCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args
      });
    }
    if (part.text) {
      textResponse += part.text;
    }
  }

  const thought = extractThinking({ text: textResponse, candidates: response.candidates });

  const validation = validateFunctionCalls(functionCalls, canvasObjects, domElements);
  if (!validation.isValid) {
    logger.warn('Function call validation issues (Vertex)', { errors: validation.errors });
    functionCalls = validation.fixedCalls;
  }

  return { 
    functionCalls, 
    textResponse, 
    thought,
    validationErrors: validation.errors
  };
};

export const generateToolContentVertex = async (toolId: string, prompt: string, modelOverride?: string): Promise<any> => {
  const modelName = modelOverride || CONFIG.ai.vertex.model;
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
- RETURN ONLY RAW VALID JSON, no markdown, no explanation.`;
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

  const vertex = getVertexClient();
  const model = vertex.getGenerativeModel({
    model: modelName,
    generationConfig: { temperature: CONFIG.ai.vertex.generation.temperature }
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: promptText }] }] as any
  });

  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (toolId === 'summary') return text;
  
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    logger.error("Failed to parse tool JSON from Vertex", e);
    return null;
  }
};

export const transcribeAudioVertex = async (base64Audio: string, modelOverride?: string): Promise<string> => {
  const vertex = getVertexClient();
  const model = vertex.getGenerativeModel({
    model: modelOverride || CONFIG.ai.vertex.model,
    generationConfig: { temperature: 0.1 }
  });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
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
    ] as any,
  });

  return result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
};
