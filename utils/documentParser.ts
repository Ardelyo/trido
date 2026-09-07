import { PDFDocument } from 'pdf-lib';
import { AttachedDocument, DocumentCategory } from '../types';

/**
 * Universal Document and File Parser for Trido
 * Parses PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx, .csv),
 * Plain Text, Markdown, Code, and Images into structured text and media data.
 */

// Helper to decompress raw deflate data (used in ZIP archives like docx, pptx, xlsx)
async function decompressDeflateRaw(compressedData: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(compressedData);
      writer.close();

      const chunks: Uint8Array[] = [];
      const reader = ds.readable.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      const result = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    } catch {
      // Fallback below
    }
  }

  // Node.js fallback if in SSR / server test
  if (typeof process !== 'undefined' && (process as any).versions?.node) {
    try {
      const zlib = await import('zlib');
      const buf = zlib.inflateRawSync(Buffer.from(compressedData));
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch {}
  }

  return compressedData;
}

// Helper to decompress zlib/flate streams (used in PDF streams)
async function decompressFlate(compressedData: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      writer.write(compressedData);
      writer.close();

      const chunks: Uint8Array[] = [];
      const reader = ds.readable.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      const result = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    } catch {
      // Try raw deflate
      try {
        return await decompressDeflateRaw(compressedData);
      } catch {
        return null;
      }
    }
  }

  if (typeof process !== 'undefined' && (process as any).versions?.node) {
    try {
      const zlib = await import('zlib');
      const buf = zlib.inflateSync(Buffer.from(compressedData));
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch {
      try {
        const zlib = await import('zlib');
        const buf = zlib.inflateRawSync(Buffer.from(compressedData));
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      } catch {
        return null;
      }
    }
  }

  return null;
}

// Minimal Central Directory ZIP reader
interface ZipEntry {
  fileName: string;
  method: number;
  compressedData: Uint8Array;
}

function parseZipEntries(buffer: Uint8Array): Map<string, ZipEntry> {
  const entries = new Map<string, ZipEntry>();
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // Find End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) return entries;

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  let cdPos = cdOffset;
  const decoder = new TextDecoder('utf-8');

  for (let i = 0; i < totalEntries && cdPos + 46 <= buffer.length; i++) {
    if (view.getUint32(cdPos, true) !== 0x02014b50) break; // PK\x01\x02

    const method = view.getUint16(cdPos + 10, true);
    const compressedSize = view.getUint32(cdPos + 20, true);
    const nameLen = view.getUint16(cdPos + 28, true);
    const extraLen = view.getUint16(cdPos + 30, true);
    const commentLen = view.getUint16(cdPos + 32, true);
    const localHeaderOffset = view.getUint32(cdPos + 42, true);

    const nameBytes = buffer.subarray(cdPos + 46, cdPos + 46 + nameLen);
    const fileName = decoder.decode(nameBytes);

    if (localHeaderOffset + 30 <= buffer.length) {
      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
      entries.set(fileName, { fileName, method, compressedData });
    }

    cdPos += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

// Unescape and decode PDF hex or literal strings
function decodePdfString(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    const hex = trimmed.slice(1, -1).replace(/\s+/g, '');
    let res = '';
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substring(i, i + 2), 16);
      if (!isNaN(code)) res += String.fromCharCode(code);
    }
    return res;
  }
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return trimmed.slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
  }
  return raw;
}

// Extract readable text from uncompressed PDF content stream
function extractPdfStreamText(content: string): string {
  const lines: string[] = [];

  // Match Tj: (<hex or literal>) Tj
  const tjRegex = /(<[0-9A-Fa-f\s]+>|\(.*?\))\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(content)) !== null) {
    const decoded = decodePdfString(match[1]);
    if (decoded.trim()) lines.push(decoded.trim());
  }

  // Match TJ: [ ... ] TJ
  const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(content)) !== null) {
    const arrayContent = match[1];
    const subRegex = /(<[0-9A-Fa-f\s]+>|\(.*?\))/g;
    let subMatch: RegExpExecArray | null;
    const lineParts: string[] = [];
    while ((subMatch = subRegex.exec(arrayContent)) !== null) {
      lineParts.push(decodePdfString(subMatch[1]));
    }
    if (lineParts.length > 0) {
      const merged = lineParts.join('').trim();
      if (merged) lines.push(merged);
    }
  }

  return lines.join(' ');
}

