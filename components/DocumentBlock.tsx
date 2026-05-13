import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { toast } from '../utils/toast';

interface DocumentBlockProps {
  config: {
    title?: string;
    markdown?: string;
    content?: string; // AI sometimes sends 'content' instead of 'markdown'
  };
}

export const DocumentBlock: React.FC<DocumentBlockProps> = ({ config }) => {
  // Accept both 'markdown' and 'content' field names from AI
  const processedMarkdown = useMemo(() => {
    const raw = config.markdown || config.content || '';
    if (!raw) return '';
    return raw.replace(/\\n/g, '\n');
  }, [config.markdown, config.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(processedMarkdown);
    toast.success('Konten berhasil disalin!');
  };

  return (
    <div className="flex w-full h-full flex-col bg-[#fffdfa] text-slate-800 border border-slate-200 shadow-sm overflow-hidden rounded-sm">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between pointer-events-auto sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-sans">
             {config.title || 'Ringkasan Materi'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-[10px] font-bold uppercase tracking-wider"
            title="Salin Markdown"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
            Salin
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-[10px] font-bold uppercase tracking-wider"
            title="Cetak / Unduh PDF"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            PDF
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-10 py-12 custom-scrollbar bg-white/50">
        <div className="max-w-3xl mx-auto prose prose-indigo prose-lg leading-relaxed antialiased">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-8 border-b-4 border-indigo-100 pb-4 font-sans" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl font-bold tracking-tight text-slate-800 mt-12 mb-4 font-sans flex items-center gap-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-bold text-slate-700 mt-8 mb-3 font-sans" {...props} />,
              p: ({node, ...props}) => <p className="mb-6 text-slate-600 leading-8" style={{ fontFamily: '"Source Serif 4", serif' }} {...props} />,
              li: ({node, ...props}) => <li className="mb-2 text-slate-600 last:mb-0" style={{ fontFamily: '"Source Serif 4", serif' }} {...props} />,
              table: ({node, ...props}) => (
                <div className="my-8 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                  <table className="w-full text-sm text-left font-sans" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => <thead className="bg-slate-50 text-slate-600 border-b border-slate-200" {...props} />,
              th: ({node, ...props}) => <th className="px-4 py-3 font-black uppercase tracking-wider text-[10px]" {...props} />,
              td: ({node, ...props}) => <td className="px-4 py-3 border-b border-slate-100 last:border-0" {...props} />,
              code: ({node, inline, className, children, ...props}: any) => {
                return inline ? (
                  <code className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-sm font-bold" {...props}>{children}</code>
                ) : (
                  <div className="bg-slate-900 rounded-xl overflow-hidden my-8 shadow-xl">
                     <div className="flex items-center px-4 py-2 bg-slate-800/50 border-b border-slate-700 justify-between">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">Source Code</span>
                       <div className="flex gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-slate-700" />
                         <div className="w-2 h-2 rounded-full bg-slate-700" />
                       </div>
                     </div>
                     <pre className="p-6 overflow-x-auto text-sm text-indigo-200 font-mono leading-relaxed"><code {...props}>{children}</code></pre>
                  </div>
                )
              }
            }}
          >
            {processedMarkdown || '*Menunggu konten...*'}
          </ReactMarkdown>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap');
        
        .prose blockquote {
          font-style: italic;
          border-left-width: 4px;
          border-left-color: var(--color-primary);
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 0 0.75rem 0.75rem 0;
        }
        
        .prose img {
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }

        .prose .math-display {
           overflow-x: auto;
           padding: 1.5rem;
           margin: 2rem 0;
           background: #fafafa;
           border-radius: 1rem;
           border: 1px solid #f0f0f0;
           text-align: center;
        }
      `}</style>
    </div>
  );
};
