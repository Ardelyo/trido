import { describe, it, expect } from 'vitest';
import { spring, variants, duration, ease } from '../design/motion';
import { isElectronEnv, getElectron } from '../utils/electron';

describe('motion tokens', () => {
  it('exposes ordered spring presets', () => {
    expect(spring.snappy.stiffness).toBeGreaterThan(spring.smooth.stiffness);
    expect(spring.snappy.type).toBe('spring');
  });
  it('has consistent enter/exit variants', () => {
    for (const key of ['fade', 'fadeUp', 'scaleIn', 'slideUp', 'slideRight'] as const) {
      expect(variants[key]).toHaveProperty('hidden');
      expect(variants[key]).toHaveProperty('show');
      expect(variants[key]).toHaveProperty('exit');
    }
  });
  it('keeps durations and easing sane', () => {
    expect(duration.fast).toBeLessThan(duration.base);
    expect(ease.out).toHaveLength(4);
  });
});

describe('electron bridge detection', () => {
  it('is false in a plain browser/jsdom', () => {
    expect(getElectron()).toBeUndefined();
    expect(isElectronEnv()).toBe(false);
  });
});
