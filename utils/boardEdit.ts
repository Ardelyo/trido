/**
 * Deterministic, pure editing operations for board components.
 *
 * The AI no longer rewrites a whole component to change one thing. It picks an operation
 * (insert / replace / delete / move a block, add / rename / delete / move a diagram node,
 * edit a quiz field or a list item) and this module applies it, so the result is always
 * well-formed and identical regardless of which model produced the call.
 *
 * Index convention for anything human-facing (options, items, questions): 1-based.
 * No DOM / React / store imports — safe to unit-test and to reuse on the server.
 */

export type EditOperation =
  // documents (markdown)
  | 'insert_after' | 'replace_block' | 'delete_block' | 'move_block' | 'append_to_section'
  // diagrams (mermaid mindmap / flowchart, markmap)
  | 'add_node' | 'rename_node' | 'delete_node' | 'move_node'
  // quizzes
  | 'set_question' | 'set_option' | 'add_option' | 'remove_option' | 'set_correct'
  // lists (todo / attendance)
  | 'add_item' | 'remove_item' | 'update_item' | 'toggle_item';

export interface EditArgs {
  operation: EditOperation;
  blockId?: string;
  afterBlockId?: string;
  target?: string;
  parent?: string;
  text?: string;
  index?: number;
  itemIndex?: number;
  value?: string;
}

export type EditResult =
  | { ok: true; config: Record<string, any>; message: string }
  | { ok: false; error: string; hint?: string };

const ok = (config: Record<string, any>, message: string): EditResult => ({ ok: true, config, message });
const fail = (error: string, hint?: string): EditResult => ({ ok: false, error, hint });

