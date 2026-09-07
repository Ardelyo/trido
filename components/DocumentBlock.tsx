import React, { useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { toast } from '../utils/toast';
import { triggerPrintComponent, exportDocumentAsHtml, exportDocumentAsMarkdown } from '../utils/smartExport';
import { Copy, Printer, Globe, FileText, Check } from 'lucide-react';

interface DocumentBlockProps {
  config: {
    title?: string;
    markdown?: string;
    content?: string;
  };
}

export const DocumentBlock: React.FC<DocumentBlockProps> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const processedMarkdown = useMemo(() => {
    const raw = config.markdown || config.content || '';
    if (!raw) return '';
    return raw.replace(/\\n/g, '\n');
  }, [config.markdown, config.content]);

  const title = config.title || 'Ringkasan Materi';

  const handleCopy = () => {
    navigator.clipboard.writeText(processedMarkdown);
    setCopied(true);
    toast.success('Konten berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (containerRef.current) {
      triggerPrintComponent(containerRef.current);
    } else {
      window.print();
    }
  };

  const handleDownloadHtml = () => {
    exportDocumentAsHtml(title, processedMarkdown);
    toast.success('Laman HTML berhasil diunduh.');
  };

  const handleDownloadMarkdown = () => {
    exportDocumentAsMarkdown(title, processedMarkdown);
    toast.success('Berkas Markdown (.md) berhasil diunduh.');
  };

  return (
    <div
      ref={containerRef}
      className="flex w-full h-full flex-col bg-[#fffdfa] text-slate-800 border border-slate-200 shadow-sm overflow-hidden rounded-sm font-sans"
    >
      {/* Printable Document Header (Appears only on print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">TRIDO ACADEMIC DOCUMENT</div>
        <h1 className="text-2xl font-black text-slate-900 uppercase mt-1">{title}</h1>
        <div className="text-xs text-slate-500 mt-1">Tanggal: {new Date().toLocaleDateString('id-ID')}</div>
      </div>

      {/* Screen Toolbar */}
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between pointer-events-auto sticky top-0 z-10 no-print">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            title="Salin Teks Markdown"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            Salin
          </button>
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            title="Unduh Berkas Markdown (.md)"
          >
            <FileText size={12} />
            .MD
          </button>
          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            title="Unduh Laman Web Mandiri (.html)"
          >
            <Globe size={12} />
            HTML
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-2xs"
            title="Cetak Dokumen Bersih / Simpan PDF (Hanya dokumen, tanpa menu website)"
          >
            <Printer size={12} />
            Cetak / PDF
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-8 md:px-12 py-8 custom-scrollbar bg-white/50 print:overflow-visible print:px-0 print:py-0">
        <div className="max-w-3xl mx-auto prose prose-indigo prose-lg leading-relaxed antialiased print:max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-6 border-b-2 border-indigo-100 pb-3 font-sans print:border-b print:border-slate-300" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold tracking-tight text-slate-800 mt-8 mb-3 font-sans flex items-center gap-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-700 mt-6 mb-2 font-sans" {...props} />,
              p: ({node, ...props}) => <p className="mb-4 text-slate-600 leading-7 font-serif" {...props} />,
              li: ({node, ...props}) => <li className="mb-1.5 text-slate-600 last:mb-0 font-serif" {...props} />,
              table: ({node, ...props}) => (
                <div className="my-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm print:shadow-none">
                  <table className="w-full text-sm text-left font-sans" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => <thead className="bg-slate-50 text-slate-600 border-b border-slate-200" {...props} />,
              th: ({node, ...props}) => <th className="px-4 py-2.5 font-black uppercase tracking-wider text-[10px]" {...props} />,
              td: ({node, ...props}) => <td className="px-4 py-2.5 border-b border-slate-100 last:border-0" {...props} />,
              code: ({node, inline, className, children, ...props}: any) => {
                return inline ? (
                  <code className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs font-bold" {...props}>{children}</code>
                ) : (
                  <div className="bg-slate-900 rounded-xl overflow-hidden my-6 shadow-md print:bg-slate-100 print:text-slate-800 print:shadow-none">
                     <div className="flex items-center px-4 py-1.5 bg-slate-800/50 border-b border-slate-700 justify-between print:hidden">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Kode Sumber</span>
                     </div>
                     <pre className="p-4 overflow-x-auto text-xs text-indigo-200 font-mono leading-relaxed print:text-slate-800"><code {...props}>{children}</code></pre>
                  </div>
                );
              }
            }}
          >
            {processedMarkdown || '*Menunggu konten...*'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
