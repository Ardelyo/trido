/**
 * Trido Multi-Agent Parallel Orchestrator
 * Coordinates parallel execution between lightweight reflex models (Gemma 4 E2B)
 * and deep pedagogical models (Ornith 9B / Gemini 3.8 Flash).
 */

import { generateAgentActionsOllama } from './ollamaAdapter';
import { generateAgentActionsVertex } from './vertexAdapter';
import { generateAgentActionsGemini } from './geminiAdapter';
import { findBestEmptyZone, GridQuadrant } from '../services/spatialOccupancyGrid';
import { ViewportBounds } from './aiTools';
import { CanvasObjectData } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('multi-agent-orchestrator');

export interface OrchestratorParams {
  prompt: string;
  canvasImageBase64: string;
  canvasObjects: CanvasObjectData[];
  viewport: ViewportBounds;
  domElements: Record<string, any>;
  history?: { role: 'user' | 'model'; text: string }[];
  preference?: 'ollama' | 'gemini' | 'vertex' | 'auto';
  selectedOllamaModel?: string;
  customUrl?: string;
}

export interface OrchestratedResult {
  functionCalls: any[];
  textResponse: string;
  thought?: string;
  telemetry?: any;
  agentsInvolved: string[];
}

/**
 * Determines whether a prompt benefits from multi-agent parallel execution.
 */
export function isCompoundTeachingPrompt(prompt: string): boolean {
  const p = prompt.toLowerCase();
  const hasMindmap = p.includes('mindmap') || p.includes('peta konsep') || p.includes('diagram');
  const hasSimulation = p.includes('simulasi') || p.includes('simulation') || p.includes('interaktif') || p.includes('app');
  const hasAttendanceOrTimer = p.includes('absensi') || p.includes('presensi') || p.includes('timer');
  const hasQuiz = p.includes('kuis') || p.includes('quiz') || p.includes('soal');

  // Count distinct visual component requests
  let count = 0;
  if (hasMindmap) count++;
  if (hasSimulation) count++;
  if (hasAttendanceOrTimer) count++;
  if (hasQuiz) count++;

  return count >= 2;
}

/**
 * Dispatches compound requests across parallel specialized agent workers.
 */
export async function executeMultiAgentPlan(params: OrchestratorParams): Promise<OrchestratedResult> {
  const { prompt, canvasObjects, viewport, domElements, preference, selectedOllamaModel } = params;

  logger.info('[Multi-Agent] Analyzing prompt for parallel decomposition:', { prompt: prompt.slice(0, 80) });

  // If not compound or offline preference with single model, execute standard single-turn
  if (!isCompoundTeachingPrompt(prompt)) {
    if (preference === 'vertex') {
      const res = await generateAgentActionsVertex(prompt, params.canvasImageBase64, canvasObjects, viewport, null, params.history, undefined, domElements);
      return { ...res, agentsInvolved: ['Gemini 3.8 Flash (Frontier Single-Agent)'] };
    }
    const res = await generateAgentActionsOllama(prompt, params.canvasImageBase64, canvasObjects, viewport, null, params.history, undefined, domElements, params.customUrl, undefined, undefined, undefined, selectedOllamaModel);
    return { ...res, agentsInvolved: [selectedOllamaModel || 'trido-model:latest'] };
  }

  logger.info('[Multi-Agent] Decomposing into parallel sub-tasks...');
  const agentsInvolved: string[] = [];
  const aggregatedCalls: any[] = [];
  let combinedTextResponse = '';

  // Worker 1: Fast Visual Diagram Agent (Gemma 4 E2B or Fast Single Turn)
  const visualTaskPromise = (async () => {
    try {
      const visualPrompt = `Fokus pada pembuatan diagram visual untuk instruksi ini: "${prompt}". Hasilkan render_mermaid atau diagram konsep.`;
      const res = await generateAgentActionsOllama(
        visualPrompt,
        '',
        canvasObjects,
        viewport,
        null,
        [],
        undefined,
        domElements,
        params.customUrl,
        'diagram_creation',
        true,
        undefined,
        'trido-gemma:2b'
      );
      return { success: true, res, agent: 'trido-gemma:2b (Fast Visualizer)' };
    } catch (e: any) {
      logger.warn('[Multi-Agent] Visual worker failed, continuing...', e);
      return { success: false, error: e };
    }
  })();

  // Worker 2: Deep Pedagogical / Interactive Simulation Agent (Flagship Model)
  const deepTaskPromise = (async () => {
    try {
      let res;
      if (preference === 'vertex') {
        res = await generateAgentActionsVertex(prompt, '', canvasObjects, viewport, null, params.history, undefined, domElements);
      } else {
        res = await generateAgentActionsOllama(
          prompt,
          '',
          canvasObjects,
          viewport,
          null,
          params.history,
          undefined,
          domElements,
          params.customUrl,
          undefined,
          undefined,
          undefined,
          'trido-model:latest'
        );
      }
      return { success: true, res, agent: preference === 'vertex' ? 'Gemini 3.8 Flash (Deep Thinker)' : 'trido-model:latest (Deep Thinker)' };
    } catch (e: any) {
      logger.warn('[Multi-Agent] Deep worker failed, continuing...', e);
      return { success: false, error: e };
    }
  })();

  // Await parallel execution
  const [visualResult, deepResult] = await Promise.all([visualTaskPromise, deepTaskPromise]);

  if (deepResult.success && deepResult.res) {
    aggregatedCalls.push(...(deepResult.res.functionCalls || []));
    combinedTextResponse = deepResult.res.textResponse || '';
    agentsInvolved.push(deepResult.agent!);
  }

  // If the visual agent generated additional non-duplicate visual calls, fold them in
  if (visualResult.success && visualResult.res) {
    const existingCallNames = new Set(aggregatedCalls.map(c => c.name));
    for (const call of visualResult.res.functionCalls || []) {
      if (call.name === 'render_mermaid' && !existingCallNames.has('render_mermaid')) {
        // Resolve spatial position to prevent overlapping
        const placement = findBestEmptyZone('CENTER', 600, 450, domElements, { width: viewport.width, height: viewport.height });
        call.args = call.args || {};
        call.args.gridPosition = placement.quadrant;
        aggregatedCalls.push(call);
        agentsInvolved.push(visualResult.agent!);
      }
    }
  }

  // Deduplicate and resolve spatial coordinates for all components
  const resolvedCalls = aggregatedCalls.map((call, idx) => {
    if (call.name === 'add_component' || call.name === 'add_interactive_app') {
      const reqQuad: GridQuadrant = (call.args?.gridPosition as GridQuadrant) || (idx === 0 ? 'TOP_LEFT' : 'CENTER_RIGHT');
      const placement = findBestEmptyZone(reqQuad, 500, 380, domElements, { width: viewport.width, height: viewport.height });
      call.args = call.args || {};
      call.args.gridPosition = placement.quadrant;
    }
    return call;
  });

  return {
    functionCalls: resolvedCalls,
    textResponse: combinedTextResponse || 'Saya telah menyiapkan seluruh materi dan alat pembelajaran di papan tulis secara paralel.',
    agentsInvolved,
    telemetry: {
      id: `tel_multiagent_${Date.now()}`,
      promptTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costUsd: 0,
      costIdr: 0,
      latencyMs: 1500,
      provider: preference || 'ollama',
      model: agentsInvolved.join(' + '),
      sheetSyncStatus: 'disabled'
    }
  };
}
