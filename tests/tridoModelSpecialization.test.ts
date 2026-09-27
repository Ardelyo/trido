import { describe, it, expect } from 'vitest';

describe('Trido Model Specialization & Multilingual Verification', () => {
  it('confirms trido-model:latest and trido-gemma:2b Modelfiles enforce Trido identity', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const gemmaPath = path.resolve(__dirname, '../scripts/Modelfile.trido-gemma');
    const flagshipPath = path.resolve(__dirname, '../scripts/Modelfile.trido-model');

    expect(fs.existsSync(gemmaPath)).toBe(true);
    expect(fs.existsSync(flagshipPath)).toBe(true);

    const gemmaContent = fs.readFileSync(gemmaPath, 'utf8');
    const flagshipContent = fs.readFileSync(flagshipPath, 'utf8');

    // Both models must strictly identify as Trido created by Ardellio Satria Anindito
    expect(gemmaContent).toContain('Trido AI');
    expect(gemmaContent).toContain('Ardellio Satria Anindito');
    expect(gemmaContent).toContain('Gemma 4 E2B');

    expect(flagshipContent).toContain('Trido AI');
    expect(flagshipContent).toContain('Ardellio Satria Anindito');
    expect(flagshipContent).toContain('MULTILINGUAL');
    expect(flagshipContent).toContain('MULTI-TASK AGENTIC ORCHESTRATION');
  });

  it('verifies that Modelfiles specify 32K context window and Gemma 4 native system prompt format', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const gemmaContent = fs.readFileSync(path.resolve(__dirname, '../scripts/Modelfile.trido-gemma'), 'utf8');

    expect(gemmaContent).toContain('num_ctx 32768');
    expect(gemmaContent).toContain('<start_of_turn>system');
    expect(gemmaContent).toContain('<start_of_turn>user');
    expect(gemmaContent).toContain('<start_of_turn>model');
  });

  it('verifies multilingual UN language coverage in Modelfile rules', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const flagshipContent = fs.readFileSync(path.resolve(__dirname, '../scripts/Modelfile.trido-model'), 'utf8');

    const unLanguages = ['English', 'Arabic', 'Chinese', 'French', 'Russian', 'Spanish'];
    unLanguages.forEach(lang => {
      expect(flagshipContent).toContain(lang);
    });
  });

  it('verifies that In-Place Mutation rule prevents duplicate widget recreation', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(path.resolve(__dirname, '../scripts/Modelfile.trido-model'), 'utf8');

    expect(content).toContain("EDIT DON'T RECREATE");
    expect(content).toContain('update_component');
  });
});
