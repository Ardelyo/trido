import { describe, it, expect } from 'vitest';
import {
  markdownToMermaidMindmap,
  sanitizeMermaidCode,
  buildSafeMindmapFromRawText,
  DEFAULT_MINDMAP
} from '../components/MermaidTool';

describe('Mermaid Mindmap Engine & Sanitizer', () => {
  it('punya default mindmap yg valid dgn header mindmap dan root', () => {
    expect(DEFAULT_MINDMAP).toContain('mindmap');
    expect(DEFAULT_MINDMAP).toContain('root((Sistem Peredaran Darah))');
    expect(DEFAULT_MINDMAP).toContain('Jantung');
    expect(DEFAULT_MINDMAP).toContain('Pembuluh Darah');
  });

  it('konversi heading dan bullet markdown jadi hirarki mindmap mermaid', () => {
    const markdown = `# Fotosintesis
## Reaksi Terang
- Tempat: Tilakoid
  - Klorofil
  - Butuh Cahaya
## Siklus Calvin
- Tempat: Stroma
  - Fiksasi CO2
`;

    const result = markdownToMermaidMindmap(markdown);

    expect(result).toContain('mindmap');
    expect(result).toContain('root((Fotosintesis))');
    expect(result).toContain('Reaksi Terang');
    expect(result).toContain('Tempat - Tilakoid');
    expect(result).toContain('Klorofil');
    expect(result).toContain('Siklus Calvin');
    expect(result).toContain('Tempat - Stroma');
    expect(result).toContain('Fiksasi CO2');
  });

  it('bisa handle list bullet datar pake judul fallback', () => {
    const markdown = `- Poin 1
- Poin 2
  - Subpoin 2.1
- Poin 3`;

    const result = markdownToMermaidMindmap(markdown, 'Topik Belajar');

    expect(result).toContain('mindmap');
    expect(result).toContain('root((Topik Belajar))');
    expect(result).toContain('Poin 1');
    expect(result).toContain('Subpoin 2.1');
  });

  it('bersihin karakter kurung dan kutip yg suka bikin parser mermaid crash', () => {
    const markdown = `# Topik (Utama) [Penting]
## Cabang "Satu" {Kunci}
- Detail (A) & (B)
`;

    const result = markdownToMermaidMindmap(markdown);

    expect(result).not.toContain('Topik (Utama)');
    expect(result).toContain('root((Topik - Utama - Penting))');
    expect(result).toContain('Cabang Satu - Kunci');
    expect(result).toContain('Detail - A & - B');
  });

  it('rapihin output mindmap LLM yg berantakan (ada kurung di tengah, titik dua, bullet, sama code fence)', () => {
    const brokenLlmCode = `\`\`\`mermaid
mindmap
  root((Sistem Peredaran Darah (Manusia)))
    - Pembuluh Darah:
      * Arteri (Pembuluh Nadi)
      * Vena [Pembuluh Balik]
    - Sel Darah:
      1. Eritrosit (Sel Darah Merah)
      2. Leukosit (Sel Darah Putih)
\`\`\``;

    const sanitized = sanitizeMermaidCode(brokenLlmCode, 'Peredaran Darah');
    const lines = sanitized.split('\n');

    expect(lines[0]).toBe('mindmap');
    expect(lines[1]).toBe('  root((Sistem Peredaran Darah - Manusia))');
    // node anak ga boleh nyisain kurung, titik dua, atau bullet markdown
    for (const line of lines.slice(2)) {
      expect(line).not.toMatch(/[()\[\]{}:]/);
      expect(line.trim()).not.toMatch(/^[-*+•]|\d+\./);
      const indent = line.match(/^(\s*)/)?.[1].length || 0;
      expect(indent).toBeGreaterThanOrEqual(4);
    }
    expect(sanitized).toContain('Arteri - Pembuluh Nadi');
    expect(sanitized).toContain('Vena - Pembuluh Balik');
  });

  it('cegah error "There can be only one root" kalo LLM ngasih banyak baris level atas atau indentasi loncat', () => {
    const multiRootBroken = `mindmap
  Cabang Satu
          Loncatan Jauh
  Cabang Dua
  Cabang Tiga`;

    const sanitized = sanitizeMermaidCode(multiRootBroken, 'Topik Utama');
    const lines = sanitized.split('\n');

    expect(lines[0]).toBe('mindmap');
    expect(lines[1]).toBe('  root((Topik Utama))');
    // cabang 1 di 4 spasi, yg loncat kejauhan ditahan maksimal naik 2 spasi (jadi 6 spasi)
    expect(lines[2]).toBe('    Cabang Satu');
    expect(lines[3]).toBe('      Loncatan Jauh');
    expect(lines[4]).toBe('    Cabang Dua');
  });

  it('otomatis bungkus label flowchart pake tanda kutip kalo ada kurung atau titik dua', () => {
    const brokenFlowchart = `flowchart TD
  A[Fase 1 (Inisiasi): Glikolisis] --> B[Fase 2 (Siklus Krebs)]`;

    const sanitized = sanitizeMermaidCode(brokenFlowchart);
    expect(sanitized).toContain('A["Fase 1 (Inisiasi): Glikolisis"]');
    expect(sanitized).toContain('B["Fase 2 (Siklus Krebs)"]');
  });

  it('bisa bangun ulang mindmap aman dari teks diagram yg rusak parah lewat buildSafeMindmapFromRawText', () => {
    const corrupted = `graph ???
  A((Rusak [Total])) --> B{Cabang Kedua ( Penting )}
  - Baris Lepas: Nilai 100%`;

    const healed = buildSafeMindmapFromRawText(corrupted, 'Pemulihan');
    expect(healed.startsWith('mindmap\n  root((Pemulihan))')).toBe(true);
    expect(healed).toContain('Baris Lepas - Nilai 100%');
  });
});
