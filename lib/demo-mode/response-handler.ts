import { findScriptedMatch, ScriptedPrompt } from './scripted-prompts';
import { isPreviewSession } from './session-manager';
import { generateAgentActions } from '../../services/aiService';

export type ProgressState = 'transcribing' | 'thinking' | 'streaming';

export async function* handleUserPrompt(
  userInput: string,
  onProgress?: (state: ProgressState) => void
): AsyncGenerator<string> {
  // Step 1: Transcribing simulation (kalau dari voice)
  onProgress?.('transcribing');
  await sleep(800 + Math.random() * 700); // 0.8-1.5s
  
  // Step 2: Check preview session
  const isPreview = isPreviewSession();
  
  if (isPreview) {
    const match = findScriptedMatch(userInput);
    
    if (match) {
      // Use scripted response with simulated latency
      yield* simulateScriptedResponse(match, onProgress);
      return;
    }
    // Fallback: kalau tidak match, tetap pakai real Gemma (untuk safety)
  }
  
  // Real Gemma 4 inference - We'll handle this in useGeminiBrain usually,
  // but for the sake of the interface requested:
  onProgress?.('thinking');
  // Since realGemmaInference is a server call that returns full object,
  // we can't easily "stream" it token-by-token unless the backend supports it.
  // For now, we yield a placeholder or the actual response if we want to mirror the requested API.
  const response = await generateAgentActions(userInput, '', [], { width: 1024, height: 768 });
  yield response.textResponse || '';
}

async function* simulateScriptedResponse(
  prompt: ScriptedPrompt,
  onProgress?: (state: ProgressState) => void
): AsyncGenerator<string> {
  // "Thinking" phase — initial latency
  onProgress?.('thinking');
  const thinkTime = prompt.latency.min + 
    Math.random() * (prompt.latency.max - prompt.latency.min);
  await sleep(thinkTime);
  
  // "Streaming" phase — token-by-token
  onProgress?.('streaming');
  const content = typeof prompt.response.content === 'string' 
    ? prompt.response.content 
    : JSON.stringify(prompt.response.content, null, 2);
  
  const tokens = tokenize(content);
  const tokenDelay = 1000 / prompt.streamSpeed;
  
  for (const token of tokens) {
    await sleep(tokenDelay + (Math.random() * 30 - 15)); // ±15ms variance
    yield token;
  }
}

function tokenize(text: string): string[] {
  // Split by word + preserve whitespace (mirror real LLM tokenization)
  return text.match(/\S+\s*|\s+/g) || [];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
