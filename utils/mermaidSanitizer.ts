// parser mermaid v11 agak rewel kalo ketemu kurung (), [], atau titik dua : di dalem teks node anak.
// sering dianggap token bentuk geometri atau icon, makanya kita bersihin dulu sebelom dirender.

export function cleanMermaidNodeLabel(raw: string, fallback = 'Topik'): string {
  const s = String(raw || '')
    .replace(/\s*\(([^()]*)\)/g, ' - $1')
    .replace(/\s*\[([^\[\]]*)\]/g, ' - $1')
    .replace(/\s*\{([^{}]*)\}/g, ' - $1')
    .replace(/\s*:\s*/g, ' - ')
    .replace(/[()\[\]{}"'`;#]/g, ' ')
    .replace(/\s*-\s*-\s*/g, ' - ')
    .replace(/^[\s\-–—•*+]+/, '')
    .replace(/[\s\-–—]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return s || fallback;
}

export function markdownToMermaidMindmap(md: string, fallbackTitle = 'Peta Konsep'): string {
  const lines = String(md || '').replace(/\\n/g, '\n').replace(/\r\n/g, '\n').split('\n');
  const out: string[] = ['mindmap'];
  let rootSet = false;
  let rootTitle = cleanMermaidNodeLabel(fallbackTitle, 'Peta Konsep');
  let curHeadingLvl = 1;
  let prevDepth = 1;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('```')) continue;

    if (line.startsWith('#')) {
      const m = line.match(/^(#+)\s+(.+)$/);
      if (m) {
        const lvl = m[1].length;
        const text = cleanMermaidNodeLabel(m[2], 'Cabang');
        if (lvl === 1 && !rootSet) {
          rootTitle = text;
          rootSet = true;
          out.push(`  root((${rootTitle}))`);
          curHeadingLvl = 1;
          prevDepth = 1;
        } else {
          if (!rootSet) {
            rootSet = true;
            out.push(`  root((${rootTitle}))`);
            prevDepth = 1;
          }
          curHeadingLvl = lvl;
          const depth = Math.min(prevDepth + 1, Math.max(2, lvl));
          prevDepth = depth;
          out.push(`${'  '.repeat(depth)}${text}`);
        }
        continue;
      }
    }

    const bulletMatch = rawLine.match(/^(\s*)(?:[-*+•]|\d+[.)])\s+(.+)$/);
    if (bulletMatch) {
      if (!rootSet) {
        rootSet = true;
        out.push(`  root((${rootTitle}))`);
        prevDepth = 1;
      }
      const rawSpaces = bulletMatch[1].replace(/\t/g, '  ').length;
      const bulletDepth = Math.floor(rawSpaces / 2);
      // jgn sampe indentasi loncat kejauhan dari baris sebelumnya
      const depth = Math.min(prevDepth + 1, Math.max(2, curHeadingLvl + 1 + bulletDepth));
      prevDepth = depth;
      const text = cleanMermaidNodeLabel(bulletMatch[2], 'Detail');
      out.push(`${'  '.repeat(depth)}${text}`);
    }
  }

  if (!rootSet) {
    out.push(`  root((${rootTitle}))`);
  }

  return out.join('\n');
}

function extractMindmapLineText(trimmedLine: string): string {
  let s = trimmedLine.replace(/^(?:[-*+•]|\d+[.)])\s+/, '').trim();

  // buka bungkus node kayak root((Judul)) atau node1[Teks] dulu biar kurung dalemnya keambil bersih
  const m =
    s.match(/^[A-Za-z0-9_-]*\(\(\((.+)\)\)\)$/) ||
    s.match(/^[A-Za-z0-9_-]*\(\((.+)\)\)$/) ||
    s.match(/^[A-Za-z0-9_-]*\{\{(.+)\}\}$/) ||
    s.match(/^[A-Za-z0-9_-]*\[\[(.+)\]\]$/) ||
    s.match(/^[A-Za-z0-9_-]*\[(.+)\]$/) ||
    s.match(/^[A-Za-z0-9_-]*\((.+)\)$/);

  if (m?.[1]) s = m[1];
  return cleanMermaidNodeLabel(s, '');
}

function sanitizeMindmapBlock(lines: string[], fallbackTitle = 'Peta Konsep'): string {
  const fallback = cleanMermaidNodeLabel(fallbackTitle, 'Peta Konsep');
  const items: { rawIndent: number; text: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || /^mindmap\b/i.test(trimmed)) continue;
    if (trimmed.startsWith('%%') || trimmed.startsWith('::icon')) continue;

    const leadingSpaces = raw.replace(/\t/g, '  ').match(/^(\s*)/)?.[1].length || 0;
    const text = extractMindmapLineText(trimmed);
    if (text) items.push({ rawIndent: leadingSpaces, text });
  }

  if (items.length === 0) {
    return `mindmap\n  root((${fallback}))\n    Cabang Utama`;
  }

  const minIndent = Math.min(...items.map(l => l.rawIndent));
  const topLevelCount = items.filter(l => l.rawIndent === minIndent).length;

  const out: string[] = ['mindmap'];
  let startIdx = 0;
  let baseChildIndent = minIndent;

  if (topLevelCount === 1) {
    out.push(`  root((${items[0].text || fallback}))`);
    startIdx = 1;
    const rest = items.slice(1);
    baseChildIndent = rest.length > 0 ? Math.min(...rest.map(l => l.rawIndent)) : minIndent + 2;
  } else {
    // kalo model lokal ngeluarin >1 baris di level paling atas, bungkus pake 1 root biar ga error "There can be only one root"
    out.push(`  root((${fallback}))`);
    startIdx = 0;
    baseChildIndent = minIndent;
  }

  let prevDepth = 1;
  for (let i = startIdx; i < items.length; i++) {
    const item = items[i];
    const steps = Math.floor(Math.max(0, item.rawIndent - baseChildIndent) / 2);
    const depth = Math.min(prevDepth + 1, Math.max(2, 2 + steps));
    prevDepth = depth;
    out.push(`${'  '.repeat(depth)}${item.text}`);
  }

  return out.join('\n');
}

