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

    const { base64Audio, selectedVertexModel } = body;
    if (!base64Audio) {
      return res.status(400).json({ error: 'Data audio base64 diperlukan.' });
    }

    const rawModel = selectedVertexModel || process.env.VERTEX_MODEL || 'gemini-3.8-flash';
    const modelName = (rawModel === 'gemini-3.7-flash' ? 'gemini-3.8-flash' : rawModel).trim();

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
    let audioMimeType = 'audio/webm';
    const mimeMatch = base64Audio.match(/^data:(audio\/[a-zA-Z0-9+.-]+);base64,/);
    if (mimeMatch) {
      audioMimeType = mimeMatch[1];
    }
    const cleanAudio = base64Audio.replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, "").trim();

    const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
    const url = `https://${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:generateContent`;

    const vertexRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: audioMimeType, data: cleanAudio } },
            { text: "Transkripsikan rekaman suara audio ini secara akurat ke dalam teks bahasa Indonesia. Tangkap istilah pembelajaran, instruksi papan tulis, rumus, atau pertanyaan secara jelas dan tepat. Kembalikan HANYA teks transkripsi murni tanpa tanda petik pembuka/penutup atau catatan tambahan." }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
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

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/^["']|["']$/g, '').trim();
    return res.status(200).json({ text });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || String(err),
      stack: err.stack,
      code: 'server_error',
      retryable: true
    });
  }
}
