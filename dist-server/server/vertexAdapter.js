import { GoogleAuth } from 'google-auth-library';
import { tools, buildSystemInstruction, validateFunctionCalls, extractThinking, getCapability } from './aiTools.js';
import { CONFIG } from '../constants';
import { createLogger } from '../utils/logger';
const logger = createLogger('vertex-adapter');
let authClient = null;
const getAuthClient = () => {
    if (!authClient) {
        let credentials = undefined;
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
            try {
                credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
            }
            catch (e) {
                logger.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON', e);
            }
        }
        else if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
            try {
                credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
            }
            catch (e) {
                logger.error('Failed to parse GCP_SERVICE_ACCOUNT_KEY', e);
            }
        }
        authClient = new GoogleAuth({
            ...(credentials ? { credentials } : {}),
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
    }
    return authClient;
};
async function callVertexRestApi(projectId, location, modelName, payload) {
    const auth = getAuthClient();
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;
    // Use global or specific location host
    const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
    const url = `https://${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:generateContent`;
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
        const error = new Error(errorMsg);
        error.status = response.status;
        error.code = data.error?.code;
        throw error;
    }
    return data;
}
export const generateAgentActionsVertex = async (prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history = [], pageContext, domElements = {}, intent, forceTools, lessonContext, modelOverride) => {
    const cleanCanvasBase64 = canvasImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const cleanInputImage = highResInputImage?.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID || CONFIG.ai.vertex.projectId || 'gemma4good-494311';
    const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || CONFIG.ai.vertex.location || 'global';
    const selectedModel = modelOverride || CONFIG.ai.vertex.model;
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
            temperature: CONFIG.ai.vertex.generation.temperature,
            maxOutputTokens: CONFIG.ai.vertex.generation.maxOutputTokens,
        },
        tools: [{ functionDeclarations: tools }],
        toolConfig: {
            functionCallingConfig: {
                mode: 'AUTO'
            }
        }
    };
    let data = await callVertexRestApi(projectId, location, selectedModel, payload);
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    let functionCalls = [];
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
export const generateToolContentVertex = async (toolId, prompt, modelOverride) => {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID || CONFIG.ai.vertex.projectId || 'gemma4good-494311';
    const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || CONFIG.ai.vertex.location || 'global';
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
    }
    else if (toolId === 'quiz') {
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
    }
    else if (toolId === 'website') {
        promptText = `Generate a JSON object for a single-page interactive web app about: "${prompt}".
    Format: { "html": "<div ...>...</div>", "title": "string" }
    Use Tailwind CSS classes. Make it beautiful and functional. Include inline script if needed.
    RETURN ONLY RAW VALID JSON without markdown formatting.`;
    }
    else if (toolId === 'summary') {
        promptText = `Summarize the following text clearly and concisely, suitable for presentation notes.
    Format your response in Markdown. Text: "${prompt}"`;
    }
    const payload = {
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: { temperature: CONFIG.ai.vertex.generation.temperature }
    };
    let data;
    try {
        data = await callVertexRestApi(projectId, location, modelName, payload);
    }
    catch (error) {
        if (error.status === 404 && modelName !== 'gemini-2.5-flash') {
            logger.warn(`Model ${modelName} returned 404 in tool-content. Falling back to gemini-2.5-flash.`);
            data = await callVertexRestApi(projectId, location, 'gemini-2.5-flash', payload);
        }
        else {
            throw error;
        }
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (toolId === 'summary')
        return text;
    try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    }
    catch {
        logger.error('Failed to parse tool content JSON', { text });
        return null;
    }
};
export const transcribeAudioVertex = async (audioBase64, mimeType = 'audio/webm', modelOverride) => {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID || CONFIG.ai.vertex.projectId || 'gemma4good-494311';
    const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || CONFIG.ai.vertex.location || 'global';
    const modelName = modelOverride || CONFIG.ai.vertex.model;
    const cleanAudio = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
    const payload = {
        contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType, data: cleanAudio } },
                    { text: "Transkripsikan rekaman suara ini secara akurat ke teks bahasa Indonesia." }
                ]
            }],
        generationConfig: { temperature: CONFIG.ai.gemini.transcription.temperature }
    };
    try {
        const data = await callVertexRestApi(projectId, location, modelName, payload);
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    catch (error) {
        if (error.status === 404 && modelName !== 'gemini-2.5-flash') {
            logger.warn(`Model ${modelName} returned 404 in transcription. Falling back to gemini-2.5-flash.`);
            const fallbackData = await callVertexRestApi(projectId, location, 'gemini-2.5-flash', payload);
            return fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
        logger.error('Vertex AI Audio Transcription failed', error);
        throw error;
    }
};
