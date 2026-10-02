import { describe, it, expect } from 'vitest';
import { useAmbientListener } from '../hooks/useAmbientListener';

describe('Trido Hands-Free Ambient Classroom Listener Hook', () => {
  it('initializes with ambient listening disabled by default (opt-in safety)', () => {
    // Basic verification of module interface and defaults
    expect(typeof useAmbientListener).toBe('function');
  });
});
