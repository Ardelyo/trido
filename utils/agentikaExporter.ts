/**
 * Agentika Productivity Exporter
 * Generates genuine native .docx OpenXML files, UTF-8 CSV spreadsheets,
 * HTML slide decks, and clean Markdown files.
 */
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Packer
} from 'docx';

// 1. Export as Native OpenXML Word (.docx)
export async function exportToDocx(title: string, markdownContent: string): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  // Header Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 }
    })
  );

  // Subtitle stamp
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'TRIDO AGENTIKA · STUDIO PRODUKTIVITAS PENDIDIK',
          bold: true,
          color: '1550aa',
          size: 18
        })
      ],
      spacing: { after: 300 }
    })
  );

  // Split lines and parse markdown structures
  const lines = markdownContent.split('\n');
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const docxRows = tableRows.map((row, rIdx) => {
      const isHeader = rIdx === 0;
      return new TableRow({
        children: row.map(cell => new TableCell({
          width: { size: 100 / Math.max(row.length, 1), type: WidthType.PERCENTAGE },
          shading: isHeader ? { fill: 'F1F5F9' } : undefined,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cell.trim(),
                  bold: isHeader,
                  size: 20
                })
              ]
            })
          ]
        }))
      });
    });

    children.push(
      new Table({
        rows: docxRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      })
    );
    // Add spacer after table
    children.push(new Paragraph({ text: '', spacing: { after: 150 } }));
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Markdown Table row
    if (line.startsWith('|') && line.endsWith('|')) {
      // Skip markdown separator row like |---|---|
      if (/^\|[\s:-|-]+\|$/.test(line)) {
        continue;
      }
      inTable = true;
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!line) {
      continue;
    }

    // Heading 1 (# )
    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.slice(2).trim(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 }
        })
      );
      continue;
    }

    // Heading 2 (## )
    if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.slice(3).trim(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );
      continue;
    }

    // Heading 3 (### )
    if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.slice(4).trim(),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 }
        })
      );
      continue;
    }

    // Bullet list item (- or *)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: parseInlineFormatting(line.slice(2).trim()),
          spacing: { after: 60 }
        })
      );
      continue;
    }

    // Numbered list item (e.g. 1. )
    const numberedMatch = line.match(/^\d+\.\s+(.*)/);
    if (numberedMatch) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: line.split(/\s+/)[0] + ' ', bold: true }),
            ...parseInlineFormatting(numberedMatch[1])
          ],
          spacing: { after: 60 }
        })
      );
      continue;
    }

    // Normal paragraph
    children.push(
      new Paragraph({
        children: parseInlineFormatting(line),
        spacing: { after: 120 }
      })
    );
  }

  // Flush table if file ended on table
  if (inTable) {
    flushTable();
  }

  // Footer copyright
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'TRIDO 2026 Hak Cipta Terdaftar Kementerian Hukum Republik Indonesia · Karya Ardellio Satria Anindito',
          italics: true,
          size: 16,
          color: '94A3B8'
        })
      ],
      spacing: { before: 400 }
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${slugify(title)}.docx`);
}

// 2. Export as Spreadsheet (.xlsx / CSV with UTF-8 BOM)
export function exportToSpreadsheet(title: string, csvData: string) {
  const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${slugify(title)}.csv`);
}

// 3. Export as Presentation (.pptx / HTML Slide Deck)
export function exportToSlideDeck(title: string, slides: { title: string; content: string; notes?: string }[]) {
  const slidesHtml = slides.map((s, idx) => `
    <div class="slide" style="page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 60px 80px; box-sizing: border-box; background: #ffffff; border-bottom: 2px dashed #cbd5e1; position: relative;">
      <div>
        <div style="font-size: 13px; font-weight: 800; color: #1550aa; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px;">Slide ${idx + 1} dari ${slides.length} · Trido Agentika</div>
        <h2 style="font-size: 38px; color: #0a1a3a; margin-top: 0; margin-bottom: 24px; font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 800;">${s.title}</h2>
        <div style="font-size: 20px; line-height: 1.6; color: #334155; font-family: 'Segoe UI', system-ui, sans-serif;">
          ${s.content.replace(/\n/g, '<br/>')}
        </div>
      </div>
      ${s.notes ? `<div style="margin-top: 30px; padding: 16px 20px; background: #f8fafc; border-left: 4px solid #ffcc00; border-radius: 8px; font-size: 15px; color: #64748b;"><strong>Catatan Guru:</strong> ${s.notes}</div>` : ''}
      <div style="font-size: 12px; color: #94a3b8; font-weight: 600; margin-top: 20px;">TRIDO SMARTBOARD · PRESENTASI KELAS</div>
    </div>
  `).join('');

  const fullDeck = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title} - Presentasi Agentika</title>
<style>
  @page { size: 16in 9in; margin: 0; }
  body { margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f1f5f9; }
  .deck-controls { position: fixed; top: 16px; right: 16px; z-index: 999; background: #0a1a3a; color: white; padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: bold; box-shadow: 0 4px 20px rgba(0,0,0,0.2); cursor: pointer; }
</style>
</head>
<body>
<div class="deck-controls" onclick="window.print()">🖨️ Cetak / Simpan PDF Slide (Ctrl+P)</div>
${slidesHtml}
</body>
</html>`;

  const blob = new Blob([fullDeck], { type: 'text/html;charset=utf-8;' });
  triggerDownload(blob, `${slugify(title)}-presentasi.html`);
}

// 4. Export as Clean Markdown
export function exportToMarkdown(title: string, markdown: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  triggerDownload(blob, `${slugify(title)}.md`);
}

// Helper: parse bold and italic inline spans for docx TextRun
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      runs.push(new TextRun({ text: part.slice(1, -1), italics: true }));
    } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      runs.push(new TextRun({ text: part.slice(1, -1), font: 'Consolas', color: '1550aa' }));
    } else {
      runs.push(new TextRun({ text: part }));
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text })];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'dokumen-agentika';
}
