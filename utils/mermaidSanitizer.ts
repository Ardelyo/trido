/**
 * Deterministic Mermaid Mindmap & Flowchart Sanitizer + Self-Healing Engine
 * Prevents Mermaid v11 lexer/parser crashes caused by LLM syntax quirks:
 * - Unescaped parentheses/brackets/braces inside mindmap nodes: e.g. "Arteri (Pembuluh Nadi)"
 * - Colons, semicolons, quotes, or markdown bullets (- / * / 1.) inside mindmap nodes
 * - Multiple root nodes ("There can be only one root") or indentation jumps
 * - Markdown code fences (```mermaid ... ```) or literal "\\n" sequences
 * - Unquoted special characters inside flowchart node labels: e.g. A[Fase 1 (Inisiasi): ATP]
 */

export function cleanMermaidNodeLabel(raw: string, fallback = 'Topik'): string {
  let s = String(raw || '')
    // Replace parenthesized expressions "Foo (Bar)" -> "Foo - Bar"
    .replace(/\s*\(([^()]*)\)/g, ' - $1')
    .replace(/\s*\[([^\[\]]*)\]/g, ' - $1')
    .replace(/\s*\{([^{}]*)\}/g, ' - $1')
    .replace(/\s*:\s*/g, ' - ')
    // Strip any remaining stray brackets, parens, quotes, semicolons, hashes, backticks
    .replace(/[()\[\]{}"'`;#]/g, ' ')
    .replace(/\s*-\s*-\s*/g, ' - ')
    // Strip leading dashes/hyphens left over from replacements
    .replace(/^[\s\-–—•*+]+/, '')
    .replace(/[\s\-–—]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return s || fallback;
}

/**
 * Converts hierarchical markdown (# Headings and - / * bullet lists)
 * into guaranteed-valid Mermaid mindmap syntax.
 */
export function markdownToMermaidMindmap(md: string, fallbackTitle = 'Peta Konsep'): string {
  const normalized = String(md || '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const result: string[] = ['mindmap'];
  let rootSet = false;
  let rootTitle = cleanMermaidNodeLabel(fallbackTitle, 'Peta Konsep');
  let currentHeadingLevel = 1;
  let prevDepth = 1; // root is depth 1 (2 spaces)

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('```')) continue;

    // Heading parsing: # Root, ## Branch, ### Sub-branch
    if (line.startsWith('#')) {
      const match = line.match(/^(#+)\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = cleanMermaidNodeLabel(match[2], 'Cabang');
        if (level === 1 && !rootSet) {
          rootTitle = text;
          rootSet = true;
          result.push(`  root((${rootTitle}))`);
          currentHeadingLevel = 1;
          prevDepth = 1;
        } else {
          if (!rootSet) {
            rootSet = true;
            result.push(`  root((${rootTitle}))`);
            prevDepth = 1;
          }
          currentHeadingLevel = level;
          const targetDepth = Math.min(prevDepth + 1, Math.max(2, level));
          prevDepth = targetDepth;
          result.push(`${'  '.repeat(targetDepth)}${text}`);
        }
        continue;
      }
    }

    // Bullet / numbered list parsing: - Item, * Item, 1. Item
    const bulletMatch = rawLine.match(/^(\s*)(?:[-*+•]|\d+[.)])\s+(.+)$/);
    if (bulletMatch) {
      if (!rootSet) {
        rootSet = true;
        result.push(`  root((${rootTitle}))`);
        prevDepth = 1;
      }
      const rawSpaces = bulletMatch[1].replace(/\t/g, '  ').length;
      const bulletDepth = Math.floor(rawSpaces / 2);
      const desiredDepth = Math.max(2, currentHeadingLevel + 1 + bulletDepth);
      const targetDepth = Math.min(prevDepth + 1, desiredDepth);
      prevDepth = targetDepth;
      const text = cleanMermaidNodeLabel(bulletMatch[2], 'Detail');
      result.push(`${'  '.repeat(targetDepth)}${text}`);
      continue;
    }
  }

  if (!rootSet) {
    result.push(`  root((${rootTitle}))`);
  }

  return result.join('\n');
}

/**
 * Unwraps a mindmap node shape wrapper such as:
 *   root((Judul Topik)) -> Judul Topik
 *   id((Subtopik)) -> Subtopik
 *   id[Subtopik] -> Subtopik
 *   ((Subtopik)) -> Subtopik
 */
function extractMindmapLineText(trimmedLine: string): string {
  let s = trimmedLine
    // Strip leading markdown bullets or numbers if LLM mixed them into mindmap
    .replace(/^(?:[-*+•]|\d+[.)])\s+/, '')
    .trim();

  // Check if line starts with an identifier + shape wrapper: e.g. root((Text)), node1[Text], A(Text)
  const wrapperMatch =
    s.match(/^[A-Za-z0-9_-]*\(\(\((.+)\)\)\)$/) ||
    s.match(/^[A-Za-z0-9_-]*\(\((.+)\)\)$/) ||
    s.match(/^[A-Za-z0-9_-]*\{\{(.+)\}\}$/) ||
    s.match(/^[A-Za-z0-9_-]*\[\[(.+)\]\]$/) ||
    s.match(/^[A-Za-z0-9_-]*\[(.+)\]$/) ||
    s.match(/^[A-Za-z0-9_-]*\((.+)\)$/);

  if (wrapperMatch && wrapperMatch[1]) {
    s = wrapperMatch[1];
  }

  return cleanMermaidNodeLabel(s, '');
}

/**
 * Sanitizes a Mermaid mindmap block to guarantee:
 * 1. First line is `mindmap`
 * 2. Second line is `  root((CleanRoot))` (depth 1 = 2 spaces)
 * 3. Every child line is at depth >= 2 (>= 4 spaces), never jumps by more than +1 depth (+2 spaces),
 *    and contains zero unescaped parentheses/brackets/colons/quotes.
 */
function sanitizeMindmapBlock(lines: string[], fallbackTitle = 'Peta Konsep'): string {
  const cleanFallback = cleanMermaidNodeLabel(fallbackTitle, 'Peta Konsep');
  const contentLines: { rawIndent: number; text: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (/^mindmap\b/i.test(trimmed)) continue;
    if (trimmed.startsWith('%%') || trimmed.startsWith('::icon')) continue;

    const leadingSpaces = raw.replace(/\t/g, '  ').match(/^(\s*)/)?.[1].length || 0;
    const text = extractMindmapLineText(trimmed);
    if (!text) continue;

    contentLines.push({ rawIndent: leadingSpaces, text });
  }

  if (contentLines.length === 0) {
    return `mindmap\n  root((${cleanFallback}))\n    Cabang Utama`;
  }

  // Determine if the first line is the single root or if there are multiple top-level items
  const minIndent = Math.min(...contentLines.map(l => l.rawIndent));
  const topLevelCount = contentLines.filter(l => l.rawIndent === minIndent).length;

  const result: string[] = ['mindmap'];
  let startIndex = 0;
  let baseChildIndent = minIndent;

  if (topLevelCount === 1) {
    const rootText = contentLines[0].text || cleanFallback;
    result.push(`  root((${rootText}))`);
    startIndex = 1;
    const remaining = contentLines.slice(1);
    baseChildIndent = remaining.length > 0 ? Math.min(...remaining.map(l => l.rawIndent)) : minIndent + 2;
  } else {
    // Multiple top-level lines existed! Wrap them all under a single root((fallbackTitle))
    result.push(`  root((${cleanFallback}))`);
    startIndex = 0;
    baseChildIndent = minIndent;
  }

  let prevDepth = 1; // root is at depth 1 (2 spaces)

  for (let i = startIndex; i < contentLines.length; i++) {
    const item = contentLines[i];
    const relIndent = Math.max(0, item.rawIndent - baseChildIndent);
    const relativeSteps = Math.floor(relIndent / 2);
    // Child depth must be at least 2 (4 spaces) and at most prevDepth + 1
    const desiredDepth = 2 + relativeSteps;
    const clampedDepth = Math.min(prevDepth + 1, Math.max(2, desiredDepth));
    prevDepth = clampedDepth;

    result.push(`${'  '.repeat(clampedDepth)}${item.text}`);
  }

  return result.join('\n');
}

/**
 * Sanitizes Flowchart / Graph syntax so node labels containing parentheses,
 * colons, slashes, or quotes are safely double-quoted.
 */
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

    // Quote unquoted square-bracket labels A[Text (with parens)] -> A["Text (with parens)"]
    line = line.replace(
      /\b([A-Za-z0-9_]+)\[(?![\[("])([^\]\n]+)\](?!\])/g,
      (_match, id, label) => {
        const cleanLabel = String(label).replace(/"/g, "'").trim();
        if (/[():;&/<>]/.test(cleanLabel)) {
          return `${id}["${cleanLabel}"]`;
        }
        return `${id}[${cleanLabel}]`;
      }
    );

    // Quote unquoted round-paren labels A(Text (with parens)) -> A("Text - with parens")
    line = line.replace(
      /\b([A-Za-z0-9_]+)\((?![(\["])([^)\n]*\([^)\n]*\)[^)\n]*)\)/g,
      (_match, id, label) => {
        const cleanLabel = String(label).replace(/[()"]/g, ' ').replace(/\s+/g, ' ').trim();
        return `${id}("${cleanLabel}")`;
      }
    );

    out.push(line);
  }

  return out.join('\n');
}

/**
 * Main entry point: sanitizes any Mermaid code string (mindmap, flowchart, markdown list, etc.)
 * into valid Mermaid v11 syntax.
 */
export function sanitizeMermaidCode(rawCode: string, fallbackTitle = 'Peta Konsep'): string {
  if (!rawCode || typeof rawCode !== 'string') {
    const cleanFallback = cleanMermaidNodeLabel(fallbackTitle, 'Peta Konsep');
    return `mindmap\n  root((${cleanFallback}))\n    Konsep Utama`;
  }

  // 1. Strip code fences and normalize escaped newlines
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
  const nonEmptyLines = rawLines.map(l => l.trim()).filter(Boolean);
  if (nonEmptyLines.length === 0) {
    const cleanFallback = cleanMermaidNodeLabel(fallbackTitle, 'Peta Konsep');
    return `mindmap\n  root((${cleanFallback}))\n    Konsep Utama`;
  }

  const firstLine = nonEmptyLines[0];

  // 2. If LLM passed Markdown headings/bullets instead of Mermaid syntax, convert it
  if (firstLine.startsWith('#') || /^[-*+•]\s+/.test(firstLine)) {
    return markdownToMermaidMindmap(code, fallbackTitle);
  }

  // 3. Mindmap diagram
  if (/^mindmap\b/i.test(firstLine) || code.includes('root((')) {
    return sanitizeMindmapBlock(rawLines, fallbackTitle);
  }

  // 4. Flowchart / Graph diagram
  if (/^(flowchart|graph)\b/i.test(firstLine)) {
    return sanitizeFlowchartBlock(rawLines);
  }

  // 5. Other known Mermaid diagram headers (sequenceDiagram, timeline, pie, classDiagram, stateDiagram, erDiagram, gantt, journey)
  if (/^(sequenceDiagram|timeline|pie|classDiagram|stateDiagram|erDiagram|gantt|journey|quadrantChart|gitGraph)\b/i.test(firstLine)) {
    return rawLines.join('\n');
  }

  // 6. Unknown/bare indented text without header -> treat as mindmap
  return sanitizeMindmapBlock(rawLines, fallbackTitle);
}

/**
 * Last-resort self-healing fallback: takes any arbitrary broken diagram text
 * and extracts all human-readable labels into a guaranteed-valid Mermaid mindmap.
 */
export function buildSafeMindmapFromRawText(rawCode: string, fallbackTitle = 'Peta Konsep'): string {
  const cleanRoot = cleanMermaidNodeLabel(fallbackTitle, 'Peta Konsep');
  const lines = String(rawCode || '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .split('\n');

  const extracted: string[] = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (!t || /^(mindmap|flowchart|graph|sequenceDiagram|style|classDef|class|click|linkStyle)\b/i.test(t)) continue;
    if (t.startsWith('```') || t.startsWith('%%')) continue;

    // If line has arrows (A --> B), split into parts
    if (t.includes('-->') || t.includes('---')) {
      const parts = t.split(/--+>?|==+>?|\|[^|]*\|/).map(p => extractMindmapLineText(p)).filter(Boolean);
      for (const p of parts) {
        if (!extracted.includes(p)) extracted.push(p);
      }
    } else {
      const clean = extractMindmapLineText(t);
      if (clean && clean.toLowerCase() !== cleanRoot.toLowerCase() && !extracted.includes(clean)) {
        extracted.push(clean);
      }
    }
  }

  if (extracted.length === 0) {
    return `mindmap\n  root((${cleanRoot}))\n    Konsep Utama`;
  }

  const out = ['mindmap', `  root((${cleanRoot}))`];
  for (const item of extracted.slice(0, 18)) {
    out.push(`    ${item}`);
  }
  return out.join('\n');
}
