import { describe, it, expect } from 'vitest';
import { markdownToMermaidMindmap, DEFAULT_MINDMAP } from '../components/MermaidTool';

describe('Mermaid Mindmap Engine & Converter', () => {
  it('has valid default mindmap syntax starting with mindmap and root', () => {
    expect(DEFAULT_MINDMAP).toContain('mindmap');
    expect(DEFAULT_MINDMAP).toContain('root((Sistem Peredaran Darah))');
    expect(DEFAULT_MINDMAP).toContain('Jantung');
    expect(DEFAULT_MINDMAP).toContain('Pembuluh Darah');
  });

  it('converts markdown headings and bullet lists into hierarchical Mermaid mindmap syntax', () => {
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
    expect(result).toContain('Tempat: Tilakoid');
    expect(result).toContain('Klorofil');
    expect(result).toContain('Siklus Calvin');
    expect(result).toContain('Tempat: Stroma');
    expect(result).toContain('Fiksasi CO2');
  });

  it('handles flat bullet lists with a fallback title', () => {
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

  it('sanitizes special characters that conflict with Mermaid node syntax', () => {
    const markdown = `# Topik (Utama) [Penting]
## Cabang "Satu" {Kunci}
- Detail (A) & (B)
`;

    const result = markdownToMermaidMindmap(markdown);

    expect(result).not.toContain('Topik (Utama)');
    expect(result).toContain('Topik Utama Penting');
    expect(result).toContain('Cabang Satu Kunci');
    expect(result).toContain('Detail A & B');
  });
});
