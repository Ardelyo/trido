import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import { FileText, Printer, Share2 } from 'lucide-react';

interface WorksheetProps {
  content: string;
  type: 'worksheet' | 'quiz';
}

export const WorksheetRenderer: React.FC<WorksheetProps> = ({ content, type }) => {
  return (
    <div className="bg-slate-50 p-4 sm:p-8 rounded-[2.5rem] w-full max-w-4xl mx-auto border-4 border-white shadow-2xl relative overflow-hidden">
      {/* Decorative dots for paper feel */}
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <FileText size={120} />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">
              {type === 'quiz' ? 'Lembar Evaluasi' : 'Lembar Kerja Siswa'}
            </h1>
            <p className="text-[12px] font-bold text-slate-400">TRIDO DIGITAL CLASSROOM • 2026</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="p-3 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl border border-slate-200 transition-all active:scale-95 shadow-sm">
            <Printer size={18} />
          </button>
          <button className="p-3 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl border border-slate-200 transition-all active:scale-95 shadow-sm">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-100 min-h-[600px] prose prose-slate prose-headings:font-black prose-headings:tracking-tight prose-p:font-medium prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-1 prose-blockquote:rounded-r-xl"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </motion.div>

      <div className="mt-8 text-center">
        <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
          Dihasilkan secara otomatis oleh Trido AI • Model: Gemma 4 Optimized
        </p>
      </div>
    </div>
  );
};
