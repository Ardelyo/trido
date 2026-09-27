import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Gemma Fine-Tuning Dataset & Quality Gate Integrity', () => {
  const datasetPath = path.resolve(__dirname, '../scripts/trido_sft_dataset.jsonl');

  it('verifies that the SFT training dataset exists and is non-empty', () => {
    expect(fs.existsSync(datasetPath)).toBe(true);
    const content = fs.readFileSync(datasetPath, 'utf8').trim();
    expect(content.length).toBeGreaterThan(100);
  });

  it('validates that every dataset sample follows the strict chat format with valid JSON function calls', () => {
    const lines = fs.readFileSync(datasetPath, 'utf8').trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(10);

    lines.forEach((line, idx) => {
      const parsed = JSON.parse(line);
      expect(parsed.messages, `Line ${idx} must have messages array`).toBeDefined();
      expect(parsed.messages.length).toBe(3);

      const [system, user, assistant] = parsed.messages;
      expect(system.role).toBe('system');
      expect(user.role).toBe('user');
      expect(assistant.role).toBe('assistant');

      // Assistant response must be valid JSON
      const assistantJson = JSON.parse(assistant.content);
      expect(assistantJson).toBeDefined();

      if (assistantJson.functionCalls) {
        expect(Array.isArray(assistantJson.functionCalls)).toBe(true);
        assistantJson.functionCalls.forEach((call: any) => {
          expect(call.name).toBeTypeOf('string');
          expect(call.args).toBeDefined();
        });
      }
    });
  });

  it('validates presence of In-Place Mutation samples in training data', () => {
    const content = fs.readFileSync(datasetPath, 'utf8');
    expect(content).toContain('update_component');
    expect(content).toContain('REPLACE');
  });

  it('validates presence of Pure Mermaid Mindmap samples in training data', () => {
    const content = fs.readFileSync(datasetPath, 'utf8');
    expect(content).toContain('render_mermaid');
    expect(content).toContain('mindmap');
    expect(content).toContain('root((');
  });

  it('validates presence of Multilingual UN Language samples in training data', () => {
    const content = fs.readFileSync(datasetPath, 'utf8');
    // Arabic sample
    expect(content).toContain('أركان الإسلام');
    // French sample
    expect(content).toContain('Révolution Française');
  });
});
