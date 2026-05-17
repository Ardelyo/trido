import { VertexAI } from "@google-cloud/vertexai";
import { tools, buildSystemInstruction, validateFunctionCalls, extractThinking } from "./aiTools";
import { CONFIG } from "../constants";
import { createLogger } from "../utils/logger";
const logger = createLogger('vertex-adapter');
let vertexClient = null;
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
export const generateAgentActionsVertex = async (prompt, canvasImageBase64, canvasObjects, viewport, highResInputImage, history = [], pageContext, domElements = {}) => {
    const cleanCanvasBase64 = canvasImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const cleanInputImage = highResInputImage?.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const systemInstruction = buildSystemInstruction(canvasObjects, viewport, pageContext, domElements);
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
    const vertex = getVertexClient();
    const model = vertex.getGenerativeModel({
        model: CONFIG.ai.vertex.model,
        generationConfig: {
            temperature: CONFIG.ai.vertex.generation.temperature,
            maxOutputTokens: CONFIG.ai.vertex.generation.maxOutputTokens,
        },
        systemInstruction: {
            role: 'system',
            parts: [{ text: systemInstruction }]
        },
        tools: [{ functionDeclarations: tools }]
    });
    const result = await model.generateContent({ contents: contents });
    const response = result.response;
    const candidate = response.candidates?.[0];
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
export const generateToolContentVertex = async (toolId, prompt) => {
    const modelName = CONFIG.ai.vertex.model;
    let promptText = "";
    if (toolId === 'mindmap') {
        promptText = `Generate a JSON array of mindmap nodes for the topic: "${prompt}". 
    Each node must have: text (string), style (MAIN_TOPIC, SUBTOPIC, DETAIL), and relativePosition (CENTER for the first one, then RIGHT_OF_LAST, BELOW_LAST, etc.).
    Example: [{"text": "AI", "style": "MAIN_TOPIC", "relativePosition": "CENTER"}, {"text": "Machine Learning", "style": "SUBTOPIC", "relativePosition": "RIGHT_OF_LAST"}]
    RETURN ONLY RAW VALID JSON ARRAY without markdown formatting.`;
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
    const vertex = getVertexClient();
    const model = vertex.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: CONFIG.ai.vertex.generation.temperature }
    });
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: promptText }] }]
    });
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (toolId === 'summary')
        return text;
    try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    }
    catch (e) {
        logger.error("Failed to parse tool JSON from Vertex", e);
        return null;
    }
};
export const transcribeAudioVertex = async (base64Audio) => {
    const vertex = getVertexClient();
    const model = vertex.getGenerativeModel({
        model: CONFIG.ai.vertex.model,
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
        ],
    });
    return result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
};
