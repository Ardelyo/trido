import { describe, it, expect } from 'vitest';
import {
  parseMarkdownBlocks, applyComponentEdit, resolveComponent, describeComponentForAI, componentFamily,
} from '../utils/boardEdit';

const doc = (markdown: string) => ({ componentType: 'DOCUMENT_PAGE', config: { markdown } });
const MD = '# Fotosintesis\n\nProses mengubah cahaya.\n\n## Tahap\n\n- Reaksi terang\n- Siklus Calvin\n\n## Rumus\n\n$6CO_2$';

describe('markdown block editing', () => {
  it('gives every block a stable id', () => {
    const b = parseMarkdownBlocks(MD);
    expect(b.map(x => x.id)).toEqual(['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7']);
    expect(b[3].kind).toBe('item');
  });
  it('replace_block changes only that block', () => {
    const r = applyComponentEdit(doc(MD), { operation: 'replace_block', blockId: 'b2', text: 'Cahaya jadi glukosa.' });
    expect(r.ok && r.config.markdown).toContain('Cahaya jadi glukosa.');
    expect(r.ok && r.config.markdown).toContain('# Fotosintesis');
    expect(r.ok && r.config.markdown).not.toContain('Proses mengubah cahaya.');
  });
  it('insert_after a list item keeps the list tight', () => {
    const r = applyComponentEdit(doc(MD), { operation: 'insert_after', blockId: 'b4', text: '- Reaksi gelap' });
    expect(r.ok && r.config.markdown).toContain('- Reaksi terang\n- Reaksi gelap\n- Siklus Calvin');
  });
  it('delete_block removes only the targeted item', () => {
    const r = applyComponentEdit(doc(MD), { operation: 'delete_block', blockId: 'b4' });
    expect(r.ok && r.config.markdown).not.toContain('Reaksi terang');
    expect(r.ok && r.config.markdown).toContain('Siklus Calvin');
  });
  it('move_block reorders', () => {
    const r = applyComponentEdit(doc(MD), { operation: 'move_block', blockId: 'b5', afterBlockId: 'b3' });
    expect(r.ok && r.config.markdown.indexOf('Siklus Calvin')).toBeLessThan(r.ok ? r.config.markdown.indexOf('Reaksi terang') : -1);
  });
  it('append_to_section adds to the end of that section only', () => {
    const r = applyComponentEdit(doc(MD), { operation: 'append_to_section', target: 'Tahap', text: '- Fotolisis air' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const m = r.config.markdown as string;
      expect(m.indexOf('Fotolisis air')).toBeGreaterThan(m.indexOf('Siklus Calvin'));
      expect(m.indexOf('Fotolisis air')).toBeLessThan(m.indexOf('## Rumus'));
    }
  });
  it('reports valid ids when the block does not exist', () => {
    const r = applyComponentEdit(doc(MD), { operation: 'delete_block', blockId: 'b99' });
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.hint).toContain('b1');
  });
});

const MM = 'mindmap\n  root((Tata Surya))\n    Planet Dalam\n      Merkurius\n      Venus\n    Planet Luar\n      Mars';
const mm = (code: string) => ({ componentType: 'MERMAID_DIAGRAM', config: { code } });

describe('mermaid mindmap editing', () => {
  it('adds a node under the exact parent, after its last descendant', () => {
    const r = applyComponentEdit(mm(MM), { operation: 'add_node', parent: 'Planet Dalam', text: 'Bumi' });
    expect(r.ok && r.config.code).toContain('      Venus\n      Bumi\n    Planet Luar');
  });
  it('adds to a leaf (creates a deeper child)', () => {
    const r = applyComponentEdit(mm(MM), { operation: 'add_node', parent: 'Mars', text: 'Phobos' });
    expect(r.ok && r.config.code).toMatch(/Mars\n {8}Phobos$/);
  });
  it('renames keeping shape wrappers', () => {
    const r = applyComponentEdit(mm(MM), { operation: 'rename_node', target: 'Tata Surya', text: 'Sistem Tata Surya' });
    expect(r.ok && r.config.code).toContain('root((Sistem Tata Surya))');
  });
  it('delete_node cascades to children', () => {
    const r = applyComponentEdit(mm(MM), { operation: 'delete_node', target: 'Planet Dalam' });
    expect(r.ok && r.config.code).not.toMatch(/Merkurius|Venus|Planet Dalam/);
    expect(r.ok && r.config.code).toContain('Planet Luar');
  });
  it('refuses to delete the root', () => {
    expect(applyComponentEdit(mm(MM), { operation: 'delete_node', target: 'Tata Surya' }).ok).toBe(false);
  });
  it('move_node re-parents a whole subtree with correct indentation', () => {
    const r = applyComponentEdit(mm(MM), { operation: 'move_node', target: 'Mars', parent: 'Planet Dalam' });
    expect(r.ok && r.config.code).toContain('      Venus\n      Mars\n    Planet Luar');
  });
  it('cannot move a node into its own subtree', () => {
    expect(applyComponentEdit(mm(MM), { operation: 'move_node', target: 'Planet Dalam', parent: 'Venus' }).ok).toBe(false);
  });
  it('lists the real nodes when the target is wrong', () => {
    const r = applyComponentEdit(mm(MM), { operation: 'add_node', parent: 'Jupiter', text: 'Europa' });
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.hint).toContain('Planet Luar');
  });
  it('matches parents fuzzily but only when unambiguous', () => {
    expect(applyComponentEdit(mm(MM), { operation: 'add_node', parent: 'planet', text: 'X' }).ok).toBe(false); // 2 matches
    expect(applyComponentEdit(mm(MM), { operation: 'add_node', parent: 'merkur', text: 'X' }).ok).toBe(true);
  });
});