// Parse PDF File
export async function parsePdfDocument(buffer: Uint8Array, dataUrl: string, fileName: string): Promise<AttachedDocument> {
  let pageCount = 1;
  let title = '';
  let author = '';
  let subject = '';

  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    pageCount = pdfDoc.getPageCount();
    title = pdfDoc.getTitle() || '';
    author = pdfDoc.getAuthor() || '';
    subject = pdfDoc.getSubject() || '';
  } catch (e) {
    console.warn('PDF load warning:', e);
  }

  // Extract text from PDF content streams
  const textDecoder = new TextDecoder('latin1');
  const pdfStr = textDecoder.decode(buffer);
  const streamRegex = /\/Length\s+(\d+)[\s\S]*?stream[\r\n]+/g;
  let m: RegExpExecArray | null;
  const extractedChunks: string[] = [];

  while ((m = streamRegex.exec(pdfStr)) !== null) {
    const len = parseInt(m[1], 10);
    const start = m.index + m[0].length;
    if (start + len <= buffer.length) {
      const streamBytes = buffer.subarray(start, start + len);
      const decompressed = await decompressFlate(streamBytes);
      if (decompressed) {
        const decompStr = new TextDecoder('utf-8', { fatal: false }).decode(decompressed);
        const text = extractPdfStreamText(decompStr);
        if (text && text.trim()) {
          extractedChunks.push(text);
        }
      }
    }
  }

  let fullText = extractedChunks.join('\n\n').trim();

  // If text stream yielded nothing (e.g. scanned PDF), provide structured note
  if (!fullText) {
    fullText = `[Dokumen PDF: "${fileName}", ${pageCount} halaman. Konten visual lengkap akan dianalisis secara multimodal oleh Gemini/Vertex AI.]`;
  }

  const headerInfo = [
    title ? `Judul: ${title}` : null,
    author ? `Penulis: ${author}` : null,
    subject ? `Subjek: ${subject}` : null,
    `Jumlah Halaman: ${pageCount}`
  ].filter(Boolean).join(' | ');

  const resultText = headerInfo ? `--- Metadata PDF: ${headerInfo} ---\n\n${fullText}` : fullText;
  const preview = fullText.slice(0, 180).replace(/\s+/g, ' ');

  return {
    name: fileName,
    type: 'application/pdf',
    size: buffer.length,
    category: 'pdf',
    text: resultText,
    pageCount,
    dataUrl,
    previewSnippet: preview,
    wordCount: resultText.split(/\s+/).filter(Boolean).length
  };
}

// Parse Word Document (.docx)
export async function parseDocxDocument(buffer: Uint8Array, fileName: string): Promise<AttachedDocument> {
  const entries = parseZipEntries(buffer);
  const docEntry = entries.get('word/document.xml');

  if (!docEntry) {
    return {
      name: fileName,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: buffer.length,
      category: 'document',
      text: `[Dokumen Word: ${fileName}]`,
      previewSnippet: fileName
    };
  }

  const xmlBytes = docEntry.method === 8 ? await decompressDeflateRaw(docEntry.compressedData) : docEntry.compressedData;
  const xml = new TextDecoder('utf-8').decode(xmlBytes);

  // Extract paragraphs (<w:p>) and tables (<w:tbl>)
  const paragraphs: string[] = [];
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(xml)) !== null) {
    const pContent = pMatch[0];
    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let tMatch: RegExpExecArray | null;
    const pRuns: string[] = [];
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      pRuns.push(tMatch[1]);
    }
    const paraText = pRuns.join('').trim();
    if (paraText) {
      // Check if heading style
      if (pContent.includes('Heading1') || pContent.includes('heading 1')) {
        paragraphs.push(`## ${paraText}`);
      } else if (pContent.includes('Heading2') || pContent.includes('heading 2')) {
        paragraphs.push(`### ${paraText}`);
      } else {
        paragraphs.push(paraText);
      }
    }
  }

  const fullText = paragraphs.join('\n\n').trim() || `[Dokumen Word: ${fileName}]`;
  const preview = fullText.slice(0, 180).replace(/\s+/g, ' ');

  return {
    name: fileName,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: buffer.length,
    category: 'document',
    text: fullText,
    previewSnippet: preview,
    wordCount: fullText.split(/\s+/).filter(Boolean).length
  };
}

