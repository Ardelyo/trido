import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  res.status(200).json({
    status: 'ok',
    environment: 'vercel-serverless',
    project: 'gemma4good-494311',
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString()
  });
}
