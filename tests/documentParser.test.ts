import { describe, it, expect } from 'vitest';
import { 
  getFileCategory, 
  parsePdfDocument, 
  parseDocumentFile, 
  parseDocxDocument, 
  parsePptxDocument, 
  parseXlsxDocument 
} from '../utils/documentParser';
import { PDFDocument, StandardFonts } from 'pdf-lib';

// Helper to create a minimal in-memory zip file for tests
function createMinimalZip(files: { name: string; content: string }[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const cdEntries: Uint8Array[] = [];
  let offset = 0;
  const encoder = new TextEncoder();

  for (const f of files) {
    const nameBytes = encoder.encode(f.name);
    const contentBytes = encoder.encode(f.content);

    // Local file header (30 bytes + nameLen + dataLen)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true); // PK\x03\x04
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // method: 0 = stored
    view.setUint16(10, 0, true); // time
    view.setUint16(12, 0, true); // date
    view.setUint32(14, 0, true); // crc32 (mock 0)
    view.setUint32(18, contentBytes.length, true); // compressed size
    view.setUint32(22, contentBytes.length, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true); // extra len
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(contentBytes);

    // Central directory header (46 bytes + nameLen)
    const cd = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cd.buffer);
    cdView.setUint32(0, 0x02014b50, true); // PK\x01\x02
    cdView.setUint16(4, 20, true);
    cdView.setUint16(6, 20, true);
    cdView.setUint16(8, 0, true);
    cdView.setUint16(10, 0, true); // method 0 = stored
    cdView.setUint32(20, contentBytes.length, true);
    cdView.setUint32(24, contentBytes.length, true);
    cdView.setUint16(28, nameBytes.length, true);
    cdView.setUint32(42, offset, true); // local header offset
    cd.set(nameBytes, 46);
    cdEntries.push(cd);

    offset += localHeader.length + contentBytes.length;
  }

  const cdStart = offset;
  let cdSize = 0;
  for (const c of cdEntries) {
    parts.push(c);
    cdSize += c.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // PK\x05\x06
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdStart, true);
  parts.push(eocd);

  const totalLen = parts.reduce((acc, p) => acc + p.length, 0);
  const result = new Uint8Array(totalLen);
  let cur = 0;
  for (const p of parts) {
    result.set(p, cur);
    cur += p.length;
  }
  return result;
}

