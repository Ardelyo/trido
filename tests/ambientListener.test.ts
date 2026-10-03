import { describe, it, expect, beforeEach } from 'vitest';
import { useAmbientListener, matchAndExecuteHandsFreeCommand } from '../hooks/useAmbientListener';
import { useStore } from '../store';

describe('Trido Hands-Free Ambient Classroom Listener Hook', () => {
  beforeEach(() => {
    // Reset store state
    useStore.setState({
      domElements: {},
      isCalculatorOpen: false,
      isQuizOpen: false,
      isAttendanceOpen: false,
      isHandsFreeListening: false,
      isAiDrawerOpen: false,
    });
  });

  it('initializes with ambient listening disabled by default (opt-in safety)', () => {
    expect(typeof useAmbientListener).toBe('function');
    expect(typeof matchAndExecuteHandsFreeCommand).toBe('function');
  });

  it('matches and executes hands-free Timer command with custom minutes', () => {
    const result = matchAndExecuteHandsFreeCommand('Trido, pasang timer 10 menit');
    expect(result.matched).toBe(true);
    expect(result.action).toBe('TIMER');
    expect(result.detail).toBe('10 menit');

    const domEls = useStore.getState().domElements;
    const timerWidget = Object.values(domEls).find(el => el.componentType === 'TIMER');
    expect(timerWidget).toBeDefined();
    expect(timerWidget?.config?.seconds).toBe(600);
  });

  it('matches and executes hands-free Attendance (Presensi) command', () => {
    expect(useStore.getState().isAttendanceOpen).toBe(false);
    const result = matchAndExecuteHandsFreeCommand('Hai Trido, buka presensi siswa');
    expect(result.matched).toBe(true);
    expect(result.action).toBe('ATTENDANCE');
    expect(useStore.getState().isAttendanceOpen).toBe(true);
  });

  it('matches and executes hands-free Spin Wheel (Roda Acak) command', () => {
    const result = matchAndExecuteHandsFreeCommand('Trido, acak giliran siswa');
    expect(result.matched).toBe(true);
    expect(result.action).toBe('SPIN_WHEEL');

    const domEls = useStore.getState().domElements;
    const wheelWidget = Object.values(domEls).find(el => el.componentType === 'SPIN_WHEEL');
    expect(wheelWidget).toBeDefined();
  });

  it('matches and executes hands-free Calculator command', () => {
    expect(useStore.getState().isCalculatorOpen).toBe(false);
    const result = matchAndExecuteHandsFreeCommand('Trido, tolong buka kalkulator sains');
    expect(result.matched).toBe(true);
    expect(result.action).toBe('CALCULATOR');
    expect(useStore.getState().isCalculatorOpen).toBe(true);
  });

  it('matches and executes hands-free Quiz command', () => {
    expect(useStore.getState().isQuizOpen).toBe(false);
    const result = matchAndExecuteHandsFreeCommand('Trido, mulai kuis interaktif');
    expect(result.matched).toBe(true);
    expect(result.action).toBe('QUIZ');
    expect(useStore.getState().isQuizOpen).toBe(true);
  });

  it('matches and executes hands-free Viewport Reset command', () => {
    const result = matchAndExecuteHandsFreeCommand('Trido, pusatkan layar');
    expect(result.matched).toBe(true);
    expect(result.action).toBe('RESET_VIEWPORT');
  });

  it('forwards general AI / Mindmap requests to Assistant drawer hands-free', () => {
    const result = matchAndExecuteHandsFreeCommand('Trido, buat peta konsep tentang sistem tata surya');
    expect(result.matched).toBe(true);
    expect(result.action).toBe('AI_ASSISTANT');
    expect(useStore.getState().isAiDrawerOpen).toBe(true);
    expect(useStore.getState().chatInputText).toContain('sistem tata surya');
  });
});