const norm = (s: string) =>
  s.toLowerCase().replace(/[`*_~#>]/g, '').replace(/\s+/g, ' ').trim();

/** Exact → case-insensitive exact → unique substring match. Returns index, -1 (none) or -2 (ambiguous). */
function findByLabel(labels: (string | null)[], query: string): number {
  const q = norm(query);
  if (!q) return -1;
  let hits = labels.map((l, i) => (l !== null && norm(l) === q ? i : -1)).filter(i => i >= 0);
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) return -2;
  hits = labels.map((l, i) => (l !== null && (norm(l).includes(q) || (norm(l).length > 2 && q.includes(norm(l)))) ? i : -1)).filter(i => i >= 0);
  if (hits.length === 1) return hits[0];
  return hits.length > 1 ? -2 : -1;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MARKDOWN BLOCKS (documents / notes)
// ─────────────────────────────────────────────────────────────────────────────

export interface MdBlock {
  id: string;
  kind: 'heading' | 'item' | 'code' | 'table' | 'paragraph';
  level?: number;
  text: string;
}

const LIST_RE = /^\s*([-*+]|\d+[.)])\s+/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;

/** Split markdown into addressable blocks (b1, b2, …). Each list item is its own block. */
export function parseMarkdownBlocks(md: string): MdBlock[] {
  const lines = (md || '').replace(/\r\n?/g, '\n').split('\n');
  const raw: Omit<MdBlock, 'id'>[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (!buf.length) return;
    const text = buf.join('\n');
    raw.push({ kind: buf.every(l => l.trim().startsWith('|')) ? 'table' : 'paragraph', text });
    buf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      flush();
      const fence = [line];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) fence.push(lines[i++]);
      if (i < lines.length) fence.push(lines[i]);
      raw.push({ kind: 'code', text: fence.join('\n') });
      continue;
    }
    if (!line.trim()) { flush(); continue; }
    const h = HEADING_RE.exec(line);
    if (h) { flush(); raw.push({ kind: 'heading', level: h[1].length, text: line }); continue; }
    if (LIST_RE.test(line)) { flush(); raw.push({ kind: 'item', text: line }); continue; }
    buf.push(line);
  }
  flush();
  return raw.map((b, i) => ({ id: `b${i + 1}`, ...b }));
}

/** Rebuild markdown: consecutive list items stay tight, everything else is separated by a blank line. */
export function joinMarkdownBlocks(blocks: Pick<MdBlock, 'kind' | 'text'>[]): string {
  let out = '';
  blocks.forEach((b, i) => {
    if (i > 0) out += blocks[i - 1].kind === 'item' && b.kind === 'item' ? '\n' : '\n\n';
    out += b.text;
  });
  return out;
}

/** Classify free text the AI supplies so it joins the list/headings properly. */
function blocksFromText(text: string): Pick<MdBlock, 'kind' | 'text'>[] {
  return parseMarkdownBlocks(text).map(({ kind, text: t }) => ({ kind, text: t }));
}

function resolveBlockIndex(blocks: MdBlock[], blockId: string | undefined): number {
  if (!blockId) return -1;
  const id = blockId.trim().toLowerCase();
  const i = blocks.findIndex(b => b.id === id);
  if (i >= 0) return i;
  // tolerate "3" or "block 3"
  const n = /(\d+)/.exec(id);
  return n ? blocks.findIndex(b => b.id === `b${n[1]}`) : -1;
}

export function describeMarkdown(md: string, maxBlocks = 60): string {
  const blocks = parseMarkdownBlocks(md);
  const shown = blocks.slice(0, maxBlocks).map(b => {
    const label = b.kind === 'heading' ? `h${b.level}` : b.kind === 'item' ? 'li' : b.kind === 'code' ? 'code' : b.kind === 'table' ? 'table' : 'p';
    const body = b.text.replace(/\s+/g, ' ');
    return `${b.id} ${label}: ${body.length > 70 ? body.slice(0, 70) + '…' : body}`;
  });
  if (blocks.length > maxBlocks) shown.push(`… +${blocks.length - maxBlocks} more blocks`);
  return shown.join('\n');
}

function editMarkdown(md: string, a: EditArgs): EditResult {
  const blocks = parseMarkdownBlocks(md);
  const ids = blocks.map(b => b.id).join(', ') || '(empty)';
  const strip = (b: MdBlock): Pick<MdBlock, 'kind' | 'text'> => ({ kind: b.kind, text: b.text });
  const all = blocks.map(strip);

  switch (a.operation) {
    case 'insert_after': {
      if (!a.text?.trim()) return fail('insert_after needs "text".');
      const key = (a.blockId || a.afterBlockId || 'end').toLowerCase();
      const add = blocksFromText(a.text);
      if (key === 'start') return ok({ markdown: joinMarkdownBlocks([...add, ...all]) }, 'Disisipkan di awal.');
      if (key === 'end' || !blocks.length) return ok({ markdown: joinMarkdownBlocks([...all, ...add]) }, 'Ditambahkan di akhir.');
      const i = resolveBlockIndex(blocks, key);
      if (i < 0) return fail(`Block "${key}" tidak ditemukan.`, `Block yang ada: ${ids}`);
      all.splice(i + 1, 0, ...add);
      return ok({ markdown: joinMarkdownBlocks(all) }, `Disisipkan setelah ${blocks[i].id}.`);
    }
    case 'replace_block': {
      const i = resolveBlockIndex(blocks, a.blockId);
      if (i < 0) return fail(`Block "${a.blockId ?? ''}" tidak ditemukan.`, `Block yang ada: ${ids}`);
      if (a.text === undefined) return fail('replace_block needs "text".');
      all.splice(i, 1, ...blocksFromText(a.text));
      return ok({ markdown: joinMarkdownBlocks(all) }, `${blocks[i].id} diganti.`);
    }
    case 'delete_block': {
      const i = resolveBlockIndex(blocks, a.blockId);
      if (i < 0) return fail(`Block "${a.blockId ?? ''}" tidak ditemukan.`, `Block yang ada: ${ids}`);
      all.splice(i, 1);
      return ok({ markdown: joinMarkdownBlocks(all) }, `${blocks[i].id} dihapus.`);
    }
    case 'move_block': {
      const from = resolveBlockIndex(blocks, a.blockId);
      if (from < 0) return fail(`Block "${a.blockId ?? ''}" tidak ditemukan.`, `Block yang ada: ${ids}`);
      const dest = (a.afterBlockId || 'start').toLowerCase();
      const to = dest === 'start' ? -1 : resolveBlockIndex(blocks, dest);
      if (dest !== 'start' && to < 0) return fail(`Block tujuan "${dest}" tidak ditemukan.`, `Block yang ada: ${ids}`);
      if (to === from) return ok({ markdown: md }, 'Tidak ada perubahan.');
      const [moved] = all.splice(from, 1);
      const insertAt = to < 0 ? 0 : (to > from ? to : to + 1);
      all.splice(insertAt, 0, moved);
      return ok({ markdown: joinMarkdownBlocks(all) }, `${blocks[from].id} dipindahkan.`);
    }
    case 'append_to_section': {
      if (!a.target) return fail('append_to_section needs "target" (judul bagian).');
      if (!a.text?.trim()) return fail('append_to_section needs "text".');
      const headings = blocks.map(b => (b.kind === 'heading' ? b.text.replace(/^#+\s*/, '') : null));
      const h = findByLabel(headings, a.target);
      if (h === -2) return fail(`Judul "${a.target}" ambigu.`, 'Gunakan blockId yang tepat dengan insert_after.');
      if (h < 0) return fail(`Bagian "${a.target}" tidak ditemukan.`, `Heading: ${blocks.filter(b => b.kind === 'heading').map(b => `${b.id} "${b.text.replace(/^#+\s*/, '')}"`).join('; ') || '(tidak ada)'}`);
      const level = blocks[h].level ?? 1;
      let end = h;
      for (let i = h + 1; i < blocks.length; i++) {
        if (blocks[i].kind === 'heading' && (blocks[i].level ?? 1) <= level) break;
        end = i;
      }
      all.splice(end + 1, 0, ...blocksFromText(a.text));
      return ok({ markdown: joinMarkdownBlocks(all) }, `Ditambahkan ke bagian "${a.target}".`);
    }
    default:
      return fail(`Operasi "${a.operation}" tidak berlaku untuk dokumen.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DIAGRAM TREES (mermaid mindmap, markmap markdown) — line + depth model
// ─────────────────────────────────────────────────────────────────────────────

interface TreeLine { raw: string; depth: number; label: string | null }
interface TreeAdapter {
  parse(src: string): { head: string[]; lines: TreeLine[] };
  render(head: string[], lines: TreeLine[]): string;
  rename(l: TreeLine, text: string): string;
  /** raw text of a new child under `parent` (undefined parent = new top-level) with the given depth. */
  make(text: string, parent: TreeLine | undefined, siblings: TreeLine[], depth: number): string;
  childDepth(parent: TreeLine, lines: TreeLine[], parentIndex: number): number;
  retarget(l: TreeLine, delta: number): string;
}

const MM_SKIP = /^\s*(::|%%|classDef\b|class\s|style\s)/;

function mermaidLabel(raw: string): string {
  const t = raw.trim();
  const m = /^[^\s(\[{)]*?(?:\(\(|\[\[|\(\[|\{\{|\(|\[|\{)(.+?)(?:\)\)|\]\]|\]\)|\}\}|\)|\]|\})\s*$/.exec(t);
  return (m ? m[1] : t).replace(/^["']|["']$/g, '').trim();
}

const mindmapAdapter: TreeAdapter = {
  parse(src) {
    const rows = src.replace(/\r\n?/g, '\n').split('\n');
    const headIdx = rows.findIndex(r => /^\s*mindmap\b/.test(r));
    const head = rows.slice(0, headIdx + 1);
    const lines: TreeLine[] = rows.slice(headIdx + 1).filter(r => r.trim()).map(raw => ({
      raw,
      depth: raw.length - raw.trimStart().length,
      label: MM_SKIP.test(raw) ? null : mermaidLabel(raw),
    }));
    return { head, lines };
  },
  render: (head, lines) => [...head, ...lines.map(l => l.raw)].join('\n'),
  rename(l, text) {
    const idx = l.raw.indexOf(l.label ?? '');
    return l.label && idx >= 0 ? l.raw.slice(0, idx) + text + l.raw.slice(idx + l.label.length) : l.raw;
  },
  make: (text, _p, _s, depth) => `${' '.repeat(depth)}${text}`,
  childDepth(parent, lines, i) {
    const next = lines[i + 1];
    return next && next.depth > parent.depth ? next.depth : parent.depth + 2;
  },
  retarget: (l, delta) => (delta >= 0 ? ' '.repeat(delta) + l.raw : l.raw.slice(Math.min(-delta, l.raw.length - l.raw.trimStart().length))),
};

const markmapAdapter: TreeAdapter = {
  parse(src) {
    const rows = src.replace(/\r\n?/g, '\n').split('\n');
    let lastHeading = 0;
    const lines: TreeLine[] = [];
    for (const raw of rows) {
      if (!raw.trim()) continue;
      const h = HEADING_RE.exec(raw);
      if (h) { lastHeading = h[1].length; lines.push({ raw, depth: lastHeading, label: h[2].trim() }); continue; }
      const li = LIST_RE.exec(raw);
      if (li) {
        const indent = raw.length - raw.trimStart().length;
        lines.push({ raw, depth: lastHeading + 1 + Math.floor(indent / 2), label: raw.replace(LIST_RE, '').trim() });
      } else lines.push({ raw, depth: 99, label: null });
    }
    return { head: [], lines };
  },
  render: (_h, lines) => lines.map(l => l.raw).join('\n'),
  rename(l, text) {
    const h = HEADING_RE.exec(l.raw);
    if (h) return `${h[1]} ${text}`;
    const m = /^(\s*(?:[-*+]|\d+[.)])\s+)/.exec(l.raw);
    return (m ? m[1] : '- ') + text;
  },
  make(text, parent, _s, depth) {
    if (!parent) return `# ${text}`;
    const ph = HEADING_RE.exec(parent.raw);
    if (ph && ph[1].length < 4) return `${'#'.repeat(ph[1].length + 1)} ${text}`;
    const indent = ph ? 0 : (parent.raw.length - parent.raw.trimStart().length) + 2;
    return `${' '.repeat(indent)}- ${text}`;
  },
  childDepth: (parent) => parent.depth + 1,
  retarget(l, delta) {
    const h = HEADING_RE.exec(l.raw);
    if (h) return `${'#'.repeat(Math.max(1, Math.min(6, h[1].length + delta)))} ${h[2]}`;
    const indent = l.raw.length - l.raw.trimStart().length;
    return ' '.repeat(Math.max(0, indent + delta * 2)) + l.raw.trimStart();
  },
};

function subtreeEnd(lines: TreeLine[], i: number): number {
  let end = i;
  for (let j = i + 1; j < lines.length && lines[j].depth > lines[i].depth; j++) end = j;
  return end;
}

function nodeIndex(lines: TreeLine[], query: string): number {
  return findByLabel(lines.map(l => l.label), query);
}

const nodeList = (lines: TreeLine[]) => lines.filter(l => l.label).map(l => `"${l.label}"`).slice(0, 40).join(', ');

function editTree(src: string, adapter: TreeAdapter, a: EditArgs, key: 'code' | 'markdown'): EditResult {
  const { head, lines } = adapter.parse(src);
  const out = (ls: TreeLine[], msg: string) => ok({ [key]: adapter.render(head, ls) }, msg);

  const need = (q: string | undefined, name: string): number | EditResult => {
    if (!q) return fail(`${a.operation} needs "${name}".`);
    const i = nodeIndex(lines, q);
    if (i === -2) return fail(`Node "${q}" ambigu (lebih dari satu cocok).`, `Node: ${nodeList(lines)}`);
    if (i < 0) return fail(`Node "${q}" tidak ditemukan.`, `Node yang ada: ${nodeList(lines)}`);
    return i;
  };

  switch (a.operation) {
    case 'add_node': {
      if (!a.text?.trim()) return fail('add_node needs "text".');
      const texts = a.text.split('\n').map(t => t.trim()).filter(Boolean);
      const copy = lines.slice();
      let p: number | undefined;
      if (a.parent) {
        const r = need(a.parent, 'parent');
        if (typeof r !== 'number') return r;
        p = r;
      } else if (key === 'code') {
        p = 0; // mindmap root
        if (!lines.length) return fail('Diagram kosong: tidak ada root.');
      }
      const parentLine = p !== undefined ? lines[p] : undefined;
      let insertAt = p !== undefined ? subtreeEnd(lines, p) + 1 : lines.length;
      const depth = parentLine ? adapter.childDepth(parentLine, lines, p!) : (key === 'markdown' ? 1 : 0);
      const created: TreeLine[] = texts.map(t => {
        const raw = adapter.make(t, parentLine, lines, depth);
        return { raw, depth, label: t };
      });
      copy.splice(insertAt, 0, ...created);
      return out(copy, `Node "${texts.join('", "')}" ditambahkan${parentLine ? ` di bawah "${parentLine.label}"` : ''}.`);
    }
    case 'rename_node': {
      const i = need(a.target, 'target'); if (typeof i !== 'number') return i;
      if (!a.text?.trim()) return fail('rename_node needs "text".');
      const copy = lines.slice();
      copy[i] = { ...lines[i], raw: adapter.rename(lines[i], a.text.trim()), label: a.text.trim() };
      return out(copy, `"${lines[i].label}" → "${a.text.trim()}".`);
    }
    case 'delete_node': {
      const i = need(a.target, 'target'); if (typeof i !== 'number') return i;
      if (key === 'code' && i === 0) return fail('Root diagram tidak boleh dihapus.', 'Gunakan update_component REPLACE untuk membuat ulang diagram.');
      const end = subtreeEnd(lines, i);
      const copy = lines.slice(); copy.splice(i, end - i + 1);
      return out(copy, `"${lines[i].label}"${end > i ? ` beserta ${end - i} sub-node` : ''} dihapus.`);
    }
    case 'move_node': {
      const i = need(a.target, 'target'); if (typeof i !== 'number') return i;
      const p = need(a.parent, 'parent'); if (typeof p !== 'number') return p;
      const end = subtreeEnd(lines, i);
      if (p >= i && p <= end) return fail('Node tidak bisa dipindah ke dalam sub-node-nya sendiri.');
      if (key === 'code' && i === 0) return fail('Root diagram tidak bisa dipindah.');
      const moving = lines.slice(i, end + 1);
      const rest = lines.slice(0, i).concat(lines.slice(end + 1));
      const pIdx = p > end ? p - moving.length : p;
      const parentLine = rest[pIdx];
      const newDepth = adapter.childDepth(parentLine, rest, pIdx);
      const delta = newDepth - moving[0].depth;
      const shifted = moving.map(l => ({ ...l, raw: adapter.retarget(l, delta), depth: l.depth + delta }));
      rest.splice(subtreeEnd(rest, pIdx) + 1, 0, ...shifted);
      return out(rest, `"${moving[0].label}" dipindahkan ke bawah "${parentLine.label}".`);
    }
    default:
      return fail(`Operasi "${a.operation}" tidak berlaku untuk diagram.`);
  }
}

// ── Mermaid flowchart (graph/flowchart) ─────────────────────────────────────

const FLOW_NODE = /\b([A-Za-z_][\w]*)\s*(\(\[|\(\(|\[\[|\[|\(|\{|>)\s*"?([^\]\)\}"\n]+?)"?\s*(\]\)|\)\)|\]\]|\]|\)|\})/g;

function flowNodes(code: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of code.matchAll(FLOW_NODE)) if (!map.has(m[1])) map.set(m[1], m[3].trim());
  return map;
}

function editFlowchart(code: string, a: EditArgs): EditResult {
  const nodes = flowNodes(code);
  const labels = [...nodes.values()];
  const ids = [...nodes.keys()];
  const find = (q?: string): string | EditResult => {
    if (!q) return fail(`${a.operation} needs a node name.`);
    const direct = ids.find(id => id === q);
    if (direct) return direct;
    const i = findByLabel(labels, q);
    if (i === -2) return fail(`Node "${q}" ambigu.`, `Node: ${labels.map(l => `"${l}"`).join(', ')}`);
    if (i < 0) return fail(`Node "${q}" tidak ditemukan.`, `Node yang ada: ${labels.map(l => `"${l}"`).join(', ')}`);
    return ids[i];
  };
  const safe = (t: string) => t.replace(/["\[\]\(\)\{\}]/g, '').trim();

  switch (a.operation) {
    case 'add_node': {
      if (!a.text?.trim()) return fail('add_node needs "text".');
      const p = find(a.parent); if (typeof p !== 'string') return p;
      let n = nodes.size + 1;
      while (nodes.has(`N${n}`)) n++;
      return ok({ code: `${code.trimEnd()}\n  ${p} --> N${n}[${safe(a.text)}]` }, `Node "${safe(a.text)}" ditambahkan setelah "${nodes.get(p)}".`);
    }
    case 'rename_node': {
      const id = find(a.target); if (typeof id !== 'string') return id;
      if (!a.text?.trim()) return fail('rename_node needs "text".');
      const old = nodes.get(id)!;
      const re = new RegExp(`(\\b${id}\\s*(?:\\(\\[|\\(\\(|\\[\\[|\\[|\\(|\\{|>)\\s*"?)${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}("?\\s*(?:\\]\\)|\\)\\)|\\]\\]|\\]|\\)|\\}))`);
      if (!re.test(code)) return fail(`Gagal menulis ulang label "${old}".`);
      return ok({ code: code.replace(re, `$1${safe(a.text)}$2`) }, `"${old}" → "${safe(a.text)}".`);
    }
    case 'delete_node': {
      const id = find(a.target); if (typeof id !== 'string') return id;
      const idRe = new RegExp(`\\b${id}\\b`);
      const out: string[] = [];
      for (const line of code.split('\n')) {
        if (!idRe.test(line)) { out.push(line); continue; }
        const arrows = (line.match(/-->|---|==>|-\.->|--[ox]/g) || []).length;
        if (arrows > 1) {
          return fail(`"${nodes.get(id)}" berada di baris berantai ("${line.trim()}").`, 'Gunakan update_component REPLACE dengan kode yang sudah diperbaiki.');
        }
        // Keep the label definition of the *other* endpoint so it doesn't degrade to a bare id.
        for (const m of line.matchAll(FLOW_NODE)) if (m[1] !== id) out.push(`  ${m[0]}`);
      }
      return ok({ code: out.join('\n') }, `"${nodes.get(id)}" dan sambungannya dihapus.`);
    }
    default:
      return fail(`Operasi "${a.operation}" belum didukung untuk flowchart.`, 'Gunakan add_node / rename_node / delete_node.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. QUIZ + LISTS
// ─────────────────────────────────────────────────────────────────────────────

function pickQuestion(cfg: Record<string, any>, itemIndex?: number): { q: Record<string, any>; set: (q: Record<string, any>) => Record<string, any> } | EditResult {
  if (Array.isArray(cfg.questions) && cfg.questions.length) {
    const i = (itemIndex ?? 1) - 1;
    if (i < 0 || i >= cfg.questions.length) return fail(`Soal nomor ${itemIndex} tidak ada (ada ${cfg.questions.length} soal).`);
    return { q: cfg.questions[i], set: nq => ({ ...cfg, questions: cfg.questions.map((x: any, k: number) => (k === i ? nq : x)) }) };
  }
  return { q: cfg, set: nq => nq };
}

function editQuiz(cfg: Record<string, any>, a: EditArgs): EditResult {
  const picked = pickQuestion(cfg, a.itemIndex);
  if ('ok' in picked) return picked;
  const { q, set } = picked;
  const options: string[] = Array.isArray(q.options) ? [...q.options] : [];
  const oi = (a.index ?? 0) - 1;
  const range = `Pilihan yang ada: 1–${options.length}`;

  switch (a.operation) {
    case 'set_question': {
      if (!a.text?.trim()) return fail('set_question needs "text".');
      const key = q.statement !== undefined && q.question === undefined ? 'statement' : 'question';
      return ok(set({ ...q, [key]: a.text.trim() }), 'Pertanyaan diperbarui.');
    }
    case 'set_option': {
      if (oi < 0 || oi >= options.length) return fail(`Pilihan ${a.index} tidak ada.`, range);
      if (!a.text?.trim()) return fail('set_option needs "text".');
      options[oi] = a.text.trim();
      return ok(set({ ...q, options }), `Pilihan ${a.index} diperbarui.`);
    }
    case 'add_option': {
      if (!a.text?.trim()) return fail('add_option needs "text".');
      if (a.index && a.index >= 1 && a.index <= options.length + 1) options.splice(a.index - 1, 0, a.text.trim());
      else options.push(a.text.trim());
      let correct = q.correctIndex;
      if (a.index && typeof correct === 'number' && a.index - 1 <= correct) correct += 1;
      return ok(set({ ...q, options, ...(typeof correct === 'number' ? { correctIndex: correct } : {}) }), 'Pilihan ditambahkan.');
    }
    case 'remove_option': {
      if (oi < 0 || oi >= options.length) return fail(`Pilihan ${a.index} tidak ada.`, range);
      if (options.length <= 2) return fail('Minimal 2 pilihan jawaban harus tersisa.');
      options.splice(oi, 1);
      let correct = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
      if (oi < correct) correct -= 1; else if (oi === correct) correct = 0;
      return ok(set({ ...q, options, correctIndex: correct }), `Pilihan ${a.index} dihapus.`);
    }
    case 'set_correct': {
      if (oi < 0 || oi >= options.length) return fail(`Pilihan ${a.index} tidak ada.`, range);
      return ok(set({ ...q, correctIndex: oi }), `Jawaban benar: pilihan ${a.index}.`);
    }
    default:
      return fail(`Operasi "${a.operation}" tidak berlaku untuk kuis.`);
  }
}

type ListSpec = { key: 'tasks' | 'students'; textKey: 'text' | 'name'; make(text: string, value?: string): Record<string, any> };

const LIST_SPECS: Record<string, ListSpec> = {
  TODOLIST: { key: 'tasks', textKey: 'text', make: (text) => ({ id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, text, completed: false }) },
  ATTENDANCE: { key: 'students', textKey: 'name', make: (text, v) => ({ name: text, status: (['H', 'I', 'S', 'A'].includes((v || '').toUpperCase()) ? v!.toUpperCase() : 'H') }) },
  PRESENSI: { key: 'students', textKey: 'name', make: (text, v) => ({ name: text, status: (['H', 'I', 'S', 'A'].includes((v || '').toUpperCase()) ? v!.toUpperCase() : 'H') }) },
};

function editList(cfg: Record<string, any>, spec: ListSpec, a: EditArgs): EditResult {
  const items: Record<string, any>[] = Array.isArray(cfg[spec.key]) ? [...cfg[spec.key]] : [];
  const names = items.map(i => String(i[spec.textKey] ?? ''));
  const summary = `Item: ${names.map((n, i) => `${i + 1}. ${n}`).join('; ') || '(kosong)'}`;
  const locate = (): number | EditResult => {
    if (a.index) {
      return a.index >= 1 && a.index <= items.length ? a.index - 1 : fail(`Item ${a.index} tidak ada.`, summary);
    }
    if (a.target) {
      const i = findByLabel(names, a.target);
      if (i === -2) return fail(`"${a.target}" ambigu.`, summary);
      return i >= 0 ? i : fail(`Item "${a.target}" tidak ditemukan.`, summary);
    }
    return fail(`${a.operation} needs "index" or "target".`, summary);
  };

  switch (a.operation) {
    case 'add_item': {
      if (!a.text?.trim()) return fail('add_item needs "text".');
      const texts = a.text.split('\n').map(t => t.trim()).filter(Boolean);
      return ok({ ...cfg, [spec.key]: [...items, ...texts.map(t => spec.make(t, a.value))] }, `${texts.length} item ditambahkan.`);
    }
    case 'remove_item': {
      const i = locate(); if (typeof i !== 'number') return i;
      items.splice(i, 1);
      return ok({ ...cfg, [spec.key]: items }, `Item ${i + 1} dihapus.`);
    }
    case 'update_item': {
      const i = locate(); if (typeof i !== 'number') return i;
      const next = { ...items[i] };
      if (a.text?.trim()) next[spec.textKey] = a.text.trim();
      if (a.value !== undefined) {
        if (spec.key === 'students') {
          const s = a.value.toUpperCase();
          if (!['H', 'I', 'S', 'A'].includes(s)) return fail(`Status "${a.value}" tidak valid.`, 'Gunakan H (hadir), I (izin), S (sakit), A (alpa).');
          next.status = s;
        } else next.completed = /^(true|selesai|done|1|ya)$/i.test(a.value);
      }
      items[i] = next;
      return ok({ ...cfg, [spec.key]: items }, `Item ${i + 1} diperbarui.`);
    }
    case 'toggle_item': {
      const i = locate(); if (typeof i !== 'number') return i;
      if (spec.key !== 'tasks') return fail('toggle_item hanya untuk daftar tugas.', 'Untuk presensi gunakan update_item dengan value H/I/S/A.');
      items[i] = { ...items[i], completed: !items[i].completed };
      return ok({ ...cfg, [spec.key]: items }, `Item ${i + 1} ${items[i].completed ? 'selesai' : 'belum selesai'}.`);
    }
    default:
      return fail(`Operasi "${a.operation}" tidak berlaku untuk daftar.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DISPATCH + TARGET RESOLUTION + AI-FACING OUTLINE
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentLike { componentType?: string; config?: any; title?: string }

type Family = 'document' | 'mindmap' | 'markmap' | 'flowchart' | 'quiz' | 'todo' | 'attendance' | 'unsupported';

export function componentFamily(el: ComponentLike): Family {
  const type = (el.componentType || '').toUpperCase();
  const cfg = el.config || {};
  if (type === 'DOCUMENT_PAGE' || type === 'MARKDOWN_NOTE') return 'document';
  if (type === 'MARKMAP_MINDMAP' && cfg.markdown && !cfg.code) return 'markmap';
  if (type === 'MERMAID_DIAGRAM' || type === 'MARKMAP_MINDMAP') {
    const code = String(cfg.code || '');
    if (/^\s*mindmap\b/m.test(code)) return 'mindmap';
    if (/^\s*(flowchart|graph)\b/m.test(code)) return 'flowchart';
    return 'unsupported';
  }
  if (type === 'QUIZ_MULTIPLE_CHOICE' || type === 'QUIZ_TRUE_FALSE' || type === 'QUIZ_APP' || type === 'QUIZ_ESSAY') return 'quiz';
  if (type === 'TODOLIST') return 'todo';
  if (type === 'ATTENDANCE' || type === 'PRESENSI') return 'attendance';
  return 'unsupported';
}

/** Apply one edit operation to a component. Returns the NEW config (merge into the existing one) or an error + hint. */
export function applyComponentEdit(el: ComponentLike, args: EditArgs): EditResult {
  const cfg = el.config || {};
  const family = componentFamily(el);
  switch (family) {
    case 'document': return editMarkdown(String(cfg.markdown ?? cfg.content ?? ''), args);
    case 'mindmap': return editTree(String(cfg.code || ''), mindmapAdapter, args, 'code');
    case 'markmap': return editTree(String(cfg.markdown || ''), markmapAdapter, args, 'markdown');
    case 'flowchart': return editFlowchart(String(cfg.code || ''), args);
    case 'quiz': return editQuiz(cfg, args);
    case 'todo': return editList(cfg, LIST_SPECS.TODOLIST, args);
    case 'attendance': return editList(cfg, LIST_SPECS.ATTENDANCE, args);
    default:
      return fail(`Komponen ${el.componentType || ''} belum mendukung edit terperinci.`, 'Gunakan update_component (REPLACE).');
  }
}

export const OPERATIONS_BY_FAMILY: Record<string, EditOperation[]> = {
  document: ['insert_after', 'replace_block', 'delete_block', 'move_block', 'append_to_section'],
  mindmap: ['add_node', 'rename_node', 'delete_node', 'move_node'],
  markmap: ['add_node', 'rename_node', 'delete_node', 'move_node'],
  flowchart: ['add_node', 'rename_node', 'delete_node'],
  quiz: ['set_question', 'set_option', 'add_option', 'remove_option', 'set_correct'],
  todo: ['add_item', 'remove_item', 'update_item', 'toggle_item'],
  attendance: ['add_item', 'remove_item', 'update_item'],
};

/**
 * Pick the component the AI means. Exact ID wins; otherwise title/type match; if several match
 * the caller gets `ambiguous` + candidates instead of a silent guess.
 */
export function resolveComponent(
  doms: Record<string, ComponentLike & { config?: any }>,
  query: { objectId?: string; componentTitle?: string; operation?: EditOperation },
): { id: string } | { error: string; candidates: string[] } {
  const entries = Object.entries(doms);
  if (query.objectId && doms[query.objectId]) return { id: query.objectId };

  const family = (e: ComponentLike) => componentFamily(e);
  const supports = (id: string) => !query.operation || (OPERATIONS_BY_FAMILY[family(doms[id])] || []).includes(query.operation);
  const describe = (id: string) => `${id} (${doms[id].componentType}${doms[id].config?.title ? ` "${doms[id].config.title}"` : ''})`;

  let pool = entries.map(([id]) => id).filter(supports);
  const t = norm(query.componentTitle || '');
  if (t) {
    const byTitle = pool.filter(id => {
      const title = norm(String(doms[id].config?.title || doms[id].title || ''));
      return title && (title.includes(t) || t.includes(title));
    });
    if (byTitle.length) pool = byTitle;
  }
  if (pool.length === 1) return { id: pool[0] };
  if (pool.length === 0) {
    return { error: query.objectId ? `Komponen "${query.objectId}" tidak ada.` : 'Tidak ada komponen yang cocok untuk operasi ini.', candidates: entries.map(([id]) => describe(id)) };
  }
  return { error: 'Ada beberapa komponen yang cocok; sebutkan objectId yang tepat.', candidates: pool.map(describe) };
}

/** Compact, addressable description of a component for the AI (block IDs, node names, item numbers). */
export function describeComponentForAI(el: ComponentLike): string {
  const cfg = el.config || {};
  const family = componentFamily(el);
  switch (family) {
    case 'document':
      return describeMarkdown(String(cfg.markdown ?? cfg.content ?? ''));
    case 'mindmap': {
      const { lines } = mindmapAdapter.parse(String(cfg.code || ''));
      return lines.filter(l => l.label).slice(0, 80).map(l => `${'  '.repeat(Math.floor(l.depth / 2))}- ${l.label}`).join('\n');
    }
    case 'markmap': {
      const { lines } = markmapAdapter.parse(String(cfg.markdown || ''));
      return lines.filter(l => l.label).slice(0, 80).map(l => `${'  '.repeat(Math.max(0, l.depth - 1))}- ${l.label}`).join('\n');
    }
    case 'flowchart':
      return [...flowNodes(String(cfg.code || '')).values()].map(l => `- ${l}`).join('\n');
    case 'quiz': {
      const qs = Array.isArray(cfg.questions) && cfg.questions.length ? cfg.questions : [cfg];
      return qs.slice(0, 20).map((q: any, i: number) => {
        const head = `Q${i + 1}: ${q.question ?? q.statement ?? ''}`;
        const opts = Array.isArray(q.options) ? q.options.map((o: string, k: number) => `   ${k + 1}${q.correctIndex === k ? '*' : ''}. ${o}`).join('\n') : '';
        return opts ? `${head}\n${opts}` : head;
      }).join('\n');
    }
    case 'todo':
      return (cfg.tasks || []).map((t: any, i: number) => `${i + 1}. [${t.completed ? 'x' : ' '}] ${t.text}`).join('\n');
    case 'attendance':
      return (cfg.students || []).slice(0, 60).map((s: any, i: number) => `${i + 1}. ${s.name} (${s.status || 'H'})`).join('\n');
    default:
      return '';
  }
}

/** Operations the AI may use on this component (for the system prompt). */
export function editableOperations(el: ComponentLike): EditOperation[] {
  return OPERATIONS_BY_FAMILY[componentFamily(el)] || [];
}
