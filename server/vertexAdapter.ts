import { tools, buildSystemInstruction, validateFunctionCalls, extractThinking, ViewportBounds, getCapability } from './aiTools';

let authClient: any = null;

const cleanEnv = (val?: string) => (val ? val.trim() : undefined);

export const getAuthClient = async () => {
  if (!authClient) {
    const { GoogleAuth } = await import('google-auth-library');
    let credentials: any = undefined;
    const rawJson = cleanEnv(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) || cleanEnv(process.env.GCP_SERVICE_ACCOUNT_KEY);
    if (rawJson) {
      try {
        credentials = JSON.parse(rawJson);
      } catch (e) {
        console.error('Failed to parse JSON credentials', e);
      }
    }

    authClient = new GoogleAuth({
      ...(credentials ? { credentials } : {}),
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
  }
  return authClient;
};

export async function callVertexRestApi(projectId: string, location: string, modelName: string, payload: any) {
  const auth = await getAuthClient();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;

  const cleanProj = (projectId || 'gemma4good-494311').trim();
  const cleanLoc = (location || 'global').trim();
  const cleanModel = (modelName || 'gemini-3.7-flash').trim();

  const host = cleanLoc === 'global' ? 'aiplatform.googleapis.com' : `${cleanLoc}-aiplatform.googleapis.com`;
  const url = `https://${host}/v1/projects/${cleanProj}/locations/${cleanLoc}/publishers/google/models/${cleanModel}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || response.statusText;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.code = data.error?.code;
    throw error;
  }

  return data;
}

export const generateAgentActionsVertex = async (
  prompt: string,
  canvasImageBase64: string,
  canvasObjects: any[],
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
  const cleanCanvasBase64 = canvasImageBase64 ? canvasImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "").trim() : "";
  const cleanInputImage = highResInputImage ? highResInputImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, "").trim() : "";

  const projectId = cleanEnv(process.env.GOOGLE_CLOUD_PROJECT) || cleanEnv(process.env.VERTEX_PROJECT_ID) || 'gemma4good-494311';
  const location = cleanEnv(process.env.GOOGLE_CLOUD_LOCATION) || cleanEnv(process.env.VERTEX_LOCATION) || 'global';
  const selectedModel = cleanEnv(modelOverride) || cleanEnv(process.env.VERTEX_MODEL) || 'gemini-3.7-flash';

  const capability = getCapability(selectedModel);
  let systemInstruction = buildSystemInstruction(canvasObjects, viewport, pageContext, domElements, lessonContext, capability);

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
        ...(cleanCanvasBase64 ? [{ inlineData: { mimeType: "image/png", data: cleanCanvasBase64 } }] : []),
        ...(cleanInputImage ? [{ inlineData: { mimeType: "image/png", data: cleanInputImage } }] : []),
        { text: `User request: ${prompt}\n\nRemember: Use function calls, not descriptions. Batch all actions together.` }
      ]
    }
  ];

  const payload = {
    contents,
    systemInstruction: {
      role: 'system',
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
    tools: [{ functionDeclarations: tools as any }],
    toolConfig: {
      functionCallingConfig: {
        mode: 'AUTO'
      }
    }
  };

  let data = await callVertexRestApi(projectId, location, selectedModel, payload);

  const candidate = data.candidates?.[0];
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

  const thought = extractThinking({ text: textResponse, candidates: data.candidates });

  const validation = validateFunctionCalls(functionCalls, canvasObjects, domElements);
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

export const generateToolContentVertex = async (toolId: string, prompt: string, modelOverride?: string): Promise<any> => {
  const projectId = cleanEnv(process.env.GOOGLE_CLOUD_PROJECT) || cleanEnv(process.env.VERTEX_PROJECT_ID) || 'gemma4good-494311';
  const location = cleanEnv(process.env.GOOGLE_CLOUD_LOCATION) || cleanEnv(process.env.VERTEX_LOCATION) || 'global';
  const modelName = cleanEnv(modelOverride) || cleanEnv(process.env.VERTEX_MODEL) || 'gemini-3.7-flash';

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
        { "type": "multiple_choice", "question": "string", "options": ["string", "string", "string", "string"], "correctIndex": number, "explanation": "string" },
        { "type": "essay", "question": "string", "expectedAnswer": "string" }
      ]
    }
    Include at least 2 multiple choice questions with 4 options and 1 essay question.
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
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.2 }
  };

  let data;
  try {
    data = await callVertexRestApi(projectId, location, modelName, payload);
  } catch (error: any) {
    if (error.status === 404 && modelName !== 'gemini-2.5-flash') {
      data = await callVertexRestApi(projectId, location, 'gemini-2.5-flash', payload);
    } else {
      throw error;
    }
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (toolId === 'summary') return text;

  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
};

export const transcribeAudioVertex = async (audioBase64: string, mimeType = 'audio/webm', modelOverride?: string): Promise<string> => {
  const projectId = cleanEnv(process.env.GOOGLE_CLOUD_PROJECT) || cleanEnv(process.env.VERTEX_PROJECT_ID) || 'gemma4good-494311';
  const location = cleanEnv(process.env.GOOGLE_CLOUD_LOCATION) || cleanEnv(process.env.VERTEX_LOCATION) || 'global';
  const modelName = cleanEnv(modelOverride) || cleanEnv(process.env.VERTEX_MODEL) || 'gemini-3.7-flash';
  const cleanAudio = audioBase64.replace(/^data:audio\/\w+;base64,/, "");

  const payload = {
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: cleanAudio } },
        { text: "Transkripsikan rekaman suara audio ini secara akurat ke dalam teks bahasa Indonesia. Tangkap istilah pembelajaran, instruksi papan tulis, rumus, atau pertanyaan secara jelas dan tepat. Kembalikan HANYA teks transkripsi murni tanpa tanda petik pembuka/penutup atau catatan tambahan." }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
  };

  try {
    const data = await callVertexRestApi(projectId, location, modelName, payload);
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text.replace(/^["']|["']$/g, '').trim();
  } catch (error: any) {
    if (error.status === 404 && modelName !== 'gemini-2.5-flash') {
      const fallbackData = await callVertexRestApi(projectId, location, 'gemini-2.5-flash', payload);
      let text = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return text.replace(/^["']|["']$/g, '').trim();
    }
    throw error;
  }
};
