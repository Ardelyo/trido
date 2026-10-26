import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Guardrail: app chrome must use brand tokens (design/BRAND.md), not generic blue/indigo utilities.
const ROOT = path.resolve(__dirname, '..');
const EXEMPT = /(landing\/|SmartboardDock|SmartboardRadial|AssistiveDock|AiStatusBadge)/;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx') && !EXEMPT.test(p)) out.push(p);
  }
  return out;
}

describe('brand consistency', () => {
  const files = [...walk(path.join(ROOT, 'components')), path.join(ROOT, 'App.tsx')];

  it('does not use generic blue/indigo utility colours in app components', () => {
    const re = /\b(?:bg|text|border|ring|from|to|via|shadow|fill|stroke)-(?:blue|indigo)-\d{2,3}\b/;
    const offenders = files.filter(f => re.test(fs.readFileSync(f, 'utf8'))).map(f => path.relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  it('uses one product name and theme colour in app metadata', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/manifest.json'), 'utf8'));
    const vite = fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8');
    expect(html).toContain('content="#1550aa"');
    expect(manifest.theme_color).toBe('#1550aa');
    expect(vite).not.toMatch(/Trido\+\+/);
    expect(vite).not.toContain('#2563eb');
  });
});
