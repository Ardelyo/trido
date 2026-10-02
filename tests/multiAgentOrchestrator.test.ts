import { describe, it, expect } from 'vitest';
import { isCompoundTeachingPrompt } from '../server/multiAgentOrchestrator';

describe('Trido Multi-Agent Parallel Orchestrator', () => {
  it('correctly identifies compound prompts requiring parallel agent decomposition', () => {
    const compoundPrompt1 = 'Siapkan mindmap ekosistem dan simulasi interaktif gerak parabola';
    const compoundPrompt2 = 'Mulai kelas: siapkan absensi 5 murid, timer 20 menit, dan buatkan kuis 3 soal';
    const compoundPrompt3 = 'Buatkan diagram fotosintesis dan app interaktif hukum gas ideal';

    expect(isCompoundTeachingPrompt(compoundPrompt1)).toBe(true);
    expect(isCompoundTeachingPrompt(compoundPrompt2)).toBe(true);
    expect(isCompoundTeachingPrompt(compoundPrompt3)).toBe(true);
  });

  it('correctly classifies simple focused prompts for single-agent execution without overhead', () => {
    const simplePrompt1 = 'Buatkan mindmap tentang sistem pencernaan';
    const simplePrompt2 = 'Apa yang dimaksud dengan hukum kekekalan energi?';
    const simplePrompt3 = 'Nyalakan timer 10 menit';

    expect(isCompoundTeachingPrompt(simplePrompt1)).toBe(false);
    expect(isCompoundTeachingPrompt(simplePrompt2)).toBe(false);
    expect(isCompoundTeachingPrompt(simplePrompt3)).toBe(false);
  });
});