function sanitizeFlowchartBlock(lines: string[]): string {
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\t/g, '  ');
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (i === 0 && /^(flowchart|graph)\s*$/i.test(trimmed)) {
      out.push('flowchart TD');
      continue;
    }

    // bungkus label A[Teks (ada kurung)] pake tanda kutip biar parser flowchart ga bingung
    line = line.replace(
      /\b([A-Za-z0-9_]+)\[(?![\[("])([^\]\n]+)\](?!\])/g,
      (_m, id, label) => {
        const clean = String(label).replace(/"/g, "'").trim();
        return /[():;&/<>]/.test(clean) ? `${id}["${clean}"]` : `${id}[${clean}]`;
      }
    );

    line = line.replace(
      /\b([A-Za-z0-9_]+)\((?![(\["])([^)\n]*\([^)\n]*\)[^)\n]*)\)/g,
      (_m, id, label) => {
        const clean = String(label).replace(/[()"]/g, ' ').replace(/\s+/g, ' ').trim();
        return `${id}("${clean}")`;
      }
    );

    out.push(line);
  }

  return out.join('\n');
}

export function sanitizeMermaidCode(rawCode: string, fallbackTitle = 'Peta Konsep'): string {
  const fallback = cleanMermaidNodeLabel(fallbackTitle, 'Peta Konsep');
  if (!rawCode || typeof rawCode !== 'string') {
    return `mindmap\n  root((${fallback}))\n    Konsep Utama`;
  }

  let code = rawCode
    .trim()
    .replace(/^```(?:mermaid|markdown|md|text)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  if (code.includes('\\n') && (!code.includes('\n') || code.split('\\n').length > code.split('\n').length)) {
    code = code.replace(/\\n/g, '\n');
  }
  code = code.replace(/\r\n/g, '\n');

  const rawLines = code.split('\n');
  const nonEmpty = rawLines.map(l => l.trim()).filter(Boolean);
  if (nonEmpty.length === 0) {
    return `mindmap\n  root((${fallback}))\n    Konsep Utama`;
  }

  const first = nonEmpty[0];

  if (first.startsWith('#') || /^[-*+•]\s+/.test(first)) {
    return markdownToMermaidMindmap(code, fallbackTitle);
  }
  if (/^mindmap\b/i.test(first) || code.includes('root((')) {
    return sanitizeMindmapBlock(rawLines, fallbackTitle);
  }
  if (/^(flowchart|graph)\b/i.test(first)) {
    return sanitizeFlowchartBlock(rawLines);
  }
  if (/^(sequenceDiagram|timeline|pie|classDiagram|stateDiagram|erDiagram|gantt|journey|quadrantChart|gitGraph)\b/i.test(first)) {
    return rawLines.join('\n');
  }

  return sanitizeMindmapBlock(rawLines, fallbackTitle);
}

// jaring pengaman terakhir kalo mermaid.render masih gagal gara2 sintaks aneh dari llm
export function buildSafeMindmapFromRawText(rawCode: string, fallbackTitle = 'Peta Konsep'): string {
  const root = cleanMermaidNodeLabel(fallbackTitle, 'Peta Konsep');
  const lines = String(rawCode || '').replace(/\\n/g, '\n').replace(/\r\n/g, '\n').split('\n');

  const extracted: string[] = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (!t || /^(mindmap|flowchart|graph|sequenceDiagram|style|classDef|class|click|linkStyle)\b/i.test(t)) continue;
    if (t.startsWith('```') || t.startsWith('%%')) continue;

    if (t.includes('-->') || t.includes('---')) {
      const parts = t.split(/--+>?|==+>?|\|[^|]*\|/).map(p => extractMindmapLineText(p)).filter(Boolean);
      for (const p of parts) {
        if (!extracted.includes(p)) extracted.push(p);
      }
    } else {
      const clean = extractMindmapLineText(t);
      if (clean && clean.toLowerCase() !== root.toLowerCase() && !extracted.includes(clean)) {
        extracted.push(clean);
      }
    }
  }

  if (extracted.length === 0) {
    return `mindmap\n  root((${root}))\n    Konsep Utama`;
  }

  const out = ['mindmap', `  root((${root}))`];
  for (const item of extracted.slice(0, 18)) {
    out.push(`    ${item}`);
  }
  return out.join('\n');
}
