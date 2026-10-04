import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  variant?: 'default' | 'slide' | 'note';
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  variant = 'default',
  className = ''
}) => {
  if (!content) return null;

  // Clean raw markdown if there are double-escaped newlines
  const processed = content.replace(/\\n/g, '\n');

  let variantStyles = 'prose prose-slate max-w-none prose-headings:font-black prose-headings:text-[#111827] prose-strong:text-[#1D4ED8] prose-strong:font-bold prose-p:text-slate-700 prose-p:leading-relaxed prose-li:text-slate-700 prose-table:border prose-table:border-slate-300 prose-th:bg-slate-100 prose-th:p-2.5 prose-th:text-xs prose-th:font-bold prose-td:p-2.5 prose-td:text-xs prose-td:border prose-td:border-slate-200';

  if (variant === 'slide') {
    variantStyles = 'prose max-w-none text-slate-800 prose-headings:text-[#111827] prose-headings:font-black prose-strong:text-[#1D4ED8] prose-strong:font-extrabold prose-p:text-slate-800 prose-p:leading-relaxed prose-li:text-slate-700 prose-ul:my-2 prose-li:my-1 prose-blockquote:bg-amber-50 prose-blockquote:border-l-4 prose-blockquote:border-[#F5C518] prose-blockquote:p-3 prose-blockquote:rounded-r-lg prose-blockquote:text-slate-700';
  } else if (variant === 'note') {
    variantStyles = 'prose prose-sm max-w-none text-slate-700 prose-strong:text-[#1D4ED8] prose-p:leading-snug';
  }

  return (
    <div className={`markdown-renderer font-sans ${variantStyles} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom bold renderer ensuring strong tag with brand blue styling
          strong: ({ children }) => (
            <strong className="font-extrabold text-[#1D4ED8]">{children}</strong>
          ),
          // Clean list items
          li: ({ children }) => (
            <li className="text-slate-800 font-medium leading-relaxed my-0.5">{children}</li>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs font-sans">{children}</table>
            </div>
          )
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
