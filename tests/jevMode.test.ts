import { describe, it, expect } from 'vitest';
import { evaluateJevSystemOne } from '../hooks/useGeminiBrain';

describe('Jev System 1 Reflex & Classifier Engine', () => {
  it('instantly handles "buka timer" as a reflex action without LLM', () => {
    let timerToggled = false;
    const mockStore = {
      isTimerOpen: false,
      toggleTimer: () => { timerToggled = true; }
    };

    const result = evaluateJevSystemOne('Buka timer 5 menit', mockStore, null);
    expect(result.handled).toBe(true);
    expect(result.actionTaken).toBe('TOGGLE_TIMER');
    expect(timerToggled).toBe(true);
  });

  it('instantly handles "buka kalkulator" as a reflex action without LLM', () => {
    let calcToggled = false;
    const mockStore = {
      isCalculatorOpen: false,
      toggleCalculator: () => { calcToggled = true; }
    };

    const result = evaluateJevSystemOne('Buka kalkulator', mockStore, null);
    expect(result.handled).toBe(true);
    expect(result.actionTaken).toBe('TOGGLE_CALCULATOR');
    expect(calcToggled).toBe(true);
  });

  it('instantly handles "zoom in" and "zoom out" on canvas', () => {
    let currentZoom = 1.0;
    const mockCanvas = {
      getZoom: () => currentZoom,
      setZoom: (z: number) => { currentZoom = z; },
      requestRenderAll: () => {}
    };

    const inResult = evaluateJevSystemOne('perbesar kanvas', {}, mockCanvas);
    expect(inResult.handled).toBe(true);
    expect(inResult.actionTaken).toBe('ZOOM_IN');
    expect(currentZoom).toBe(1.25);

    const outResult = evaluateJevSystemOne('zoom out', {}, mockCanvas);
    expect(outResult.handled).toBe(true);
    expect(outResult.actionTaken).toBe('ZOOM_OUT');
    expect(currentZoom).toBe(1.0);
  });

  it('locks intent to modification and identifies target diagram when user asks to edit', () => {
    const mockStore = {
      domElements: {
        'web_999': {
          componentType: 'MERMAID_DIAGRAM',
          config: { title: 'Peta Konsep Fotosintesis' }
        }
      }
    };

    const result = evaluateJevSystemOne('Ubah cabang fotosintesis dan tambah detail klorofil', mockStore, null);
    expect(result.handled).toBe(false); // Passes to System 2 for deep generation
    expect(result.lockIntent).toBe('modification');
    expect(result.targetObjectId).toBe('web_999');
  });

  it('safely passes regular creative prompts through to System 2 without interception', () => {
    const result = evaluateJevSystemOne('Buatlah rencana belajar tentang sistem tata surya', {}, null);
    expect(result.handled).toBe(false);
    expect(result.lockIntent).toBeUndefined();
  });
});
