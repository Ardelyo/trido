import { createLogger } from '../utils/logger';

const logger = createLogger('clm-service');

export interface ClmQuestion {
  type?: 'choice' | 'noul' | 'score';
  instructions: string;
  criteria: Record<string, string> | string[];
}

export interface ClmChoiceAnswer {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface ClmNoulAnswer {
  noul: number;
}

export interface ClmScoreAnswer {
  score: number;
  confidence: number;
  legend: Record<number, string>;
  probabilities: Record<string, number>;
}

export type ClmAnswer = ClmChoiceAnswer | ClmNoulAnswer | ClmScoreAnswer;

export interface ClmSystemOneResponse {
  answers: Record<string, ClmAnswer>;
  source: 'clm' | 'system1_fallback';
  latencyMs: number;
}

export interface ClmDecisionContext {
  prompt: string;
  language?: string;
  activeCanvasObjectsCount?: number;
  existingMindmapNodesCount?: number;
  hasMermaidOnCanvas?: boolean;
}

/**
 * Fast semantic token/keyword similarity scoring for zero-overhead fallback
 * when CLM daemon (:8700) is in cold-start or offline.
 */
function computeSemanticHeuristicChoice(
  prompt: string,
  criteria: Record<string, string>
): ClmChoiceAnswer {
  const pLower = prompt.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [key, description] of Object.entries(criteria)) {
    let score = 0.1;
    const descWords = description.toLowerCase().split(/[\s,.:;()]+/);
    
    // Keyword and semantic affinity
    for (const word of descWords) {
      if (word.length > 2 && pLower.includes(word)) {
        score += 1.0;
      }
    }

    // Domain specific boost
    if (key === 'creation' && /buat|bikin|gambar|create|draw|add|generate|make|mindmap|diagram|quiz|kuis/i.test(pLower)) {
      score += 2.5;
    } else if (key === 'modification' && /ubah|ganti|edit|update|expand|pindah|geser|move|hapus|delete|tambah cabang/i.test(pLower)) {
      score += 2.5;
    } else if (key === 'question' && /^(apa|mengapa|kenapa|bagaimana|siapa|kapan|what|why|how|who|explain|jelaskan)/i.test(pLower.trim())) {
      score += 2.5;
    } else if (key === 'navigation' && /zoom|pan|geser kanvas|ke halaman|page/i.test(pLower)) {
      score += 2.5;
    } else if (key === 'render_mermaid' && /mindmap|peta konsep|flowchart|alur|diagram|siklus|hirarki|struktur/i.test(pLower)) {
      score += 3.0;
    } else if (key === 'quiz' && /quiz|kuis|soal|pilihan ganda|latihan|evaluasi/i.test(pLower)) {
      score += 3.0;
    }

    scores[key] = score;
  }

  // Softmax normalization
  const expScores = Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, Math.exp(v)])
  );
  const sumExp = Object.values(expScores).reduce((a, b) => a + b, 0) || 1;
  const probs = Object.fromEntries(
    Object.entries(expScores).map(([k, v]) => [k, Math.round((v / sumExp) * 1000) / 1000])
  );

  let bestChoice = Object.keys(probs)[0];
  let maxP = -1;
  for (const [k, p] of Object.entries(probs)) {
    if (p > maxP) {
      maxP = p;
      bestChoice = k;
    }
  }

  return {
    choice: bestChoice,
    confidence: maxP,
    probabilities: probs
  };
}

/**
 * Executes a System 1 Decision query against Contrastive-LM (CLM)
 * Endpoint: POST /v1/systemone
 * Falls back to fast local contrastive heuristics if CLM daemon is not reachable.
 */
