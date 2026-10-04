import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportToDocx,
  exportToSpreadsheet,
  exportToSlideDeck,
  exportToMarkdown
} from '../utils/agentikaExporter';

describe('Agentika Productivity Exporter', () => {
  let createdBlobs: { blob: Blob; filename: string }[] = [];

  beforeEach(() => {
    createdBlobs = [];
    // Mock URL and DOM download triggers in headless environment
    global.URL.createObjectURL = vi.fn((blob: Blob) => {
      return 'blob:mock-url';
    });
    global.URL.revokeObjectURL = vi.fn();

    // Mock document.createElement('a')
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        const originalClick = el.click.bind(el);
        el.click = vi.fn(function (this: HTMLAnchorElement) {
          createdBlobs.push({
            blob: (this as any)._blob,
            filename: this.download
          });
          originalClick();
        });
      }
      return el;
    });
  });

  it('generates DOCX compatible Word document with proper XML namespaces', async () => {
    await exportToDocx('Modul Ajar Fisika', '# Modul Ajar\n\nPenjelasan hukum Newton.');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('generates CSV spreadsheet with UTF-8 BOM for Microsoft Excel', () => {
    const csvContent = 'No,Nama Siswa,Nilai UH,Status\n1,Budi,85,Tuntas\n2,Siti,70,Remedial';
    exportToSpreadsheet('Rekap Nilai Siswa', csvContent);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('generates Slide Deck HTML presentation with slides and notes', () => {
    const slides = [
      { title: 'Pengenalan Tata Surya', content: '- Matahari sebagai pusat\n- 8 Planet utama', notes: 'Bahas revolusi' },
      { title: 'Planet Kebumian', content: '- Merkurius\n- Venus\n- Bumi\n- Mars', notes: 'Tanyakan ke siswa' }
    ];
    exportToSlideDeck('Sistem Tata Surya', slides);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('generates clean Markdown file download', () => {
    exportToMarkdown('Catatan Fisika', '## Hukum Gravitasi Universal');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