// Parse PowerPoint (.pptx)
export async function parsePptxDocument(buffer: Uint8Array, fileName: string): Promise<AttachedDocument> {
  const entries = parseZipEntries(buffer);
  const slideEntries: { name: string; num: number; entry: ZipEntry }[] = [];

  for (const [name, entry] of entries) {
    const match = name.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (match) {
      slideEntries.push({ name, num: parseInt(match[1], 10), entry });
    }
  }

  slideEntries.sort((a, b) => a.num - b.num);

  const slideTexts: string[] = [];
  for (const item of slideEntries) {
    const bytes = item.entry.method === 8 ? await decompressDeflateRaw(item.entry.compressedData) : item.entry.compressedData;
    const xml = new TextDecoder('utf-8').decode(bytes);

    const paras: string[] = [];
    const pRegex = /<a:p[\s>][\s\S]*?<\/a:p>/g;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = pRegex.exec(xml)) !== null) {
      const pContent = pMatch[0];
      const tRegex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
      let tMatch: RegExpExecArray | null;
      const runs: string[] = [];
      while ((tMatch = tRegex.exec(pContent)) !== null) {
        runs.push(tMatch[1]);
      }
      const pStr = runs.join('').trim();
      if (pStr) paras.push(pStr);
    }

    if (paras.length > 0) {
      slideTexts.push(`### Slide ${item.num}\n${paras.join('\n')}`);
    }
  }

  const fullText = slideTexts.join('\n\n').trim() || `[Presentasi PowerPoint: ${fileName}, ${slideEntries.length} slide]`;
  const preview = fullText.slice(0, 180).replace(/\s+/g, ' ');

  return {
    name: fileName,
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: buffer.length,
    category: 'presentation',
    text: fullText,
    pageCount: slideEntries.length,
    previewSnippet: preview,
    wordCount: fullText.split(/\s+/).filter(Boolean).length
  };
}

// Parse Excel (.xlsx)
export async function parseXlsxDocument(buffer: Uint8Array, fileName: string): Promise<AttachedDocument> {
  const entries = parseZipEntries(buffer);

  // Parse Shared Strings
  const sharedStrings: string[] = [];
  const ssEntry = entries.get('xl/sharedStrings.xml');
  if (ssEntry) {
    const ssBytes = ssEntry.method === 8 ? await decompressDeflateRaw(ssEntry.compressedData) : ssEntry.compressedData;
    const ssXml = new TextDecoder('utf-8').decode(ssBytes);
    const siRegex = /<si[\s>][\s\S]*?<\/si>/g;
    let siMatch: RegExpExecArray | null;
    while ((siMatch = siRegex.exec(ssXml)) !== null) {
      const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g;
      let tMatch: RegExpExecArray | null;
      const parts: string[] = [];
      while ((tMatch = tRegex.exec(siMatch[0])) !== null) {
        parts.push(tMatch[1]);
      }
      sharedStrings.push(parts.join(''));
    }
  }

  // Parse Worksheets
  const sheetTexts: string[] = [];
  let sheetIndex = 1;
  while (true) {
    const sheetEntry = entries.get(`xl/worksheets/sheet${sheetIndex}.xml`);
    if (!sheetEntry) break;

    const sheetBytes = sheetEntry.method === 8 ? await decompressDeflateRaw(sheetEntry.compressedData) : sheetEntry.compressedData;
    const sheetXml = new TextDecoder('utf-8').decode(sheetBytes);

    const rows: string[] = [];
    const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
      const rowContent = rowMatch[1];
      const cRegex = /<c\s+([^>]*?)>([\s\S]*?)<\/c>/g;
      let cMatch: RegExpExecArray | null;
      const cells: string[] = [];

      while ((cMatch = cRegex.exec(rowContent)) !== null) {
        const attrs = cMatch[1];
        const inner = cMatch[2];
        const isString = attrs.includes('t="s"');
        const vMatch = inner.match(/<v>([\s\S]*?)<\/v>/);
        if (vMatch) {
          const val = vMatch[1].trim();
          if (isString) {
            const idx = parseInt(val, 10);
            cells.push(sharedStrings[idx] || '');
          } else {
            cells.push(val);
          }
        }
      }
      if (cells.length > 0) {
        rows.push(`| ${cells.join(' | ')} |`);
      }
    }

    if (rows.length > 0) {
      sheetTexts.push(`### Sheet ${sheetIndex}\n${rows.slice(0, 500).join('\n')}`);
    }
    sheetIndex++;
  }

  const fullText = sheetTexts.join('\n\n').trim() || `[File Spreadsheet: ${fileName}]`;
  const preview = fullText.slice(0, 180).replace(/\s+/g, ' ');

  return {
    name: fileName,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
    category: 'spreadsheet',
    text: fullText,
    previewSnippet: preview,
    wordCount: fullText.split(/\s+/).filter(Boolean).length
  };
}

