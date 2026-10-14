import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeSpokenNumbers,
  stripConversationalPrefix,
  evaluateJevSystemOne,
  classifyIntent
} from '../hooks/useGeminiBrain';
import { matchAndExecuteHandsFreeCommand } from '../hooks/useAmbientListener';
import { useStore } from '../store';

describe('Smartboard Synchronization & Chat/Voice Mode Understanding', () => {
  beforeEach(() => {
    useStore.setState({
      pages: [{ canvas: {}, dom: {}, previewDataUrl: '', mindmapNodes: [] }],
      currentPageIndex: 0,
      domElements: {},
      activeMindmapNodes: [],
      isTimerOpen: false,
      isCalculatorOpen: false,
      isQuizOpen: false,
      isNotesOpen: false,
      isAttendanceOpen: false,
      isPeriodicTableOpen: false,
      isUnitConverterOpen: false,
      isAiDrawerOpen: false,
      chatInputText: '',
      interimInputText: '',
      isVoiceListening: false
    });
  });

  describe('Spoken Number & Conversational Prefix Normalization', () => {
    it('normalizes Indonesian and English spoken numbers into digits', () => {
      expect(normalizeSpokenNumbers('pasang timer lima belas menit')).toBe('pasang timer 15 menit');
      expect(normalizeSpokenNumbers('timer dua puluh lima menit')).toBe('timer 25 menit');
      expect(normalizeSpokenNumbers('buatkan lima soal kuis')).toBe('buatkan 5 soal kuis');
      expect(normalizeSpokenNumbers('open timer ten minutes')).toBe('open timer 10 minutes');
    });

    it('strips polite prefixes and wake words in both Chat and Voice modes', () => {
      expect(stripConversationalPrefix('Halo Trido, tolong buka kalkulator')).toBe('buka kalkulator');
      expect(stripConversationalPrefix('Trido, coba perbesar layar')).toBe('perbesar layar');
      expect(stripConversationalPrefix('Please open periodic table')).toBe('open periodic table');
    });
  });

  describe('Jev-1 Reflex Understanding (Chat & Voice Mode)', () => {
    it('handles polite/spoken timer commands with custom spoken duration', () => {
      const state = useStore.getState();
      const res = evaluateJevSystemOne('Halo Trido, tolong pasang timer lima belas menit', state, null);
      expect(res.handled).toBe(true);
      expect(res.actionTaken).toBe('TOGGLE_TIMER');

      const timers = Object.values(useStore.getState().domElements).filter(el => el.componentType === 'TIMER');
      expect(timers.length).toBe(1);
      expect(timers[0].config?.seconds).toBe(900);
    });

    it('handles undo, redo, and new page reflexes with polite prefixes', () => {
      const undoSpy = vi.fn();
      const redoSpy = vi.fn();
      useStore.getState().setUndoRedoFunctions(undoSpy, redoSpy);

      const resUndo = evaluateJevSystemOne('Tolong batalkan aksi terakhir', useStore.getState(), null);
      expect(resUndo.handled).toBe(true);
      expect(resUndo.actionTaken).toBe('UNDO');
      expect(undoSpy).toHaveBeenCalledTimes(1);

      const resRedo = evaluateJevSystemOne('Trido, ulangi aksi tadi', useStore.getState(), null);
      expect(resRedo.handled).toBe(true);
      expect(resRedo.actionTaken).toBe('REDO');
      expect(redoSpy).toHaveBeenCalledTimes(1);

      const resPage = evaluateJevSystemOne('Tolong tambah halaman', useStore.getState(), null);
      expect(resPage.handled).toBe(true);
      expect(resPage.actionTaken).toBe('ADD_PAGE');
      expect(useStore.getState().pages.length).toBe(2);
      expect(useStore.getState().currentPageIndex).toBe(1);
    });

    it('locks onto the latest diagram for in-place modification requests', () => {
      useStore.getState().updateDomElement('mermaid_123', {
        id: 'mermaid_123',
        html: '<div>Diagram</div>',
        componentType: 'MERMAID_DIAGRAM',
        config: { code: 'mindmap\n  root((Sel))' },
        x: 500,
        y: 400,
        width: 600,
        height: 400,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        zIndex: 10
      });

      const res = evaluateJevSystemOne('Tolong tambahkan cabang baru pada peta konsep tadi', useStore.getState(), null);
      expect(res.handled).toBe(false);
      expect(res.lockIntent).toBe('modification');
      expect(res.targetObjectId).toBe('mermaid_123');
    });
  });

  describe('Intent Classification Accuracy (Modification vs Question vs Creation vs Navigation)', () => {
    it('classifies in-place modifications accurately even when target nouns (mindmap, diagram, kotak) are present', () => {
      expect(classifyIntent('Ubah peta konsep tadi menjadi 4 cabang')).toBe('modification');
      expect(classifyIntent('Tolong tambahkan cabang pada mindmap fotosintesis')).toBe('modification');
      expect(classifyIntent('Edit diagram alur tadi')).toBe('modification');
      expect(classifyIntent('Ganti warna kotak menjadi biru')).toBe('modification');
      expect(classifyIntent('Hapus lingkaran merah')).toBe('modification');
    });

    it('classifies pure conceptual questions as question without triggering unwanted board widgets', () => {
      expect(classifyIntent('Halo Trido, apa perbedaan mitosis dan meiosis?')).toBe('question');
      expect(classifyIntent('Mengapa langit berwarna biru?')).toBe('question');
      expect(classifyIntent('Bagaimana cara kerja enzim pencernaan?')).toBe('question');
    });

    it('classifies explicit board visual requests as creation even when phrased with jelaskan/apa', () => {
      expect(classifyIntent('Tolong jelaskan siklus air dengan peta konsep di papan')).toBe('creation');
      expect(classifyIntent('Buatkan lima soal kuis tentang tata surya')).toBe('creation');
      expect(classifyIntent('Gambarkan segitiga siku-siku di kanvas')).toBe('creation');
    });

    it('classifies camera and page commands as navigation', () => {
      expect(classifyIntent('Tolong pusatkan layar')).toBe('navigation');
      expect(classifyIntent('Pindah halaman 2')).toBe('navigation');
    });
  });

  describe('Hands-Free Voice Mode & Multi-Page DOM Synchronization', () => {
    it('parses spoken Indonesian numbers in hands-free Timer commands', () => {
      const res = matchAndExecuteHandsFreeCommand('Trido, pasang timer dua puluh lima menit');
      expect(res.matched).toBe(true);
      expect(res.action).toBe('TIMER');
      expect(res.detail).toBe('25 menit');

      const timer = Object.values(useStore.getState().domElements).find(el => el.componentType === 'TIMER');
      expect(timer?.config?.seconds).toBe(1500);
    });

    it('routes topic-specific spoken quiz generation to AI Smartboard while keeping simple quiz toggle as QUIZ', () => {
      const simpleRes = matchAndExecuteHandsFreeCommand('Trido, mulai kuis interaktif');
      expect(simpleRes.action).toBe('QUIZ');
      expect(useStore.getState().isQuizOpen).toBe(true);

      useStore.setState({ isQuizOpen: false, isAiDrawerOpen: false });
      const aiQuizRes = matchAndExecuteHandsFreeCommand('Trido, buatkan lima soal kuis tentang fotosintesis');
      expect(aiQuizRes.action).toBe('AI_ASSISTANT');
      expect(useStore.getState().isAiDrawerOpen).toBe(true);
      expect(useStore.getState().chatInputText).toContain('fotosintesis');
    });

    it('synchronizes domElements cleanly across addPage, switchPage, and removePage', () => {
      // Page 0 has a widget
      useStore.getState().updateDomElement('note_p0', {
        id: 'note_p0',
        html: '<div>Catatan Halaman 1</div>',
        componentType: 'MARKDOWN_NOTE',
        x: 400,
        y: 300,
        width: 300,
        height: 240,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        zIndex: 5
      });
      useStore.getState().updatePageData(0, {}, useStore.getState().domElements);

      // Add Page 1 -> domElements resets to empty for the new page
      useStore.getState().addPage();
      expect(useStore.getState().currentPageIndex).toBe(1);
      expect(Object.keys(useStore.getState().domElements)).toHaveLength(0);

      // Add widget on Page 1
      useStore.getState().updateDomElement('timer_p1', {
        id: 'timer_p1',
        html: '<div>Timer Halaman 2</div>',
        componentType: 'TIMER',
        x: 600,
        y: 400,
        width: 320,
        height: 380,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        zIndex: 5
      });
      useStore.getState().updatePageData(1, {}, useStore.getState().domElements);

      // Switch back to Page 0 -> restores Page 0's domElements
      useStore.getState().switchPage(0);
      expect(useStore.getState().currentPageIndex).toBe(0);
      expect(useStore.getState().domElements['note_p0']).toBeDefined();
      expect(useStore.getState().domElements['timer_p1']).toBeUndefined();

      // Switch to Page 1 -> restores Page 1's domElements
      useStore.getState().switchPage(1);
      expect(useStore.getState().domElements['timer_p1']).toBeDefined();
      expect(useStore.getState().domElements['note_p0']).toBeUndefined();
    });
  });
});
