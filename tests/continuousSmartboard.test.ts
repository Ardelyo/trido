import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../store';
import { BoardSession, ChatMessage, LessonPlan } from '../types';
import { markdownToMermaidMindmap } from '../components/MermaidTool';
import { evaluateJevSystemOne } from '../hooks/useGeminiBrain';

// Mock DB operations in-memory for Vitest environment
const mockDb = new Map<string, BoardSession>();
vi.mock('../services/db', () => ({
  saveSessionToDb: vi.fn(async (session: BoardSession) => {
    mockDb.set(session.id, session);
  }),
  getSessionFromDb: vi.fn(async (id: string) => {
    return mockDb.get(id);
  }),
  getAllSessionsFromDb: vi.fn(async () => {
    return Array.from(mockDb.values());
  }),
  deleteSessionFromDb: vi.fn(async (id: string) => {
    mockDb.delete(id);
  })
}));

describe('Continuous Smartboard & In-Place Mutation Integration', () => {
  beforeEach(() => {
    useStore.getState().createNewSession();
  });

  it('preserves chat messages and lessonPlan across session saves and loads', async () => {
    const store = useStore.getState();

    // 1. Simulate an active session with chat and lesson plan
    const testMessages: ChatMessage[] = [
      { role: 'user', text: 'Halo Trido, hari ini kita belajar sistem peredaran darah' },
      { role: 'model', text: 'Siap! Saya buatkan peta konsep sistem peredaran darah manusia.' },
      { role: 'user', text: 'Tolong tambahkan detail tentang pembuluh darah vena dan arteri' },
      { role: 'model', text: 'Cabang pembuluh darah sudah saya perluas di peta konsep Mermaid.' }
    ];

    const testLessonPlan: LessonPlan = {
      id: 'lesson_test_1',
      subject: 'IPA Biologi',
      topic: 'Sistem Peredaran Darah',
      gradeLevel: 'Kelas 8',
      phase: 'core',
      plannedSteps: [],
      completedSteps: ['Peta Konsep Dasar', 'Struktur Jantung'],
      createdAt: Date.now()
    };

    useStore.setState({
      messages: testMessages,
      lessonPlan: testLessonPlan
    });

    expect(useStore.getState().messages.length).toBe(4);
    expect(useStore.getState().lessonPlan?.topic).toBe('Sistem Peredaran Darah');

    // 2. Save the session
    await useStore.getState().saveCurrentSession('Kelas Biologi 8A');
    const sessionId = useStore.getState().currentSessionId;
    expect(sessionId).toBeTruthy();

    // 3. Clear session (simulate user closing board or creating new session)
    useStore.getState().createNewSession();
    expect(useStore.getState().messages.length).toBe(1);
    expect(useStore.getState().lessonPlan).toBeNull();

    // 4. Reload the session from IndexedDB
    await useStore.getState().loadSessionData(sessionId!);

    // 5. Verify full conversational context is restored!
    const restored = useStore.getState();
    expect(restored.messages.length).toBe(4);
    expect(restored.messages[2].text).toContain('pembuluh darah vena dan arteri');
    expect(restored.lessonPlan?.topic).toBe('Sistem Peredaran Darah');
    expect(restored.lessonPlan?.subject).toBe('IPA Biologi');
    expect(restored.lessonPlan?.completedSteps).toContain('Struktur Jantung');
  });

  it('correctly maps Indonesian educational synonyms to Mermaid diagram components', () => {
    const doms = {
      'web_diagram_01': {
        componentType: 'MERMAID_DIAGRAM',
        config: {
          title: 'Bagan Alur Fotosintesis',
          code: 'mindmap\n  root((Fotosintesis))\n    Reaksi Terang\n    Siklus Calvin'
        }
      }
    };

    // Test Jev-1 target locking for in-place edit
    const result1 = evaluateJevSystemOne('Ubah peta konsep fotosintesis', { domElements: doms }, null);
    expect(result1.lockIntent).toBe('modification');
    expect(result1.targetObjectId).toBe('web_diagram_01');

    const result2 = evaluateJevSystemOne('Tambah cabang di mindmap biologi', { domElements: doms }, null);
    expect(result2.lockIntent).toBe('modification');
    expect(result2.targetObjectId).toBe('web_diagram_01');

    const result3 = evaluateJevSystemOne('Edit diagram alur bagian reaksi terang', { domElements: doms }, null);
    expect(result3.lockIntent).toBe('modification');
    expect(result3.targetObjectId).toBe('web_diagram_01');
  });

  it('converts markdown documents into Mermaid mindmaps preserving branch depth', () => {
    const markdownOutline = `
# Ekosistem Hutan
## Komponen Biotik
- Produsen: Pohon, Semak
- Konsumen Primer: Herbivora
  - Rusa
  - Kelinci
## Komponen Abiotik
- Tanah dan Air
- Sinar Matahari
`;

    const mermaidSyntax = markdownToMermaidMindmap(markdownOutline, 'Ekosistem');

    expect(mermaidSyntax).toContain('mindmap');
    expect(mermaidSyntax).toContain('root((Ekosistem Hutan))');
    expect(mermaidSyntax).toContain('Komponen Biotik');
    expect(mermaidSyntax).toContain('Konsumen Primer: Herbivora');
    expect(mermaidSyntax).toContain('Rusa');
    expect(mermaidSyntax).toContain('Komponen Abiotik');
    expect(mermaidSyntax).toContain('Sinar Matahari');
  });
});