describe('markmap markdown editing', () => {
  const MK = '# Hewan\n## Mamalia\n- Kucing\n- Sapi\n## Reptil\n- Ular';
  const mk = { componentType: 'MARKMAP_MINDMAP', config: { markdown: MK } };
  it('adds a bullet under a heading that already has bullets', () => {
    const r = applyComponentEdit(mk, { operation: 'add_node', parent: 'Mamalia', text: 'Paus' });
    expect(r.ok && r.config.markdown).toContain('- Sapi\n');
    expect(r.ok && r.config.markdown).toMatch(/Mamalia\n(.*\n)*.*Paus/);
  });
  it('delete_node removes heading and its bullets', () => {
    const r = applyComponentEdit(mk, { operation: 'delete_node', target: 'Reptil' });
    expect(r.ok && r.config.markdown).toBe('# Hewan\n## Mamalia\n- Kucing\n- Sapi');
  });
});

describe('flowchart editing', () => {
  const FC = 'flowchart TD\n  A[Mulai] --> B[Proses]\n  B --> C{Valid?}\n  C --> D[Selesai]';
  const fc = { componentType: 'MERMAID_DIAGRAM', config: { code: FC } };
  it('adds a node connected to the parent', () => {
    const r = applyComponentEdit(fc, { operation: 'add_node', parent: 'Proses', text: 'Log' });
    expect(r.ok && r.config.code).toMatch(/B --> N\d+\[Log\]$/);
  });
  it('renames a label in place', () => {
    const r = applyComponentEdit(fc, { operation: 'rename_node', target: 'Mulai', text: 'Awal' });
    expect(r.ok && r.config.code).toContain('A[Awal] --> B[Proses]');
  });
  it('delete_node keeps the other endpoint definition', () => {
    const r = applyComponentEdit(fc, { operation: 'delete_node', target: 'Mulai' });
    expect(r.ok && r.config.code).toContain('B[Proses]');
    expect(r.ok && r.config.code).not.toContain('Mulai');
  });
});

describe('quiz editing', () => {
  const quiz = { componentType: 'QUIZ_MULTIPLE_CHOICE', config: { question: 'Q?', options: ['a', 'b', 'c', 'd'], correctIndex: 1 } };
  it('sets option and correct answer with 1-based indexes', () => {
    const r = applyComponentEdit(quiz, { operation: 'set_option', index: 3, text: 'baru' });
    expect(r.ok && r.config.options).toEqual(['a', 'b', 'baru', 'd']);
    const c = applyComponentEdit(quiz, { operation: 'set_correct', index: 4 });
    expect(c.ok && c.config.correctIndex).toBe(3);
  });
  it('keeps the correct answer pointing at the same option when removing an earlier one', () => {
    const r = applyComponentEdit(quiz, { operation: 'remove_option', index: 1 });
    expect(r.ok && r.config.options).toEqual(['b', 'c', 'd']);
    expect(r.ok && r.config.correctIndex).toBe(0);
  });
  it('edits a specific question of a multi-question quiz', () => {
    const multi = { componentType: 'QUIZ_APP', config: { questions: [{ question: 'A', options: ['1', '2'], correctIndex: 0 }, { question: 'B', options: ['x', 'y'], correctIndex: 0 }] } };
    const r = applyComponentEdit(multi, { operation: 'set_question', itemIndex: 2, text: 'B baru' });
    expect(r.ok && r.config.questions[1].question).toBe('B baru');
    expect(r.ok && r.config.questions[0].question).toBe('A');
    expect(applyComponentEdit(multi, { operation: 'set_question', itemIndex: 5, text: 'x' }).ok).toBe(false);
  });
});