export async function queryClmSystemOne(
  state: string,
  questions: Record<string, ClmQuestion>,
  endpoint: string = 'http://127.0.0.1:8700',
  timeoutMs: number = 800
): Promise<ClmSystemOneResponse> {
  const start = Date.now();

  try {
    const cleanUrl = endpoint.replace(/\/+$/, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${cleanUrl}/v1/systemone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state,
        questions,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const latencyMs = Date.now() - start;
      logger.info(`[CLM System 1] Resolved via ${cleanUrl} in ${latencyMs}ms`);
      return {
        answers: data.answers || {},
        source: 'clm',
        latencyMs,
      };
    }
  } catch (err: any) {
    // CLM daemon not reachable or timed out — seamlessly use deterministic heuristic engine
  }

  // Deterministic local Fallback
  const latencyMs = Date.now() - start;
  const answers: Record<string, ClmAnswer> = {};

  for (const [qid, q] of Object.entries(questions)) {
    if (Array.isArray(q.criteria)) {
      // Score type
      answers[qid] = {
        score: 0,
        confidence: 0.5,
        legend: Object.fromEntries(q.criteria.map((c, i) => [i, c])),
        probabilities: { '0': 0.5, '1': 0.5 }
      };
    } else if (q.type === 'noul' || ('true' in q.criteria && 'false' in q.criteria)) {
      const isMindmapMatch = /mindmap|peta konsep|concept map|hierarchy/i.test(state);
      answers[qid] = {
        noul: isMindmapMatch ? 0.95 : 0.05
      };
    } else {
      answers[qid] = computeSemanticHeuristicChoice(state, q.criteria);
    }
  }

  return {
    answers,
    source: 'system1_fallback',
    latencyMs,
  };
}

/**
 * Standard pre-flight System 1 router for Trido user requests
 */
export async function routeTridoInteractionWithClm(
  context: ClmDecisionContext,
  endpoint?: string
): Promise<{
  intent: 'creation' | 'modification' | 'question' | 'navigation';
  suggestedTool: 'render_mermaid' | 'quiz' | 'notes' | 'whiteboard';
  isMindmap: boolean;
  source: 'clm' | 'system1_fallback';
  latencyMs: number;
}> {
  const state = `User Prompt: ${context.prompt}\nActive Language: ${context.language || 'en'}\nActive Canvas Elements: ${context.activeCanvasObjectsCount || 0}\nExisting Mindmap Nodes: ${context.existingMindmapNodesCount || 0}\nHas Mermaid Diagram: ${context.hasMermaidOnCanvas ? 'yes' : 'no'}`;

  const questions: Record<string, ClmQuestion> = {
    intent: {
      type: 'choice',
      instructions: 'Determine the primary action intent for this digital classroom smartboard request.',
      criteria: {
        creation: 'Create new educational content, mindmap, flowchart, quiz, notes, or canvas drawing',
        modification: 'Edit, update, expand, reposition, or delete existing canvas items or mindmap',
        question: 'Factual question, explanation, or teaching advice without direct canvas drawings',
        navigation: 'Zoom, pan, navigate between board pages'
      }
    },
    suggested_tool: {
      type: 'choice',
      instructions: 'Which specialized educational tool should handle this request?',
      criteria: {
        render_mermaid: 'Mindmaps, concept trees, flowcharts, timelines, architecture, process diagrams',
        quiz: 'Interactive quizzes, assessments, multiple choice, true false, practice questions',
        notes: 'Lesson notes, summaries, reading documents, explanations',
        whiteboard: 'Freehand drawing, standard shapes, math formulas, canvas annotations'
      }
    },
    is_mindmap: {
      type: 'noul',
      instructions: 'Does this request ask for a mindmap or concept tree?',
      criteria: {
        true: 'The user explicitly or implicitly wants a mindmap, concept map, or hierarchical topic breakdown',
        false: 'Other format or not a mindmap'
      }
    }
  };

  const res = await queryClmSystemOne(state, questions, endpoint);
  const intentAnswer = res.answers.intent as ClmChoiceAnswer;
  const toolAnswer = res.answers.suggested_tool as ClmChoiceAnswer;
  const mindmapAnswer = res.answers.is_mindmap as ClmNoulAnswer;

  const intent = (intentAnswer?.choice || 'creation') as 'creation' | 'modification' | 'question' | 'navigation';
  const suggestedTool = (toolAnswer?.choice || 'render_mermaid') as 'render_mermaid' | 'quiz' | 'notes' | 'whiteboard';
  const isMindmap = (mindmapAnswer?.noul ?? 0) > 0.5;

  return {
    intent,
    suggestedTool,
    isMindmap,
    source: res.source,
    latencyMs: res.latencyMs
  };
}
