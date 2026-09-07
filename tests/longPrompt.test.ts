import { describe, it, expect } from 'vitest';
import { buildSystemInstruction, getCapability } from '../server/aiTools';

describe('Long Prompt Handling Tests', () => {
  it('buildSystemInstruction contains long prompt guidelines and does not artificially cap response length to 2 sentences', () => {
    const sysPrompt = buildSystemInstruction([], { width: 1920, height: 1080 });
    
    // Verifies that the guidelines for handling long and detailed prompts are present
    expect(sysPrompt).toContain('HANDLING LONG & DETAILED PROMPTS');
    expect(sysPrompt).toContain('Deconstruct the prompt');
    expect(sysPrompt).toContain('Comprehensive execution');
    expect(sysPrompt).toContain('Hybrid balance');
    
    // Verifies that artificial caps that previously forced 2-5 sentence cutoffs are removed
    expect(sysPrompt).not.toContain('Length: 2-5 sentences in chat');
    expect(sysPrompt).not.toContain('NEVER dump everything at once — build the lesson incrementally');
  });

  it('provides full tool capabilities for modern models when handling complex prompts', () => {
    const cap = getCapability('gemini-3.8-flash');
    expect(cap.supportsLessonEngine).toBe(true);
    expect(cap.maxToolCallsPerRequest).toBeGreaterThanOrEqual(20);

    const sysPrompt = buildSystemInstruction([], { width: 1920, height: 1080 }, undefined, {}, undefined, cap);
    expect(sysPrompt).toContain(`Max ${cap.maxToolCallsPerRequest} tool calls`);
  });
});