describe('list editing', () => {
  const todo = { componentType: 'TODOLIST', config: { tasks: [{ id: '1', text: 'Bahas Bab 4', completed: false }, { id: '2', text: 'Latihan', completed: false }] } };
  const att = { componentType: 'ATTENDANCE', config: { students: [{ name: 'Budi', status: 'H' }, { name: 'Siti', status: 'H' }] } };
  it('toggles and removes tasks by text or index', () => {
    const t = applyComponentEdit(todo, { operation: 'toggle_item', target: 'latihan' });
    expect(t.ok && t.config.tasks[1].completed).toBe(true);
    const d = applyComponentEdit(todo, { operation: 'remove_item', index: 1 });
    expect(d.ok && d.config.tasks).toHaveLength(1);
  });
  it('updates attendance status and validates it', () => {
    const r = applyComponentEdit(att, { operation: 'update_item', target: 'Siti', value: 'S' });
    expect(r.ok && r.config.students[1].status).toBe('S');
    expect(applyComponentEdit(att, { operation: 'update_item', target: 'Siti', value: 'Z' }).ok).toBe(false);
  });
  it('add_item accepts several names at once', () => {
    const r = applyComponentEdit(att, { operation: 'add_item', text: 'Ani\nBudi2' });
    expect(r.ok && r.config.students).toHaveLength(4);
  });
});

describe('target resolution & AI outline', () => {
  const doms: any = {
    d1: { componentType: 'DOCUMENT_PAGE', config: { title: 'Catatan Materi', markdown: '# A' } },
    d2: { componentType: 'DOCUMENT_PAGE', config: { title: 'Ringkasan', markdown: '# B' } },
    m1: { componentType: 'MERMAID_DIAGRAM', config: { title: 'Peta', code: MM } },
  };
  it('prefers an exact objectId', () => expect(resolveComponent(doms, { objectId: 'd2' })).toEqual({ id: 'd2' }));
  it('resolves by title', () => expect(resolveComponent(doms, { componentTitle: 'catatan' })).toEqual({ id: 'd1' }));
  it('filters by what the operation supports', () => {
    expect(resolveComponent(doms, { operation: 'add_node' })).toEqual({ id: 'm1' });
  });
  it('asks instead of guessing when ambiguous', () => {
    const r = resolveComponent(doms, { operation: 'insert_after' });
    expect('error' in r && r.candidates.length).toBe(2);
  });
  it('describes documents with addressable block ids and diagrams with node names', () => {
    expect(describeComponentForAI(doms.d1)).toContain('b1 h1: # A');
    expect(describeComponentForAI(doms.m1)).toContain('Planet Luar');
    expect(componentFamily(doms.m1)).toBe('mindmap');
  });
});

import { sanitizeMermaidCode } from '../utils/mermaidSanitizer';
describe('edits survive the mermaid sanitizer used after every AI edit', () => {
  it('keeps structure of an edited mindmap', () => {
    const r = applyComponentEdit(mm(MM), { operation: 'add_node', parent: 'Planet Dalam', text: 'Bumi' });
    expect(r.ok).toBe(true);
    if (r.ok === true) {
      const out = sanitizeMermaidCode(r.config.code, 'Tata Surya');
      for (const label of ['Tata Surya', 'Planet Dalam', 'Merkurius', 'Venus', 'Bumi', 'Planet Luar', 'Mars']) expect(out).toContain(label);
      expect(out.split('\n')[0].trim()).toBe('mindmap');
      expect(out.indexOf('Bumi')).toBeLessThan(out.indexOf('Planet Luar'));
    }
  });
  it('keeps an edited flowchart valid', () => {
    const FC = 'flowchart TD\n  A[Mulai] --> B[Proses]';
    const r = applyComponentEdit({ componentType: 'MERMAID_DIAGRAM', config: { code: FC } }, { operation: 'add_node', parent: 'Proses', text: 'Selesai' });
    if (r.ok === true) {
      const out = sanitizeMermaidCode(r.config.code, 'Alur');
      expect(out).toMatch(/flowchart|graph/);
      expect(out).toContain('Selesai');
    } else throw new Error('edit failed');
  });
});
