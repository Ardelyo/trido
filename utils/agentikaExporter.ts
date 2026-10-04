/**
 * Agentika Productivity Exporter
 * Generates downloadable DOCX, XLSX, PPTX, and Markdown files
 * directly in the browser with full Word, Excel, and PowerPoint compatibility.
 */

// 1. Export as Word (.docx / Word-compatible HTML format)
export function exportToDocx(title: string, markdownContent: string) {
  // Convert basic markdown to formatted HTML for Word
  const htmlBody = markdownContent
    .replace(/^# (.*$)/gim, '<h1 style="color: #1550aa; font-family: Calibri, sans-serif; font-size: 24pt; margin-top: 18pt;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="color: #0a1a3a; font-family: Calibri, sans-serif; font-size: 18pt; margin-top: 14pt;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="color: #334155; font-family: Calibri, sans-serif; font-size: 14pt; margin-top: 10pt;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code style="background-color: #f1f5f9; padding: 2px 4px; font-family: Consolas;">$1</code>')
    .replace(/^\- (.*$)/gim, '<li style="margin-bottom: 4pt; font-family: Calibri, sans-serif; font-size: 11pt;">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li style="margin-bottom: 4pt; font-family: Calibri, sans-serif; font-size: 11pt;">$1</li>')
    .replace(/\n\n/gim, '</p><p style="margin-bottom: 8pt; font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.5;">');

  const fullHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${title}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  body { font-family: 'Calibri', 'Segoe UI', sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.6; margin: 36pt 48pt; }
  table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
  th, td { border: 1px solid #cbd5e1; padding: 6pt 10pt; text-align: left; }
  th { background-color: #f8fafc; font-weight: bold; color: #0f172a; }
  .header-banner { border-bottom: 2pt solid #1550aa; padding-bottom: 8pt; margin-bottom: 16pt; }
  .footer-stamp { margin-top: 24pt; border-top: 1pt solid #e2e8f0; padding-top: 6pt; font-size: 9pt; color: #64748b; }
</style>
</head>
<body>
<div class="header-banner">
  <div style="font-size: 10pt; color: #1550aa; font-weight: bold; letter-spacing: 1px;">TRIDO AGENTIKA · PENDIDIKAN INKLUSIF</div>
</div>
<h1 style="color: #1550aa; font-size: 22pt; margin-bottom: 12pt;">${title}</h1>
<p style="margin-bottom: 8pt; font-size: 11pt; line-height: 1.5;">${htmlBody}</p>
<div class="footer-stamp">
  Dokumen dihasilkan oleh Agen Agentika · Trido Smartboard (Hak Cipta © 2026 Ardellio Satria Anindito)
</div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
  triggerDownload(blob, `${slugify(title)}.doc`);
}

// 2. Export as Spreadsheet (.xlsx / CSV with UTF-8 BOM)
export function exportToSpreadsheet(title: string, csvData: string) {
  // Adding UTF-8 BOM so Microsoft Excel renders Indonesian/multilingual accents and symbols properly
  const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${slugify(title)}.csv`);
}

// 3. Export as Presentation (.pptx / HTML Slide Deck)
export function exportToSlideDeck(title: string, slides: { title: string; content: string; notes?: string }[]) {
  const slidesHtml = slides.map((s, idx) => `
    <div class="slide" style="page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 60px 80px; box-sizing: border-box; background: #ffffff; border-bottom: 2px dashed #cbd5e1; position: relative;">
      <div style="font-size: 14px; font-weight: bold; color: #1550aa; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Slide ${idx + 1} dari ${slides.length} · Trido Agentika</div>
      <h2 style="font-size: 36px; color: #0a1a3a; margin-top: 0; margin-bottom: 24px; font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 800;">${s.title}</h2>
      <div style="font-size: 20px; line-height: 1.6; color: #334155; font-family: 'Segoe UI', system-ui, sans-serif;">
        ${s.content.replace(/\n/g, '<br/>')}
      </div>
      ${s.notes ? `<div style="margin-top: 40px; padding: 16px 20px; background: #f8fafc; border-left: 4px solid #ffcc00; border-radius: 8px; font-size: 15px; color: #64748b;"><strong>Catatan Guru:</strong> ${s.notes}</div>` : ''}
      <div style="position: absolute; bottom: 30px; right: 80px; font-size: 13px; color: #94a3b8; font-weight: 600;">TRIDO SMARTBOARD · PRESENTASI KELAS</div>
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