describe('Document Parser Unit Tests', () => {
  it('correctly categorizes files by extension and mime type', () => {
    expect(getFileCategory('materi.pdf', 'application/pdf')).toBe('pdf');
    expect(getFileCategory('modul.docx', '')).toBe('document');
    expect(getFileCategory('data.xlsx', '')).toBe('spreadsheet');
    expect(getFileCategory('data.csv', 'text/csv')).toBe('spreadsheet');
    expect(getFileCategory('slide.pptx', '')).toBe('presentation');
    expect(getFileCategory('catatan.txt', 'text/plain')).toBe('text');
    expect(getFileCategory('README.md', '')).toBe('text');
    expect(getFileCategory('script.py', '')).toBe('code');
    expect(getFileCategory('schema.json', 'application/json')).toBe('code');
    expect(getFileCategory('diagram.png', 'image/png')).toBe('image');
    expect(getFileCategory('photo.jpg', 'image/jpeg')).toBe('image');
  });

  it('parses real PDF documents and extracts text, metadata, and page count', async () => {
    const doc = await PDFDocument.create();
    doc.setTitle('Fotosintesis Biologi SMA');
    doc.setAuthor('Pak Guru');
    doc.setSubject('Materi Kelas 11');

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page1 = doc.addPage([500, 500]);
    page1.drawText('Bab 1: Pengantar Reaksi Terang dan Reaksi Gelap', { x: 50, y: 450, size: 14, font });
    page1.drawText('Klorofil menyerap cahaya pada panjang gelombang biru dan merah.', { x: 50, y: 420, size: 12, font });

    const page2 = doc.addPage([500, 500]);
    page2.drawText('Bab 2: Siklus Calvin', { x: 50, y: 450, size: 14, font });

    const pdfBytes = await doc.save();
    const dataUrl = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;

    const parsed = await parsePdfDocument(pdfBytes, dataUrl, 'fotosintesis.pdf');

    expect(parsed.name).toBe('fotosintesis.pdf');
    expect(parsed.category).toBe('pdf');
    expect(parsed.pageCount).toBe(2);
    expect(parsed.dataUrl).toBe(dataUrl);
    expect(parsed.text).toContain('Fotosintesis Biologi SMA');
    expect(parsed.text).toContain('Pak Guru');
    expect(parsed.text).toContain('Bab 1: Pengantar Reaksi Terang');
    expect(parsed.text).toContain('Klorofil menyerap cahaya');
    expect(parsed.text).toContain('Bab 2: Siklus Calvin');
  });

  it('parses Word .docx documents', async () => {
    const docXml = `<?xml version="1.0" encoding="UTF-8"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Rangkuman Materi Kimia</w:t></w:r></w:p>
        <w:p><w:r><w:t>Ikatan kovalen terbentuk melalui pemakaian bersama elektron.</w:t></w:r></w:p>
      </w:body>
    </w:document>`;

    const zipBytes = createMinimalZip([{ name: 'word/document.xml', content: docXml }]);
    const parsed = await parseDocxDocument(zipBytes, 'kimia.docx');

    expect(parsed.category).toBe('document');
    expect(parsed.text).toContain('## Rangkuman Materi Kimia');
    expect(parsed.text).toContain('Ikatan kovalen terbentuk');
  });

  it('parses PowerPoint .pptx presentations', async () => {
    const slide1Xml = `<p:sld><p:cSld><p:spTree>
      <p:sp><p:txBody><a:p><a:r><a:t>Pengenalan Tata Surya</a:t></a:r></a:p></p:txBody></p:sp>
    </p:spTree></p:cSld></p:sld>`;

    const slide2Xml = `<p:sld><p:cSld><p:spTree>
      <p:sp><p:txBody><a:p><a:r><a:t>Planet Dalam: Merkurius, Venus, Bumi, Mars</a:t></a:r></a:p></p:txBody></p:sp>
    </p:spTree></p:cSld></p:sld>`;

    const zipBytes = createMinimalZip([
      { name: 'ppt/slides/slide1.xml', content: slide1Xml },
      { name: 'ppt/slides/slide2.xml', content: slide2Xml }
    ]);

    const parsed = await parsePptxDocument(zipBytes, 'astronomi.pptx');

    expect(parsed.category).toBe('presentation');
    expect(parsed.pageCount).toBe(2);
    expect(parsed.text).toContain('### Slide 1');
    expect(parsed.text).toContain('Pengenalan Tata Surya');
    expect(parsed.text).toContain('### Slide 2');
    expect(parsed.text).toContain('Planet Dalam: Merkurius');
  });

  it('parses Excel .xlsx spreadsheets', async () => {
    const sharedStringsXml = `<sst count="2" uniqueCount="2">
      <si><t>Nama Siswa</t></si>
      <si><t>Nilai Ujian</t></si>
    </sst>`;

    const sheet1Xml = `<worksheet>
      <sheetData>
        <row r="1">
          <c r="A1" t="s"><v>0</v></c>
          <c r="B1" t="s"><v>1</v></c>
        </row>
        <row r="2">
          <c r="A2"><v>Budi</v></c>
          <c r="B2"><v>95</v></c>
        </row>
      </sheetData>
    </worksheet>`;

    const zipBytes = createMinimalZip([
      { name: 'xl/sharedStrings.xml', content: sharedStringsXml },
      { name: 'xl/worksheets/sheet1.xml', content: sheet1Xml }
    ]);

    const parsed = await parseXlsxDocument(zipBytes, 'nilai.xlsx');

    expect(parsed.category).toBe('spreadsheet');
    expect(parsed.text).toContain('Nama Siswa');
    expect(parsed.text).toContain('Nilai Ujian');
    expect(parsed.text).toContain('Budi');
    expect(parsed.text).toContain('95');
  });

  it('parses plain text and markdown files', async () => {
    const content = '# Rencana Pelajaran Fisika\n\n1. Hukum Newton I\n2. Hukum Newton II: F = m * a\n3. Hukum Newton III: Aksi = -Reaksi';
    const file = new File([content], 'fisika.md', { type: 'text/markdown' });

    const parsed = await parseDocumentFile(file);

    expect(parsed.name).toBe('fisika.md');
    expect(parsed.category).toBe('text');
    expect(parsed.text).toBe(content);
    expect(parsed.wordCount).toBeGreaterThan(5);
  });

  it('parses code files like Python or JSON', async () => {
    const pyCode = 'def hitung_energi(m, c=3e8):\n    return m * (c ** 2)\n';
    const file = new File([pyCode], 'rumus.py', { type: 'text/x-python' });

    const parsed = await parseDocumentFile(file);

    expect(parsed.name).toBe('rumus.py');
    expect(parsed.category).toBe('code');
    expect(parsed.text).toBe(pyCode);
  });
});
