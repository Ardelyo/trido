export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    body = body || {};

    const vertexProjectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID || 'gemma4good-494311';
    const vertexLocation = process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || 'global';
    const vertexModel = body.selectedVertexModel || process.env.VERTEX_MODEL || 'gemini-3.8-flash';
    const geminiModel = body.selectedGeminiModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    const hasVertex = Boolean(vertexProjectId);
    const hasGemini = Boolean(process.env.GEMINI_API_KEY || body.geminiApiKey);

    const mode = hasVertex ? 'vertex' : hasGemini ? 'gemini' : 'unavailable';
    const model = mode === 'vertex' ? vertexModel : geminiModel;

    return res.status(200).json({
      mode,
      model,
      online: mode !== 'unavailable',
      reason: 'ok',
      vertexStatus: {
        online: hasVertex,
        reason: hasVertex ? 'configured' : 'missing_project'
      },
      geminiStatus: {
        online: hasGemini,
        reason: hasGemini ? 'ok' : 'missing_key'
      },
      ollamaStatus: {
        online: false,
        hasModel: false,
        models: []
      },
      envGeminiModel: geminiModel,
      gcpProject: vertexProjectId,
      gcpLocation: vertexLocation
    });
  } catch (error: any) {
    return res.status(500).json({
      mode: 'unavailable',
      online: false,
      error: error.message || String(error),
      stack: error.stack
    });
  }
}