// Categorize file by extension and mime type
export function getFileCategory(fileName: string, mimeType: string): DocumentCategory {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico'].includes(ext)) {
    return 'image';
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (['docx', 'doc', 'rtf', 'odt'].includes(ext)) {
    return 'document';
  }
  if (['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext)) {
    return 'spreadsheet';
  }
  if (['pptx', 'ppt', 'odp'].includes(ext)) {
    return 'presentation';
  }
  if (['txt', 'md', 'markdown', 'text', 'log'].includes(ext)) {
    return 'text';
  }
  if (['json', 'js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'xml', 'yaml', 'yml', 'sql', 'sh', 'bat', 'c', 'cpp', 'java'].includes(ext)) {
    return 'code';
  }
  return 'other';
}

// Universal Main Entry Point: parse any File object
export async function parseDocumentFile(file: File): Promise<AttachedDocument> {
  const category = getFileCategory(file.name, file.type);

  // Helper to read file as ArrayBuffer
  const readBuffer = (): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper to read file as DataURL
  const readDataUrl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper to read file as Text
  const readText = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // 1. Image
  if (category === 'image') {
    const dataUrl = await readDataUrl();
    return {
      name: file.name,
      type: file.type || 'image/png',
      size: file.size,
      category: 'image',
      text: `[Gambar dilempirkan: ${file.name}, ukuran: ${(file.size / 1024).toFixed(1)} KB]`,
      dataUrl,
      previewSnippet: file.name,
      wordCount: 0
    };
  }

  // 2. PDF
  if (category === 'pdf') {
    const [buffer, dataUrl] = await Promise.all([readBuffer(), readDataUrl()]);
    return await parsePdfDocument(buffer, dataUrl, file.name);
  }

  // 3. Word Document (.docx)
  if (file.name.toLowerCase().endsWith('.docx')) {
    const buffer = await readBuffer();
    return await parseDocxDocument(buffer, file.name);
  }

  // 4. PowerPoint (.pptx)
  if (file.name.toLowerCase().endsWith('.pptx')) {
    const buffer = await readBuffer();
    return await parsePptxDocument(buffer, file.name);
  }

  // 5. Excel (.xlsx)
  if (file.name.toLowerCase().endsWith('.xlsx')) {
    const buffer = await readBuffer();
    return await parseXlsxDocument(buffer, file.name);
  }

  // 6. Plain Text, Markdown, CSV, Code, JSON
  if (category === 'text' || category === 'code' || category === 'spreadsheet' || category === 'document') {
    try {
      const text = await readText();
      const preview = text.slice(0, 180).replace(/\s+/g, ' ');
      return {
        name: file.name,
        type: file.type || 'text/plain',
        size: file.size,
        category,
        text,
        previewSnippet: preview,
        wordCount: text.split(/\s+/).filter(Boolean).length
      };
    } catch {
      // Fall through to other
    }
  }

  // 7. Fallback / Other
  try {
    const text = await readText();
    // Check if looks like valid text
    if (!text.includes('\0')) {
      const preview = text.slice(0, 180).replace(/\s+/g, ' ');
      return {
        name: file.name,
        type: file.type || 'text/plain',
        size: file.size,
        category: 'text',
        text,
        previewSnippet: preview,
        wordCount: text.split(/\s+/).filter(Boolean).length
      };
    }
  } catch {}

  return {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    category: 'other',
    text: `[File dilampirkan: ${file.name}, tipe: ${file.type || 'biner'}, ukuran: ${(file.size / 1024).toFixed(1)} KB]`,
    previewSnippet: file.name
  };
}
