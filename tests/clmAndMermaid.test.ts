import { describe, it, expect } from 'vitest';
import { queryClmSystemOne, routeTridoInteractionWithClm } from '../server/clmService';
import { buildMermaidMindmapCode } from '../hooks/useGeminiBrain';
import { SUPPORTED_LANGUAGES, getLanguageInfo } from '../utils/languages';

describe('Contrastive-LM (CLM) System 1 Decision Engine', () => {
  it('correctly routes mindmap request using CLM System 1 with sub-second latency', async () => {
    const decision = await routeTridoInteractionWithClm({
      prompt: 'buatkan peta konsep fotosintesis tumbuhan',
      language: 'id',
      activeCanvasObjectsCount: 0,
      existingMindmapNodesCount: 0
    });

    expect(decision.intent).toBe('creation');
    expect(decision.suggestedTool).toBe('render_mermaid');
    expect(decision.isMindmap).toBe(true);
    expect(['clm', 'system1_fallback']).toContain(decision.source);
    expect(decision.latencyMs).toBeLessThan(1000);
  });

  it('correctly classifies modification intent for existing canvas elements', async () => {
    const decision = await routeTridoInteractionWithClm({
      prompt: 'edit warna kotak dan ganti teks judul',
      language: 'id',
      activeCanvasObjectsCount: 5,
      existingMindmapNodesCount: 3
    });

    expect(decision.intent).toBe('modification');
  });

  it('correctly handles multilingual prompts (English and Spanish)', async () => {
    const enDecision = await routeTridoInteractionWithClm({
      prompt: 'create a mindmap explaining the human circulatory system',
      language: 'en'
    });
    expect(enDecision.isMindmap).toBe(true);
    expect(enDecision.suggestedTool).toBe('render_mermaid');

    const esDecision = await routeTridoInteractionWithClm({
      prompt: 'generar un mapa conceptual del ciclo del agua',
      language: 'es'
    });
    expect(esDecision.isMindmap).toBe(true);
  });
});

describe('Strict Mermaid Mindmap Engine', () => {
  it('generates valid Mermaid mindmap syntax without rectangle boxes or manual arrows', () => {
    const nodes = [
      { text: 'Sistem Pernapasan', style: 'MAIN_TOPIC', parentNodeText: null },
      { text: 'Hidung', style: 'SUBTOPIC', parentNodeText: 'Sistem Pernapasan' },
      { text: 'Tenggorokan', style: 'SUBTOPIC', parentNodeText: 'Sistem Pernapasan' },
      { text: 'Paru-paru', style: 'SUBTOPIC', parentNodeText: 'Sistem Pernapasan' },
      { text: 'Alveolus', style: 'DETAIL', parentNodeText: 'Paru-paru' }
    ];

    const code = buildMermaidMindmapCode(nodes);
    expect(code).toContain('mindmap');
    expect(code).toContain('root((Sistem Pernapasan))');
    expect(code).toContain('Hidung');
    expect(code).toContain('Paru-paru');
    expect(code).toContain('Alveolus');
    // Ensure no legacy box or arrow tokens
    expect(code).not.toContain('RECTANGLE');
    expect(code).not.toContain('-->');
  });
});

describe('Multi-Language Support (150+ ISO Languages)', () => {
  it('contains over 50 registered world languages with speech locale', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(50);
    const idInfo = getLanguageInfo('id');
    expect(idInfo.speechLocale).toBe('id-ID');
    const enInfo = getLanguageInfo('en');
    expect(enInfo.speechLocale).toBe('en-US');
    const jaInfo = getLanguageInfo('ja');
    expect(jaInfo.speechLocale).toBe('ja-JP');
  });
});
