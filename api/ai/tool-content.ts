export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    body = body || {};

    const { toolId, prompt, selectedVertexModel } = body;
    const modelName = (selectedVertexModel || process.env.VERTEX_MODEL || 'gemini-3.8-flash').trim();

    const { GoogleAuth } = await import('google-auth-library');
    const adcRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const credentials = adcRaw ? JSON.parse(adcRaw.trim()) : undefined;

    const auth = new GoogleAuth({
      ...(credentials ? { credentials } : {}),
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;

    const projectId = (process.env.GOOGLE_CLOUD_PROJECT || 'gemma4good-494311').trim();
    const location = (process.env.GOOGLE_CLOUD_LOCATION || 'global').trim();

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

    const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
    const url = `https://${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:generateContent`;

    const vertexRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.2,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      })
    });

    const data = await vertexRes.json();
    if (!vertexRes.ok) {
      throw new Error(data.error?.message || vertexRes.statusText);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (toolId === 'summary') return res.status(200).json({ result: text });

    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonStr);
    } catch {
      parsedResult = null;
    }

    return res.status(200).json({ result: parsedResult });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || String(err),
      stack: err.stack,
      code: 'server_error',
      retryable: true
    });
  }
}
